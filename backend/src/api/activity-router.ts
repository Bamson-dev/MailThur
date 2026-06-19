import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { getRecentActivityForUser } from "../repositories/campaigns.repository";

const router = Router();

router.get(
  "/activity/recent",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const events = await getRecentActivityForUser(userEmail, 10);
      res.json({ events });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
