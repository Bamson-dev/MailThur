import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logger } from "../utils/logger";

export interface ValidatedRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
> extends Request {
  validatedBody: TBody;
  validatedQuery: TQuery;
  validatedParams: TParams;
}

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware factory that validates request body, query, and params
 * against Zod schemas BEFORE any route logic or database queries run.
 *
 * Invalid input returns 400 with a generic message — never echoes
 * back the raw invalid input in the response.
 *
 * Usage:
 *   router.get("/example", validate({ query: exampleQuerySchema }), handler);
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        (req as ValidatedRequest).validatedBody = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        (req as ValidatedRequest).validatedQuery = schemas.query.parse(
          req.query
        );
      }
      if (schemas.params) {
        (req as ValidatedRequest).validatedParams = schemas.params.parse(
          req.params
        );
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        if (process.env.NODE_ENV === "development") {
          logger.warn("Validation failed", { issues: error.issues });
        }
        res.status(400).json({
          error: "Invalid request. Please check your input and try again.",
        });
        return;
      }
      next(error);
    }
  };
}
