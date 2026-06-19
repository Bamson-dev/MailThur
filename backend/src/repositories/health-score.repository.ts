import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { countConnectedInboxesForUser } from "./connected-inboxes.repository";

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

export interface HealthScoreResult {
  score: number;
  steps: HealthScoreStep;
  next_action: HealthScoreNextAction | null;
  milestones: UserMilestones;
}

async function getUserCampaignIds(userEmail: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_email", userEmail);

  if (error) {
    logger.error("Failed to fetch campaigns for health score", error);
    throw new Error("Health score lookup failed");
  }

  return (data ?? []).map((c) => c.id as string);
}

export async function getHealthScore(userEmail: string): Promise<HealthScoreResult> {
  const [inboxCount, campaignIds] = await Promise.all([
    countConnectedInboxesForUser(userEmail),
    getUserCampaignIds(userEmail),
  ]);

  const inboxConnected = inboxCount > 0;
  const campaignCreated = campaignIds.length > 0;

  let emailSent = false;
  let replyReceived = false;
  let firstOpen = false;

  if (campaignIds.length > 0) {
    const [
      { count: sentCount, error: sentError },
      { count: replyCount, error: replyError },
      { count: openCount, error: openError },
    ] = await Promise.all([
      supabase
        .from("send_log")
        .select("id", { count: "exact", head: true })
        .in("campaign_id", campaignIds)
        .eq("status", "sent"),
      supabase
        .from("send_log")
        .select("id", { count: "exact", head: true })
        .in("campaign_id", campaignIds)
        .not("replied_at", "is", null),
      supabase
        .from("send_log")
        .select("id", { count: "exact", head: true })
        .in("campaign_id", campaignIds)
        .not("opened_at", "is", null),
    ]);

    if (sentError || replyError || openError) {
      logger.error(
        "Failed to fetch send log milestones",
        sentError ?? replyError ?? openError
      );
      throw new Error("Health score lookup failed");
    }

    emailSent = (sentCount ?? 0) > 0;
    replyReceived = (replyCount ?? 0) > 0;
    firstOpen = (openCount ?? 0) > 0;
  }

  const steps: HealthScoreStep = {
    inbox_connected: inboxConnected,
    campaign_created: campaignCreated,
    email_sent: emailSent,
    reply_received: replyReceived,
  };

  let score = 0;
  if (steps.inbox_connected) score += 25;
  if (steps.campaign_created) score += 25;
  if (steps.email_sent) score += 25;
  if (steps.reply_received) score += 25;

  let next_action: HealthScoreNextAction | null = null;
  if (!steps.inbox_connected) {
    next_action = {
      label: "Connect your inbox to start sending",
      href: "/dashboard/inboxes",
    };
  } else if (!steps.campaign_created) {
    next_action = {
      label: "Create your first campaign",
      href: "/dashboard/campaigns/new",
    };
  } else if (!steps.email_sent) {
    next_action = {
      label: "Launch a campaign to send your first email",
      href: "/dashboard/campaigns",
    };
  } else if (!steps.reply_received) {
    next_action = {
      label: "Keep sending — your first reply is coming",
      href: "/dashboard/campaigns",
    };
  }

  return {
    score,
    steps,
    next_action,
    milestones: {
      first_email_sent: emailSent,
      first_open: firstOpen,
      first_reply: replyReceived,
    },
  };
}
