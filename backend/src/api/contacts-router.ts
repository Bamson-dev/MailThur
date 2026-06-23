import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { listUnifiedContactsForUser } from "../repositories/contacts.repository";

const listContactsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z
    .enum([
      "pending",
      "in_progress",
      "completed",
      "bounced",
      "unsubscribed",
      "replied",
    ])
    .optional(),
});

type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;

const router = Router();

router.get(
  "/contacts",
  requireAuth,
  validate({ query: listContactsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const query = (req as ValidatedRequest<unknown, ListContactsQuery>)
        .validatedQuery;

      const contacts = await listUnifiedContactsForUser(userEmail, {
        search: query.search,
        status: query.status,
      });

      res.json({ contacts });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
