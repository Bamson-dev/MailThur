"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedBackground from "./coming-soon/AnimatedBackground";
import FlipCountdownUnit from "./coming-soon/FlipCountdownUnit";
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

interface ComingSoonProps {
  launchDate?: string;
}

export default function ComingSoon({ launchDate }: ComingSoonProps) {
  const launchDateString = launchDate ?? process.env.NEXT_PUBLIC_LAUNCH_DATE;
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!launchDateString) {
      return;
    }

    const target = new Date(launchDateString);

    if (Number.isNaN(target.getTime())) {
      return;
    }

    const tick = () => {
      const remaining = getTimeRemaining(target);
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
          scheduling.
        </motion.p>

        <motion.div
          className="mt-12"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          {timeRemaining ? (
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
      </div>
    </main>
  );
}
