"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import ConfirmModal from "@/components/dashboard/ConfirmModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  BillingStatus,
  fetchBillingStatus,
  PLAN_LABELS,
  UpgradePlan,
} from "@/lib/billing";
import { deleteAllCampaigns } from "@/lib/campaigns";
import { fetchCurrentUser } from "@/lib/dashboard";
import { disconnectAllInboxes } from "@/lib/inboxes";
import { getSessionEmail } from "@/lib/session";
import { getUserErrorMessage } from "@/lib/api";

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
  const [email, setEmail] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [bounceNotify, setBounceNotify] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDisconnectAll() {
    setLoading(true);
    try {
      await disconnectAllInboxes();
      setMessage("All inboxes disconnected.");
      setShowDisconnectModal(false);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAllCampaigns() {
    setLoading(true);
    try {
      await deleteAllCampaigns();
      setMessage("All campaign data deleted.");
      setShowDeleteModal(false);
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const trialEmailsUsed =
    billing?.trial_emails_limit && billing.trial_emails_remaining != null
      ? billing.trial_emails_limit - billing.trial_emails_remaining
      : 0;
  const trialEmailsPct = billing?.trial_emails_limit
    ? (trialEmailsUsed / billing.trial_emails_limit) * 100
    : 0;
  const trialDaysPct = billing?.trial_days_remaining
    ? Math.max(0, ((14 - billing.trial_days_remaining) / 14) * 100)
    : 0;

  return (
    <AuthGate onSignedIn={load}>
      <DashboardHeader
        title="Settings"
        description="Account, preferences, and billing"
      />

      {message ? <p className="mb-4 text-sm text-success">{message}</p> : null}
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Account
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-1 text-white">{email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Plan</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium capitalize text-accent">
                  {billing?.plan ?? "trial"}
                </span>
              </dd>
            </div>
          </dl>

          {billing?.plan === "trial" ? (
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Trial emails</span>
                  <span>
                    {trialEmailsUsed}/{billing.trial_emails_limit ?? 50}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-border">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${trialEmailsPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Trial period</span>
                  <span>{billing.trial_days_remaining ?? 0} days left</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-border">
                  <div
                    className="h-full rounded-full bg-info"
                    style={{ width: `${trialDaysPct}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-2">
            {(["starter", "growth", "agency"] as UpgradePlan[]).map((plan) => (
              <button
                key={plan}
                type="button"
                title="Coming Soon"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-card-border px-4 py-2 text-sm text-muted opacity-60"
              >
                Upgrade to {PLAN_LABELS[plan]} — Coming Soon
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Preferences
          </h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-white">
                Bounce pause notification
              </span>
              <input
                type="checkbox"
                checked={bounceNotify}
                onChange={(e) => {
                  setBounceNotify(e.target.checked);
                  setPref(PREF_BOUNCE, e.target.checked);
                }}
                className="h-4 w-4 rounded border-card-border accent-accent"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-white">Weekly summary email</span>
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={(e) => {
                  setWeeklySummary(e.target.checked);
                  setPref(PREF_WEEKLY, e.target.checked);
                }}
                className="h-4 w-4 rounded border-card-border accent-accent"
              />
            </label>
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-danger/30">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-muted">
          Irreversible actions. Proceed with caution.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowDisconnectModal(true)}
            className="rounded-lg border border-danger/50 px-4 py-2 text-sm text-danger hover:bg-danger/10"
          >
            Disconnect all inboxes
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-lg border border-danger/50 px-4 py-2 text-sm text-danger hover:bg-danger/10"
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
