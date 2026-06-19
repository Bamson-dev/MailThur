"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  fetchCampaignAnalytics,
  formatRate,
} from "@/lib/analytics";
import {
  Campaign,
  CampaignContact,
  fetchCampaign,
  fetchCampaignContacts,
  launchCampaign,
  pauseCampaign,
} from "@/lib/campaigns";
import { getUserErrorMessage } from "@/lib/api";
import { Mail, Reply, Send, Users } from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [analytics, setAnalytics] = useState<{
    sent: number;
    open_rate: number;
    reply_rate: number;
    contacts: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [camp, contactRows, stats] = await Promise.all([
        fetchCampaign(id),
        fetchCampaignContacts(id),
        fetchCampaignAnalytics(id),
      ]);
      setCampaign(camp);
      setContacts(contactRows);
      setAnalytics(stats);
      setError("");
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLaunch() {
    setActionLoading(true);
    setMessage("");
    try {
      await launchCampaign(id);
      setMessage("Campaign launched.");
      await load();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePause() {
    setActionLoading(true);
    setMessage("");
    try {
      await pauseCampaign(id);
      setMessage("Campaign paused.");
      await load();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  const canLaunch =
    campaign &&
    (campaign.steps?.length ?? 0) > 0 &&
    (campaign.contact_count ?? 0) > 0 &&
    campaign.status !== "active";

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title={campaign?.name ?? "Campaign"}
        description="Campaign details and performance"
        actions={
          campaign ? (
            <div className="flex gap-2">
              {campaign.status === "active" ? (
                <button
                  type="button"
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="rounded-lg border border-card-border px-4 py-2 text-sm text-white hover:bg-card disabled:opacity-50"
                >
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLaunch}
                  disabled={!canLaunch || actionLoading}
                  className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-success/90 disabled:opacity-50"
                >
                  Launch
                </button>
              )}
              <Link
                href="/dashboard/campaigns"
                className="rounded-lg border border-card-border px-4 py-2 text-sm text-white hover:bg-card"
              >
                Back
              </Link>
            </div>
          ) : null
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Loading campaign...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : campaign ? (
        <>
          {message ? (
            <p className="mb-4 text-sm text-success">{message}</p>
          ) : null}

          <div className="mb-4 flex items-center gap-3">
            <StatusBadge status={campaign.status} />
            <span className="text-sm text-muted">
              {campaign.contact_count ?? 0} contacts ·{" "}
              {campaign.steps?.length ?? 0} steps
            </span>
          </div>

          {analytics ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Sent" value={analytics.sent} icon={Send} />
              <StatCard
                label="Open rate"
                value={formatRate(analytics.open_rate)}
                icon={Mail}
              />
              <StatCard
                label="Reply rate"
                value={formatRate(analytics.reply_rate)}
                icon={Reply}
              />
              <StatCard
                label="Contacts"
                value={analytics.contacts}
                icon={Users}
              />
            </div>
          ) : null}

          <Card className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Sequence steps
            </h2>
            <div className="mt-4 space-y-4">
              {(campaign.steps ?? []).map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-lg border border-card-border bg-content p-4"
                >
                  <p className="text-xs font-medium text-accent">
                    Step {index + 1}
                    {step.delay_days > 0
                      ? ` · +${step.delay_days} day(s)`
                      : ""}
                  </p>
                  <p className="mt-2 font-medium text-white">{step.subject}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                    {step.body}
                  </p>
                </div>
              ))}
              {(campaign.steps ?? []).length === 0 ? (
                <p className="text-sm text-muted">No steps configured.</p>
              ) : null}
            </div>
          </Card>

          <Card className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Contacts
            </h2>
            {contacts.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No contacts yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border text-left text-muted">
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Step</th>
                      <th className="pb-3 font-medium">Last contacted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="py-3 pr-4 text-white">{contact.email}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={contact.status} />
                        </td>
                        <td className="py-3 pr-4 text-muted">
                          {contact.current_step + 1}
                        </td>
                        <td className="py-3 text-muted">
                          {contact.last_contacted_at
                            ? new Date(
                                contact.last_contacted_at
                              ).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </AuthGate>
  );
}
