"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import { fetchBillingStatus, PlanId } from "@/lib/billing";
import { fetchCampaigns } from "@/lib/campaigns";
import { fetchInboxes } from "@/lib/inboxes";
import {
  getSessionEmail,
  hasSession,
  isOnboardingDone,
  signOut,
} from "@/lib/session";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [ready, setReady] = useState(false);

  const checkOnboarding = useCallback(async () => {
    if (!hasSession()) {
      setReady(true);
      return;
    }

    const email = getSessionEmail();
    setUserEmail(email);

    if (email) {
      try {
        const billing = await fetchBillingStatus();
        setPlan(billing.plan);
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
    router.push("/dashboard");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-content">
        <p className="text-sm text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-content">
      <Sidebar
        userEmail={userEmail}
        plan={plan}
        onSignOut={handleSignOut}
      />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
