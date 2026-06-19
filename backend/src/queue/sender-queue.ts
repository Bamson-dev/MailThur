import {
  fetchEligibleContacts,
  getCampaignSteps,
  recordSendLog,
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
import { logger } from "../utils/logger";

const rotationByUser = new Map<string, InboxRotationState>();

async function ensureValidAccessToken(inbox: {
  id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}): Promise<string> {
  const expiresAt = new Date(inbox.token_expires_at);
  const bufferMs = 60 * 1000;

  if (expiresAt.getTime() - bufferMs > Date.now()) {
    return inbox.access_token;
  }

  const refreshed = await refreshGoogleAccessToken(inbox.refresh_token);
  await updateInboxTokens(inbox.id, refreshed.accessToken, refreshed.expiresAt);
  return refreshed.accessToken;
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

  for (const contact of contacts) {
    processed += 1;

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
    const body = personalizeText(step.body, contact);

    try {
      const accessToken = await ensureValidAccessToken(inbox);
      await sendGmailMessage({
        accessToken,
        fromEmail: inbox.inbox_email,
        toEmail: contact.email,
        subject,
        body,
      });

      await recordSendLog({
        campaignId: contact.campaign_id,
        contactId: contact.id,
        inboxId: inbox.id,
        stepOrder: contact.current_step,
        status: "sent",
      });

      recordInboxSend(inbox.id, rotation);

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

      await recordSendLog({
        campaignId: contact.campaign_id,
        contactId: contact.id,
        inboxId: inbox.id,
        stepOrder: contact.current_step,
        status: hardBounce ? "bounced" : "failed",
        errorMessage: message.slice(0, 500),
      });

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
