import {
  fetchEligibleContacts,
  getCampaignSteps,
  createPendingSendLog,
  finalizeSendLog,
  advanceContactAfterSend,
  updateContactStatus,
  isCampaignActive,
} from "../repositories/campaigns.repository";
import {
  getActiveInboxesWithTokensForUser,
  updateInboxTokens,
} from "../repositories/connected-inboxes.repository";
import { refreshGoogleAccessToken } from "../utils/google-oauth";
import { sendGmailMessage, isHardBounceError } from "../utils/gmail-send";
import { personalizeText } from "../utils/personalize";
import {
  buildInboxRotationState,
  selectAvailableInbox,
  recordInboxSend,
  InboxRotationState,
} from "../utils/inbox-rotation";
import {
  checkUserCanSend,
  incrementTrialEmailsSent,
  expireSubscription,
  TRIAL_EMAIL_CAP,
} from "../repositories/subscriptions.repository";
import { logger } from "../utils/logger";
import { appendTrackingPixel } from "../utils/tracking";

const rotationByUser = new Map<string, InboxRotationState>();

async function ensureValidAccessToken(inbox: {
  id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}): Promise<string> {
  try {
    const refreshed = await refreshGoogleAccessToken(inbox.refresh_token);
    await updateInboxTokens(inbox.id, refreshed.accessToken, refreshed.expiresAt);
    return refreshed.accessToken;
  } catch {
    const expiresAt = new Date(inbox.token_expires_at);
    const bufferMs = 60 * 1000;

    if (expiresAt.getTime() - bufferMs > Date.now()) {
      return inbox.access_token;
    }

    throw new Error("Google token refresh failed");
  }
}

async function sendEmailWithRetry(
  inbox: {
    id: string;
    inbox_email: string;
    access_token: string;
    refresh_token: string;
    token_expires_at: string;
  },
  toEmail: string,
  subject: string,
  body: string,
  contentType: "text/plain" | "text/html" = "text/plain"
): Promise<void> {
  let accessToken = await ensureValidAccessToken(inbox);

  try {
    await sendGmailMessage({
      accessToken,
      fromEmail: inbox.inbox_email,
      toEmail,
      subject,
      body,
      contentType,
    });
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("401")) {
      throw error;
    }
  }

  const refreshed = await refreshGoogleAccessToken(inbox.refresh_token);
  await updateInboxTokens(inbox.id, refreshed.accessToken, refreshed.expiresAt);
  accessToken = refreshed.accessToken;

  await sendGmailMessage({
    accessToken,
    fromEmail: inbox.inbox_email,
    toEmail,
    subject,
    body,
    contentType,
  });
}

export async function processSendQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  const contacts = await fetchEligibleContacts();
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const errors: string[] = [];

  const stepsCache = new Map<string, Awaited<ReturnType<typeof getCampaignSteps>>>();
  const sendEligibilityCache = new Map<
    string,
    Awaited<ReturnType<typeof checkUserCanSend>>
  >();

  for (const contact of contacts) {
    processed += 1;

    let eligibility = sendEligibilityCache.get(contact.user_email);
    if (!eligibility) {
      eligibility = await checkUserCanSend(contact.user_email);
      sendEligibilityCache.set(contact.user_email, eligibility);
    }

    if (!eligibility.allowed) {
      skipped += 1;
      continue;
    }

    if (!(await isCampaignActive(contact.campaign_id))) {
      skipped += 1;
      continue;
    }

    let steps = stepsCache.get(contact.campaign_id);
    if (!steps) {
      steps = await getCampaignSteps(contact.campaign_id);
      stepsCache.set(contact.campaign_id, steps);
    }

    const step = steps.find((s) => s.step_order === contact.current_step);
    if (!step) {
      await updateContactStatus(contact.id, "completed");
      skipped += 1;
      continue;
    }

    let inboxes = await getActiveInboxesWithTokensForUser(contact.user_email);
    if (inboxes.length === 0) {
      skipped += 1;
      continue;
    }

    let rotation = rotationByUser.get(contact.user_email);
    if (!rotation) {
      rotation = await buildInboxRotationState(inboxes);
      rotationByUser.set(contact.user_email, rotation);
    }

    const inbox = selectAvailableInbox(inboxes, rotation);
    if (!inbox) {
      skipped += 1;
      continue;
    }

    const subject = personalizeText(step.subject, contact);
    const plainBody = personalizeText(step.body, contact);

    let sendLogId: string | null = null;

    try {
      sendLogId = await createPendingSendLog({
        campaignId: contact.campaign_id,
        contactId: contact.id,
        inboxId: inbox.id,
        stepOrder: contact.current_step,
      });

      const htmlBody = appendTrackingPixel(plainBody, sendLogId);

      await sendEmailWithRetry(
        inbox,
        contact.email,
        subject,
        htmlBody,
        "text/html"
      );

      await finalizeSendLog(sendLogId, "sent");

      recordInboxSend(inbox.id, rotation);

      const updatedSubscription = await incrementTrialEmailsSent(
        contact.user_email
      );
      if (
        updatedSubscription.plan === "trial" &&
        updatedSubscription.trial_emails_sent >= TRIAL_EMAIL_CAP
      ) {
        await expireSubscription(contact.user_email);
        sendEligibilityCache.set(contact.user_email, {
          allowed: false,
          reason: "trial_email_cap",
        });
      }

      const nextStep = contact.current_step + 1;
      const nextStepConfig = steps.find((s) => s.step_order === nextStep);
      await advanceContactAfterSend(
        contact.id,
        nextStep,
        steps.length,
        nextStepConfig?.delay_days ?? 0
      );

      sent += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown send error";

      const hardBounce = isHardBounceError(message);

      if (sendLogId) {
        await finalizeSendLog(
          sendLogId,
          hardBounce ? "bounced" : "failed",
          message.slice(0, 500)
        );
      }

      if (hardBounce) {
        await updateContactStatus(contact.id, "bounced");
      }

      failed += 1;
      if (errors.length < 5) {
        errors.push(message.slice(0, 200));
      }
      logger.error("Campaign send failed", error, {
        campaignId: contact.campaign_id,
        contactId: contact.id,
      });
    }
  }

  return { processed, sent, failed, skipped, errors };
}
