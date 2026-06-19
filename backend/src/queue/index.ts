import Bull from "bull";
import { env } from "../config/env";
import { processSendQueue } from "./sender-queue";
import { processDailyCapRamp } from "./cap-ramp-job";
import { logger } from "../utils/logger";

const SEND_JOB_NAME = "process-sends";
const CAP_RAMP_JOB_NAME = "daily-cap-ramp";

let sendQueue: Bull.Queue | null = null;

export function getSendQueue(): Bull.Queue {
  if (!sendQueue) {
    sendQueue = new Bull("mailthur-sender", env.REDIS_URL, {
      redis: {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    });

    sendQueue.process(SEND_JOB_NAME, async () => {
      const result = await processSendQueue();
      logger.info("Send queue processed", result);
      return result;
    });

    sendQueue.process(CAP_RAMP_JOB_NAME, async () => {
      const result = await processDailyCapRamp();
      logger.info("Daily cap ramp processed", result);
      return result;
    });

    sendQueue.on("error", (error) => {
      logger.error("Send queue error", error);
    });
  }

  return sendQueue;
}

export async function startQueueSchedulers(): Promise<void> {
  const queue = getSendQueue();

  await queue.add(
    SEND_JOB_NAME,
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: "mailthur-send-repeat",
      removeOnComplete: true,
      removeOnFail: 50,
    }
  );

  await queue.add(
    CAP_RAMP_JOB_NAME,
    {},
    {
      repeat: { every: 24 * 60 * 60 * 1000 },
      jobId: "mailthur-cap-ramp-repeat",
      removeOnComplete: true,
      removeOnFail: 50,
    }
  );

  logger.info("Queue schedulers started");
}

export async function triggerSendQueueNow(): Promise<
  Awaited<ReturnType<typeof processSendQueue>>
> {
  return processSendQueue();
}
