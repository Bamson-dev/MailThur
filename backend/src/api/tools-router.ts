import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { validate, ValidatedRequest } from "../middleware/validate";
import {
  checkDomainDns,
  domainCheckBodySchema,
  DomainCheckBody,
} from "../services/domain-check.service";

export const domainCheckLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many domain checks. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post(
  "/domain-check",
  domainCheckLimiter,
  validate({ body: domainCheckBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { domain } = (req as ValidatedRequest<DomainCheckBody>).validatedBody;
      const result = await checkDomainDns(domain);
      res.json({ result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
