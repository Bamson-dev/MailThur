"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserErrorMessage, isLimitReachedError } from "@/lib/api";
import {
  InboxAnalytics,
  fetchInboxAnalytics,
  formatRate,
} from "@/lib/analytics";
import { hasSession } from "@/lib/session";
import UpgradePrompt from "./UpgradePrompt";

type HealthTone = "green" | "yellow" | "red";

function healthTone(inbox: InboxAnalytics): HealthTone {
  if (inbox.status === "paused") {
    return "red";
  }
  if (inbox.bounce_rate_7d > 5) {
    return "yellow";
  }
  return "green";
}

const toneStyles: Record<HealthTone, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

const toneLabels: Record<HealthTone, string> = {
  green: "Active",
  yellow: "High bounce rate",
  red: "Paused",
};

export default function InboxHealth() {
  const [inboxes, setInboxes] = useState<InboxAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [limitMessage, setLimitMessage] = useState("");

  const loadAnalytics = useCallback(async () => {
    if (!hasSession()) {
      setInboxes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLimitMessage("");

    try {
      const data = await fetchInboxAnalytics();
      setInboxes(data);
      setErrorMessage("");
    } catch (error) {
      if (isLimitReachedError(error)) {
        setLimitMessage(error.message);
      } else {
        setErrorMessage(getUserErrorMessage(error));
      }
      setInboxes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900">Inbox Health</h2>
      <p className="mt-2 text-sm text-gray-600">
        Daily send volume and bounce rates for connected inboxes.
      </p>

      {limitMessage ? (
        <div className="mt-6">
          <UpgradePrompt
            message={limitMessage}
            onDismiss={() => setLimitMessage("")}
          />
        </div>
      ) : null}

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : inboxes.length === 0 ? (
          <p className="text-sm text-gray-500">No inbox analytics yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {inboxes.map((inbox) => {
              const tone = healthTone(inbox);

              return (
                <li
                  key={inbox.inbox_id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${toneStyles[tone]}`}
                      title={toneLabels[tone]}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {inbox.inbox_email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {toneLabels[tone]} · cap {inbox.daily_send_cap}/day
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 sm:text-right">
                    <p>
                      {inbox.sent_today} sent today
                      {typeof inbox.sent_week === "number"
                        ? ` · ${inbox.sent_week} this week`
                        : null}
                    </p>
                    <p>Bounce rate (7d): {formatRate(inbox.bounce_rate_7d)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {errorMessage ? (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
