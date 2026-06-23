import { apiFetch } from "./api";
import { fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface ActivityEvent {
  send_log_id: string;
  campaign_id: string;
  campaign_name: string;
  contact_email: string;
  inbox_email: string;
  status: string;
  sent_at: string;
  opened_at: string | null;
}

export async function fetchRecentActivity(
  limit = 20
): Promise<ActivityEvent[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ events: ActivityEvent[] }>(
    `${apiUrl}/api/activity/recent?limit=${limit}`,
    fetchOptions({
      userMessage: "Unable to load recent activity. Please try again.",
    })
  );

  return response.events;
}
