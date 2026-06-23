"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Mail, Pause, Play, Trash2 } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card, { SectionHeading } from "@/components/dashboard/Card";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import MetricBar from "@/components/dashboard/MetricBar";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { TableSkeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import {
  CampaignAnalytics,
  fetchCampaignAnalytics,
  formatRate,
} from "@/lib/analytics";
import {
  Campaign,
  deleteCampaign,
  fetchCampaigns,
  pauseCampaign,
  resumeCampaign,
} from "@/lib/campaigns";
import { getUserErrorMessage } from "@/lib/api";

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analyticsById, setAnalyticsById] = useState<
    Record<string, CampaignAnalytics>
  >({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Campaign["status"] | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCampaigns({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setCampaigns(data);
      setError("");

      const results = await Promise.allSettled(
        data.map((c) => fetchCampaignAnalytics(c.id))
      );
      const next: Record<string, CampaignAnalytics> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          next[result.value.campaign_id] = result.value;
        }
      }
      setAnalyticsById(next);
    } catch (err) {
      setError(getUserErrorMessage(err));
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePause(id: string) {
    setActionLoading(id);
    try {
      await pauseCampaign(id);
      toast("Campaign paused");
      await load();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResume(id: string) {
    setActionLoading(id);
    try {
      await resumeCampaign(id);
      toast("Campaign resumed");
      await load();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      await deleteCampaign(deleteId);
      toast("Campaign deleted");
      setDeleteId(null);
      await load();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Campaigns"
        description="Manage your outreach campaigns"
        actions={
          <Link
            href="/dashboard/campaigns/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            New Campaign
          </Link>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-border-subtle p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="flex-1 rounded-lg border border-border-subtle bg-content px-4 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as Campaign["status"] | "")
              }
              className="rounded-lg border border-border-subtle bg-content px-4 py-2 text-sm text-white"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-white hover:bg-content"
            >
              Apply
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-danger">{error}</p>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No campaigns yet"
            description="Create your first campaign to start reaching prospects with personalized sequences."
            action={
              <Link
                href="/dashboard/campaigns/new"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
              >
                New Campaign
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-border-subtle text-left">
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Name
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Contacts
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Sent
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Open
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Reply
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Bounce
                  </th>
                  <th className="px-4 py-3 text-table-header uppercase text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const analytics = analyticsById[campaign.id];
                  return (
                    <tr
                      key={campaign.id}
                      className="group border-b border-border-subtle bg-surface transition-colors hover:bg-row-hover"
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/dashboard/campaigns/${campaign.id}`)
                          }
                          className="text-left text-sm font-medium text-white hover:text-accent"
                        >
                          {campaign.name}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-body">
                        {campaign.contact_count ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-body">
                        {analytics?.sent ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-body">
                          {analytics ? formatRate(analytics.open_rate) : "—"}
                        </span>
                        {analytics ? (
                          <MetricBar
                            value={analytics.open_rate}
                            color="success"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-body">
                          {analytics ? formatRate(analytics.reply_rate) : "—"}
                        </span>
                        {analytics ? (
                          <MetricBar
                            value={analytics.reply_rate}
                            color="info"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-body">
                          {analytics ? formatRate(analytics.bounce_rate) : "—"}
                        </span>
                        {analytics ? (
                          <MetricBar
                            value={analytics.bounce_rate}
                            color="danger"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/dashboard/campaigns/${campaign.id}`)
                            }
                            className="rounded p-1.5 text-muted hover:bg-content hover:text-white"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {campaign.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => handlePause(campaign.id)}
                              disabled={actionLoading === campaign.id}
                              className="rounded p-1.5 text-muted hover:bg-content hover:text-warning"
                              title="Pause"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          ) : campaign.status === "paused" ? (
                            <button
                              type="button"
                              onClick={() => handleResume(campaign.id)}
                              disabled={actionLoading === campaign.id}
                              className="rounded p-1.5 text-muted hover:bg-content hover:text-success"
                              title="Resume"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setDeleteId(campaign.id)}
                            className="rounded p-1.5 text-muted hover:bg-content hover:text-danger"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={!!deleteId}
        title="Delete campaign"
        description="This will permanently delete the campaign and all its contacts. This action cannot be undone."
        confirmLabel="Delete"
        loading={!!actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AuthGate>
  );
}
