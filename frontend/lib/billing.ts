import { apiFetch } from "./api";
import { fetchOptions } from "./session";
import { TRIAL_DAY_LIMIT, TRIAL_EMAIL_LIMIT } from "./billing-plans";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type PlanId = "trial" | "starter" | "growth" | "agency";
export type UpgradePlan = "starter" | "growth" | "agency";

interface BillingStatusResponse {
  plan: PlanId;
  status: "active" | "cancelled" | "expired";
  max_inboxes: number;
  trial_emails_remaining?: number;
  trial_days_remaining?: number;
  trial_emails_sent?: number;
  trial_emails_limit?: number;
  trial_days_limit?: number;
  monthly_emails_sent?: number;
  monthly_emails_cap?: number;
}

export interface BillingStatus {
  plan: PlanId;
  max_inboxes: number;
  trial_emails_remaining?: number;
  trial_days_remaining?: number;
  trial_emails_limit?: number;
  trial_days_limit?: number;
  monthly_emails_sent?: number;
  monthly_emails_cap?: number;
  subscription_active?: boolean;
}

export const PLAN_LABELS: Record<UpgradePlan, string> = {
  starter: "Starter — $19/mo",
  growth: "Growth — $39/mo",
  agency: "Agency — $79/mo",
};

export async function fetchBillingStatus(): Promise<BillingStatus> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<BillingStatusResponse>(
    `${apiUrl}/api/billing/status`,
    fetchOptions({
      userMessage: "Unable to load billing status. Please try again.",
    })
  );

  return {
    plan: response.plan,
    max_inboxes: response.max_inboxes,
    trial_emails_remaining: response.trial_emails_remaining,
    trial_days_remaining: response.trial_days_remaining,
    trial_emails_limit: response.trial_emails_limit ?? TRIAL_EMAIL_LIMIT,
    trial_days_limit: response.trial_days_limit ?? TRIAL_DAY_LIMIT,
    monthly_emails_sent: response.monthly_emails_sent,
    monthly_emails_cap: response.monthly_emails_cap,
    subscription_active: response.status === "active",
  };
}

export async function initiateCheckout(plan: UpgradePlan): Promise<string> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ payment_url: string }>(
    `${apiUrl}/api/billing/checkout`,
    fetchOptions({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
      userMessage: "Unable to start checkout. Please try again.",
    })
  );

  return response.payment_url;
}

export async function verifyPayment(reference: string): Promise<{
  verified: boolean;
  plan: PlanId;
}> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<{ verified: boolean; plan: PlanId }>(
    `${apiUrl}/api/billing/verify`,
    fetchOptions({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
      userMessage: "Unable to verify payment. Please try again.",
    })
  );
}

export async function cancelSubscription(): Promise<{ cancelled: boolean }> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<{ cancelled: boolean }>(
    `${apiUrl}/api/billing/cancel`,
    fetchOptions({
      method: "POST",
      userMessage: "Unable to cancel subscription. Please try again.",
    })
  );
}

export interface InboxEligibility {
  allowed: boolean;
  plan: PlanId;
  max_inboxes: number;
  connected_inboxes: number;
}

export async function fetchInboxEligibility(): Promise<InboxEligibility> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<InboxEligibility>(
    `${apiUrl}/api/billing/inbox-eligibility`,
    fetchOptions({
      userMessage: "Unable to verify inbox limit. Please try again.",
    })
  );
}

export const UPGRADE_PLANS: Array<{
  id: UpgradePlan;
  name: string;
  price: string;
  inboxes: string;
}> = [
  { id: "starter", name: "Starter", price: "$19/month", inboxes: "2 inboxes" },
  { id: "growth", name: "Growth", price: "$39/month", inboxes: "6 inboxes" },
  {
    id: "agency",
    name: "Agency",
    price: "$79/month",
    inboxes: "Unlimited inboxes",
  },
];
