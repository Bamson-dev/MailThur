"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface FlipCountdownUnitProps {
  value: number;
  label: string;
}

export default function FlipCountdownUnit({
  value,
  label,
}: FlipCountdownUnitProps) {
  const display = String(value).padStart(2, "0");
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-xl border border-violet-400/25 bg-white/5 shadow-[0_0_24px_rgba(139,92,246,0.15)] backdrop-blur-sm sm:h-[5.5rem] sm:w-[5.5rem]"
        style={{ perspective: 600 }}
      >
        <div className="absolute inset-x-0 top-1/2 h-px bg-violet-300/10" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            className="text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { rotateX: -80, opacity: 0, y: 8 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { rotateX: 0, opacity: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { rotateX: 80, opacity: 0, y: -8 }
            }
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-violet-300/70 sm:text-xs">
        {label}
      </span>
    </div>
  );
}
