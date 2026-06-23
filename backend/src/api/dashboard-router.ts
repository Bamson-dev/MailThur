import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { getDashboardOverview } from "../repositories/dashboard.repository";
import { getHealthScore } from "../repositories/health-score.repository";

const router = Router();

router.get(
  "/dashboard/overview",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const overview = await getDashboardOverview(userEmail);
      res.json(overview);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/dashboard/health-score",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const healthScore = await getHealthScore(userEmail);
      res.json(healthScore);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/me",
  requireAuth,
  (req: Request, res: Response) => {
    const { userEmail } = req as AuthenticatedRequest;
    res.json({ email: userEmail });
  }
);

export default router;
