"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getUserErrorMessage } from "@/lib/api";
import {
  ConnectedInbox,
  disconnectInbox,
  establishSession,
  fetchInboxes,
  getConnectInboxUrl,
  hasSession,
} from "@/lib/inboxes";

export default function InboxConnect() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [inboxes, setInboxes] = useState<ConnectedInbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const connectedParam = searchParams.get("connected");

  const loadInboxes = useCallback(async () => {
    if (!hasSession()) {
      setSignedIn(false);
      setInboxes([]);
      setLoading(false);
      return;
    }

    setSignedIn(true);
    setLoading(true);

    try {
      const data = await fetchInboxes();
      setInboxes(data);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
      setInboxes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSignedIn(hasSession());
    loadInboxes();
  }, [loadInboxes]);

  useEffect(() => {
    if (connectedParam === "success") {
      setActionMessage("Inbox connected successfully.");
      loadInboxes();
    } else if (connectedParam === "error") {
      setActionMessage("");
      setErrorMessage(
        "Unable to connect inbox. Please try again or contact support."
      );
    }
  }, [connectedParam, loadInboxes]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setActionMessage("");

    try {
      await establishSession(email.trim());
      setSignedIn(true);
      setActionMessage("Signed in successfully.");
      await loadInboxes();
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    }
  }

  function handleConnect() {
    if (!hasSession()) {
      setErrorMessage("Please sign in before connecting an inbox.");
      return;
    }

    window.location.href = getConnectInboxUrl();
  }

  async function handleDisconnect(inboxId: string) {
    setDisconnectingId(inboxId);
    setErrorMessage("");
    setActionMessage("");

    try {
      await disconnectInbox(inboxId);
      setActionMessage("Inbox disconnected.");
      await loadInboxes();
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error));
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900">Connect Inbox</h2>
      <p className="mt-2 text-sm text-gray-600">
        Link your Gmail account to start sending from MailThur.
      </p>

      {!signedIn ? (
        <form onSubmit={handleSignIn} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Sign in
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Connect Gmail Inbox
        </button>
      )}

      {actionMessage ? (
        <p className="mt-4 text-sm text-green-700">{actionMessage}</p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <div className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Connected inboxes
        </h3>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : inboxes.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No inboxes connected yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
            {inboxes.map((inbox) => (
              <li
                key={inbox.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{inbox.inbox_email}</p>
                  <p className="text-sm text-gray-500">
                    {inbox.provider} · {inbox.status} · cap {inbox.daily_send_cap}/day
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDisconnect(inbox.id)}
                  disabled={disconnectingId === inbox.id}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {disconnectingId === inbox.id ? "Disconnecting..." : "Disconnect"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
