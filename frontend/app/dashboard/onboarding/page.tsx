"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Inbox, Mail, Rocket } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { createCampaign } from "@/lib/campaigns";
import { getConnectInboxUrl } from "@/lib/inboxes";
import {
  getSessionEmail,
  markOnboardingDone,
} from "@/lib/session";

const STEPS = [
  {
    title: "Welcome to MailThur",
    description:
      "Connect your Gmail inbox and launch your first campaign in minutes.",
    icon: Rocket,
  },
  {
    title: "Connect your inbox",
    description:
      "Link a Gmail account to send personalized outreach with inbox rotation.",
    icon: Inbox,
  },
  {
    title: "Create your first campaign",
    description:
      "Build a sequence, import contacts, and start reaching prospects.",
    icon: Mail,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  function finish() {
    const email = getSessionEmail();
    if (email) {
      markOnboardingDone(email);
    }
    router.push("/dashboard");
  }

  async function handleQuickCampaign() {
    const email = getSessionEmail();
    if (email) markOnboardingDone(email);
    try {
      const campaign = await createCampaign("My First Campaign");
      router.push(`/dashboard/campaigns/new?campaignId=${campaign.id}`);
    } catch {
      router.push("/dashboard/campaigns/new");
    }
  }

  const Icon = STEPS[step].icon;

  return (
    <AuthGate>
      <DashboardHeader
        title="Get started"
        description={`Step ${step + 1} of ${STEPS.length}`}
      />

      <Card className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
          <Icon className="h-7 w-7 text-accent" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-white">
          {STEPS[step].title}
        </h2>
        <p className="mt-3 text-sm text-muted">{STEPS[step].description}</p>

        <div className="mt-8 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i <= step ? "bg-accent" : "bg-card-border"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {step === 1 ? (
            <a
              href={getConnectInboxUrl()}
              className="block w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Connect Gmail Inbox
            </a>
          ) : step === 2 ? (
            <>
              <button
                type="button"
                onClick={handleQuickCampaign}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Create first campaign
              </button>
              <button
                type="button"
                onClick={finish}
                className="w-full rounded-lg border border-card-border px-4 py-2.5 text-sm text-white hover:bg-content"
              >
                Skip for now
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Continue
            </button>
          )}

          {step > 0 && step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="w-full text-sm text-muted hover:text-white"
            >
              Back
            </button>
          ) : null}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex w-full items-center justify-center gap-1 text-sm text-muted hover:text-white"
            >
              I&apos;ll connect later
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={finish}
          className="mt-6 flex w-full items-center justify-center gap-1 text-xs text-muted hover:text-white"
        >
          <Check className="h-3 w-3" />
          Dismiss onboarding
        </button>
      </Card>
    </AuthGate>
  );
}
