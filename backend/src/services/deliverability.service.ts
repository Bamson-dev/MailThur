import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { getInboxBounceStats } from "../repositories/connected-inboxes.repository";

export type DeliverabilityGrade = "A" | "B" | "C" | "D" | "F";

export interface DeliverabilityResult {
  score: number;
  grade: DeliverabilityGrade;
  recommendation: string;
}

function scoreToGrade(score: number): DeliverabilityGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

async function wasAggressiveSending(
  inboxId: string,
  dailyCap: number
): Promise<boolean> {
  if (dailyCap <= 0) return false;

  const threshold = dailyCap * 0.9;
  const daysToCheck = 5;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - daysToCheck);
  since.setUTCHours(0, 0, 0, 0);

  const { data: logs, error } = await supabase
    .from("send_log")
    .select("sent_at")
    .eq("inbox_id", inboxId)
    .eq("status", "sent")
    .gte("sent_at", since.toISOString());

  if (error) {
    logger.error("Failed to fetch send logs for deliverability", error);
    return false;
  }

  const countsByDay = new Map<string, number>();
  for (const log of logs ?? []) {
    if (!log.sent_at) continue;
    const day = (log.sent_at as string).slice(0, 10);
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
  }

  const recentDays: string[] = [];
  for (let i = daysToCheck - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    recentDays.push(d.toISOString().slice(0, 10));
  }

  const daysWithData = recentDays.filter((day) => countsByDay.has(day));
  if (daysWithData.length < daysToCheck) {
    return false;
  }

  return daysWithData.every((day) => (countsByDay.get(day) ?? 0) >= threshold);
}

export async function getInboxDeliverability(
  userEmail: string,
  inboxId: string
): Promise<DeliverabilityResult | null> {
  const { data: inbox, error } = await supabase
    .from("connected_inboxes")
    .select("id, user_email, status, daily_send_cap, created_at, updated_at")
    .eq("id", inboxId)
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch inbox for deliverability", error);
    throw new Error("Deliverability lookup failed");
  }

  if (!inbox) {
    return null;
  }

  let score = 100;
  const bounceSince = new Date();
  bounceSince.setDate(bounceSince.getDate() - 7);

  const bounceStats = await getInboxBounceStats(inboxId, bounceSince);
  const bounceRate =
    bounceStats.total === 0 ? 0 : bounceStats.bounced / bounceStats.total;

  if (bounceRate > 0.05) {
    score -= 20;
  } else if (bounceRate > 0.03) {
    score -= 10;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (
    inbox.status === "paused" &&
    new Date(inbox.updated_at as string) >= thirtyDaysAgo
  ) {
    score -= 15;
  }

  const aggressive = await wasAggressiveSending(
    inboxId,
    inbox.daily_send_cap as number
  );
  if (aggressive) {
    score -= 10;
  }

  const createdAt = new Date(inbox.created_at as string);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  if (
    inbox.status === "active" &&
    createdAt <= fourteenDaysAgo
  ) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));
  const grade = scoreToGrade(score);

  let recommendation: string;
  if (bounceRate > 0.05) {
    recommendation =
      "Reduce your daily cap by 5 for the next 3 days to improve your score.";
  } else if (aggressive) {
    recommendation =
      "You are hitting your daily cap consistently — lower it slightly to protect deliverability.";
  } else if (inbox.status === "paused") {
    recommendation =
      "Review bounced contacts and list quality before resuming sends.";
  } else if (score >= 90) {
    recommendation = "Your inbox is healthy. Keep sending consistently.";
  } else if (score >= 75) {
    recommendation =
      "Monitor your bounce rate and avoid sudden volume spikes.";
  } else {
    recommendation =
      "Pause new sends, clean your list, and reduce daily volume.";
  }

  return { score, grade, recommendation };
}
