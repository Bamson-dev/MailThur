import { Router, Request, Response, NextFunction } from "express";
import { getPlatformStats } from "../repositories/platform-stats.repository";

const router = Router();

router.get("/platform", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getPlatformStats();
    res.set("Cache-Control", "public, max-age=60");
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router;
