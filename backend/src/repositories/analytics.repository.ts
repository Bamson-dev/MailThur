import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { getCampaignForUser } from "./campaigns.repository";
import {
  getInboxBounceStats,
  listInboxesForUser,
} from "./connected-inboxes.repository";

export interface CampaignAnalytics {
  contacts: number;
  sent: number;
  open_rate: number;
  reply_rate: number;
  bounce_rate: number;
  completion_rate: number;
}

export interface InboxAnalyticsItem {
  id: string;
  inbox_email: string;
  status: string;
  daily_send_cap: number;
  sent_today: number;
  sent_week: number;
  sent_month: number;
  bounce_rate_7d: number;
  created_at: string;
}

export async function getCampaignAnalytics(
  userEmail: string,
  campaignId: string
): Promise<CampaignAnalytics | null> {
  const campaign = await getCampaignForUser(userEmail, campaignId);
  if (!campaign) {
    return null;
  }

  const [
    { count: contactCount, error: contactError },
    { data: sendRows, error: sendError },
    { data: contactRows, error: statusError },
  ] = await Promise.all([
    supabase
      .from("campaign_contacts")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId),
    supabase
      .from("send_log")
      .select("status, opened_at, replied_at")
      .eq("campaign_id", campaignId)
      .in("status", ["sent", "bounced"]),
    supabase
      .from("campaign_contacts")
      .select("status")
      .eq("campaign_id", campaignId),
  ]);

  if (contactError || sendError || statusError) {
    logger.error("Failed to fetch campaign analytics", contactError ?? sendError ?? statusError);
    throw new Error("Analytics fetch failed");
  }

  const contacts = contactCount ?? 0;
  const sentRows = sendRows ?? [];
  const sent = sentRows.filter((r) => r.status === "sent").length;
  const bounced = sentRows.filter((r) => r.status === "bounced").length;
  const opened = sentRows.filter((r) => r.opened_at != null).length;
  const replied = sentRows.filter((r) => r.replied_at != null).length;
  const completed =
    contactRows?.filter((r) => r.status === "completed").length ?? 0;

  const pct = (numerator: number, denominator: number): number =>
    denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;

  return {
    contacts,
    sent,
    open_rate: pct(opened, sent),
    reply_rate: pct(replied, sent),
    bounce_rate: pct(bounced, sent + bounced),
    completion_rate: pct(completed, contacts),
  };
}

export async function getInboxAnalytics(
  userEmail: string
): Promise<InboxAnalyticsItem[]> {
  const inboxes = await listInboxesForUser(userEmail);
  if (inboxes.length === 0) {
    return [];
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const bounceSince = new Date();
  bounceSince.setDate(bounceSince.getDate() - 7);

  const results: InboxAnalyticsItem[] = [];

  for (const inbox of inboxes) {
    const [
      { count: sentToday, error: todayError },
      { count: sentWeek, error: weekError },
      { count: sentMonth, error: monthError },
    ] = await Promise.all([
      supabase
        .from("send_log")
        .select("id", { count: "exact", head: true })
        .eq("inbox_id", inbox.id)
        .eq("status", "sent")
        .gte("sent_at", startOfDay.toISOString()),
      supabase
        .from("send_log")
        .select("id", { count: "exact", head: true })
        .eq("inbox_id", inbox.id)
        .eq("status", "sent")
        .gte("sent_at", weekAgo.toISOString()),
      supabase
        .from("send_log")
        .select("id", { count: "exact", head: true })
        .eq("inbox_id", inbox.id)
        .eq("status", "sent")
        .gte("sent_at", monthAgo.toISOString()),
    ]);

    if (todayError || weekError || monthError) {
      logger.error("Failed to fetch inbox send counts", todayError ?? weekError ?? monthError);
      throw new Error("Inbox analytics fetch failed");
    }

    const bounceStats = await getInboxBounceStats(inbox.id, bounceSince);
    const bounceRate =
      bounceStats.total === 0
        ? 0
        : Math.round((bounceStats.bounced / bounceStats.total) * 1000) / 10;

    results.push({
      id: inbox.id,
      inbox_email: inbox.inbox_email,
      status: inbox.status,
      daily_send_cap: inbox.daily_send_cap,
      sent_today: sentToday ?? 0,
      sent_week: sentWeek ?? 0,
      sent_month: sentMonth ?? 0,
      bounce_rate_7d: bounceRate,
      created_at: inbox.created_at,
    });
  }

  return results;
}

export async function markSendLogOpened(sendLogId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("send_log")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", sendLogId)
    .is("opened_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    logger.error("Failed to mark send log opened", error);
    return false;
  }

  return !!data;
}

export async function markSendLogReplied(sendLogId: string): Promise<boolean> {
  const { data: logRow, error: fetchError } = await supabase
    .from("send_log")
    .select("id, contact_id, replied_at")
    .eq("id", sendLogId)
    .maybeSingle();

  if (fetchError || !logRow) {
    if (fetchError) {
      logger.error("Failed to fetch send log for reply", fetchError);
    }
    return false;
  }

  if (logRow.replied_at) {
    return true;
  }

  const now = new Date().toISOString();

  const { error: logError } = await supabase
    .from("send_log")
    .update({ replied_at: now })
    .eq("id", sendLogId);

  if (logError) {
    logger.error("Failed to mark send log replied", logError);
    return false;
  }

  const { error: contactError } = await supabase
    .from("campaign_contacts")
    .update({ status: "replied" })
    .eq("id", logRow.contact_id);

  if (contactError) {
    logger.error("Failed to update contact replied status", contactError);
  }

  return true;
}

export async function processHardBounce(sendLogId: string): Promise<{
  processed: boolean;
  inboxPaused: boolean;
}> {
  const { data: logRow, error: fetchError } = await supabase
    .from("send_log")
    .select("id, contact_id, inbox_id, status")
    .eq("id", sendLogId)
    .maybeSingle();

  if (fetchError || !logRow) {
    if (fetchError) {
      logger.error("Failed to fetch send log for bounce", fetchError);
    }
    return { processed: false, inboxPaused: false };
  }

  if (logRow.status === "bounced") {
    return { processed: true, inboxPaused: false };
  }

  const { error: logError } = await supabase
    .from("send_log")
    .update({ status: "bounced" })
    .eq("id", sendLogId);

  if (logError) {
    logger.error("Failed to mark send log bounced", logError);
    return { processed: false, inboxPaused: false };
  }

  const { error: contactError } = await supabase
    .from("campaign_contacts")
    .update({ status: "bounced" })
    .eq("id", logRow.contact_id);

  if (contactError) {
    logger.error("Failed to update contact bounced status", contactError);
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const bounceStats = await getInboxBounceStats(logRow.inbox_id, since);
  const bounceRate =
    bounceStats.total === 0 ? 0 : bounceStats.bounced / bounceStats.total;

  let inboxPaused = false;

  if (bounceRate > 0.1) {
    const { error: pauseError } = await supabase
      .from("connected_inboxes")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", logRow.inbox_id);

    if (pauseError) {
      logger.error("Failed to pause inbox after high bounce rate", pauseError);
    } else {
      inboxPaused = true;
      logger.warn("Inbox paused due to high bounce rate", {
        inboxId: logRow.inbox_id,
        bounceRate7d: Math.round(bounceRate * 1000) / 10,
        totalSends7d: bounceStats.total,
        bounced7d: bounceStats.bounced,
      });
    }
  }

  return { processed: true, inboxPaused };
}
