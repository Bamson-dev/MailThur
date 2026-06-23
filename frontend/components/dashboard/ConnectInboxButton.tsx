"use client";

import { useState } from "react";
import { fetchInboxEligibility, PlanId } from "@/lib/billing";
import { getConnectInboxUrl } from "@/lib/inboxes";
import UpgradeModal from "./UpgradeModal";
import { cn } from "@/lib/utils";

interface ConnectInboxButtonProps {
  className?: string;
  children: React.ReactNode;
  onLimitReached?: () => void;
}

export default function ConnectInboxButton({
  className,
  children,
  onLimitReached,
}: ConnectInboxButtonProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [eligibility, setEligibility] = useState<{
    plan: PlanId;
    max_inboxes: number;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setChecking(true);
    try {
      const result = await fetchInboxEligibility();
      if (!result.allowed) {
        setEligibility({ plan: result.plan, max_inboxes: result.max_inboxes });
        setShowUpgrade(true);
        onLimitReached?.();
        return;
      }
      window.location.href = getConnectInboxUrl();
    } catch {
      window.location.href = getConnectInboxUrl();
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={checking}
        className={cn(className, checking && "opacity-70")}
      >
        {children}
      </button>

      {eligibility ? (
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          plan={eligibility.plan}
          maxInboxes={eligibility.max_inboxes}
        />
      ) : null}
    </>
  );
}
