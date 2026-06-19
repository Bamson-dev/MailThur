import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

export interface InboxPublic {
  id: string;
  inbox_email: string;
  provider: string;
  status: string;
  daily_send_cap: number;
  created_at: string;
}

export interface InboxUpsertData {
  userEmail: string;
  inboxEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
}

export interface InboxWithTokens {
  id: string;
  user_email: string;
  inbox_email: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  daily_send_cap: number;
  status: string;
}

const CONSERVATIVE_DAILY_SEND_CAP = 20;

/**
 * Upsert a connected inbox for the authenticated user.
 * IDOR prevention: user_email always comes from the verified session.
 * New inboxes get a conservative daily_send_cap; reconnects preserve the cap.
 */
export async function upsertConnectedInbox(data: InboxUpsertData): Promise<void> {
  const { data: existing, error: lookupError } = await supabase
    .from("connected_inboxes")
    .select("id")
    .eq("user_email", data.userEmail)
    .eq("inbox_email", data.inboxEmail)
    .maybeSingle();

  if (lookupError) {
    logger.error("Failed to lookup connected inbox", lookupError);
    throw new Error("Inbox upsert failed");
  }

  const payload = {
    user_email: data.userEmail,
    provider: "google",
    inbox_email: data.inboxEmail,
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
    token_expires_at: data.tokenExpiresAt.toISOString(),
    status: "active",
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("connected_inboxes")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      logger.error("Failed to update connected inbox", error);
      throw new Error("Inbox upsert failed");
    }
    return;
  }

  const { error } = await supabase.from("connected_inboxes").insert({
    ...payload,
    daily_send_cap: CONSERVATIVE_DAILY_SEND_CAP,
  });

  if (error) {
    logger.error("Failed to insert connected inbox", error);
    throw new Error("Inbox upsert failed");
  }
}

/**
 * List connected inboxes for the authenticated user only.
 * Never returns access_token or refresh_token.
 */
export async function listInboxesForUser(
  userEmail: string
): Promise<InboxPublic[]> {
  const { data, error } = await supabase
    .from("connected_inboxes")
    .select("id, inbox_email, provider, status, daily_send_cap, created_at")
    .eq("user_email", userEmail)
    .neq("status", "disconnected")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list connected inboxes", error);
    throw new Error("Inbox list failed");
  }

  return (data ?? []) as InboxPublic[];
}

export async function getActiveInboxesWithTokensForUser(
  userEmail: string
): Promise<InboxWithTokens[]> {
  const { data, error } = await supabase
    .from("connected_inboxes")
    .select(
      "id, user_email, inbox_email, access_token, refresh_token, token_expires_at, daily_send_cap, status"
    )
    .eq("user_email", userEmail)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to fetch inboxes with tokens", error);
    throw new Error("Inbox fetch failed");
  }

  return (data ?? []) as InboxWithTokens[];
}

export async function updateInboxTokens(
  inboxId: string,
  accessToken: string,
  tokenExpiresAt: Date
): Promise<void> {
  const { error } = await supabase
    .from("connected_inboxes")
    .update({
      access_token: accessToken,
      token_expires_at: tokenExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", inboxId);

  if (error) {
    logger.error("Failed to update inbox tokens", error);
    throw new Error("Token update failed");
  }
}

export async function countSendsTodayForInbox(inboxId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("send_log")
    .select("id", { count: "exact", head: true })
    .eq("inbox_id", inboxId)
    .eq("status", "sent")
    .gte("sent_at", startOfDay.toISOString());

  if (error) {
    logger.error("Failed to count sends today", error);
    throw new Error("Send count failed");
  }

  return count ?? 0;
}

export async function listAllActiveInboxes(): Promise<
  Array<{ id: string; daily_send_cap: number; status: string }>
> {
  const { data, error } = await supabase
    .from("connected_inboxes")
    .select("id, daily_send_cap, status")
    .eq("status", "active");

  if (error) {
    logger.error("Failed to list active inboxes", error);
    throw new Error("Inbox list failed");
  }

  return data ?? [];
}

export async function updateInboxCapAndStatus(
  inboxId: string,
  dailySendCap: number,
  status?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    daily_send_cap: dailySendCap,
    updated_at: new Date().toISOString(),
  };

  if (status) {
    updates.status = status;
  }

  const { error } = await supabase
    .from("connected_inboxes")
    .update(updates)
    .eq("id", inboxId);

  if (error) {
    logger.error("Failed to update inbox cap/status", error);
    throw new Error("Inbox update failed");
  }
}

export async function getInboxBounceStats(
  inboxId: string,
  since: Date
): Promise<{ total: number; bounced: number }> {
  const { data, error } = await supabase
    .from("send_log")
    .select("status")
    .eq("inbox_id", inboxId)
    .gte("sent_at", since.toISOString());

  if (error) {
    logger.error("Failed to fetch bounce stats", error);
    throw new Error("Bounce stats failed");
  }

  const total = data?.length ?? 0;
  const bounced =
    data?.filter((row) => row.status === "bounced").length ?? 0;

  return { total, bounced };
}

/**
 * Disconnect an inbox. IDOR prevention: always filters by user_email AND id.
 * Sets status to disconnected rather than hard deleting.
 */
export async function disconnectInbox(
  userEmail: string,
  inboxId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("connected_inboxes")
    .update({
      status: "disconnected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", inboxId)
    .eq("user_email", userEmail)
    .select("id")
    .maybeSingle();

  if (error) {
    logger.error("Failed to disconnect inbox", error);
    throw new Error("Inbox disconnect failed");
  }

  return !!data;
}
