"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Inbox, Mail, Rocket } from "lucide-react";
import AuthGate from "@/components/dashboard/AuthGate";
import Card from "@/components/dashboard/Card";
import { useToast } from "@/components/dashboard/ToastProvider";
import { createCampaign } from "@/lib/campaigns";
import { getConnectInboxUrl } from "@/lib/inboxes";
import {
  getSessionEmail,
  markOnboardingDone,
} from "@/lib/session";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Welcome to MailThur",
    description:
      "Connect your inbox, build your sequence, start closing. This takes about 3 minutes.",
    bullets: [
      "Connect your Gmail inbox",
      "Build your outreach sequence",
      "Import your contacts",
      "Launch your campaign",
    ],
    icon: Rocket,
  },
  {
    title: "Connect your sending inbox",
    description:
      "MailThur sends emails from your own Gmail account. We only request permission to send and read emails, nothing else.",
    trustNote:
      "Your login credentials are never stored. We use Google's secure OAuth connection.",
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
  const { toast } = useToast();
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
      toast("Campaign created");
      router.push(`/dashboard/campaigns/new?campaignId=${campaign.id}`);
    } catch {
      router.push("/dashboard/campaigns/new");
    }
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AuthGate>
      <div className="mx-auto flex min-h-[70vh] max-w-[520px] flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex w-full items-center justify-center">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  i <= step ? "bg-accent" : "bg-border-subtle"
                )}
              />
              {i < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "h-0.5 w-12 transition-colors sm:w-16",
                    i < step ? "bg-accent" : "bg-border-subtle"
                  )}
                />
              ) : null}
            </div>
          ))}
        </div>

        <Card className="w-full shadow-purple-glow">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark">
              <Icon className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-white">
              {current.title}
            </h1>
            <p className="mt-3 text-sm text-body">{current.description}</p>

            {step === 0 && current.bullets ? (
              <ul className="mt-6 space-y-2 text-left text-sm text-body">
                {current.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            {step === 1 && current.trustNote ? (
              <p className="mt-6 text-xs text-muted">{current.trustNote}</p>
            ) : null}
          </div>

          <div className="mt-8 space-y-3">
            {step === 0 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Start Setup
              </button>
            ) : step === 1 ? (
              <>
                <a
                  href={getConnectInboxUrl()}
                  className="block w-full rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-white hover:bg-accent/90"
                >
                  Connect Gmail Inbox
                </a>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-sm text-muted hover:text-body"
                >
                  Skip for now
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleQuickCampaign}
                  className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90"
                >
                  Finish Setup
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="w-full rounded-lg border border-border-subtle px-4 py-3 text-sm text-white hover:bg-content"
                >
                  Skip for now
                </button>
              </>
            )}

            {step > 0 && step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="w-full text-sm text-muted hover:text-body"
              >
                Back
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={finish}
            className="mt-6 flex w-full items-center justify-center gap-1 text-xs text-muted hover:text-body"
          >
            <Check className="h-3 w-3" />
            Dismiss onboarding
          </button>
        </Card>
      </div>
    </AuthGate>
  );
}
