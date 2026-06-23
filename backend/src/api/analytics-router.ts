import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import {
  getCampaignAnalytics,
  getInboxAnalytics,
} from "../repositories/analytics.repository";
import { getDailyAnalyticsSeries } from "../repositories/dashboard.repository";

const campaignParamsSchema = z.object({
  id: z.string().uuid(),
});

const dailyQuerySchema = z.object({
  days: z.coerce.number().int().refine((v) => v === 7 || v === 30 || v === 90),
});

type CampaignParams = z.infer<typeof campaignParamsSchema>;
type DailyQuery = z.infer<typeof dailyQuerySchema>;

const router = Router();

router.get(
  "/analytics/campaigns/:id",
  requireAuth,
  validate({ params: campaignParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, CampaignParams>)
        .validatedParams;

      const analytics = await getCampaignAnalytics(userEmail, id);
      if (!analytics) {
        res.status(404).json({ error: "Campaign not found." });
        return;
      }

      res.json({ analytics });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/analytics/inboxes",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const inboxes = await getInboxAnalytics(userEmail);
      res.json({ inboxes });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/analytics/daily",
  requireAuth,
  validate({ query: dailyQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const query = (req as ValidatedRequest<unknown, DailyQuery>).validatedQuery;
      const series = await getDailyAnalyticsSeries(userEmail, query.days);
      res.json({ series });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
