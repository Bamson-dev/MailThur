const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface PlatformStats {
  emails_sent_today: number;
  emails_sent_this_week: number;
  active_campaigns: number;
  connected_inboxes: number;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(`${apiUrl}/api/stats/platform`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to load platform statistics.");
  }

  const data = (await response.json()) as { stats: PlatformStats };
  return data.stats;
}
