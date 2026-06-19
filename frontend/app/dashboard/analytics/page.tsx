"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
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
            className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Loading analytics...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Sends & opens
            </h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke="#353849" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#252836",
                      border: "1px solid #353849",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sends"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    dot={false}
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Campaign performance
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-muted">
                    <th className="pb-3 pr-4">
                      <button type="button" onClick={() => toggleSort("name")}>
                        Campaign
                      </button>
                    </th>
                    <th className="pb-3 pr-4">
                      <button type="button" onClick={() => toggleSort("sent")}>
                        Sent
                      </button>
                    </th>
                    <th className="pb-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleSort("open_rate")}
                      >
                        Open rate
                      </button>
                    </th>
                    <th className="pb-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("reply_rate")}
                      >
                        Reply rate
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {sortedCampaigns.map((campaign) => {
                    const stats = campaignAnalytics[campaign.id];
                    return (
                      <tr key={campaign.id}>
                        <td className="py-3 pr-4 text-white">{campaign.name}</td>
                        <td className="py-3 pr-4 text-muted">
                          {stats?.sent ?? 0}
                        </td>
                        <td className="py-3 pr-4 text-muted">
                          {stats ? formatRate(stats.open_rate) : "—"}
                        </td>
                        <td className="py-3 text-muted">
                          {stats ? formatRate(stats.reply_rate) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Inbox performance
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-muted">
                    <th className="pb-3 pr-4 font-medium">Inbox</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Sent today</th>
                    <th className="pb-3 pr-4 font-medium">Sent week</th>
                    <th className="pb-3 font-medium">Bounce (7d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {inboxes.map((inbox) => {
                    const highlight =
                      inbox.bounce_rate_7d > 10 || inbox.status === "paused";
                    return (
                      <tr
                        key={inbox.inbox_id}
                        className={cn(
                          highlight && "bg-danger/5"
                        )}
                      >
                        <td className="py-3 pr-4 text-white">
                          {inbox.inbox_email}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={inbox.status} />
                        </td>
                        <td className="py-3 pr-4 text-muted">
                          {inbox.sent_today}
                        </td>
                        <td className="py-3 pr-4 text-muted">
                          {inbox.sent_week ?? 0}
                        </td>
                        <td
                          className={cn(
                            "py-3",
                            inbox.bounce_rate_7d > 10
                              ? "text-danger"
                              : "text-muted"
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
