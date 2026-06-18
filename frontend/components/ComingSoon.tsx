"use client";

import { FormEvent, useEffect, useState } from "react";
import { getUserErrorMessage } from "@/lib/api";
import { joinWaitlist } from "@/lib/waitlist";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeRemaining(target: Date): TimeRemaining | null {
  const diff = target.getTime() - Date.now();

  if (diff <= 0) {
    return null;
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-bold tabular-nums text-white sm:text-5xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs uppercase tracking-widest text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export default function ComingSoon() {
  const launchDateString = process.env.NEXT_PUBLIC_LAUNCH_DATE;
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!launchDateString) {
      setIsLaunched(true);
      return;
    }

    const target = new Date(launchDateString);

    if (Number.isNaN(target.getTime())) {
      setIsLaunched(true);
      return;
    }

    const tick = () => {
      const remaining = getTimeRemaining(target);
      if (!remaining) {
        setIsLaunched(true);
        setTimeRemaining(null);
        return;
      }
      setIsLaunched(false);
      setTimeRemaining(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [launchDateString]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");
    setEmailError("");

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await joinWaitlist(email.trim());
      setSubmitMessage(response.message);
      setEmail("");
    } catch (error) {
      setSubmitMessage(getUserErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
          MailThur
        </p>

        <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          MailThur is launching soon.
        </h1>

        <p className="mt-6 text-lg text-zinc-400 sm:text-xl">
          Connect your inboxes. We handle the sequencing, rotation, and
          scheduling. Launching in 72 hours.
        </p>

        <div className="mt-12">
          {isLaunched ? (
            <p className="text-xl font-medium text-blue-300">
              We&apos;re live. Check back shortly.
            </p>
          ) : timeRemaining ? (
            <div className="flex justify-center gap-6 sm:gap-10">
              <CountdownUnit value={timeRemaining.days} label="Days" />
              <CountdownUnit value={timeRemaining.hours} label="Hours" />
              <CountdownUnit value={timeRemaining.minutes} label="Minutes" />
              <CountdownUnit value={timeRemaining.seconds} label="Seconds" />
            </div>
          ) : (
            <div className="h-16" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-14 max-w-md">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Notify Me"}
            </button>
          </div>

          {emailError ? (
            <p className="mt-3 text-sm text-red-400">{emailError}</p>
          ) : null}

          {submitMessage ? (
            <p className="mt-3 text-sm text-zinc-300">{submitMessage}</p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
