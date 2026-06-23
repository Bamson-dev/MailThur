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
import Card, { SectionHeading } from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import HealthScoreRing from "@/components/dashboard/HealthScoreRing";
import PlatformStatsBanner from "@/components/dashboard/PlatformStatsBanner";
import FirstSuccessCard from "@/components/dashboard/FirstSuccessCard";
import ConnectInboxButton from "@/components/dashboard/ConnectInboxButton";
import {
  StatCardSkeleton,
  CardListSkeleton,
  Skeleton,
} from "@/components/dashboard/Skeleton";
import {
  DashboardOverview,
  fetchDashboardOverview,
  fetchHealthScore,
  HealthScore,
} from "@/lib/dashboard";
import { formatRate } from "@/lib/analytics";
import { getUserErrorMessage } from "@/lib/api";
import {
  activityDotColor,
  bounceColor,
  capBarColor,
  timeAgo,
} from "@/lib/utils";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, health] = await Promise.all([
        fetchDashboardOverview(),
        fetchHealthScore(),
      ]);
      setData(overview);
      setHealthScore(health);
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

  const stats = data?.stats;
  const events = data?.activity ?? [];
  const inboxes = data?.inboxes ?? [];

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Dashboard"
        description="Overview of your outreach performance"
        actions={
          <>
            <Link
              href="/dashboard/campaigns/new"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              New Campaign
            </Link>
            <ConnectInboxButton className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-surface">
              Connect Inbox
            </ConnectInboxButton>
          </>
        }
      />

      {error ? (
        <p className="mb-6 text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <>
          <Skeleton className="mb-6 h-36 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : stats && healthScore ? (
        <>
          <Card className="mb-6">
            <HealthScoreRing
              score={healthScore.score}
              nextAction={healthScore.next_action}
            />
          </Card>

          <div className="mb-6">
            <FirstSuccessCard milestones={healthScore.milestones} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Emails sent this month"
              value={stats.emails_sent_this_month}
              icon={Send}
              accent="accent"
            />
            <StatCard
              label="Avg open rate"
              value={stats.avg_open_rate}
              icon={Mail}
              accent="success"
              isPercentage
            />
            <StatCard
              label="Avg reply rate"
              value={stats.avg_reply_rate}
              icon={Reply}
              accent="info"
              isPercentage
            />
            <StatCard
              label="Active campaigns"
              value={stats.active_campaigns_count}
              icon={Megaphone}
              accent="warning"
            />
          </div>

          <PlatformStatsBanner />

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 !p-0">
              <div className="border-b border-border-subtle px-6 py-4">
                <SectionHeading>Recent activity</SectionHeading>
              </div>
              {events.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted">
                  No sending activity yet.
                </p>
              ) : (
                <ul className="max-h-[28rem] overflow-y-auto scrollbar-thin">
                  {events.map((event, index) => (
                    <li
                      key={event.send_log_id}
                      className={`flex items-start gap-3 border-b border-border-subtle px-6 py-3.5 ${
                        index % 2 === 0 ? "bg-surface" : "bg-transparent"
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityDotColor(
                          event.status,
                          event.opened_at
                        )}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white">
                          {event.contact_email}
                          <span className="text-muted">
                            {" "}
                            · {event.campaign_name}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {event.inbox_email} · {timeAgo(event.sent_at)}
                        </p>
                      </div>
                      <StatusBadge
                        status={
                          event.status === "bounced"
                            ? "bounced"
                            : event.opened_at
                              ? "opened"
                              : event.status
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-accent" />
                <SectionHeading>Inbox health</SectionHeading>
              </div>
              {inboxes.length === 0 ? (
                <p className="mt-4 text-sm text-muted">
                  No inboxes connected.{" "}
                  <ConnectInboxButton className="text-accent hover:underline">
                    Connect one
                  </ConnectInboxButton>
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
                    const bounce = bounceColor(inbox.bounce_rate_7d);

                    return (
                      <li
                        key={inbox.id}
                        className="rounded-xl border border-border-subtle bg-surface p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-white">
                            {inbox.inbox_email}
                          </p>
                          <span className="shrink-0 rounded-full bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
                            Google
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted">
                              Today&apos;s sending
                            </p>
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
                        <div className="mt-3 flex items-center justify-between">
                          <StatusBadge status={inbox.status} />
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${bounce.dot}`}
                            />
                            <span className={`text-xs font-medium ${bounce.text}`}>
                              {formatRate(inbox.bounce_rate_7d)} bounce
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/campaigns/new"
              className="group rounded-xl border border-border-subtle bg-surface p-6 transition-colors hover:border-accent/40"
            >
              <Megaphone className="h-5 w-5 text-accent" />
              <p className="mt-3 font-semibold text-white">New Campaign</p>
              <p className="mt-1 text-sm text-muted">
                Build a sequence and start reaching prospects.
              </p>
            </Link>
            <ConnectInboxButton className="group rounded-xl border border-border-subtle bg-surface p-6 text-left transition-colors hover:border-accent/40">
              <Inbox className="h-5 w-5 text-accent" />
              <p className="mt-3 font-semibold text-white">Connect Inbox</p>
              <p className="mt-1 text-sm text-muted">
                Link Gmail to send from your own account.
              </p>
            </ConnectInboxButton>
          </div>
        </>
      ) : null}
    </AuthGate>
  );
}
