import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { listCampaignsForUser } from "./campaigns.repository";
import { getCampaignAnalytics } from "./analytics.repository";

export interface DashboardOverview {
  emails_sent_this_month: number;
  avg_open_rate: number;
  avg_reply_rate: number;
  active_campaigns_count: number;
}

export interface DailyAnalyticsPoint {
  date: string;
  sends: number;
  opens: number;
}

export async function getDashboardOverview(
  userEmail: string
): Promise<DashboardOverview> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("user_email", userEmail);

  if (campaignError) {
    logger.error("Failed to fetch campaigns for overview", campaignError);
    throw new Error("Dashboard overview failed");
  }

  const campaignIds = (campaigns ?? []).map((c) => c.id as string);
  const activeCampaignsCount =
    campaigns?.filter((c) => c.status === "active").length ?? 0;

  if (campaignIds.length === 0) {
    return {
      emails_sent_this_month: 0,
      avg_open_rate: 0,
      avg_reply_rate: 0,
      active_campaigns_count: 0,
    };
  }

  const { count: sentThisMonth, error: sentError } = await supabase
    .from("send_log")
    .select("id", { count: "exact", head: true })
    .in("campaign_id", campaignIds)
    .eq("status", "sent")
    .gte("sent_at", startOfMonth.toISOString());

  if (sentError) {
    logger.error("Failed to count monthly sends", sentError);
    throw new Error("Dashboard overview failed");
  }

  const campaignList = await listCampaignsForUser(userEmail);
  const analyticsResults = await Promise.all(
    campaignList.map((c) => getCampaignAnalytics(userEmail, c.id))
  );

  const validAnalytics = analyticsResults.filter(
    (a): a is NonNullable<typeof a> => a != null && a.sent > 0
  );

  const avgOpen =
    validAnalytics.length === 0
      ? 0
      : validAnalytics.reduce((sum, a) => sum + a.open_rate, 0) /
        validAnalytics.length;

  const avgReply =
    validAnalytics.length === 0
      ? 0
      : validAnalytics.reduce((sum, a) => sum + a.reply_rate, 0) /
        validAnalytics.length;

  return {
    emails_sent_this_month: sentThisMonth ?? 0,
    avg_open_rate: Math.round(avgOpen * 10) / 10,
    avg_reply_rate: Math.round(avgReply * 10) / 10,
    active_campaigns_count: activeCampaignsCount,
  };
}

export async function getDailyAnalyticsSeries(
  userEmail: string,
  days: number
): Promise<DailyAnalyticsPoint[]> {
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_email", userEmail);

  if (campaignError) {
    logger.error("Failed to fetch campaigns for daily analytics", campaignError);
    throw new Error("Daily analytics failed");
  }

  const campaignIds = (campaigns ?? []).map((c) => c.id as string);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days + 1);
  since.setUTCHours(0, 0, 0, 0);

  const dateMap = new Map<string, { sends: number; opens: number }>();

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    dateMap.set(key, { sends: 0, opens: 0 });
  }

  if (campaignIds.length === 0) {
    return [...dateMap.entries()].map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }

  const { data: logs, error: logError } = await supabase
    .from("send_log")
    .select("status, sent_at, opened_at")
    .in("campaign_id", campaignIds)
    .eq("status", "sent")
    .gte("sent_at", since.toISOString());

  if (logError) {
    logger.error("Failed to fetch send logs for daily analytics", logError);
    throw new Error("Daily analytics failed");
  }

  for (const log of logs ?? []) {
    if (!log.sent_at) continue;
    const key = (log.sent_at as string).slice(0, 10);
    const entry = dateMap.get(key);
    if (!entry) continue;
    entry.sends += 1;
    if (log.opened_at) entry.opens += 1;
  }

  return [...dateMap.entries()].map(([date, stats]) => ({
    date,
    ...stats,
  }));
}
