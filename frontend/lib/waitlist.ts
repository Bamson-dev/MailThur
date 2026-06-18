import { apiFetch } from "./api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface WaitlistResponse {
  message: string;
}

export async function joinWaitlist(email: string): Promise<WaitlistResponse> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  return apiFetch<WaitlistResponse>(`${apiUrl}/api/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    userMessage: "Unable to join the waitlist. Please try again later.",
  });
}
