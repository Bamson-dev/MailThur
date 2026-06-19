import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

export interface PlatformStats {
  emails_sent_today: number;
  emails_sent_this_week: number;
  active_campaigns: number;
  connected_inboxes: number;
}

const MIN_EMAILS_TODAY = 500;
const MIN_ACTIVE_CAMPAIGNS = 12;

interface CacheEntry {
  data: PlatformStats;
  expiresAt: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000;

function applyMinimums(raw: PlatformStats): PlatformStats {
  return {
    emails_sent_today: Math.max(raw.emails_sent_today, MIN_EMAILS_TODAY),
    emails_sent_this_week: raw.emails_sent_this_week,
    active_campaigns: Math.max(raw.active_campaigns, MIN_ACTIVE_CAMPAIGNS),
    connected_inboxes: raw.connected_inboxes,
  };
}

async function fetchPlatformStatsFromDb(): Promise<PlatformStats> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    { count: sentToday, error: todayError },
    { count: sentWeek, error: weekError },
    { count: activeCampaigns, error: campaignError },
    { count: inboxes, error: inboxError },
  ] = await Promise.all([
    supabase
      .from("send_log")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", startOfDay.toISOString()),
    supabase
      .from("send_log")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", weekAgo.toISOString()),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("connected_inboxes")
      .select("id", { count: "exact", head: true })
      .neq("status", "disconnected"),
  ]);

  if (todayError || weekError || campaignError || inboxError) {
    logger.error(
      "Failed to fetch platform stats",
      todayError ?? weekError ?? campaignError ?? inboxError
    );
    throw new Error("Platform stats lookup failed");
  }

  return applyMinimums({
    emails_sent_today: sentToday ?? 0,
    emails_sent_this_week: sentWeek ?? 0,
    active_campaigns: activeCampaigns ?? 0,
    connected_inboxes: inboxes ?? 0,
  });
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  const data = await fetchPlatformStatsFromDb();
  cache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

/** Exposed for tests to reset cache between assertions. */
export function clearPlatformStatsCache(): void {
  cache = null;
}
