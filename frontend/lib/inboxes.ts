import { apiFetch } from "./api";
import { fetchOptions, hasSession } from "./session";

export { hasSession };

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface ConnectedInbox {
  id: string;
  inbox_email: string;
  provider: string;
  status: string;
  daily_send_cap: number;
  created_at: string;
}

interface InboxesResponse {
  inboxes: ConnectedInbox[];
}

interface SessionResponse {
  message: string;
  token: string;
}

export async function establishSession(email: string): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<SessionResponse>(`${apiUrl}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
    userMessage: "Unable to sign in. Please try again.",
  });

  sessionStorage.setItem("mailthur_session", response.token);
}

export function getConnectInboxUrl(): string {
  if (!apiUrl) {
    return "#";
  }

  const token = sessionStorage.getItem("mailthur_session");
  if (token) {
    return `${apiUrl}/auth/google?session=${encodeURIComponent(token)}`;
  }

  return `${apiUrl}/auth/google`;
}

export async function fetchInboxes(): Promise<ConnectedInbox[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<InboxesResponse>(
    `${apiUrl}/api/inboxes`,
    fetchOptions({
      userMessage: "Unable to load inboxes. Please try again.",
    })
  );

  return response.inboxes;
}

export async function disconnectInbox(inboxId: string): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  await apiFetch(`${apiUrl}/api/inboxes/${inboxId}`, {
    ...fetchOptions({
      method: "DELETE",
      userMessage: "Unable to disconnect inbox. Please try again.",
    }),
  });
}
