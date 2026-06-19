"use client";

import { useState } from "react";
import {
  initiateCheckout,
  PlanId,
  UPGRADE_PLANS,
  UpgradePlan,
} from "@/lib/billing";
import { getUserErrorMessage } from "@/lib/api";
import { useToast } from "./ToastProvider";

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
  const [loading, setLoading] = useState<UpgradePlan | null>(null);

  if (!open) return null;

  const defaultDescription =
    plan === "trial"
      ? "Your trial includes 1 inbox. Upgrade to connect more sending accounts."
      : `Your ${plan} plan allows ${maxInboxes} inbox${maxInboxes === 1 ? "" : "es"}. Upgrade to connect more.`;

  async function handleSelect(upgradePlan: UpgradePlan) {
    setLoading(upgradePlan);
    try {
      const url = await initiateCheckout(upgradePlan);
      window.location.href = url;
    } catch (err) {
      toast(getUserErrorMessage(err), "error");
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border-subtle bg-surface p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white">{headline}</h2>
        <p className="mt-2 text-sm text-body">
          {description ?? defaultDescription}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {UPGRADE_PLANS.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-xl border border-border-subtle bg-content p-4"
            >
              <p className="font-semibold text-white">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.inboxes}</p>
              <p className="mt-2 text-lg font-bold text-accent">{p.price}</p>
              <button
                type="button"
                onClick={() => handleSelect(p.id)}
                disabled={loading !== null}
                className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {loading === p.id ? "Loading..." : "Select Plan"}
              </button>
            </div>
          ))}
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
