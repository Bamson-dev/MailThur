"use client";

import { FormEvent, useEffect, useState } from "react";
import { establishSession } from "@/lib/inboxes";
import { getUserErrorMessage } from "@/lib/api";
import { hasSession } from "@/lib/session";
import Card from "@/components/dashboard/Card";

interface AuthGateProps {
  children: React.ReactNode;
  onSignedIn?: () => void;
}

export default function AuthGate({ children, onSignedIn }: AuthGateProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(hasSession());
  }, []);

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await establishSession(email.trim());
      setAuthenticated(true);
      onSignedIn?.();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="text-lg font-semibold text-white">Sign in to MailThur</h2>
      <p className="mt-2 text-sm text-muted">
        Enter your email to access the dashboard.
      </p>
      <form onSubmit={handleSignIn} className="mt-6 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full rounded-lg border border-card-border bg-content px-4 py-2.5 text-white placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </Card>
  );
}
