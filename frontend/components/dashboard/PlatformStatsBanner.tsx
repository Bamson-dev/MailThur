"use client";

import { useEffect, useState } from "react";
import { fetchPlatformStats, PlatformStats } from "@/lib/stats";

export default function PlatformStatsBanner() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchPlatformStats();
        if (mounted) setStats(data);
      } catch {
        // Banner is non-critical; fail silently
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!stats) return null;

  return (
    <div className="mb-6 rounded-xl border border-border-subtle bg-[#0F1117] px-4 py-3 text-center text-sm text-body sm:text-left">
      MailThur users sent{" "}
      <span className="font-semibold text-white">
        {stats.emails_sent_today.toLocaleString()}
      </span>{" "}
      emails today across{" "}
      <span className="font-semibold text-white">
        {stats.active_campaigns.toLocaleString()}
      </span>{" "}
      active campaigns.
    </div>
  );
}
