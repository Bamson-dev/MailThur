import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

export type PlanId = "trial" | "starter" | "growth" | "agency" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";

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
  paystack_customer_code: string | null;
  flutterwave_subscription_id: string | null;
  max_inboxes: number;
  max_emails_per_month: number | null;
  created_at: string;
  updated_at: string;
}

export const TRIAL_EMAIL_CAP = 500;
export const TRIAL_DAYS = 3;
export const STARTER_MONTHLY_EMAIL_CAP = 30_000;

export const PLAN_CONFIG = {
  trial: { max_inboxes: 1 },
  starter: { max_inboxes: 999, max_emails_per_month: STARTER_MONTHLY_EMAIL_CAP },
  growth: { max_inboxes: 999, max_emails_per_month: null },
  agency: { max_inboxes: 999, max_emails_per_month: null },
  enterprise: { max_inboxes: 999, max_emails_per_month: null },
} as const satisfies Record<
  PlanId,
  { max_inboxes: number; max_emails_per_month?: number | null }
>;

export type PaidPlanId = Exclude<PlanId, "trial" | "enterprise">;

export function maxInboxesForPlan(plan: PlanId): number {
  return PLAN_CONFIG[plan].max_inboxes;
}

export function maxEmailsPerMonthForPlan(plan: PlanId): number | null {
  if (plan === "starter") {
    return STARTER_MONTHLY_EMAIL_CAP;
  }
  return null;
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
      trial_emails_sent: 0,
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
  const { data, error } = await supabase.rpc("increment_trial_emails_sent", {
    p_user_email: userEmail,
  });

  if (!error) {
    const rows = (data as Subscription[] | null) ?? [];
    if (rows.length > 0) {
      return rows[0];
    }
    return getOrCreateSubscription(userEmail);
  }

  const subscription = await getOrCreateSubscription(userEmail);
  if (subscription.plan !== "trial") {
    return subscription;
  }

  const { data: updated, error: updateError } = await supabase
    .from("subscriptions")
    .update({
      trial_emails_sent: subscription.trial_emails_sent + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail)
    .eq("plan", "trial")
    .select("*")
    .single();

  if (updateError) {
    logger.error("Failed to increment trial emails sent", updateError);
    throw new Error("Trial email counter update failed");
  }

  return updated as Subscription;
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

export async function setSubscriptionPastDue(userEmail: string): Promise<void> {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail);

  if (error) {
    logger.error("Failed to mark subscription past due", error);
    throw new Error("Subscription past_due update failed");
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
  paystackCustomerCode?: string | null;
  flutterwaveSubscriptionId?: string | null;
}

export async function upgradeSubscription(
  input: UpgradeSubscriptionInput
): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const updates: Record<string, unknown> = {
    plan: input.plan,
    status: "active",
    max_inboxes: maxInboxesForPlan(input.plan),
    max_emails_per_month: maxEmailsPerMonthForPlan(input.plan),
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  if (input.paystackSubscriptionCode !== undefined) {
    updates.paystack_subscription_code = input.paystackSubscriptionCode;
  }

  if (input.paystackCustomerCode !== undefined) {
    updates.paystack_customer_code = input.paystackCustomerCode;
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

export async function renewSubscriptionPeriod(
  paystackSubscriptionCode: string
): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("paystack_subscription_code", paystackSubscriptionCode);

  if (error) {
    logger.error("Failed to renew subscription period", error);
    throw new Error("Subscription renewal failed");
  }
}

export async function getSubscriptionByPaystackCode(
  paystackSubscriptionCode: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("paystack_subscription_code", paystackSubscriptionCode)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch subscription by Paystack code", error);
    throw new Error("Subscription lookup failed");
  }

  return (data as Subscription | null) ?? null;
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

function calendarMonthStartIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
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
  return maxEmailsPerMonthForPlan(plan);
}

export async function countMonthlyEmailsSent(
  userEmail: string,
  subscription: Subscription
): Promise<number> {
  if (subscription.plan === "starter") {
    return countEmailsSentSince(userEmail, calendarMonthStartIso());
  }

  const sinceIso =
    subscription.current_period_start ?? calendarMonthStartIso();

  return countEmailsSentSince(userEmail, sinceIso);
}

export async function checkUserCanSend(
  userEmail: string
): Promise<SendEligibility> {
  const subscription = await getOrCreateSubscription(userEmail);

  if (
    subscription.status === "expired" ||
    subscription.status === "cancelled" ||
    subscription.status === "past_due"
  ) {
    return { allowed: false, reason: "subscription_inactive" };
  }

  if (subscription.plan === "trial") {
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

  const monthlyCap = monthlyEmailCapForPlan(subscription.plan);
  if (monthlyCap != null) {
    const sentThisMonth = await countMonthlyEmailsSent(userEmail, subscription);
    if (sentThisMonth >= monthlyCap) {
      return { allowed: false, reason: "monthly_email_cap" };
    }
  }

  return { allowed: true };
}

export async function checkUserCanConnectInbox(
  userEmail: string,
  connectedInboxCount: number
): Promise<{ allowed: boolean; maxInboxes: number; plan: PlanId }> {
  const subscription = await getOrCreateSubscription(userEmail);

  if (
    subscription.status === "expired" ||
    subscription.status === "cancelled" ||
    subscription.status === "past_due"
  ) {
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

export interface BillingStatusPayload {
  plan: PlanId;
  status: SubscriptionStatus;
  trial_emails_sent: number;
  trial_emails_remaining: number;
  trial_expires_at: string;
  trial_days_remaining: number;
  is_trial_expired: boolean;
  monthly_emails_sent: number;
  monthly_emails_remaining: number | null;
  paystack_subscription_code: string | null;
  current_period_end: string | null;
  max_inboxes: number;
}

export async function buildBillingStatusPayload(
  userEmail: string
): Promise<BillingStatusPayload> {
  const subscription = await getOrCreateSubscription(userEmail);
  const monthlySent = await countMonthlyEmailsSent(userEmail, subscription);
  const monthlyCap = monthlyEmailCapForPlan(subscription.plan);
  const trialExpired =
    subscription.plan === "trial" &&
    (subscription.status === "expired" || isTrialExpired(subscription));

  return {
    plan: subscription.plan,
    status: subscription.status,
    trial_emails_sent: subscription.trial_emails_sent,
    trial_emails_remaining: trialEmailsRemaining(subscription),
    trial_expires_at: subscription.trial_expires_at,
    trial_days_remaining: trialDaysRemaining(subscription),
    is_trial_expired: trialExpired,
    monthly_emails_sent: monthlySent,
    monthly_emails_remaining:
      monthlyCap == null ? null : Math.max(0, monthlyCap - monthlySent),
    paystack_subscription_code: subscription.paystack_subscription_code,
    current_period_end: subscription.current_period_end,
    max_inboxes: subscription.max_inboxes,
  };
}
