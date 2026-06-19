"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { fetchInboxAnalytics, formatRate } from "@/lib/analytics";
import {
  disconnectInbox,
  fetchInboxes,
  getConnectInboxUrl,
  resumeInbox,
} from "@/lib/inboxes";
import { getUserErrorMessage } from "@/lib/api";

export default function InboxesPage() {
  const [inboxes, setInboxes] = useState<
    Awaited<ReturnType<typeof fetchInboxAnalytics>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, list] = await Promise.all([
        fetchInboxAnalytics(),
        fetchInboxes(),
      ]);
      const createdMap = new Map(list.map((i) => [i.id, i.created_at]));
      setInboxes(
        analytics.map((a) => ({
          ...a,
          created_at: createdMap.get(a.inbox_id) ?? a.created_at,
        }))
      );
      setError("");
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pausedCount = inboxes.filter((i) => i.status === "paused").length;

  async function handleDisconnect(id: string) {
    setActionId(id);
    try {
      await disconnectInbox(id);
      await load();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function handleResume(id: string) {
    setActionId(id);
    try {
      await resumeInbox(id);
      await load();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Inboxes"
        description="Manage connected Gmail inboxes"
        actions={
          <a
            href={getConnectInboxUrl()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Connect Inbox
          </a>
        }
      />

      {pausedCount > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-white">
              {pausedCount} inbox(es) paused
            </p>
            <p className="mt-1 text-xs text-muted">
              Inboxes are auto-paused when bounce rate exceeds 10%. Review and
              resume when ready.
            </p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading inboxes...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : inboxes.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            No inboxes connected.{" "}
            <a href={getConnectInboxUrl()} className="text-accent hover:underline">
              Connect your first inbox
            </a>
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {inboxes.map((inbox) => {
            const capPct =
              inbox.daily_send_cap > 0
                ? Math.min(
                    100,
                    (inbox.sent_today / inbox.daily_send_cap) * 100
                  )
                : 0;
            const bounceColor =
              inbox.bounce_rate_7d > 10
                ? "text-danger"
                : inbox.bounce_rate_7d > 5
                  ? "text-warning"
                  : "text-success";

            return (
              <Card key={inbox.inbox_id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {inbox.inbox_email}
                    </p>
                    {inbox.created_at ? (
                      <p className="mt-1 text-xs text-muted">
                        Connected{" "}
                        {new Date(inbox.created_at).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={inbox.status} />
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Daily sends</span>
                    <span>
                      {inbox.sent_today}/{inbox.daily_send_cap}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-border">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted">Sent this week</p>
                    <p className="font-medium text-white">
                      {inbox.sent_week ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Bounce rate (7d)</p>
                    <p className={`font-medium ${bounceColor}`}>
                      {formatRate(inbox.bounce_rate_7d)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {inbox.status === "paused" ? (
                    <button
                      type="button"
                      onClick={() => handleResume(inbox.inbox_id)}
                      disabled={actionId === inbox.inbox_id}
                      className="flex-1 rounded-lg bg-success px-3 py-2 text-xs font-semibold text-white hover:bg-success/90 disabled:opacity-50"
                    >
                      Resume
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDisconnect(inbox.inbox_id)}
                    disabled={actionId === inbox.inbox_id}
                    className="flex-1 rounded-lg border border-card-border px-3 py-2 text-xs text-white hover:bg-content disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AuthGate>
  );
}
