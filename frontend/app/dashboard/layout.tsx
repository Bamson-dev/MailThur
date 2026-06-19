"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import PageTransition from "@/components/dashboard/PageTransition";
import { ToastProvider } from "@/components/dashboard/ToastProvider";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import {
  BillingStatus,
  fetchBillingStatus,
  PlanId,
} from "@/lib/billing";
import { fetchCampaigns } from "@/lib/campaigns";
import { fetchInboxes } from "@/lib/inboxes";
import {
  getSessionEmail,
  hasSession,
  isOnboardingDone,
  signOut,
} from "@/lib/session";
import { Skeleton } from "@/components/dashboard/Skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [ready, setReady] = useState(false);
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const [showUpgradePicker, setShowUpgradePicker] = useState(false);

  const checkOnboarding = useCallback(async () => {
    if (!hasSession()) {
      setReady(true);
      return;
    }

    const email = getSessionEmail();
    setUserEmail(email);

    if (email) {
      try {
        const status = await fetchBillingStatus();
        setPlan(status.plan);
        setBilling(status);

        if (
          status.plan === "trial" &&
          status.trial_emails_remaining !== undefined &&
          status.trial_emails_remaining <= 0
        ) {
          setShowTrialExpired(true);
        }
      } catch {
        setPlan("trial");
      }
    }

    if (
      pathname !== "/dashboard/onboarding" &&
      email &&
      !isOnboardingDone(email)
    ) {
      try {
        const [inboxes, campaigns] = await Promise.all([
          fetchInboxes(),
          fetchCampaigns(),
        ]);
        if (inboxes.length === 0 && campaigns.length === 0) {
          router.replace("/dashboard/onboarding");
          return;
        }
      } catch {
        // Allow dashboard access if checks fail
      }
    }

    setReady(true);
  }, [pathname, router]);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  function handleSignOut() {
    signOut();
    setUserEmail(null);
    setPlan(null);
    setBilling(null);
    router.push("/dashboard");
  }

  const showTrialWarning =
    billing?.plan === "trial" &&
    billing.trial_emails_remaining !== undefined &&
    billing.trial_emails_remaining > 0 &&
    billing.trial_emails_remaining <= 10;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-content">
        <div className="w-48 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-content">
        <Sidebar
          userEmail={userEmail}
          plan={plan}
          onSignOut={handleSignOut}
        />
        <main className="lg:pl-60">
          {showTrialWarning ? (
            <div className="border-b border-warning/30 bg-warning/10 px-4 py-3 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-white">
                  You have{" "}
                  <span className="font-semibold">
                    {billing?.trial_emails_remaining}
                  </span>{" "}
                  trial emails remaining. Upgrade to keep sending without
                  interruption.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUpgradePicker(true)}
                  className="shrink-0 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent/90"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          ) : null}

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>

        {billing ? (
          <>
            <UpgradeModal
              open={showTrialExpired}
              onClose={() => {}}
              onSignOut={handleSignOut}
              plan={billing.plan}
              maxInboxes={billing.max_inboxes}
              headline="Your trial has ended"
              description="You've used all 50 trial emails. Upgrade to a paid plan to continue sending campaigns."
              dismissible={false}
            />
            <UpgradeModal
              open={showUpgradePicker}
              onClose={() => setShowUpgradePicker(false)}
              plan={billing.plan}
              maxInboxes={billing.max_inboxes}
              headline="Upgrade your plan"
              description="Choose a plan to send more emails and connect additional inboxes."
            />
          </>
        ) : null}
      </div>
    </ToastProvider>
  );
}
