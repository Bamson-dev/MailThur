"use client";

import { useState } from "react";
import { initiateCheckout, PlanId, UpgradePlan } from "@/lib/billing";
import { getUserErrorMessage } from "@/lib/api";
import { useToast } from "./ToastProvider";
import PlanCards from "./PlanCards";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  plan: PlanId;
  maxInboxes: number;
  headline?: string;
  description?: string;
  dismissible?: boolean;
}

export default function UpgradeModal({
  open,
  onClose,
  onSignOut,
  plan,
  maxInboxes,
  headline = "You have reached your inbox limit",
  description,
  dismissible = true,
}: UpgradeModalProps) {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<UpgradePlan | null>(null);

  if (!open) return null;

  const defaultDescription =
    plan === "trial"
      ? "Your trial includes 1 inbox. Upgrade to connect more sending accounts."
      : `Your ${plan} plan allows ${maxInboxes} inbox${maxInboxes === 1 ? "" : "es"}. Upgrade to connect more.`;

  async function handleCheckout(upgradePlan: UpgradePlan) {
    setLoadingPlan(upgradePlan);
    try {
      const url = await initiateCheckout(upgradePlan);
      window.location.href = url;
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white">{headline}</h2>
        <p className="mt-2 text-sm text-body">
          {description ?? defaultDescription}
        </p>

        <div className="mt-6">
          <PlanCards
            currentPlan={plan}
            loadingPlan={loadingPlan}
            onCheckout={handleCheckout}
            compact
          />
        </div>

        {dismissible ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full text-center text-sm text-muted hover:text-body"
          >
            Continue with {plan === "trial" ? "trial" : plan}
          </button>
        ) : onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            className="mt-6 w-full text-center text-sm text-muted hover:text-body"
          >
            Sign out
          </button>
        ) : null}
      </div>
    </div>
  );
}
