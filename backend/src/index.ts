import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOrigins } from "./config/env";
import { globalRateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./api/health.routes";
import exampleRoutes from "./api/example.routes";
import waitlistRoutes from "./api/waitlist.routes";
import { logger } from "./utils/logger";
import { env } from "./config/env";

const app = express();

// Security headers — all explicitly configured, not left as defaults
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    xContentTypeOptions: true,
    xFrameOptions: { action: "deny" },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// CORS — explicit allowlist, never wildcard
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Global rate limiting — every route is limited by default
app.use(globalRateLimiter);

// Routes
app.use(healthRoutes);
app.use("/api", exampleRoutes);
app.use("/api", waitlistRoutes);

// Global error handler — MUST be last
app.use(errorHandler);

app.listen(env.PORT, env.HOST, () => {
  logger.info("Server started", {
    host: env.HOST,
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  });
});

export default app;
