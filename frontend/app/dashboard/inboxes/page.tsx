"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Inbox, Plus } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import ConnectInboxButton from "@/components/dashboard/ConnectInboxButton";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { CardListSkeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import { formatRate } from "@/lib/analytics";
import {
  disconnectInbox,
  fetchInboxHealth,
  fetchInboxes,
  InboxDeliverability,
  resumeInbox,
} from "@/lib/inboxes";
import { fetchDashboardOverview } from "@/lib/dashboard";
import { getUserErrorMessage } from "@/lib/api";
import { bounceColor, capBarColor, cn } from "@/lib/utils";

const GRADE_COLORS: Record<string, string> = {
  A: "text-success",
  B: "text-info",
  C: "text-warning",
  D: "text-danger",
  F: "text-danger",
};

export default function InboxesPage() {
  const { toast } = useToast();
  const [inboxes, setInboxes] = useState<
    Awaited<ReturnType<typeof fetchDashboardOverview>>["inboxes"]
  >([]);
  const [healthMap, setHealthMap] = useState<
    Record<string, InboxDeliverability>
  >({});
  const [createdMap, setCreatedMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, list] = await Promise.all([
        fetchDashboardOverview(),
        fetchInboxes(),
      ]);
      setInboxes(overview.inboxes);
      setCreatedMap(new Map(list.map((i) => [i.id, i.created_at])));

      const healthResults = await Promise.allSettled(
        overview.inboxes.map((inbox) => fetchInboxHealth(inbox.id))
      );
      const nextHealth: Record<string, InboxDeliverability> = {};
      overview.inboxes.forEach((inbox, i) => {
        const result = healthResults[i];
        if (result.status === "fulfilled") {
          nextHealth[inbox.id] = result.value;
        }
      });
      setHealthMap(nextHealth);
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
      toast("Inbox disconnected");
      await load();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleResume(id: string) {
    setActionId(id);
    try {
      await resumeInbox(id);
      toast("Inbox resumed");
      await load();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
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
          <ConnectInboxButton className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            Connect New Inbox
          </ConnectInboxButton>
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
        <CardListSkeleton count={2} />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : inboxes.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No inboxes connected yet"
            description="Connect your Gmail inbox so MailThur can send personalized outreach from your own account with proper deliverability."
            action={
              <ConnectInboxButton className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90">
                <Plus className="h-4 w-4" />
                Connect Gmail Inbox
              </ConnectInboxButton>
            }
          />
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
            const bounce = bounceColor(inbox.bounce_rate_7d);
            const createdAt = createdMap.get(inbox.id);
            const deliverability = healthMap[inbox.id];

            return (
              <Card key={inbox.id}>
                {inbox.status === "paused" ? (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <p className="text-xs text-body">
                      Paused automatically due to high bounce rate. Investigate
                      your list quality before resuming.
                    </p>
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{inbox.inbox_email}</p>
                    {createdAt ? (
                      <p className="mt-1 text-xs text-muted">
                        Connected{" "}
                        {new Date(createdAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
                      Google
                    </span>
                    <StatusBadge status={inbox.status} />
                  </div>
                </div>

                {deliverability ? (
                  <div className="mt-4 rounded-lg border border-border-subtle bg-content p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider text-muted">
                        Deliverability score
                      </p>
                      <span
                        className={cn(
                          "text-2xl font-bold",
                          GRADE_COLORS[deliverability.grade]
                        )}
                      >
                        {deliverability.grade}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-body">
                      {deliverability.recommendation}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">Today&apos;s sending</p>
                    <p className="text-xs text-body">
                      {inbox.sent_today} / {inbox.daily_send_cap}
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
                    <div
                      className={`h-full rounded-full transition-all ${capBarColor(capPct)}`}
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${bounce.dot}`} />
                  <span className={`text-sm font-medium ${bounce.text}`}>
                    {formatRate(inbox.bounce_rate_7d)} bounce (7d)
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  {inbox.status === "paused" ? (
                    <button
                      type="button"
                      onClick={() => handleResume(inbox.id)}
                      disabled={actionId === inbox.id}
                      className="flex-1 rounded-lg bg-success px-3 py-2 text-xs font-semibold text-white hover:bg-success/90 disabled:opacity-50"
                    >
                      Resume
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDisconnect(inbox.id)}
                    disabled={actionId === inbox.id}
                    className="flex-1 rounded-lg border border-border-subtle px-3 py-2 text-xs text-white hover:bg-content disabled:opacity-50"
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
