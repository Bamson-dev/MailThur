import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { csvUpload } from "../middleware/csvUpload";
import {
  createCampaign,
  listCampaignsForUser,
  getCampaignForUser,
  replaceCampaignSteps,
  importCampaignContacts,
  launchCampaign,
  pauseCampaign,
  getSendLogForCampaign,
  getContactsForCampaign,
} from "../repositories/campaigns.repository";
import {
  parseContactsFromCsv,
  parseContactsFromJson,
} from "../services/contact-import";
import {
  leadThurImportPayloadSchema,
  mapLeadThurContacts,
} from "../integrations/leadthur";
import { triggerSendQueueNow } from "../queue";
import { logger } from "../utils/logger";

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

const campaignParamsSchema = z.object({
  id: z.string().uuid(),
});

const stepSchema = z.object({
  subject: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(50000),
  delay_days: z.number().int().min(0).max(365),
});

const replaceStepsSchema = z.object({
  steps: z.array(stepSchema).max(20),
});

const contactImportItemSchema = z.object({
  email: z.string().email().max(255),
  first_name: z.string().max(255).optional(),
  business_name: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

const importContactsSchema = z.object({
  contacts: z.array(contactImportItemSchema).min(1).max(5000),
});

const listCampaignsQuerySchema = z.object({
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
  search: z.string().trim().max(200).optional(),
});

type CreateCampaignBody = z.infer<typeof createCampaignSchema>;
type CampaignParams = z.infer<typeof campaignParamsSchema>;
type ReplaceStepsBody = z.infer<typeof replaceStepsSchema>;
type ImportContactsBody = z.infer<typeof importContactsSchema>;
type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
type LeadThurImportBody = z.infer<typeof leadThurImportPayloadSchema>;

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many upload attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const launchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many launch attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post(
  "/campaigns",
  requireAuth,
  validate({ body: createCampaignSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { name } = (req as ValidatedRequest<CreateCampaignBody>).validatedBody;
      const campaign = await createCampaign(userEmail, name);
      res.status(201).json({ campaign });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/campaigns",
  requireAuth,
  validate({ query: listCampaignsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const query = (req as ValidatedRequest<unknown, ListCampaignsQuery>)
        .validatedQuery;
      const campaigns = await listCampaignsForUser(userEmail, {
        status: query.status,
        search: query.search,
      });
      res.json({ campaigns });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/campaigns/:id",
  requireAuth,
  validate({ params: campaignParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, CampaignParams>)
        .validatedParams;

      const campaign = await getCampaignForUser(userEmail, id);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({ campaign });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/campaigns/:id/steps",
  requireAuth,
  validate({ params: campaignParamsSchema, body: replaceStepsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<ReplaceStepsBody, unknown, CampaignParams>)
        .validatedParams;
      const { steps } = (req as ValidatedRequest<ReplaceStepsBody>).validatedBody;

      const updated = await replaceCampaignSteps(userEmail, id, steps);
      if (updated.length === 0 && steps.length > 0) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      if (steps.length === 0) {
        const campaign = await getCampaignForUser(userEmail, id);
        if (!campaign) {
          res.status(404).json({ error: "Campaign not found." });
          return;
        }
      }

      res.json({ steps: updated });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/campaigns/:id/contacts/csv",
  requireAuth,
  uploadLimiter,
  validate({ params: campaignParamsSchema }),
  csvUpload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, CampaignParams>)
        .validatedParams;

      if (!req.file) {
        res.status(400).json({
          error: "Invalid request. Please check your input and try again.",
        });
        return;
      }

      const parsed = parseContactsFromCsv(req.file.buffer);
      const campaign = await getCampaignForUser(userEmail, id);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      if (parsed.valid.length === 0) {
        res.json({
          imported: 0,
          skipped: parsed.invalid.length,
          invalid: parsed.invalid,
        });
        return;
      }

      const result = await importCampaignContacts(userEmail, id, parsed.valid);
      if (!result) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({
        imported: result.imported,
        skipped: parsed.invalid.length,
        invalid: parsed.invalid,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid file type")) {
        res.status(400).json({
          error: "Invalid request. Please check your input and try again.",
        });
        return;
      }
      next(error);
    }
  }
);

router.post(
  "/campaigns/:id/contacts/import",
  requireAuth,
  uploadLimiter,
  validate({ params: campaignParamsSchema, body: importContactsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<ImportContactsBody, unknown, CampaignParams>)
        .validatedParams;
      const { contacts } = (req as ValidatedRequest<ImportContactsBody>).validatedBody;

      const parsed = parseContactsFromJson(contacts);
      const campaign = await getCampaignForUser(userEmail, id);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      if (parsed.valid.length === 0) {
        res.json({
          imported: 0,
          skipped: parsed.invalid.length,
          invalid: parsed.invalid,
        });
        return;
      }

      const result = await importCampaignContacts(userEmail, id, parsed.valid);
      if (!result) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({
        imported: result.imported,
        skipped: parsed.invalid.length,
        invalid: parsed.invalid,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/campaigns/:id/contacts/leadthur",
  requireAuth,
  uploadLimiter,
  validate({ params: campaignParamsSchema, body: leadThurImportPayloadSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<LeadThurImportBody, unknown, CampaignParams>)
        .validatedParams;
      const { contacts } = (req as ValidatedRequest<LeadThurImportBody>).validatedBody;

      const campaign = await getCampaignForUser(userEmail, id);
      if (!campaign) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      const parsed = mapLeadThurContacts(contacts);

      if (parsed.valid.length === 0) {
        res.json({
          imported: 0,
          skipped: parsed.skipped.length,
          skipped_details: parsed.skipped,
        });
        return;
      }

      const result = await importCampaignContacts(userEmail, id, parsed.valid);
      if (!result) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({
        imported: result.imported,
        skipped: parsed.skipped.length,
        skipped_details: parsed.skipped,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/campaigns/:id/launch",
  requireAuth,
  launchLimiter,
  validate({ params: campaignParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, CampaignParams>)
        .validatedParams;

      const result = await launchCampaign(userEmail, id);
      if (!result.success) {
        if (result.reason === "not_found") {
          res.status(404).json({ error: "Campaign not found." });
          return;
        }
        res.status(400).json({
          error: "Campaign cannot be launched. Add steps and contacts first.",
        });
        return;
      }

      res.json({ message: "Campaign launched.", status: "active" });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/campaigns/:id/pause",
  requireAuth,
  validate({ params: campaignParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, CampaignParams>)
        .validatedParams;

      const paused = await pauseCampaign(userEmail, id);
      if (!paused) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({ message: "Campaign paused.", status: "paused" });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/campaigns/queue/process",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await triggerSendQueueNow();
      res.json({ message: "Queue processed.", result });
    } catch (error) {
      logger.error("Manual queue process failed", error);
      next(error);
    }
  }
);

router.get(
  "/campaigns/:id/send-log",
  requireAuth,
  validate({ params: campaignParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, CampaignParams>)
        .validatedParams;

      const entries = await getSendLogForCampaign(userEmail, id);
      if (!entries) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({ send_log: entries });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/campaigns/:id/contacts",
  requireAuth,
  validate({ params: campaignParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, CampaignParams>)
        .validatedParams;

      const contacts = await getContactsForCampaign(userEmail, id);
      if (!contacts) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({ contacts });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
