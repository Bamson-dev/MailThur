import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { validate, ValidatedRequest } from "../middleware/validate";
import { getRecentActivityForUser } from "../repositories/campaigns.repository";

const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

type ActivityQuery = z.infer<typeof activityQuerySchema>;

const router = Router();

router.get(
  "/activity/recent",
  requireAuth,
  validate({ query: activityQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const query = (req as ValidatedRequest<unknown, ActivityQuery>)
        .validatedQuery;
      const limit = query.limit ?? 10;
      const events = await getRecentActivityForUser(userEmail, limit);
      res.json({ events });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
