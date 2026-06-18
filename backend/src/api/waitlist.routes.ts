import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { addToWaitlist } from "../repositories/waitlist.repository";

const waitlistBodySchema = z.object({
  email: z.string().email().max(255),
});

type WaitlistBody = z.infer<typeof waitlistBodySchema>;

const router = Router();

router.post(
  "/waitlist",
  validate({ body: waitlistBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = (req as ValidatedRequest<WaitlistBody>).validatedBody;
      await addToWaitlist(email);

      res.json({
        message: "Thanks! We will notify you when we launch.",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
