import { Router, Request, Response, NextFunction, raw } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  buildBillingStatusPayload,
  getOrCreateSubscription,
  upgradeSubscription,
  cancelSubscription,
  setSubscriptionPastDue,
  renewSubscriptionPeriod,
  getSubscriptionByPaystackCode,
  checkUserCanConnectInbox,
  PaidPlanId,
} from "../repositories/subscriptions.repository";
import { countConnectedInboxesForUser } from "../repositories/connected-inboxes.repository";

const checkoutBodySchema = z.object({
  plan: z.enum(["starter", "growth", "agency"]),
});

const verifyBodySchema = z.object({
  reference: z.string().min(1).max(255),
});

type CheckoutBody = z.infer<typeof checkoutBodySchema>;
type VerifyBody = z.infer<typeof verifyBodySchema>;

const paystackEventSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()),
});

export const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many billing requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Too many webhook requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRouter = Router();

function paystackPlanCode(plan: PaidPlanId): string {
  const map: Record<PaidPlanId, string | undefined> = {
    starter: env.PAYSTACK_STARTER_PLAN,
    growth: env.PAYSTACK_GROWTH_PLAN,
    agency: env.PAYSTACK_AGENCY_PLAN,
  };

  const code = map[plan];
  if (!code) {
    throw new Error(`Paystack plan code not configured for ${plan}`);
  }

  return code;
}

function paystackSecretKeyMode(): "test" | "live" | "unknown" | "placeholder" {
  const key = env.PAYSTACK_SECRET_KEY;
  if (key === "sk_test_mailthur_dev_placeholder") {
    return "placeholder";
  }
  if (key.startsWith("sk_test_")) {
    return "test";
  }
  if (key.startsWith("sk_live_")) {
    return "live";
  }
  return "unknown";
}

function paystackPlanConfigSnapshot(): Record<string, string | undefined> {
  return {
    starter: env.PAYSTACK_STARTER_PLAN,
    growth: env.PAYSTACK_GROWTH_PLAN,
    agency: env.PAYSTACK_AGENCY_PLAN,
  };
}

interface PaystackInitializePayload {
  status?: boolean;
  message?: string;
  data?: { authorization_url?: string; reference?: string };
}

async function initializePaystackCheckout(input: {
  email: string;
  plan: PaidPlanId;
  planCode: string;
}): Promise<
  | { ok: true; authorizationUrl: string; reference: string | null }
  | { ok: false; httpStatus: number; paystackStatus: number; body: string; message: string }
> {
  const callbackUrl = `${env.FRONTEND_URL}/dashboard/billing?payment=success`;
  const requestBody = {
    email: input.email,
    plan: input.planCode,
    callback_url: callbackUrl,
    metadata: {
      product: "mailthur",
      plan: input.plan,
      user_email: input.email,
    },
  };

  let response: globalThis.Response;
  try {
    response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (error) {
    logger.error("Paystack checkout request failed", error, {
      plan: input.plan,
      planCode: input.planCode,
      keyMode: paystackSecretKeyMode(),
      planCodes: paystackPlanConfigSnapshot(),
      callbackUrl,
    });
    return {
      ok: false,
      httpStatus: 503,
      paystackStatus: 0,
      body: error instanceof Error ? error.message : String(error),
      message: "Unable to reach Paystack.",
    };
  }

  const bodyText = await response.text();
  let payload: PaystackInitializePayload = {};

  if (bodyText.trim()) {
    try {
      payload = JSON.parse(bodyText) as PaystackInitializePayload;
    } catch (error) {
      logger.error("Paystack checkout returned non-JSON body", error, {
        plan: input.plan,
        planCode: input.planCode,
        paystackStatus: response.status,
        responseBody: bodyText,
        keyMode: paystackSecretKeyMode(),
        planCodes: paystackPlanConfigSnapshot(),
      });
      return {
        ok: false,
        httpStatus: 424,
        paystackStatus: response.status,
        body: bodyText,
        message: "Paystack returned an invalid response.",
      };
    }
  }

  if (!response.ok || !payload.status || !payload.data?.authorization_url) {
    logger.error("Paystack checkout initialization failed", undefined, {
      plan: input.plan,
      planCode: input.planCode,
      paystackStatus: response.status,
      paystackMessage: payload.message ?? null,
      responseBody: bodyText,
      keyMode: paystackSecretKeyMode(),
      planCodes: paystackPlanConfigSnapshot(),
      callbackUrl,
    });
      return {
        ok: false,
        httpStatus: 424,
        paystackStatus: response.status,
        body: bodyText,
        message: payload.message ?? "Payment initialization failed.",
      };
  }

  return {
    ok: true,
    authorizationUrl: payload.data.authorization_url,
    reference: payload.data.reference ?? null,
  };
}

function parsePlanFromMetadata(metadata: unknown): PaidPlanId | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const plan = (metadata as Record<string, unknown>).plan;
  if (plan === "starter" || plan === "growth" || plan === "agency") {
    return plan;
  }

  return null;
}

function parseUserEmailFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const userEmail = (metadata as Record<string, unknown>).user_email;
  return typeof userEmail === "string" && userEmail.includes("@")
    ? userEmail
    : null;
}

apiRouter.get(
  "/billing/inbox-eligibility",
  billingLimiter,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const connectedCount = await countConnectedInboxesForUser(userEmail);
      const eligibility = await checkUserCanConnectInbox(
        userEmail,
        connectedCount
      );

      res.json({
        allowed: eligibility.allowed,
        plan: eligibility.plan,
        max_inboxes: eligibility.maxInboxes,
        connected_inboxes: connectedCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

apiRouter.get(
  "/billing/status",
  billingLimiter,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const status = await buildBillingStatusPayload(userEmail);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }
);

apiRouter.post(
  "/billing/checkout",
  billingLimiter,
  requireAuth,
  validate({ body: checkoutBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { plan } = (req as ValidatedRequest<CheckoutBody>).validatedBody;

      let planCode: string;
      try {
        planCode = paystackPlanCode(plan);
      } catch {
        logger.error("Paystack plan code missing", undefined, {
          plan,
          planCodes: paystackPlanConfigSnapshot(),
        });
        res.status(503).json({ error: "Billing is not configured." });
        return;
      }

      const keyMode = paystackSecretKeyMode();
      if (keyMode === "placeholder" || keyMode === "unknown") {
        logger.error("Paystack secret key is not configured", undefined, {
          plan,
          planCode,
          keyMode,
          planCodes: paystackPlanConfigSnapshot(),
        });
        res.status(503).json({ error: "Billing is not configured." });
        return;
      }

      const checkout = await initializePaystackCheckout({
        email: userEmail,
        plan,
        planCode,
      });

      if (!checkout.ok) {
        res.status(checkout.httpStatus).json({
          error: checkout.message,
        });
        return;
      }

      res.json({
        authorization_url: checkout.authorizationUrl,
        reference: checkout.reference,
      });
    } catch (error) {
      next(error);
    }
  }
);

apiRouter.post(
  "/billing/verify",
  billingLimiter,
  requireAuth,
  validate({ body: verifyBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { reference } = (req as ValidatedRequest<VerifyBody>).validatedBody;

      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const payload = (await response.json()) as {
        status?: boolean;
        data?: {
          status?: string;
          metadata?: Record<string, unknown>;
          customer?: { email?: string; customer_code?: string };
          subscription?: { subscription_code?: string };
          subscription_code?: string;
        };
      };

      if (!response.ok || !payload.status || !payload.data) {
        res.status(400).json({ error: "Payment verification failed." });
        return;
      }

      if (payload.data.status !== "success") {
        res.status(400).json({
          error: "Payment not completed.",
          status: payload.data.status,
        });
        return;
      }

      const metadata = payload.data.metadata;
      const plan = parsePlanFromMetadata(metadata);
      const metadataEmail = parseUserEmailFromMetadata(metadata);
      const paidEmail =
        metadataEmail ??
        (typeof payload.data.customer?.email === "string"
          ? payload.data.customer.email
          : null);

      if (!paidEmail || paidEmail.toLowerCase() !== userEmail.toLowerCase()) {
        res.status(403).json({ error: "Payment does not match your account." });
        return;
      }

      if (!plan) {
        res.status(400).json({ error: "Missing plan in payment metadata." });
        return;
      }

      const subscriptionCode =
        payload.data.subscription?.subscription_code ??
        (typeof payload.data.subscription_code === "string"
          ? payload.data.subscription_code
          : null);
      const customerCode =
        typeof payload.data.customer?.customer_code === "string"
          ? payload.data.customer.customer_code
          : null;

      await upgradeSubscription({
        userEmail,
        plan,
        paystackSubscriptionCode: subscriptionCode,
        paystackCustomerCode: customerCode,
      });

      const status = await buildBillingStatusPayload(userEmail);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }
);

apiRouter.delete(
  "/billing/cancel",
  billingLimiter,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const subscription = await getOrCreateSubscription(userEmail);

      if (subscription.plan === "trial") {
        res.status(400).json({ error: "Trial subscriptions cannot be cancelled." });
        return;
      }

      if (!subscription.paystack_subscription_code) {
        res.status(400).json({ error: "No active Paystack subscription found." });
        return;
      }

      const response = await fetch(
        "https://api.paystack.co/subscription/disable",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: subscription.paystack_subscription_code,
            token: subscription.paystack_subscription_code,
          }),
        }
      );

      if (!response.ok) {
        logger.error("Paystack subscription disable failed", undefined, {
          userEmail,
          status: response.status,
        });
        res.status(502).json({ error: "Unable to cancel subscription." });
        return;
      }

      await cancelSubscription(userEmail);

      res.json({
        message: "Subscription cancelled successfully.",
        status: "cancelled",
      });
    } catch (error) {
      next(error);
    }
  }
);

function verifyPaystackWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined
): boolean {
  if (!signature || !env.PAYSTACK_WEBHOOK_SECRET) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

async function processPaystackBillingEvent(
  event: z.infer<typeof paystackEventSchema>
): Promise<void> {
  const data = event.data;

  if (event.event === "charge.success") {
    const subscriptionCode =
      typeof data.subscription_code === "string"
        ? data.subscription_code
        : null;

    if (subscriptionCode) {
      await renewSubscriptionPeriod(subscriptionCode);
      return;
    }

    const metadata = data.metadata;
    const userEmail = parseUserEmailFromMetadata(metadata);
    const plan = parsePlanFromMetadata(metadata);

    if (userEmail && plan) {
      await upgradeSubscription({
        userEmail,
        plan,
        paystackSubscriptionCode:
          typeof data.subscription_code === "string"
            ? data.subscription_code
            : null,
        paystackCustomerCode:
          typeof data.customer === "object" &&
          data.customer &&
          typeof (data.customer as Record<string, unknown>).customer_code ===
            "string"
            ? ((data.customer as Record<string, unknown>).customer_code as string)
            : null,
      });
    }
  }

  if (event.event === "subscription.disable") {
    const subscriptionCode =
      typeof data.subscription_code === "string"
        ? data.subscription_code
        : null;

    if (subscriptionCode) {
      const sub = await getSubscriptionByPaystackCode(subscriptionCode);
      if (sub) {
        await cancelSubscription(sub.user_email);
      }
    }
  }

  if (event.event === "subscription.not_renew") {
    const subscriptionCode =
      typeof data.subscription_code === "string"
        ? data.subscription_code
        : null;

    if (subscriptionCode) {
      const sub = await getSubscriptionByPaystackCode(subscriptionCode);
      if (sub) {
        await setSubscriptionPastDue(sub.user_email);
      }
    }
  }

  if (event.event === "invoice.payment_failed") {
    const subscriptionCode =
      typeof data.subscription === "object" &&
      data.subscription &&
      typeof (data.subscription as Record<string, unknown>).subscription_code ===
        "string"
        ? ((data.subscription as Record<string, unknown>)
            .subscription_code as string)
        : typeof data.subscription_code === "string"
          ? data.subscription_code
          : null;

    if (subscriptionCode) {
      const sub = await getSubscriptionByPaystackCode(subscriptionCode);
      if (sub) {
        await setSubscriptionPastDue(sub.user_email);
      }
    }
  }
}

export async function handlePaystackBillingWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const signature = req.headers["x-paystack-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!Buffer.isBuffer(rawBody) || !verifyPaystackWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: "Invalid signature." });
    return;
  }

  let event: z.infer<typeof paystackEventSchema>;
  try {
    event = paystackEventSchema.parse(JSON.parse(rawBody.toString("utf8")));
  } catch {
    res.status(400).json({ error: "Invalid payload." });
    return;
  }

  res.status(200).json({ received: true });

  setImmediate(() => {
    processPaystackBillingEvent(event).catch((error) => {
      logger.error("Paystack billing webhook processing failed", error, {
        event: event.event,
      });
    });
  });
}

/** Legacy webhook path — delegates to billing handler. */
export async function handlePaystackWebhook(
  req: Request,
  res: Response
): Promise<void> {
  return handlePaystackBillingWebhook(req, res);
}

export function registerPaystackWebhook(app: import("express").Express): void {
  app.post(
    "/webhooks/paystack",
    webhookLimiter,
    raw({ type: "application/json" }),
    (req, res, next) => {
      handlePaystackBillingWebhook(req, res).catch(next);
    }
  );
}

export function registerPaystackBillingWebhook(
  app: import("express").Express
): void {
  app.post(
    "/webhooks/paystack/billing",
    webhookLimiter,
    raw({ type: "application/json" }),
    (req, res, next) => {
      handlePaystackBillingWebhook(req, res).catch(next);
    }
  );
}

/** @deprecated Flutterwave retained for legacy webhooks only. */
export function registerFlutterwaveWebhook(_app: import("express").Express): void {
  // No-op: billing uses Paystack only.
}

export default apiRouter;
