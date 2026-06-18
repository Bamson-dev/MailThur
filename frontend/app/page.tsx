import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "MailThur — Launching Soon",
  description:
    "MailThur is launching soon. Connect your inboxes — we handle the sequencing, rotation, and scheduling.",
};

export default function Home() {
  return <ComingSoon />;
}
