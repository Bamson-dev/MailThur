"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HealthScoreNextAction } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface HealthScoreRingProps {
  score: number;
  nextAction: HealthScoreNextAction | null;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HealthScoreRing({
  score,
  nextAction,
}: HealthScoreRingProps) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const complete = score >= 100;

  return (
    <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
      <div className="relative h-36 w-36 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#1E2235"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{score}</span>
          <span className="text-xs uppercase tracking-widest text-muted">
            Setup
          </span>
        </div>
      </div>

      <div className="mt-4 sm:mt-0">
        <p className="text-section-heading text-text-heading">
          Pipeline health
        </p>
        {complete ? (
          <p className="mt-2 text-sm font-medium text-success">
            You are ready. Keep going.
          </p>
        ) : nextAction ? (
          <Link
            href={nextAction.href}
            className="group mt-3 inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm text-white transition-colors hover:border-accent/40"
          >
            {nextAction.label}
            <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
