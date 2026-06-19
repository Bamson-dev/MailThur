"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import Card, { SectionHeading } from "./Card";
import { UserMilestones } from "@/lib/dashboard";
import { useToast } from "./ToastProvider";
import { cn } from "@/lib/utils";

const SHARE_TEXT =
  "Just got my first cold email reply using MailThur. The platform handles all the sequencing and inbox rotation automatically. mailthur.com";

interface FirstSuccessCardProps {
  milestones: UserMilestones;
}

const STEPS = [
  { key: "first_email_sent" as const, label: "Send your first email" },
  { key: "first_open" as const, label: "Get your first open" },
  { key: "first_reply" as const, label: "Get your first reply" },
];

export default function FirstSuccessCard({ milestones }: FirstSuccessCardProps) {
  const { toast } = useToast();
  const allDone =
    milestones.first_email_sent &&
    milestones.first_open &&
    milestones.first_reply;

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      toast("Tweet copied to clipboard!");
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  }

  if (allDone) {
    return (
      <Card className="border-success/30 bg-success/5">
        <div className="flex flex-col items-center py-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <Check className="h-7 w-7 text-success" strokeWidth={2.5} />
          </div>
          <div className="mt-4 flex-1 sm:mt-0">
            <p className="text-lg font-semibold text-white">
              You got your first reply!
            </p>
            <p className="mt-1 text-sm text-body">
              Share the win and help others discover MailThur.
            </p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 sm:mt-0"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeading>Get your first reply</SectionHeading>
      <ul className="mt-4 space-y-3">
        {STEPS.map((step) => {
          const done = milestones[step.key];
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  done
                    ? "border-success bg-success/15 text-success"
                    : "border-border-subtle text-muted"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span
                className={cn(
                  "text-sm",
                  done ? "text-body line-through opacity-70" : "text-white"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
