import { apiFetch } from "./api";
import { fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type PlanId = "trial" | "starter" | "growth" | "agency";
export type UpgradePlan = "starter" | "growth" | "agency";

export interface BillingStatus {
  plan: PlanId;
  max_inboxes: number;
  trial_emails_remaining?: number;
  trial_days_remaining?: number;
  trial_emails_limit?: number;
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

  const response = await apiFetch<{ billing: BillingStatus }>(
    `${apiUrl}/api/billing/status`,
    fetchOptions({
      userMessage: "Unable to load billing status. Please try again.",
    })
  );

  return response.billing;
}

export async function initiateCheckout(plan: UpgradePlan): Promise<string> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ checkout_url: string }>(
    `${apiUrl}/api/billing/checkout`,
    fetchOptions({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
      userMessage: "Unable to start checkout. Please try again.",
    })
  );

  return response.checkout_url;
}
