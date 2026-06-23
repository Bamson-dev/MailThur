import {
  listAllActiveInboxes,
  updateInboxCapAndStatus,
  getInboxBounceStats,
} from "../repositories/connected-inboxes.repository";
import { logger } from "../utils/logger";

const MAX_DAILY_SEND_CAP = 200;
const MIN_DAILY_SEND_CAP = 10;
const INCREASE_PERCENT = 0.1;
const DECREASE_PERCENT = 0.2;
const LOW_BOUNCE_THRESHOLD = 0.03;
const HIGH_BOUNCE_THRESHOLD = 0.05;
const CRITICAL_BOUNCE_THRESHOLD = 0.1;
const MIN_SENDS_FOR_RAMP = 20;

export async function processDailyCapRamp(): Promise<{
  adjusted: number;
  paused: number;
}> {
  const inboxes = await listAllActiveInboxes();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  let adjusted = 0;
  let paused = 0;

  for (const inbox of inboxes) {
    const { total, bounced } = await getInboxBounceStats(inbox.id, since);

    if (total < MIN_SENDS_FOR_RAMP) {
      continue;
    }

    const bounceRate = bounced / total;

    if (bounceRate > CRITICAL_BOUNCE_THRESHOLD) {
      await updateInboxCapAndStatus(
        inbox.id,
        Math.max(MIN_DAILY_SEND_CAP, Math.floor(inbox.daily_send_cap * 0.5)),
        "paused"
      );
      paused += 1;
      logger.warn("Inbox paused due to high bounce rate", {
        inboxId: inbox.id,
        bounceRate,
      });
      continue;
    }

    if (bounceRate > HIGH_BOUNCE_THRESHOLD) {
      const newCap = Math.max(
        MIN_DAILY_SEND_CAP,
        Math.floor(inbox.daily_send_cap * (1 - DECREASE_PERCENT))
      );
      await updateInboxCapAndStatus(inbox.id, newCap);
      adjusted += 1;
      continue;
    }

    if (bounceRate < LOW_BOUNCE_THRESHOLD) {
      const newCap = Math.min(
        MAX_DAILY_SEND_CAP,
        Math.ceil(inbox.daily_send_cap * (1 + INCREASE_PERCENT))
      );

      if (newCap !== inbox.daily_send_cap) {
        await updateInboxCapAndStatus(inbox.id, newCap);
        adjusted += 1;
      }
    }
  }

  return { adjusted, paused };
}
