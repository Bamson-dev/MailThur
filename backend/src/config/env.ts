import { z } from "zod";

const DEFAULT_CORS_ORIGINS =
  "https://mailthur.com,https://staging.mailthur.com,http://localhost:3000";

/** Coolify and other hosts often inject empty strings — treat as unset. */
function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}

const envSchema = z.object({
  PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(4000)
  ),
  HOST: z.preprocess(
    emptyToUndefined,
    z.string().default("0.0.0.0")
  ),
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(["development", "production", "test"]).default("development")
  ),
  FRONTEND_URL: z.preprocess(emptyToUndefined, z.string().url()),
  CORS_ALLOWED_ORIGINS: z
    .preprocess(
      emptyToUndefined,
      z.string().min(1).default(DEFAULT_CORS_ORIGINS)
    )
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url()),
  SUPABASE_SERVICE_KEY: z.preprocess(emptyToUndefined, z.string().min(1)),
  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().min(1)),
  GOOGLE_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1)),
  GOOGLE_REDIRECT_URI: z.preprocess(emptyToUndefined, z.string().url()),
  SESSION_SECRET: z.preprocess(emptyToUndefined, z.string().min(32)),
  COOKIE_DOMAIN: z.preprocess(emptyToUndefined, z.string().optional()),
  // Redis is not wired yet — optional so missing value does not block startup.
  REDIS_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("redis://localhost:6379")
  ),
  PAYSTACK_SECRET_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("sk_test_mailthur_dev_placeholder")
  ),
  PAYSTACK_PUBLIC_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("pk_test_mailthur_dev_placeholder")
  ),
  FLUTTERWAVE_SECRET_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("FLWSECK_TEST-mailthur_dev_placeholder")
  ),
  FLUTTERWAVE_PUBLIC_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("FLWPUBK_TEST-mailthur_dev_placeholder")
  ),
  /** Public backend URL for unsubscribe links in emails (e.g. https://backend.mailthur.com) */
  PUBLIC_BACKEND_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://staging-backend.mailthur.com")
  ),
  /** Base URL for open-tracking pixel (defaults to PUBLIC_BACKEND_URL) */
  TRACKING_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
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
