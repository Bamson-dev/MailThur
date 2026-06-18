import { z } from "zod";

const DEFAULT_CORS_ORIGINS =
  "https://mailthur.com,https://staging.mailthur.com,http://localhost:3000";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().url(),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .min(1)
    .default(DEFAULT_CORS_ORIGINS)
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  REDIS_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(
      JSON.stringify({
        level: "error",
        message: "Environment validation failed — refusing to start",
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
        timestamp: new Date().toISOString(),
      })
    );

    console.error(`Missing or invalid environment variables:\n${missing}`);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

/**
 * CORS allowed origins from CORS_ALLOWED_ORIGINS env var (comma-separated).
 * Staging and production set different values in their environment.
 * Never use a wildcard — always an explicit allowlist.
 */
export const corsOrigins: string[] = [
  ...env.CORS_ALLOWED_ORIGINS,
  env.FRONTEND_URL,
].filter((origin, index, self) => self.indexOf(origin) === index);
