import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { unsubscribeBySendLogId } from "../repositories/campaigns.repository";

const sendLogParamsSchema = z.object({
  send_log_id: z.string().uuid(),
});

type SendLogParams = z.infer<typeof sendLogParamsSchema>;

const unsubscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

const UNSUBSCRIBE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribed</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 24px; color: #1f2937; }
    h1 { font-size: 1.5rem; }
    p { line-height: 1.6; color: #4b5563; }
  </style>
</head>
<body>
  <h1>You have been unsubscribed</h1>
  <p>You will no longer receive campaign emails from this sender. This may take a short time to take full effect.</p>
</body>
</html>`;

router.get(
  "/:send_log_id",
  unsubscribeLimiter,
  validate({ params: sendLogParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { send_log_id } = (req as ValidatedRequest<unknown, unknown, SendLogParams>)
        .validatedParams;

      const result = await unsubscribeBySendLogId(send_log_id);

      if (!result.found) {
        res.status(404).type("html").send(
          `<!DOCTYPE html><html><body><p>This unsubscribe link is invalid or has already been used.</p></body></html>`
        );
        return;
      }

      res.status(200).type("html").send(UNSUBSCRIBE_HTML);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
