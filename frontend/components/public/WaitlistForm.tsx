"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
      return;
    }

    try {
      const result = await apiFetch<{ message: string }>(
        `${apiUrl}/api/waitlist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      setStatus("success");
      setMessage(result.message);
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-center text-sm font-medium text-body">
        Get launch updates and product news
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg border border-accent/40 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/20 disabled:opacity-50"
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </button>
      </form>
      {message ? (
        <p
          className={`mt-3 text-center text-sm ${
            status === "success" ? "text-success" : "text-danger"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
