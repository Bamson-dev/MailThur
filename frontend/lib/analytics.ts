import { apiFetch } from "./api";
import { fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface CampaignAnalytics {
  campaign_id: string;
  contacts: number;
  sent: number;
  open_rate: number;
  reply_rate: number;
  bounce_rate: number;
  completion_rate?: number;
}

export interface InboxAnalytics {
  inbox_id: string;
  inbox_email: string;
  sent_today: number;
  sent_week?: number;
  bounce_rate_7d: number;
  daily_send_cap: number;
  status: string;
}

export function formatRate(value: number): string {
  const pct = value <= 1 && value >= 0 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

export async function fetchCampaignAnalytics(
  campaignId: string
): Promise<CampaignAnalytics> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ analytics: CampaignAnalytics }>(
    `${apiUrl}/api/analytics/campaigns/${campaignId}`,
    fetchOptions({
      userMessage: "Unable to load campaign analytics. Please try again.",
    })
  );

  return response.analytics;
}

export async function fetchInboxAnalytics(): Promise<InboxAnalytics[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ inboxes: InboxAnalytics[] }>(
    `${apiUrl}/api/analytics/inboxes`,
    fetchOptions({
      userMessage: "Unable to load inbox analytics. Please try again.",
    })
  );

  return response.inboxes;
}
