import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { markSendLogOpened } from "../repositories/analytics.repository";
import { TRANSPARENT_GIF } from "../utils/tracking";

const sendLogParamsSchema = z.object({
  send_log_id: z.string().uuid(),
});

type SendLogParams = z.infer<typeof sendLogParamsSchema>;

const router = Router();

router.get(
  "/open/:send_log_id",
  validate({ params: sendLogParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { send_log_id } = (
        req as ValidatedRequest<unknown, unknown, SendLogParams>
      ).validatedParams;

      await markSendLogOpened(send_log_id);

      res.set({
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0",
      });
      res.status(200).send(TRANSPARENT_GIF);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
