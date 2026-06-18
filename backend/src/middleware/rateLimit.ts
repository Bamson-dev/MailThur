import rateLimit from "express-rate-limit";

/**
 * Global default rate limiter: 60 requests per minute per IP.
 * Applied to every route in the main server file so all future routes
 * are rate-limited by default without per-route configuration.
 *
 * For stricter limits on sensitive endpoints (login, signup, password reset),
 * create a route-specific limiter and apply it BEFORE the route handler:
 *
 *   const authLimiter = rateLimit({
 *     windowMs: 15 * 60 * 1000, // 15 minutes
 *     max: 5,                     // 5 attempts per window
 *     message: { error: "Too many attempts. Please try again later." },
 *     standardHeaders: true,
 *     legacyHeaders: false,
 *   });
 *   router.post("/login", authLimiter, validate({ body: loginSchema }), loginHandler);
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
