"use client";

import { useState } from "react";
import { getUserErrorMessage } from "@/lib/api";
import {
  PLAN_LABELS,
  UpgradePlan,
  initiateCheckout,
} from "@/lib/billing";

const UPGRADE_PLANS: UpgradePlan[] = ["starter", "growth", "agency"];

interface UpgradePromptProps {
  message: string;
  onDismiss?: () => void;
}

export default function UpgradePrompt({
  message,
  onDismiss,
}: UpgradePromptProps) {
  const [loadingPlan, setLoadingPlan] = useState<UpgradePlan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpgrade(plan: UpgradePlan) {
    setLoadingPlan(plan);
    setErrorMessage("");

    try {
      const checkoutUrl = await initiateCheckout(plan);
      window.location.href = checkoutUrl;
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
      setLoadingPlan(null);
    }
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-900">Plan limit reached</p>
          <p className="mt-1 text-sm text-amber-800">{message}</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-amber-700 hover:text-amber-900"
          >
            Dismiss
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {UPGRADE_PLANS.map((plan) => (
          <button
            key={plan}
            type="button"
            onClick={() => handleUpgrade(plan)}
            disabled={loadingPlan !== null}
            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {loadingPlan === plan ? "Redirecting..." : `Upgrade to ${PLAN_LABELS[plan]}`}
          </button>
        ))}
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
