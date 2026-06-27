import type { Metadata } from "next";
import LandingPage from "@/components/public/LandingPage";

export const metadata: Metadata = {
  title: "MailThur — Connect your inbox. Build your sequence. Start closing.",
  description:
    "MailThur sends cold emails from your own Gmail account, handles follow-ups automatically, and tracks every open and reply.",
};

export default function Home() {
  return <LandingPage />;
}
