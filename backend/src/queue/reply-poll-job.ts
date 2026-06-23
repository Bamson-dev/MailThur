import {
  fetchSentLogsAwaitingReply,
  markSendLogReplied,
} from "../repositories/campaigns.repository";
import { updateInboxTokens } from "../repositories/connected-inboxes.repository";
import { refreshGoogleAccessToken } from "../utils/google-oauth";
import {
  fetchGmailThread,
  threadHasReplyFromContact,
} from "../utils/gmail-threads";
import { logger } from "../utils/logger";

const REPLY_LOOKBACK_DAYS = 7;

async function ensureAccessToken(inbox: {
  id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}): Promise<string> {
  const expiresAt = new Date(inbox.token_expires_at);
  if (expiresAt.getTime() - 60_000 > Date.now()) {
    return inbox.access_token;
  }

  const refreshed = await refreshGoogleAccessToken(inbox.refresh_token);
  await updateInboxTokens(inbox.id, refreshed.accessToken, refreshed.expiresAt);
  return refreshed.accessToken;
}

export async function processReplyPolling(): Promise<{
  checked: number;
  replies: number;
  errors: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - REPLY_LOOKBACK_DAYS);

  const pending = await fetchSentLogsAwaitingReply(since);
  let checked = 0;
  let replies = 0;
  let errors = 0;

  const tokenCache = new Map<string, string>();

  for (const row of pending) {
    checked += 1;

    try {
      let token = tokenCache.get(row.inbox_id);
      if (!token) {
        token = await ensureAccessToken({
          id: row.inbox_id,
          access_token: row.access_token,
          refresh_token: row.refresh_token,
          token_expires_at: row.token_expires_at,
        });
        tokenCache.set(row.inbox_id, token);
      }

      const thread = await fetchGmailThread(token, row.gmail_thread_id);
      if (!thread) {
        continue;
      }

      if (
        threadHasReplyFromContact(
          thread,
          row.contact_email,
          row.inbox_email
        )
      ) {
        await markSendLogReplied(row.send_log_id, row.contact_id);
        replies += 1;
        logger.info("Reply detected via polling", {
          sendLogId: row.send_log_id,
          contactId: row.contact_id,
        });
      }
    } catch (error) {
      errors += 1;
      logger.error("Reply polling error", error, {
        sendLogId: row.send_log_id,
      });
    }
  }

  return { checked, replies, errors };
}
