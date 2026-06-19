"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGate from "@/components/dashboard/AuthGate";
import Card, { SectionHeading } from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { StatCardSkeleton, TableSkeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
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
  const { toast } = useToast();
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
    try {
      await launchCampaign(id);
      toast("Campaign launched");
      await load();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePause() {
    setActionLoading(true);
    try {
      await pauseCampaign(id);
      toast("Campaign paused");
      await load();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
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
      {loading ? (
        <>
          <div className="mb-8 h-10 w-64 animate-pulse rounded bg-border-subtle" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : campaign ? (
        <>
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-page-title text-white">{campaign.name}</h1>
                  <StatusBadge status={campaign.status} />
                </div>
                <p className="mt-1 text-body text-text-heading">
                  {campaign.contact_count ?? 0} contacts ·{" "}
                  {campaign.steps?.length ?? 0} steps
                </p>
              </div>
              <div className="flex gap-2">
                {campaign.status === "active" ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-white hover:bg-surface disabled:opacity-50"
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
                  className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-white hover:bg-surface"
                >
                  Back
                </Link>
              </div>
            </div>

            {analytics ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Contacts"
                  value={analytics.contacts}
                  icon={Users}
                  accent="accent"
                />
                <StatCard
                  label="Sent"
                  value={analytics.sent}
                  icon={Send}
                  accent="info"
                />
                <StatCard
                  label="Open rate"
                  value={analytics.open_rate}
                  icon={Mail}
                  accent="success"
                  isPercentage
                />
                <StatCard
                  label="Reply rate"
                  value={analytics.reply_rate}
                  icon={Reply}
                  accent="warning"
                  isPercentage
                />
              </div>
            ) : null}
          </div>

          <Card className="mt-8">
            <SectionHeading>Sequence steps</SectionHeading>
            <div className="relative mt-6 space-y-0">
              {(campaign.steps ?? []).map((step, index) => (
                <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {index < (campaign.steps?.length ?? 0) - 1 ? (
                    <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-border-subtle" />
                  ) : null}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1 rounded-xl border border-border-subtle bg-content p-4">
                    <p className="text-xs text-muted">
                      {step.delay_days > 0
                        ? `Wait ${step.delay_days} day(s)`
                        : "Send immediately"}
                    </p>
                    <p className="mt-2 font-medium text-white">{step.subject}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-body">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
              {(campaign.steps ?? []).length === 0 ? (
                <p className="text-sm text-muted">No steps configured.</p>
              ) : null}
            </div>
          </Card>

          <Card className="mt-6 !p-0 overflow-hidden">
            <div className="border-b border-border-subtle px-6 py-4">
              <SectionHeading>Contacts</SectionHeading>
            </div>
            {contacts.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted">No contacts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left">
                      <th className="px-4 py-3 text-table-header uppercase text-muted">
                        Email
                      </th>
                      <th className="px-4 py-3 text-table-header uppercase text-muted">
                        Status
                      </th>
                      <th className="px-4 py-3 text-table-header uppercase text-muted">
                        Step
                      </th>
                      <th className="px-4 py-3 text-table-header uppercase text-muted">
                        Last contacted
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-border-subtle bg-surface hover:bg-row-hover"
                      >
                        <td className="px-4 py-3 text-white">{contact.email}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={contact.status} />
                        </td>
                        <td className="px-4 py-3 text-body">
                          {contact.current_step + 1}
                        </td>
                        <td className="px-4 py-3 text-body">
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
