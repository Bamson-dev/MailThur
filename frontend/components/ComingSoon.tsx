"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Mail,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import AnimatedBackground from "./coming-soon/AnimatedBackground";
import FlipCountdownUnit from "./coming-soon/FlipCountdownUnit";
import WaitlistForm from "./coming-soon/WaitlistForm";
import "./coming-soon/coming-soon.css";

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

const HEADLINE_WORDS = "MailThur is launching soon.".split(" ");

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Automatic Inbox Warmup",
    description:
      "Your sender reputation is everything in cold email. MailThur builds it for you automatically, so your emails consistently land in inboxes, not spam folders. No technical setup. No manual configuration. Just connect your inbox and we handle the rest.",
  },
  {
    icon: RefreshCw,
    title: "Inbox rotation",
    description:
      "Spread sends across multiple connected accounts to protect deliverability.",
  },
  {
    icon: Mail,
    title: "Reply detection",
    description:
      "Sequences stop automatically when a prospect responds to your outreach.",
  },
  {
    icon: BarChart3,
    title: "Open tracking",
    description:
      "See who opened your emails with built-in pixel tracking.",
  },
  {
    icon: Shield,
    title: "Unsubscribe handling",
    description:
      "One-click unsubscribe links are included on every message.",
  },
  {
    icon: Users,
    title: "LeadThur integration",
    description:
      "Import contacts instantly from LeadThur into your campaigns.",
  },
];

const wordVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.35 + i * 0.1,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function ComingSoon() {
  const launchDateString = process.env.NEXT_PUBLIC_LAUNCH_DATE;
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <motion.p
          className="text-sm font-semibold uppercase tracking-[0.35em] text-violet-300/90"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          MailThur
        </motion.p>

        <h1 className="mt-8 flex flex-wrap justify-center gap-x-[0.3em] gap-y-1 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          {HEADLINE_WORDS.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              custom={index}
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              className="inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-lg text-violet-200/70 sm:text-xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
        >
          Connect your inboxes. We handle the sequencing, rotation, and
          scheduling. Launching in 72 hours.
        </motion.p>

        <motion.div
          className="mt-12"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          {isLaunched ? (
            <motion.p
              className="text-xl font-medium text-violet-200"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              We&apos;re live. Check back shortly.
            </motion.p>
          ) : timeRemaining ? (
            <div className="flex justify-center gap-3 sm:gap-5">
              <FlipCountdownUnit value={timeRemaining.days} label="Days" />
              <FlipCountdownUnit value={timeRemaining.hours} label="Hours" />
              <FlipCountdownUnit value={timeRemaining.minutes} label="Minutes" />
              <FlipCountdownUnit value={timeRemaining.seconds} label="Seconds" />
            </div>
          ) : (
            <div className="h-[5.5rem]" />
          )}
        </motion.div>

        <WaitlistForm />
      </div>

      <section
        id="features"
        className="relative z-10 mt-20 w-full max-w-6xl px-2 text-left sm:px-4"
      >
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Built for serious outreach
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-violet-200/70">
          Everything you need to run professional cold email campaigns from your
          own inbox.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-violet-500/20 bg-[#0D0F1A]/90 p-5 backdrop-blur-sm"
            >
              <feature.icon className="h-6 w-6 text-violet-400" />
              <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-violet-200/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
