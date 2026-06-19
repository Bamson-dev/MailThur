"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserErrorMessage } from "@/lib/api";
import { ActivityEvent, fetchRecentActivity } from "@/lib/activity";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecentActivity();
      setEvents(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-900">Recent activity</h2>
      <p className="mt-2 text-sm text-gray-600">
        Last 10 sending events across your campaigns.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      ) : errorMessage ? (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No activity yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
          {events.map((event) => (
            <li key={event.send_log_id} className="px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">
                {event.campaign_name} → {event.contact_email}
              </p>
              <p className="mt-1 text-gray-500">
                From {event.inbox_email} · {formatTime(event.sent_at)} ·{" "}
                {event.status}
                {event.opened_at ? " · opened" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
