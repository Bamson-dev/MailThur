"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserErrorMessage, isLimitReachedError } from "@/lib/api";
import {
  BillingStatus,
  PLAN_LABELS,
  UpgradePlan,
  fetchBillingStatus,
  initiateCheckout,
} from "@/lib/billing";
import { TRIAL_EMAIL_LIMIT } from "@/lib/billing-plans";
import { hasSession } from "@/lib/session";
import UpgradePrompt from "./UpgradePrompt";

const UPGRADE_PLANS: UpgradePlan[] = ["starter", "growth", "agency"];

const PLAN_DISPLAY: Record<BillingStatus["plan"], string> = {
  trial: "Free trial",
  starter: "Starter",
  growth: "Growth",
  agency: "Agency",
  enterprise: "Enterprise",
};

export default function BillingSection() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<UpgradePlan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [limitMessage, setLimitMessage] = useState("");

  const loadBilling = useCallback(async () => {
    if (!hasSession()) {
      setBilling(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLimitMessage("");

    try {
      const status = await fetchBillingStatus();
      setBilling(status);
      setErrorMessage("");
    } catch (error) {
      if (isLimitReachedError(error)) {
        setLimitMessage(error.message);
      } else {
        setErrorMessage(getUserErrorMessage(error));
      }
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  async function handleUpgrade(plan: UpgradePlan) {
    setLoadingPlan(plan);
    setErrorMessage("");

    try {
      const checkoutUrl = await initiateCheckout(plan);
      window.location.href = checkoutUrl;
    } catch (error) {
      if (isLimitReachedError(error)) {
        setLimitMessage(error.message);
      } else {
        setErrorMessage(getUserErrorMessage(error));
      }
      setLoadingPlan(null);
    }
  }

  const showUpgradeButtons =
    billing?.plan === "trial" || billing?.status !== "active";

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900">Billing</h2>
      <p className="mt-2 text-sm text-gray-600">
        Manage your plan and upgrade when you need more capacity.
      </p>

      {limitMessage ? (
        <div className="mt-6">
          <UpgradePrompt
            message={limitMessage}
            onDismiss={() => setLimitMessage("")}
          />
        </div>
      ) : null}

      <div className="mt-8 rounded-lg border border-gray-200 p-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : billing ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Current plan:{" "}
              <span className="font-semibold text-gray-900">
                {PLAN_DISPLAY[billing.plan]}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Inbox limit: {billing.max_inboxes}
            </p>
            {billing.plan === "trial" ? (
              <>
                {typeof billing.trial_emails_remaining === "number" ? (
                  <p className="text-sm text-gray-600">
                    Trial emails remaining: {billing.trial_emails_remaining} of{" "}
                    {TRIAL_EMAIL_LIMIT}
                  </p>
                ) : null}
                {typeof billing.trial_days_remaining === "number" ? (
                  <p className="text-sm text-gray-600">
                    Trial days remaining: {billing.trial_days_remaining}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sign in to view billing.</p>
        )}
      </div>

      {showUpgradeButtons ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {UPGRADE_PLANS.map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => handleUpgrade(plan)}
              disabled={loadingPlan !== null}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loadingPlan === plan
                ? "Redirecting..."
                : `Upgrade to ${PLAN_LABELS[plan]}`}
            </button>
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
