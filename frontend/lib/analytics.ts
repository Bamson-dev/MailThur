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
  sent_month?: number;
  bounce_rate_7d: number;
  daily_send_cap: number;
  status: string;
  created_at?: string;
}

export interface DailyAnalyticsPoint {
  date: string;
  sends: number;
  opens: number;
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

  const response = await apiFetch<{
    analytics: Omit<CampaignAnalytics, "campaign_id">;
  }>(`${apiUrl}/api/analytics/campaigns/${campaignId}`, fetchOptions({
    userMessage: "Unable to load campaign analytics. Please try again.",
  }));

  return { ...response.analytics, campaign_id: campaignId };
}

export async function fetchInboxAnalytics(): Promise<InboxAnalytics[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{
    inboxes: Array<
      Omit<InboxAnalytics, "inbox_id"> & { id: string }
    >;
  }>(`${apiUrl}/api/analytics/inboxes`, fetchOptions({
    userMessage: "Unable to load inbox analytics. Please try again.",
  }));

  return response.inboxes.map((inbox) => ({
    inbox_id: inbox.id,
    inbox_email: inbox.inbox_email,
    sent_today: inbox.sent_today,
    sent_week: inbox.sent_week,
    sent_month: inbox.sent_month,
    bounce_rate_7d: inbox.bounce_rate_7d,
    daily_send_cap: inbox.daily_send_cap,
    status: inbox.status,
    created_at: inbox.created_at,
  }));
}

export async function fetchDailyAnalytics(
  days: 7 | 30 | 90
): Promise<DailyAnalyticsPoint[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ series: DailyAnalyticsPoint[] }>(
    `${apiUrl}/api/analytics/daily?days=${days}`,
    fetchOptions({
      userMessage: "Unable to load analytics chart. Please try again.",
    })
  );

  return response.series;
}
