import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { corsOrigins } from "./config/env";
import {
  authenticatedApiRateLimiter,
  globalRateLimiter,
} from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./api/health.routes";
import exampleRoutes from "./api/example.routes";
import waitlistRoutes from "./api/waitlist.routes";
import authRouter from "./api/auth-router";
import campaignsRouter from "./api/campaigns-router";
import analyticsRouter from "./api/analytics-router";
import billingRouter, {
  registerPaystackWebhook,
  registerFlutterwaveWebhook,
} from "./api/billing-router";
import trackRouter from "./api/track-router";
import webhooksRouter from "./api/webhooks-router";
import unsubscribeRouter from "./api/unsubscribe-router";
import activityRouter from "./api/activity-router";
import dashboardRouter from "./api/dashboard-router";
import contactsRouter from "./api/contacts-router";
import statsRouter from "./api/stats-router";
import toolsRouter from "./api/tools-router";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { startQueueSchedulers } from "./queue";

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

registerPaystackWebhook(app);

app.use(express.json());
app.use(cookieParser());

registerFlutterwaveWebhook(app);

// Global rate limiting — public routes only (/api uses higher authenticated cap)
app.use(globalRateLimiter);

// Public API routes (own rate limits; mounted before authenticated cap)
app.use("/api/stats", statsRouter);
app.use("/api/tools", toolsRouter);

app.use("/api", authenticatedApiRateLimiter);

// Routes
app.use(healthRoutes);
app.use(authRouter);
app.use("/track", trackRouter);
app.use("/unsubscribe", unsubscribeRouter);
app.use("/webhooks", webhooksRouter);
app.use("/api", campaignsRouter);
app.use("/api", analyticsRouter);
app.use("/api", billingRouter);
app.use("/api", activityRouter);
app.use("/api", dashboardRouter);
app.use("/api", contactsRouter);
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

  startQueueSchedulers().catch((error) => {
    logger.error("Failed to start queue schedulers", error);
  });
});

export default app;
