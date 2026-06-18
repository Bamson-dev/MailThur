"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getUserErrorMessage } from "@/lib/api";
import { joinWaitlist } from "@/lib/waitlist";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function SuccessCheckmark() {
  return (
    <motion.div
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10"
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="h-7 w-7 text-emerald-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <motion.path
          d="M5 13l4 4L19 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
}

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");
    setEmailError("");
    setIsSuccess(false);

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await joinWaitlist(email.trim());
      setSubmitMessage(response.message);
      setIsSuccess(true);
      setEmail("");
    } catch (error) {
      setSubmitMessage(getUserErrorMessage(error));
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-14 max-w-md">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="py-4 text-center"
          >
            <SuccessCheckmark />
            <motion.p
              className="mt-5 text-sm text-violet-100/90 sm:text-base"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {submitMessage}
            </motion.p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-violet-300/40 backdrop-blur-sm transition focus:border-violet-400/50 focus:outline-none focus:ring-1 focus:ring-violet-400/40"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mailthur-btn-shimmer mailthur-btn-glow rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Notify Me"}
              </button>
            </div>

            {emailError ? (
              <motion.p
                className="mt-3 text-sm text-red-400"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {emailError}
              </motion.p>
            ) : null}

            {submitMessage && !isSuccess ? (
              <motion.p
                className="mt-3 text-sm text-violet-200/80"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {submitMessage}
              </motion.p>
            ) : null}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
