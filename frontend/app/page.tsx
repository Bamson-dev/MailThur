import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "MailThur — Launching Soon",
  description:
    "MailThur is launching soon. Connect your inboxes — we handle the sequencing, rotation, and scheduling.",
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function resolveLaunchDate(): string {
  const envDate = process.env.NEXT_PUBLIC_LAUNCH_DATE;

  if (envDate && !Number.isNaN(new Date(envDate).getTime())) {
    return new Date(envDate).toISOString();
  }

  return new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
}

export default function Home() {
  return <ComingSoon launchDate={resolveLaunchDate()} />;
}
