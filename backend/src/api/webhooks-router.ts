import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import {
  markSendLogReplied,
  processHardBounce,
} from "../repositories/analytics.repository";
import { logger } from "../utils/logger";

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Too many webhook requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const gmailReplySchema = z.object({
  send_log_id: z.string().uuid(),
  thread_id: z.string().max(255).optional(),
  message_id: z.string().max(255).optional(),
});

const gmailBounceSchema = z.object({
  send_log_id: z.string().uuid(),
  bounce_type: z.enum(["hard", "soft"]).optional(),
  reason: z.string().max(500).optional(),
});

type GmailReplyBody = z.infer<typeof gmailReplySchema>;
type GmailBounceBody = z.infer<typeof gmailBounceSchema>;

const router = Router();

router.use(webhookLimiter);

router.post(
  "/gmail/reply",
  validate({ body: gmailReplySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req as ValidatedRequest<GmailReplyBody>).validatedBody;

      logger.info("Gmail reply webhook received", {
        sendLogId: body.send_log_id,
        hasThreadId: !!body.thread_id,
        hasMessageId: !!body.message_id,
      });

      await markSendLogReplied(body.send_log_id);

      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/gmail/bounce",
  validate({ body: gmailBounceSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = (req as ValidatedRequest<GmailBounceBody>).validatedBody;

      if (body.bounce_type === "soft") {
        logger.info("Gmail soft bounce webhook received", {
          sendLogId: body.send_log_id,
        });
        res.status(200).json({ received: true, action: "ignored_soft_bounce" });
        return;
      }

      const result = await processHardBounce(body.send_log_id);

      logger.info("Gmail hard bounce webhook processed", {
        sendLogId: body.send_log_id,
        processed: result.processed,
        inboxPaused: result.inboxPaused,
      });

      res.status(200).json({
        received: true,
        processed: result.processed,
        inbox_paused: result.inboxPaused,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
