"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pause, Play, Trash2 } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
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
      await load();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResume(id: string) {
    setActionLoading(id);
    try {
      await resumeCampaign(id);
      await load();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      await deleteCampaign(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(getUserErrorMessage(err));
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

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="flex-1 rounded-lg border border-card-border bg-content px-4 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as Campaign["status"] | "")
            }
            className="rounded-lg border border-card-border bg-content px-4 py-2 text-sm text-white"
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
            className="rounded-lg border border-card-border px-4 py-2 text-sm text-white hover:bg-content"
          >
            Apply
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted">Loading campaigns...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-danger">{error}</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No campaigns found.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-muted">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Contacts</th>
                  <th className="pb-3 pr-4 font-medium">Sent</th>
                  <th className="pb-3 pr-4 font-medium">Open</th>
                  <th className="pb-3 pr-4 font-medium">Reply</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {campaigns.map((campaign) => {
                  const analytics = analyticsById[campaign.id];
                  return (
                    <tr key={campaign.id}>
                      <td className="py-3 pr-4 font-medium text-white">
                        {campaign.name}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {campaign.contact_count ?? 0}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {analytics?.sent ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {analytics ? formatRate(analytics.open_rate) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {analytics ? formatRate(analytics.reply_rate) : "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
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
