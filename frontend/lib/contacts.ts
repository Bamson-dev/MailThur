import { apiFetch } from "./api";
import { fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export interface UnifiedContact {
  id: string;
  campaign_id: string;
  campaign_name: string;
  email: string;
  business_name: string | null;
  city: string | null;
  status: string;
  last_contacted_at: string | null;
  opened: boolean;
  replied: boolean;
}

export async function fetchContacts(filters?: {
  search?: string;
  status?: string;
}): Promise<UnifiedContact[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString();
  const url = query
    ? `${apiUrl}/api/contacts?${query}`
    : `${apiUrl}/api/contacts`;

  const response = await apiFetch<{ contacts: UnifiedContact[] }>(
    url,
    fetchOptions({
      userMessage: "Unable to load contacts. Please try again.",
    })
  );

  return response.contacts;
}

export function exportContactsCsv(contacts: UnifiedContact[]): void {
  const headers = [
    "Campaign",
    "Email",
    "Business",
    "City",
    "Status",
    "Last Contacted",
    "Opened",
    "Replied",
  ];

  const rows = contacts.map((c) => [
    c.campaign_name,
    c.email,
    c.business_name ?? "",
    c.city ?? "",
    c.status,
    c.last_contacted_at ?? "",
    c.opened ? "Yes" : "No",
    c.replied ? "Yes" : "No",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mailthur-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
