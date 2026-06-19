import { Router, Request, Response, NextFunction, raw } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import {
  getOrCreateSubscription,
  upgradeSubscription,
  cancelSubscription,
  trialDaysRemaining,
  trialEmailsRemaining,
  PLAN_CONFIG,
  PaidPlanId,
  maxInboxesForPlan,
  checkUserCanConnectInbox,
} from "../repositories/subscriptions.repository";
import { countConnectedInboxesForUser } from "../repositories/connected-inboxes.repository";

const checkoutBodySchema = z.object({
  plan: z.enum(["starter", "growth", "agency"]),
});

type CheckoutBody = z.infer<typeof checkoutBodySchema>;

const paystackEventSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()),
});

const flutterwaveEventSchema = z.object({
  event: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  "event.type": z.string().optional(),
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

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  return req.ip ?? req.socket.remoteAddress ?? "";
}

async function isNigerianIp(ip: string): Promise<boolean> {
  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    return false;
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/country_code/`, {
      headers: { "User-Agent": "MailThur-Billing/1.0" },
    });

    if (!response.ok) {
      logger.warn("ipapi.co lookup failed", { status: response.status });
      return false;
    }

    const country = (await response.text()).trim().toUpperCase();
    return country === "NG";
  } catch (error) {
    logger.warn("ipapi.co lookup error", { error });
    return false;
  }
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
  "/billing/status",
  billingLimiter,
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const subscription = await getOrCreateSubscription(userEmail);

      const response: Record<string, unknown> = {
        plan: subscription.plan,
        status: subscription.status,
        max_inboxes: subscription.max_inboxes,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      };

      if (subscription.plan === "trial" && subscription.status === "active") {
        response.trial_days_remaining = trialDaysRemaining(subscription);
        response.trial_emails_remaining = trialEmailsRemaining(subscription);
        response.trial_emails_sent = subscription.trial_emails_sent;
        response.trial_expires_at = subscription.trial_expires_at;
      }

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

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

apiRouter.post(
  "/billing/checkout",
  billingLimiter,
  requireAuth,
  validate({ body: checkoutBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { plan } = (req as ValidatedRequest<CheckoutBody>).validatedBody;
      const pricing = PLAN_CONFIG[plan];
      const usePaystack = await isNigerianIp(getClientIp(req));

      if (usePaystack) {
        const reference = `mailthur-${plan}-${Date.now()}`;
        const response = await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: userEmail,
              amount: pricing.price_ngn_kobo,
              reference,
              metadata: {
                user_email: userEmail,
                plan,
              },
              callback_url: `${env.FRONTEND_URL}/dashboard?billing=success`,
            }),
          }
        );

        const payload = (await response.json()) as {
          status?: boolean;
          message?: string;
          data?: { authorization_url?: string; reference?: string };
        };

        if (!response.ok || !payload.status || !payload.data?.authorization_url) {
          logger.error("Paystack checkout initialization failed", undefined, {
            status: response.status,
          });
          res.status(502).json({ error: "Payment initialization failed." });
          return;
        }

        res.json({
          gateway: "paystack",
          payment_url: payload.data.authorization_url,
          reference: payload.data.reference ?? reference,
        });
        return;
      }

      const txRef = `mailthur-${plan}-${Date.now()}`;
      const response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: pricing.price_usd,
          currency: "USD",
          redirect_url: `${env.FRONTEND_URL}/dashboard?billing=success`,
          customer: {
            email: userEmail,
          },
          meta: {
            user_email: userEmail,
            plan,
          },
        }),
      });

      const payload = (await response.json()) as {
        status?: string;
        message?: string;
        data?: { link?: string };
      };

      if (
        !response.ok ||
        payload.status !== "success" ||
        !payload.data?.link
      ) {
        logger.error("Flutterwave checkout initialization failed", undefined, {
          status: response.status,
        });
        res.status(502).json({ error: "Payment initialization failed." });
        return;
      }

      res.json({
        gateway: "flutterwave",
        payment_url: payload.data.link,
        reference: txRef,
      });
    } catch (error) {
      next(error);
    }
  }
);

function verifyPaystackSignature(
  rawBody: Buffer,
  signature: string | undefined
): boolean {
  if (!signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

function verifyFlutterwaveHash(hash: string | undefined): boolean {
  return !!hash && hash === env.FLUTTERWAVE_SECRET_KEY;
}

async function fulfillPaidPlan(
  userEmail: string,
  plan: PaidPlanId,
  options: {
    paystackSubscriptionCode?: string | null;
    flutterwaveSubscriptionId?: string | null;
  } = {}
): Promise<void> {
  await upgradeSubscription({
    userEmail,
    plan,
    paystackSubscriptionCode: options.paystackSubscriptionCode ?? null,
    flutterwaveSubscriptionId: options.flutterwaveSubscriptionId ?? null,
  });

  logger.info("Subscription upgraded", {
    userEmail,
    plan,
    maxInboxes: maxInboxesForPlan(plan),
  });
}

export async function handlePaystackWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const signature = req.headers["x-paystack-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!Buffer.isBuffer(rawBody) || !verifyPaystackSignature(rawBody, signature)) {
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

  const data = event.data;

  if (event.event === "charge.success") {
    const metadata = data.metadata;
    const userEmail =
      parseUserEmailFromMetadata(metadata) ??
      (typeof data.customer === "object" &&
      data.customer &&
      typeof (data.customer as Record<string, unknown>).email === "string"
        ? ((data.customer as Record<string, unknown>).email as string)
        : null);
    const plan = parsePlanFromMetadata(metadata);

    if (userEmail && plan) {
      await fulfillPaidPlan(userEmail, plan, {
        paystackSubscriptionCode:
          typeof data.subscription_code === "string"
            ? data.subscription_code
            : null,
      });
    }
  }

  if (
    event.event === "subscription.disable" ||
    event.event === "subscription.not_renew"
  ) {
    const customerEmail =
      typeof data.customer === "object" &&
      data.customer &&
      typeof (data.customer as Record<string, unknown>).email === "string"
        ? ((data.customer as Record<string, unknown>).email as string)
        : null;

    if (customerEmail) {
      await cancelSubscription(customerEmail);
    }
  }

  if (event.event === "subscription.create" || event.event === "invoice.update") {
    const metadata = data.metadata;
    const userEmail = parseUserEmailFromMetadata(metadata);
    const plan = parsePlanFromMetadata(metadata);

    if (userEmail && plan) {
      await fulfillPaidPlan(userEmail, plan, {
        paystackSubscriptionCode:
          typeof data.subscription_code === "string"
            ? data.subscription_code
            : null,
      });
    }
  }

  res.json({ received: true });
}

export async function handleFlutterwaveWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const verifHash = req.headers["verif-hash"] as string | undefined;

  if (!verifyFlutterwaveHash(verifHash)) {
    res.status(401).json({ error: "Invalid signature." });
    return;
  }

  let event: z.infer<typeof flutterwaveEventSchema>;
  try {
    event = flutterwaveEventSchema.parse(req.body);
  } catch {
    res.status(400).json({ error: "Invalid payload." });
    return;
  }

  const data = event.data ?? {};
  const eventType = event.event ?? event["event.type"] ?? "";

  if (eventType === "charge.completed") {
    const meta = data.meta ?? data.metadata;
    const userEmail =
      parseUserEmailFromMetadata(meta) ??
      (typeof data.customer === "object" &&
      data.customer &&
      typeof (data.customer as Record<string, unknown>).email === "string"
        ? ((data.customer as Record<string, unknown>).email as string)
        : null);
    const plan = parsePlanFromMetadata(meta);
    const status = data.status;

    if (userEmail && plan && status === "successful") {
      await fulfillPaidPlan(userEmail, plan, {
        flutterwaveSubscriptionId:
          typeof data.id === "string" || typeof data.id === "number"
            ? String(data.id)
            : null,
      });
    }
  }

  res.json({ received: true });
}

export function registerPaystackWebhook(app: import("express").Express): void {
  app.post(
    "/webhooks/paystack",
    webhookLimiter,
    raw({ type: "application/json" }),
    (req, res, next) => {
      handlePaystackWebhook(req, res).catch(next);
    }
  );
}

export function registerFlutterwaveWebhook(app: import("express").Express): void {
  app.post("/webhooks/flutterwave", webhookLimiter, (req, res, next) => {
    handleFlutterwaveWebhook(req, res).catch(next);
  });
}

export default apiRouter;
