import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

export type PlanId = "trial" | "starter" | "growth" | "agency";
export type SubscriptionStatus = "active" | "cancelled" | "expired";

export interface Subscription {
  id: string;
  user_email: string;
  plan: PlanId;
  status: SubscriptionStatus;
  trial_emails_sent: number;
  trial_started_at: string;
  trial_expires_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  paystack_subscription_code: string | null;
  flutterwave_subscription_id: string | null;
  max_inboxes: number;
  created_at: string;
  updated_at: string;
}

export const TRIAL_EMAIL_CAP = 500;
export const TRIAL_DAYS = 3;
export const STARTER_MONTHLY_EMAIL_CAP = 30_000;

export const PLAN_CONFIG = {
  trial: {
    max_inboxes: 1,
    price_usd: 0,
    price_ngn_kobo: 0,
  },
  starter: {
    max_inboxes: 2,
    price_usd: 19,
    price_ngn_kobo: 19000,
  },
  growth: {
    max_inboxes: 6,
    price_usd: 39,
    price_ngn_kobo: 39000,
  },
  agency: {
    max_inboxes: 999,
    price_usd: 79,
    price_ngn_kobo: 79000,
  },
} as const satisfies Record<
  PlanId,
  { max_inboxes: number; price_usd: number; price_ngn_kobo: number }
>;

export type PaidPlanId = Exclude<PlanId, "trial">;

export function maxInboxesForPlan(plan: PlanId): number {
  return PLAN_CONFIG[plan].max_inboxes;
}

export async function getSubscription(
  userEmail: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch subscription", error);
    throw new Error("Subscription lookup failed");
  }

  return (data as Subscription | null) ?? null;
}

export async function getOrCreateSubscription(
  userEmail: string
): Promise<Subscription> {
  const existing = await getSubscription(userEmail);
  if (existing) {
    return existing;
  }

  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + TRIAL_DAYS);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_email: userEmail,
      plan: "trial",
      status: "active",
      max_inboxes: PLAN_CONFIG.trial.max_inboxes,
      trial_expires_at: trialExpiresAt.toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const retry = await getSubscription(userEmail);
      if (retry) {
        return retry;
      }
    }

    logger.error("Failed to create subscription", error);
    throw new Error("Subscription creation failed");
  }

  return data as Subscription;
}

export async function incrementTrialEmailsSent(
  userEmail: string
): Promise<Subscription> {
  const subscription = await getOrCreateSubscription(userEmail);

  if (subscription.plan !== "trial") {
    return subscription;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      trial_emails_sent: subscription.trial_emails_sent + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to increment trial emails sent", error);
    throw new Error("Trial email counter update failed");
  }

  return data as Subscription;
}

export async function expireSubscription(userEmail: string): Promise<void> {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail);

  if (error) {
    logger.error("Failed to expire subscription", error);
    throw new Error("Subscription expiry failed");
  }
}

export async function cancelSubscription(userEmail: string): Promise<void> {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail);

  if (error) {
    logger.error("Failed to cancel subscription", error);
    throw new Error("Subscription cancellation failed");
  }
}

export interface UpgradeSubscriptionInput {
  userEmail: string;
  plan: PaidPlanId;
  paystackSubscriptionCode?: string | null;
  flutterwaveSubscriptionId?: string | null;
}

export async function upgradeSubscription(
  input: UpgradeSubscriptionInput
): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const updates: Record<string, unknown> = {
    plan: input.plan,
    status: "active",
    max_inboxes: maxInboxesForPlan(input.plan),
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  if (input.paystackSubscriptionCode !== undefined) {
    updates.paystack_subscription_code = input.paystackSubscriptionCode;
  }

  if (input.flutterwaveSubscriptionId !== undefined) {
    updates.flutterwave_subscription_id = input.flutterwaveSubscriptionId;
  }

  await getOrCreateSubscription(input.userEmail);

  const { data, error } = await supabase
    .from("subscriptions")
    .update(updates)
    .eq("user_email", input.userEmail)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to upgrade subscription", error);
    throw new Error("Subscription upgrade failed");
  }

  return data as Subscription;
}

export function isTrialExpired(subscription: Subscription): boolean {
  if (subscription.plan !== "trial") {
    return false;
  }

  return new Date(subscription.trial_expires_at).getTime() <= Date.now();
}

export function trialEmailsRemaining(subscription: Subscription): number {
  return Math.max(0, TRIAL_EMAIL_CAP - subscription.trial_emails_sent);
}

export function trialDaysRemaining(subscription: Subscription): number {
  const msRemaining =
    new Date(subscription.trial_expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

export interface SendEligibility {
  allowed: boolean;
  reason?:
    | "trial_expired"
    | "trial_email_cap"
    | "subscription_inactive"
    | "monthly_email_cap";
}

async function countEmailsSentSince(
  userEmail: string,
  sinceIso: string
): Promise<number> {
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_email", userEmail);

  if (campaignError) {
    logger.error("Failed to fetch campaigns for send cap", campaignError);
    throw new Error("Send cap lookup failed");
  }

  const campaignIds = (campaigns ?? []).map((c) => c.id as string);
  if (campaignIds.length === 0) {
    return 0;
  }

  const { count, error: sentError } = await supabase
    .from("send_log")
    .select("id", { count: "exact", head: true })
    .in("campaign_id", campaignIds)
    .eq("status", "sent")
    .gte("sent_at", sinceIso);

  if (sentError) {
    logger.error("Failed to count sends for cap", sentError);
    throw new Error("Send cap lookup failed");
  }

  return count ?? 0;
}

export function monthlyEmailCapForPlan(plan: PlanId): number | null {
  if (plan === "starter") {
    return STARTER_MONTHLY_EMAIL_CAP;
  }
  return null;
}

export async function countMonthlyEmailsSent(
  userEmail: string,
  subscription: Subscription
): Promise<number> {
  const sinceIso =
    subscription.current_period_start ??
    new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
    ).toISOString();

  return countEmailsSentSince(userEmail, sinceIso);
}

export async function checkUserCanSend(
  userEmail: string
): Promise<SendEligibility> {
  const subscription = await getOrCreateSubscription(userEmail);

  if (subscription.status === "expired" || subscription.status === "cancelled") {
    return { allowed: false, reason: "subscription_inactive" };
  }

  if (subscription.plan !== "trial") {
    const monthlyCap = monthlyEmailCapForPlan(subscription.plan);
    if (monthlyCap != null) {
      const sentThisPeriod = await countMonthlyEmailsSent(
        userEmail,
        subscription
      );
      if (sentThisPeriod >= monthlyCap) {
        return { allowed: false, reason: "monthly_email_cap" };
      }
    }
    return { allowed: true };
  }

  if (isTrialExpired(subscription)) {
    await expireSubscription(userEmail);
    return { allowed: false, reason: "trial_expired" };
  }

  if (subscription.trial_emails_sent >= TRIAL_EMAIL_CAP) {
    await expireSubscription(userEmail);
    return { allowed: false, reason: "trial_email_cap" };
  }

  return { allowed: true };
}

export async function checkUserCanConnectInbox(
  userEmail: string,
  connectedInboxCount: number
): Promise<{ allowed: boolean; maxInboxes: number; plan: PlanId }> {
  const subscription = await getOrCreateSubscription(userEmail);

  if (subscription.status === "expired" || subscription.status === "cancelled") {
    return {
      allowed: false,
      maxInboxes: subscription.max_inboxes,
      plan: subscription.plan,
    };
  }

  return {
    allowed: connectedInboxCount < subscription.max_inboxes,
    maxInboxes: subscription.max_inboxes,
    plan: subscription.plan,
  };
}
