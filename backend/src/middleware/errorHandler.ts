import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Global error handler — MUST be registered last in the middleware chain.
 *
 * Logs full technical error server-side (structured JSON).
 * Returns only a generic message to the client — never stack traces,
 * database error text, or internal details.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error("Unhandled error", err);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: "Something went wrong, please try again",
  });
}
