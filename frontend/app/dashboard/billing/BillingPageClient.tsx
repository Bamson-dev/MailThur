"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card, { SectionHeading } from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import {
  BillingStatus,
  cancelSubscription,
  fetchBillingStatus,
  initiateCheckout,
  verifyPayment,
  UpgradePlan,
} from "@/lib/billing";
import {
  COMPARISON_ROWS,
  PLAN_CARDS,
  TRIAL_DAY_LIMIT,
  TRIAL_EMAIL_LIMIT,
  TRUST_BADGES,
  UPGRADE_PLAN_IDS,
} from "@/lib/billing-plans";
import { getUserErrorMessage } from "@/lib/api";
import { capBarColor } from "@/lib/utils";

export default function BillingPageClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<UpgradePlan | null>(null);
  const [cancelling, setCancelling] = useState(false);
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
    const billingSuccess = searchParams.get("billing");

    if (!reference && billingSuccess !== "success") {
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
    if (!window.confirm("Cancel your paid subscription? You can upgrade again anytime.")) {
      return;
    }

    setCancelling(true);
    try {
      await cancelSubscription();
      toast("Subscription cancelled.");
      await loadBilling();
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
    } finally {
      setCancelling(false);
    }
  }

  const trialLimit = billing?.trial_emails_limit ?? TRIAL_EMAIL_LIMIT;
  const trialDaysLimit = billing?.trial_days_limit ?? TRIAL_DAY_LIMIT;
  const trialEmailsUsed =
    billing?.trial_emails_remaining != null
      ? trialLimit - billing.trial_emails_remaining
      : 0;
  const trialEmailsPct = trialLimit ? (trialEmailsUsed / trialLimit) * 100 : 0;
  const trialDaysUsed =
    billing?.trial_days_remaining != null
      ? Math.max(0, trialDaysLimit - billing.trial_days_remaining)
      : 0;
  const trialDaysPct = trialDaysLimit
    ? (trialDaysUsed / trialDaysLimit) * 100
    : 0;

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
        <Card className="mb-8">
          <SectionHeading>Trial countdown</SectionHeading>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs text-muted">
                <span>Emails used</span>
                <span>
                  {trialEmailsUsed}/{trialLimit}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
                <div
                  className={`h-full rounded-full transition-all ${capBarColor(trialEmailsPct)}`}
                  style={{ width: `${trialEmailsPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {billing.trial_emails_remaining ?? 0} emails remaining in your trial
              </p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted">
                <span>Trial period</span>
                <span>
                  {billing.trial_days_remaining ?? 0} of {trialDaysLimit} days left
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-subtle">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${trialDaysPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                Trial expires when you hit {trialLimit} emails or {trialDaysLimit} days
              </p>
            </div>
          </div>
        </Card>
      ) : billing ? (
        <Card className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Current plan</p>
              <p className="mt-1 text-2xl font-bold capitalize text-white">
                {billing.plan}
              </p>
              <p className="mt-1 text-sm text-body">
                {billing.max_inboxes} inbox{billing.max_inboxes === 1 ? "" : "es"}
                {typeof billing.monthly_emails_cap === "number"
                  ? ` · ${billing.monthly_emails_sent ?? 0}/${billing.monthly_emails_cap.toLocaleString()} emails this period`
                  : null}
              </p>
            </div>
            {billing.subscription_active ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-muted hover:text-body disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel subscription"}
              </button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_CARDS.map((plan) => {
          const isCurrent = billing?.plan === plan.id;
          const isUpgrade = UPGRADE_PLAN_IDS.includes(plan.id as UpgradePlan);
          const upgradeId = plan.id as UpgradePlan;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-5 ${
                plan.highlighted
                  ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                  : "border-border-subtle bg-surface"
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </span>
              ) : null}

              <p className="text-lg font-bold text-white">{plan.name}</p>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>
              <p className="mt-4 text-3xl font-bold text-white">
                {plan.price}
                {plan.priceNote ? (
                  <span className="text-base font-normal text-muted">
                    {" "}
                    {plan.priceNote}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-sm text-body">{plan.inboxes}</p>
              <p className="text-sm text-body">{plan.monthlyEmails}</p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-body">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <span className="mt-5 block rounded-lg border border-accent/40 bg-accent/10 py-2.5 text-center text-sm font-semibold text-accent">
                  Current plan
                </span>
              ) : isUpgrade ? (
                <button
                  type="button"
                  onClick={() => handleUpgrade(upgradeId)}
                  disabled={loadingPlan !== null}
                  className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {loadingPlan === upgradeId ? "Redirecting…" : `Choose ${plan.name}`}
                </button>
              ) : (
                <span className="mt-5 block rounded-lg border border-border-subtle py-2.5 text-center text-sm text-muted">
                  Included on signup
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Card className="mb-8">
        <SectionHeading>Compare plans</SectionHeading>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-muted">
                <th className="pb-3 pr-4 font-medium">Feature</th>
                <th className="pb-3 pr-4 font-medium">Trial</th>
                <th className="pb-3 pr-4 font-medium">Starter</th>
                <th className="pb-3 pr-4 font-medium">Growth</th>
                <th className="pb-3 font-medium">Agency</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border-subtle/60">
                  <td className="py-3 pr-4 text-body">{row.label}</td>
                  <td className="py-3 pr-4 text-muted">{row.trial}</td>
                  <td className="py-3 pr-4 text-muted">{row.starter}</td>
                  <td className="py-3 pr-4 text-muted">{row.growth}</td>
                  <td className="py-3 text-muted">{row.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge}
            className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface p-4"
          >
            {badge.includes("secure") ? (
              <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
            ) : badge.includes("Cancel") ? (
              <CreditCard className="h-5 w-5 shrink-0 text-accent" />
            ) : (
              <Check className="h-5 w-5 shrink-0 text-success" />
            )}
            <p className="text-sm text-body">{badge}</p>
          </div>
        ))}
      </div>
    </AuthGate>
  );
}
