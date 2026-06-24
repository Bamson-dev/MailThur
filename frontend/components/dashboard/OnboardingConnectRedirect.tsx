"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSessionEmail, isOnboardingDone } from "@/lib/session";

export default function OnboardingConnectRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/dashboard") return;

    const connected = searchParams.get("connected");
    if (connected !== "success") return;

    const email = getSessionEmail();
    if (!email || isOnboardingDone(email)) return;

    router.replace("/dashboard/onboarding?connected=success");
  }, [pathname, router, searchParams]);

  return null;
}
