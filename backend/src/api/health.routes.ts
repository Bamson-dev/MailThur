import { Router, Request, Response, NextFunction } from "express";
import { getQueueStatus } from "../queue";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.get("/health/queue", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const queue = await getQueueStatus();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      queue,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
