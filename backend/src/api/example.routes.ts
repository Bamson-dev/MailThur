import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";

const exampleQuerySchema = z.object({
  name: z.string().min(1).max(100),
});

type ExampleQuery = z.infer<typeof exampleQuerySchema>;

const router = Router();

/**
 * Example protected route demonstrating the validation pattern.
 * Copy this structure for every real route:
 *   1. Define Zod schema(s) for body/query/params
 *   2. Apply validate() middleware with those schemas
 *   3. Access validated data via req.validatedQuery / validatedBody / validatedParams
 *   4. Run route logic only after validation passes
 */
router.get(
  "/example",
  validate({ query: exampleQuerySchema }),
  (req: Request, res: Response) => {
    const { name } = (req as ValidatedRequest<unknown, ExampleQuery>)
      .validatedQuery;

    res.json({
      message: `Hello, ${name}`,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
