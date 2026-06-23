"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card, { SectionHeading } from "@/components/dashboard/Card";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import {
  BillingStatus,
  fetchBillingStatus,
} from "@/lib/billing";
import { TRIAL_DAY_LIMIT, TRIAL_EMAIL_LIMIT } from "@/lib/billing-plans";
import { deleteAllCampaigns } from "@/lib/campaigns";
import { fetchCurrentUser } from "@/lib/dashboard";
import { disconnectAllInboxes } from "@/lib/inboxes";
import DomainChecker from "@/components/dashboard/DomainChecker";
import { getSessionEmail } from "@/lib/session";
import { getUserErrorMessage } from "@/lib/api";
import { capBarColor } from "@/lib/utils";

const PREF_BOUNCE = "mailthur_pref_bounce_notify";
const PREF_WEEKLY = "mailthur_pref_weekly_summary";

function getPref(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

function setPref(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value ? "true" : "false");
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [bounceNotify, setBounceNotify] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setPageLoading(true);
    setBounceNotify(getPref(PREF_BOUNCE));
    setWeeklySummary(getPref(PREF_WEEKLY));
    setEmail(getSessionEmail());
    try {
      const user = await fetchCurrentUser();
      setEmail(user.email);
      const status = await fetchBillingStatus();
      setBilling(status);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDisconnectAll() {
    setLoading(true);
    try {
      await disconnectAllInboxes();
      toast("All inboxes disconnected");
      setShowDisconnectModal(false);
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAllCampaigns() {
    setLoading(true);
    try {
      await deleteAllCampaigns();
      toast("All campaign data deleted");
      setShowDeleteModal(false);
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  const trialEmailsUsed = billing?.trial_emails_sent ?? 0;
  const trialEmailsPct = (trialEmailsUsed / TRIAL_EMAIL_LIMIT) * 100;
  const trialDaysPct = billing?.trial_days_remaining
    ? Math.max(
        0,
        ((TRIAL_DAY_LIMIT - billing.trial_days_remaining) / TRIAL_DAY_LIMIT) *
          100
      )
    : 0;

  if (pageLoading) {
    return (
      <AuthGate onSignedIn={load}>
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Settings"
        description="Account, preferences, and billing"
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeading>Account</SectionHeading>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">
                Email
              </dt>
              <dd className="mt-1 text-white">{email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">
                Plan
              </dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium capitalize text-accent">
                  {billing?.plan ?? "trial"}
                </span>
              </dd>
            </div>
          </dl>

          {billing?.plan === "trial" ? (
            <div className="mt-8 space-y-5">
              <div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Trial emails used</span>
                  <span>
                    {trialEmailsUsed}/{TRIAL_EMAIL_LIMIT}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
                  <div
                    className={`h-full rounded-full transition-all ${capBarColor(trialEmailsPct)}`}
                    style={{ width: `${trialEmailsPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Trial period</span>
                  <span>{billing.trial_days_remaining ?? 0} of {TRIAL_DAY_LIMIT} days left</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${trialDaysPct}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <SectionHeading>Preferences</SectionHeading>
          <div className="mt-6 space-y-5">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-body">
                Email me when an inbox is paused for high bounce rate
              </span>
              <input
                type="checkbox"
                checked={bounceNotify}
                onChange={(e) => {
                  setBounceNotify(e.target.checked);
                  setPref(PREF_BOUNCE, e.target.checked);
                }}
                className="h-4 w-4 rounded border-border-subtle accent-accent"
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-body">
                Weekly sending summary email
              </span>
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={(e) => {
                  setWeeklySummary(e.target.checked);
                  setPref(PREF_WEEKLY, e.target.checked);
                }}
                className="h-4 w-4 rounded border-border-subtle accent-accent"
              />
            </label>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <SectionHeading>Domain checker</SectionHeading>
        <p className="mt-2 text-sm text-body">
          Verify SPF, DKIM, and DMARC records for your sending domain.
        </p>
        <div className="mt-6">
          <DomainChecker />
        </div>
      </Card>

      <Card className="mt-6 border-danger-border bg-danger-zone">
        <SectionHeading className="text-danger">Danger zone</SectionHeading>
        <p className="mt-2 text-sm text-body">
          Irreversible actions. Proceed with caution.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowDisconnectModal(true)}
            className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/20"
          >
            Disconnect all inboxes
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/20"
          >
            Delete all campaign data
          </button>
        </div>
      </Card>

      <ConfirmModal
        open={showDisconnectModal}
        title="Disconnect all inboxes"
        description="This will disconnect every connected inbox. You will need to reconnect them to send emails."
        confirmLabel="Disconnect all"
        loading={loading}
        onConfirm={handleDisconnectAll}
        onCancel={() => setShowDisconnectModal(false)}
      />

      <ConfirmModal
        open={showDeleteModal}
        title="Delete all campaign data"
        description="This will permanently delete all campaigns, contacts, and send history. This cannot be undone."
        confirmLabel="Delete everything"
        loading={loading}
        onConfirm={handleDeleteAllCampaigns}
        onCancel={() => setShowDeleteModal(false)}
      />
    </AuthGate>
  );
}
