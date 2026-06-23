import { apiFetch } from "./api";
import { fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface HealthScoreStep {
  inbox_connected: boolean;
  campaign_created: boolean;
  email_sent: boolean;
  reply_received: boolean;
}

export interface HealthScoreNextAction {
  label: string;
  href: string;
}

export interface UserMilestones {
  first_email_sent: boolean;
  first_open: boolean;
  first_reply: boolean;
}

export interface HealthScore {
  score: number;
  steps: HealthScoreStep;
  next_action: HealthScoreNextAction | null;
  milestones: UserMilestones;
}

export interface DashboardStats {
  emails_sent_this_month: number;
  avg_open_rate: number;
  avg_reply_rate: number;
  active_campaigns_count: number;
  connected_inboxes_count: number;
}

export interface DashboardInboxHealth {
  id: string;
  inbox_email: string;
  status: string;
  daily_send_cap: number;
  sent_today: number;
  sent_week: number;
  bounce_rate_7d: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  activity: import("./activity").ActivityEvent[];
  inboxes: DashboardInboxHealth[];
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<DashboardOverview>(
    `${apiUrl}/api/dashboard/overview`,
    fetchOptions({
      userMessage: "Unable to load dashboard overview. Please try again.",
    })
  );
}

export async function fetchHealthScore(): Promise<HealthScore> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<HealthScore>(
    `${apiUrl}/api/dashboard/health-score`,
    fetchOptions({
      userMessage: "Unable to load setup progress. Please try again.",
    })
  );
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
