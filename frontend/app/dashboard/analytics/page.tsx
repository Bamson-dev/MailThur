"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card, { SectionHeading } from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Skeleton, TableSkeleton } from "@/components/dashboard/Skeleton";
import {
  CampaignAnalytics,
  DailyAnalyticsPoint,
  fetchCampaignAnalytics,
  fetchDailyAnalytics,
  fetchInboxAnalytics,
  formatRate,
} from "@/lib/analytics";
import { Campaign, fetchCampaigns } from "@/lib/campaigns";
import { getUserErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type SortKey = "name" | "sent" | "open_rate" | "reply_rate";
type Days = 7 | 30 | 90;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs text-muted">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm text-white">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<Days>(30);
  const [series, setSeries] = useState<DailyAnalyticsPoint[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<
    Record<string, CampaignAnalytics>
  >({});
  const [inboxes, setInboxes] = useState<
    Awaited<ReturnType<typeof fetchInboxAnalytics>>
  >([]);
  const [sortKey, setSortKey] = useState<SortKey>("sent");
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [daily, campList, inboxList] = await Promise.all([
        fetchDailyAnalytics(days),
        fetchCampaigns(),
        fetchInboxAnalytics(),
      ]);
      setSeries(daily);
      setCampaigns(campList);
      setInboxes(inboxList);

      const results = await Promise.allSettled(
        campList.map((c) => fetchCampaignAnalytics(c.id))
      );
      const next: Record<string, CampaignAnalytics> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          next[result.value.campaign_id] = result.value;
        }
      }
      setCampaignAnalytics(next);
      setError("");
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const aa = campaignAnalytics[a.id];
      const bb = campaignAnalytics[b.id];
      let av: string | number = a.name;
      let bv: string | number = b.name;
      if (sortKey === "sent") {
        av = aa?.sent ?? 0;
        bv = bb?.sent ?? 0;
      } else if (sortKey === "open_rate") {
        av = aa?.open_rate ?? 0;
        bv = bb?.open_rate ?? 0;
      } else if (sortKey === "reply_rate") {
        av = aa?.reply_rate ?? 0;
        bv = bb?.reply_rate ?? 0;
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [campaigns, campaignAnalytics, sortKey, sortAsc]);

  const hasChartData = series.some((d) => d.sends > 0 || d.opens > 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Analytics"
        description="Performance trends across campaigns and inboxes"
        actions={
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as Days)}
            className="rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <TableSkeleton rows={5} />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <>
          <Card>
            <SectionHeading>Sends & opens</SectionHeading>
            {!hasChartData ? (
              <EmptyState
                icon={BarChart3}
                title="No analytics data yet"
                description="Send your first campaign emails to see performance trends here."
                className="py-12"
              />
            ) : (
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="sendsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="opensGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1E2235" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="#1E2235"
                      tick={{ fill: "#6B7280", fontSize: 11 }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      stroke="#1E2235"
                      tick={{ fill: "#6B7280", fontSize: 11 }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sends"
                      stroke="#7C3AED"
                      strokeWidth={2}
                      fill="url(#sendsGrad)"
                      name="Sends"
                    />
                    <Line
                      type="monotone"
                      dataKey="opens"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      name="Opens"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="mt-6 !p-0 overflow-hidden">
            <div className="border-b border-border-subtle px-6 py-4">
              <SectionHeading>Campaign performance</SectionHeading>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left">
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        className="text-table-header uppercase text-muted hover:text-white"
                        onClick={() => toggleSort("name")}
                      >
                        Campaign
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        className="text-table-header uppercase text-muted hover:text-white"
                        onClick={() => toggleSort("sent")}
                      >
                        Sent
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        className="text-table-header uppercase text-muted hover:text-white"
                        onClick={() => toggleSort("open_rate")}
                      >
                        Open rate
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        className="text-table-header uppercase text-muted hover:text-white"
                        onClick={() => toggleSort("reply_rate")}
                      >
                        Reply rate
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((campaign) => {
                    const stats = campaignAnalytics[campaign.id];
                    return (
                      <tr
                        key={campaign.id}
                        className="border-b border-border-subtle bg-surface hover:bg-row-hover"
                      >
                        <td className="px-4 py-3 text-white">{campaign.name}</td>
                        <td className="px-4 py-3 text-body">
                          {stats?.sent ?? 0}
                        </td>
                        <td className="px-4 py-3 text-body">
                          {stats ? formatRate(stats.open_rate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-body">
                          {stats ? formatRate(stats.reply_rate) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-6 !p-0 overflow-hidden">
            <div className="border-b border-border-subtle px-6 py-4">
              <SectionHeading>Inbox performance</SectionHeading>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left">
                    <th className="px-4 py-3 text-table-header uppercase text-muted">
                      Inbox
                    </th>
                    <th className="px-4 py-3 text-table-header uppercase text-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-table-header uppercase text-muted">
                      Sent today
                    </th>
                    <th className="px-4 py-3 text-table-header uppercase text-muted">
                      Sent week
                    </th>
                    <th className="px-4 py-3 text-table-header uppercase text-muted">
                      Bounce (7d)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inboxes.map((inbox) => {
                    const bounceWarn = inbox.bounce_rate_7d > 5;
                    const paused = inbox.status === "paused";

                    return (
                      <tr
                        key={inbox.inbox_id}
                        className={cn(
                          "border-b border-border-subtle bg-surface",
                          bounceWarn && "bg-warning/5",
                          paused && "bg-danger/5"
                        )}
                      >
                        <td className="px-4 py-3 text-white">
                          {inbox.inbox_email}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inbox.status} />
                        </td>
                        <td className="px-4 py-3 text-body">
                          {inbox.sent_today}
                        </td>
                        <td className="px-4 py-3 text-body">
                          {inbox.sent_week ?? 0}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3",
                            inbox.bounce_rate_7d > 5
                              ? "text-warning"
                              : "text-body"
                          )}
                        >
                          {formatRate(inbox.bounce_rate_7d)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AuthGate>
  );
}
