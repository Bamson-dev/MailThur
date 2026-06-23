import { apiFetch } from "./api";
import { fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type PlanId = "trial" | "starter" | "growth" | "agency" | "enterprise";
export type UpgradePlan = "starter" | "growth" | "agency";

export const PLAN_LABELS: Record<UpgradePlan, string> = {
  starter: "Starter — ₦25,000/mo",
  growth: "Growth — ₦50,000/mo",
  agency: "Agency — ₦75,000/mo",
};

export interface BillingStatus {
  plan: PlanId;
  status: "active" | "cancelled" | "expired" | "past_due";
  trial_emails_sent: number;
  trial_emails_remaining: number;
  trial_expires_at: string;
  trial_days_remaining: number;
  is_trial_expired: boolean;
  monthly_emails_sent: number;
  monthly_emails_remaining: number | null;
  paystack_subscription_code: string | null;
  current_period_end?: string | null;
  max_inboxes: number;
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<BillingStatus>(
    `${apiUrl}/api/billing/status`,
    fetchOptions({
      userMessage: "Unable to load billing status. Please try again.",
    })
  );
}

export async function initiateCheckout(plan: UpgradePlan): Promise<string> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ authorization_url: string }>(
    `${apiUrl}/api/billing/checkout`,
    fetchOptions({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
      userMessage: "Unable to start checkout. Please try again.",
    })
  );

  return response.authorization_url;
}

export async function verifyPayment(reference: string): Promise<BillingStatus> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<BillingStatus>(
    `${apiUrl}/api/billing/verify`,
    fetchOptions({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
      userMessage: "Unable to verify payment. Please try again.",
    })
  );
}

export async function cancelSubscription(): Promise<{ message: string }> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<{ message: string }>(
    `${apiUrl}/api/billing/cancel`,
    fetchOptions({
      method: "DELETE",
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

export function trialHoursRemaining(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / (60 * 60 * 1000)));
}
