import Bull from "bull";
import Redis from "ioredis";
import { env } from "../config/env";
import { processSendQueue } from "./sender-queue";
import { processDailyCapRamp } from "./cap-ramp-job";
import { processReplyPolling } from "./reply-poll-job";
import { logger } from "../utils/logger";

const SEND_JOB_NAME = "process-sends";
const CAP_RAMP_JOB_NAME = "daily-cap-ramp";
const REPLY_POLL_JOB_NAME = "reply-poll";

let sendQueue: Bull.Queue | null = null;
let schedulersStarted = false;

async function isRedisAvailable(): Promise<boolean> {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
  });

  try {
    await client.connect();
    await client.ping();
    return true;
  } catch (error) {
    logger.warn("Redis unavailable — Bull schedulers disabled", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return false;
  } finally {
    client.disconnect();
  }
}

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

    sendQueue.process(REPLY_POLL_JOB_NAME, async () => {
      const result = await processReplyPolling();
      logger.info("Reply poll processed", result);
      return result;
    });

    sendQueue.on("error", (error) => {
      logger.error("Send queue error", error);
    });
  }

  return sendQueue;
}

export async function startQueueSchedulers(): Promise<void> {
  if (schedulersStarted) {
    return;
  }

  const redisOk = await isRedisAvailable();
  if (!redisOk) {
    return;
  }

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

  await queue.add(
    REPLY_POLL_JOB_NAME,
    {},
    {
      repeat: { every: 10 * 60 * 1000 },
      jobId: "mailthur-reply-poll-repeat",
      removeOnComplete: true,
      removeOnFail: 50,
    }
  );

  schedulersStarted = true;
  logger.info("Queue schedulers started");
}

export async function getQueueStatus(): Promise<{
  redisReachable: boolean;
  schedulersStarted: boolean;
  repeatableJobs: Array<{ key: string; name: string; every: number | null }>;
}> {
  const redisReachable = await isRedisAvailable();

  if (!redisReachable || !schedulersStarted || !sendQueue) {
    return {
      redisReachable,
      schedulersStarted,
      repeatableJobs: [],
    };
  }

  const repeatableJobs = await sendQueue.getRepeatableJobs();

  return {
    redisReachable,
    schedulersStarted,
    repeatableJobs: repeatableJobs.map((job) => ({
      key: job.key,
      name: job.name,
      every: job.every ?? null,
    })),
  };
}

export async function triggerSendQueueNow(): Promise<
  Awaited<ReturnType<typeof processSendQueue>>
> {
  return processSendQueue();
}
