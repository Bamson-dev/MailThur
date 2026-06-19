"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Mail,
  Megaphone,
  Reply,
  Send,
} from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ActivityEvent, fetchRecentActivity } from "@/lib/activity";
import { fetchDashboardOverview } from "@/lib/dashboard";
import { fetchInboxAnalytics, formatRate } from "@/lib/analytics";
import { getConnectInboxUrl } from "@/lib/inboxes";
import { getUserErrorMessage } from "@/lib/api";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState({
    emails_sent_this_month: 0,
    avg_open_rate: 0,
    avg_reply_rate: 0,
    active_campaigns_count: 0,
  });
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [inboxes, setInboxes] = useState<
    Awaited<ReturnType<typeof fetchInboxAnalytics>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, activityData, inboxData] = await Promise.all([
        fetchDashboardOverview(),
        fetchRecentActivity(20),
        fetchInboxAnalytics(),
      ]);
      setOverview(overviewData);
      setEvents(activityData);
      setInboxes(inboxData);
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

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Dashboard"
        description="Overview of your outreach performance"
        actions={
          <>
            <Link
              href="/dashboard/campaigns/new"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
            >
              New Campaign
            </Link>
            <a
              href={getConnectInboxUrl()}
              className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-white hover:bg-card"
            >
              Connect Inbox
            </a>
          </>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Loading overview...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Emails sent this month"
              value={overview.emails_sent_this_month}
              icon={Send}
            />
            <StatCard
              label="Avg open rate"
              value={formatRate(overview.avg_open_rate)}
              icon={Mail}
            />
            <StatCard
              label="Avg reply rate"
              value={formatRate(overview.avg_reply_rate)}
              icon={Reply}
            />
            <StatCard
              label="Active campaigns"
              value={overview.active_campaigns_count}
              icon={Megaphone}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Recent activity
              </h2>
              {events.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No activity yet.</p>
              ) : (
                <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto scrollbar-thin">
                  {events.map((event) => (
                    <li
                      key={event.send_log_id}
                      className="rounded-lg border border-card-border bg-content px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">
                          {event.campaign_name} → {event.contact_email}
                        </p>
                        <StatusBadge status={event.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        From {event.inbox_email} · {formatTime(event.sent_at)}
                        {event.opened_at ? " · opened" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Inbox health
                </h2>
              </div>
              {inboxes.length === 0 ? (
                <p className="mt-4 text-sm text-muted">
                  No inboxes connected.{" "}
                  <a href={getConnectInboxUrl()} className="text-accent hover:underline">
                    Connect one
                  </a>
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
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
                        ? "bg-danger"
                        : inbox.bounce_rate_7d > 5
                          ? "bg-warning"
                          : "bg-success";

                    return (
                      <li
                        key={inbox.inbox_id}
                        className="rounded-lg border border-card-border bg-content p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            {inbox.inbox_email}
                          </p>
                          <StatusBadge status={inbox.status} />
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted">
                            <span>Daily cap</span>
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
                        <p className="mt-2 text-xs text-muted">
                          Bounce rate (7d):{" "}
                          <span className={`font-medium ${bounceColor.replace("bg-", "text-")}`}>
                            {formatRate(inbox.bounce_rate_7d)}
                          </span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </AuthGate>
  );
}
