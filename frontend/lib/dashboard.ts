import { apiFetch } from "./api";
import { fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface DashboardOverview {
  emails_sent_this_month: number;
  avg_open_rate: number;
  avg_reply_rate: number;
  active_campaigns_count: number;
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ overview: DashboardOverview }>(
    `${apiUrl}/api/dashboard/overview`,
    fetchOptions({
      userMessage: "Unable to load dashboard overview. Please try again.",
    })
  );

  return response.overview;
}

export async function fetchCurrentUser(): Promise<{ email: string }> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<{ email: string }>(
    `${apiUrl}/api/me`,
    fetchOptions({
      userMessage: "Unable to load account info. Please try again.",
    })
  );
}
