"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Clock } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card, { SectionHeading } from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PlanCards, {
  ComparisonTable,
  TrustBadges,
} from "@/components/dashboard/PlanCards";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import {
  BillingStatus,
  cancelSubscription,
  fetchBillingStatus,
  initiateCheckout,
  trialHoursRemaining,
  verifyPayment,
  UpgradePlan,
} from "@/lib/billing";
import { TRIAL_EMAIL_LIMIT } from "@/lib/billing-plans";
import { getUserErrorMessage } from "@/lib/api";
import { capBarColor } from "@/lib/utils";

export default function BillingPageClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<UpgradePlan | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState("");

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchBillingStatus();
      setBilling(status);
      setError("");
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    const reference = searchParams.get("reference");
    const paymentSuccess = searchParams.get("payment");

    if (!reference && paymentSuccess !== "success") {
      return;
    }

    async function verify() {
      if (!reference) {
        toast("Payment received. Verifying your subscription…");
        await loadBilling();
        return;
      }

      try {
        const result = await verifyPayment(reference);
        toast(`Upgraded to ${result.plan} plan.`);
        await loadBilling();
      } catch (err) {
        toast(getUserErrorMessage(err), "error");
      }
    }

    verify();
  }, [searchParams, loadBilling, toast]);

  async function handleUpgrade(plan: UpgradePlan) {
    setLoadingPlan(plan);
    setError("");
    try {
      const url = await initiateCheckout(plan);
      window.location.href = url;
    } catch (err) {
      setError(getUserErrorMessage(err));
      setLoadingPlan(null);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const result = await cancelSubscription();
      toast(result.message);
      setShowCancelModal(false);
      await loadBilling();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setCancelling(false);
    }
  }

  const trialEmailsUsed = billing?.trial_emails_sent ?? 0;
  const trialEmailsPct = (trialEmailsUsed / TRIAL_EMAIL_LIMIT) * 100;
  const hoursLeft = billing ? trialHoursRemaining(billing.trial_expires_at) : 0;

  if (loading) {
    return (
      <AuthGate onSignedIn={loadBilling}>
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate onSignedIn={loadBilling}>
      <DashboardHeader
        title="Billing"
        description="Choose a plan, track your trial, and manage your subscription."
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      {billing?.plan === "trial" ? (
        <Card className="mb-8 border-accent/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-accent">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Trial active
                </span>
              </div>
              <p className="mt-2 text-xl font-bold text-white">
                Your trial ends in {billing.trial_days_remaining} day
                {billing.trial_days_remaining === 1 ? "" : "s"}
                {hoursLeft > 0 ? ` and ${hoursLeft} hours` : ""}. Upgrade to keep
                sending.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted">
              <span>Trial emails sent</span>
              <span>
                {trialEmailsUsed}/{TRIAL_EMAIL_LIMIT}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-border-subtle">
              <div
                className={`h-full rounded-full transition-all ${capBarColor(trialEmailsPct)}`}
                style={{ width: `${Math.min(100, trialEmailsPct)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {billing.trial_emails_remaining} emails remaining in your trial
            </p>
          </div>
        </Card>
      ) : billing ? (
        <Card className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold capitalize text-white">
                  {billing.plan}
                </p>
                {billing.status === "active" ? (
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                    Active
                  </span>
                ) : null}
              </div>
              {billing.current_period_end ? (
                <p className="mt-2 text-sm text-body">
                  Next billing date:{" "}
                  {new Date(billing.current_period_end).toLocaleDateString()}
                </p>
              ) : null}
              {billing.plan === "starter" &&
              billing.monthly_emails_remaining != null ? (
                <div className="mt-4 max-w-md">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Monthly emails</span>
                    <span>
                      {billing.monthly_emails_sent}/
                      {(billing.monthly_emails_sent ?? 0) +
                        (billing.monthly_emails_remaining ?? 0)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.min(
                          100,
                          ((billing.monthly_emails_sent ?? 0) /
                            Math.max(
                              1,
                              (billing.monthly_emails_sent ?? 0) +
                                (billing.monthly_emails_remaining ?? 0)
                            )) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-8 border-t border-border-subtle pt-6">
            <p className="text-sm font-semibold text-danger">Danger zone</p>
            <p className="mt-1 text-sm text-muted">
              Cancel your subscription. You can upgrade again anytime.
            </p>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={billing.status === "cancelled"}
              className="mt-3 rounded-lg border border-danger/40 px-4 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              Cancel subscription
            </button>
          </div>
        </Card>
      ) : null}

      <PlanCards
        currentPlan={billing?.plan}
        loadingPlan={loadingPlan}
        onCheckout={handleUpgrade}
      />

      <div className="mt-8">
        <TrustBadges />
      </div>

      <Card className="mt-8">
        <SectionHeading>How MailThur compares</SectionHeading>
        <div className="mt-6">
          <ComparisonTable />
        </div>
      </Card>

      {showCancelModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white">Cancel subscription?</h3>
            <p className="mt-2 text-sm text-body">
              Your paid plan will end at the current billing period. You can
              resubscribe anytime.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-lg border border-border-subtle py-2 text-sm text-body"
              >
                Keep subscription
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 rounded-lg bg-danger py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthGate>
  );
}
