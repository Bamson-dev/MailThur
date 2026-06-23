import type { Metadata } from "next";
import LandingPage from "@/components/public/LandingPage";

export const metadata: Metadata = {
  title: "MailThur — Cold Email Outreach From Your Own Inbox",
  description:
    "Connect your Gmail inbox, build sequences, and track every open and reply. MailThur handles follow-ups automatically so you can focus on closing.",
};

export default function Home() {
  return <LandingPage />;
}
