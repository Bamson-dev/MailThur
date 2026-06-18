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

/**
 * Upsert a connected inbox for the authenticated user.
 * IDOR prevention: user_email always comes from the verified session.
 */
export async function upsertConnectedInbox(data: InboxUpsertData): Promise<void> {
  const { error } = await supabase.from("connected_inboxes").upsert(
    {
      user_email: data.userEmail,
      provider: "google",
      inbox_email: data.inboxEmail,
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      token_expires_at: data.tokenExpiresAt.toISOString(),
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email,inbox_email" }
  );

  if (error) {
    logger.error("Failed to upsert connected inbox", error, {
      inboxEmail: data.inboxEmail,
    });
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
