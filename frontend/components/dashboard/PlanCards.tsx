"use client";

import Link from "next/link";
import { Check, Sparkles, X } from "lucide-react";
import {
  COMPETITOR_COMPARISON,
  ENTERPRISE_WHATSAPP_URL,
  PAID_PLAN_CARDS,
  PlanCardData,
  TRUST_BADGES,
} from "@/lib/billing-plans";
import type { PlanId, UpgradePlan } from "@/lib/billing";

interface PlanCardsProps {
  currentPlan?: PlanId;
  loadingPlan?: UpgradePlan | null;
  onCheckout?: (plan: UpgradePlan) => void;
  signupHref?: string;
  compact?: boolean;
}

function isUpgradePlan(id: string): id is UpgradePlan {
  return id === "starter" || id === "growth" || id === "agency";
}

function PlanCardButton({
  plan,
  isCurrent,
  loadingPlan,
  onCheckout,
  signupHref,
}: {
  plan: PlanCardData;
  isCurrent: boolean;
  loadingPlan?: UpgradePlan | null;
  onCheckout?: (plan: UpgradePlan) => void;
  signupHref?: string;
}) {
  if (plan.isEnterprise) {
    return (
      <a
        href={ENTERPRISE_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 block rounded-lg border border-border-subtle py-2.5 text-center text-sm font-semibold text-white hover:border-accent/50 hover:bg-accent/10"
      >
        Talk to us
      </a>
    );
  }

  if (isCurrent) {
    return (
      <span className="mt-5 block rounded-lg border border-accent/40 bg-accent/10 py-2.5 text-center text-sm font-semibold text-accent">
        Current plan
      </span>
    );
  }

  if (signupHref && isUpgradePlan(plan.id)) {
    return (
      <Link
        href={signupHref}
        className="mt-5 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-accent/90"
      >
        Get Started
      </Link>
    );
  }

  if (!onCheckout || !isUpgradePlan(plan.id)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onCheckout(plan.id as UpgradePlan)}
      disabled={loadingPlan !== null && loadingPlan !== undefined}
      className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
    >
      {loadingPlan === plan.id ? "Redirecting…" : "Get Started"}
    </button>
  );
}

export default function PlanCards({
  currentPlan,
  loadingPlan,
  onCheckout,
  signupHref,
  compact = false,
}: PlanCardsProps) {
  return (
    <div
      className={
        compact
          ? "grid gap-3 sm:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      }
    >
      {PAID_PLAN_CARDS.map((plan) => {
        const isCurrent = currentPlan === plan.id;

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-xl border p-5 transition-colors hover:border-accent/40 ${
              plan.highlighted
                ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                : "border-border-subtle bg-surface"
            }`}
          >
            {plan.highlighted ? (
              <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            ) : null}

            <p className="text-lg font-bold text-white">{plan.name}</p>
            {plan.price ? (
              <p className="mt-2 text-2xl font-bold text-white">{plan.price}</p>
            ) : (
              <p className="mt-2 text-sm text-muted">Custom pricing</p>
            )}
            <p className="mt-3 text-sm font-medium text-body">{plan.headline}</p>

            <ul className="mt-4 flex-1 space-y-2 text-sm text-body">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>

            {plan.valueLine ? (
              <p className="mt-4 text-xs leading-relaxed text-success">
                {plan.valueLine}
              </p>
            ) : null}

            <PlanCardButton
              plan={plan}
              isCurrent={isCurrent}
              loadingPlan={loadingPlan}
              onCheckout={onCheckout}
              signupHref={signupHref}
            />
          </div>
        );
      })}
    </div>
  );
}

export function TrustBadges() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TRUST_BADGES.map((badge) => (
        <div
          key={badge}
          className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface p-4 text-sm text-body"
        >
          <Check className="h-4 w-4 shrink-0 text-success" />
          {badge}
        </div>
      ))}
    </div>
  );
}

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-muted">
            <th className="pb-3 pr-4 font-medium">Feature</th>
            <th className="pb-3 pr-4 font-medium">MailThur Starter at 25k NGN</th>
            <th className="pb-3 pr-4 font-medium">
              Instantly Growth at 97 USD/mo
            </th>
            <th className="pb-3 font-medium">Smartlead Pro at 78 USD/mo</th>
          </tr>
        </thead>
        <tbody>
          {COMPETITOR_COMPARISON.map((row) => (
            <tr key={row.feature} className="border-b border-border-subtle/60">
              <td className="py-3 pr-4 text-body">{row.feature}</td>
              <Cell value={row.mailthur} highlight={row.positive === "mailthur"} />
              <Cell value={row.instantly} highlight={row.positive === "instantly"} />
              <Cell value={row.smartlead} highlight={row.positive === "smartlead"} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value, highlight }: { value: string; highlight?: boolean }) {
  const normalized = value.toLowerCase();

  if (normalized === "yes") {
    return (
      <td className="py-3 pr-4">
        <Check className="h-4 w-4 text-success" aria-label="Yes" />
      </td>
    );
  }

  if (normalized === "no") {
    return (
      <td className="py-3 pr-4">
        <X className="h-4 w-4 text-danger" aria-label="No" />
      </td>
    );
  }

  return (
    <td
      className={`py-3 pr-4 ${highlight ? "font-medium text-success" : "text-muted"}`}
    >
      {value}
    </td>
  );
}
