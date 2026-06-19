import { apiFetch } from "./api";
import { authHeaders, fetchOptions } from "./session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  subject: string;
  body: string;
  delay_days: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_email: string;
  name: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  contact_count?: number;
  steps?: CampaignStep[];
}

export interface StepInput {
  subject: string;
  body: string;
  delay_days: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  invalid: Array<{ row: number; reason: string }>;
}

export interface CampaignContact {
  id: string;
  email: string;
  first_name: string | null;
  business_name: string | null;
  current_step: number;
  status: string;
  next_send_at: string | null;
  last_contacted_at: string | null;
}

export async function fetchCampaigns(filters?: {
  status?: CampaignStatus;
  search?: string;
}): Promise<Campaign[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const params = new URLSearchParams();
  if (filters?.status) {
    params.set("status", filters.status);
  }
  if (filters?.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  const url = query
    ? `${apiUrl}/api/campaigns?${query}`
    : `${apiUrl}/api/campaigns`;

  const response = await apiFetch<{ campaigns: Campaign[] }>(
    url,
    fetchOptions({
      userMessage: "Unable to load campaigns. Please try again.",
    })
  );

  return response.campaigns;
}

export async function createCampaign(name: string): Promise<Campaign> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ campaign: Campaign }>(
    `${apiUrl}/api/campaigns`,
    fetchOptions({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      userMessage: "Unable to create campaign. Please try again.",
    })
  );

  return response.campaign;
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ campaign: Campaign }>(
    `${apiUrl}/api/campaigns/${id}`,
    fetchOptions({
      userMessage: "Unable to load campaign. Please try again.",
    })
  );

  return response.campaign;
}

export async function saveCampaignSteps(
  id: string,
  steps: StepInput[]
): Promise<CampaignStep[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ steps: CampaignStep[] }>(
    `${apiUrl}/api/campaigns/${id}/steps`,
    fetchOptions({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
      userMessage: "Unable to save campaign steps. Please try again.",
    })
  );

  return response.steps;
}

export async function importCampaignCsv(
  id: string,
  file: File
): Promise<ImportResult> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiUrl}/api/campaigns/${id}/contacts/csv`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Unable to import contacts. Please try again.");
  }

  return (await response.json()) as ImportResult;
}

export async function launchCampaign(id: string): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  await apiFetch(`${apiUrl}/api/campaigns/${id}/launch`, {
    ...fetchOptions({
      method: "POST",
      userMessage: "Unable to launch campaign. Please try again.",
    }),
  });
}

export async function pauseCampaign(id: string): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  await apiFetch(`${apiUrl}/api/campaigns/${id}/pause`, {
    ...fetchOptions({
      method: "POST",
      userMessage: "Unable to pause campaign. Please try again.",
    }),
  });
}

export async function resumeCampaign(id: string): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  await apiFetch(`${apiUrl}/api/campaigns/${id}/resume`, {
    ...fetchOptions({
      method: "POST",
      userMessage: "Unable to resume campaign. Please try again.",
    }),
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  await apiFetch(`${apiUrl}/api/campaigns/${id}`, {
    ...fetchOptions({
      method: "DELETE",
      userMessage: "Unable to delete campaign. Please try again.",
    }),
  });
}

export async function deleteAllCampaigns(): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  await apiFetch(`${apiUrl}/api/campaigns`, {
    ...fetchOptions({
      method: "DELETE",
      userMessage: "Unable to delete campaigns. Please try again.",
    }),
  });
}

export async function fetchCampaignContacts(
  id: string
): Promise<CampaignContact[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ contacts: CampaignContact[] }>(
    `${apiUrl}/api/campaigns/${id}/contacts`,
    fetchOptions({
      userMessage: "Unable to load contacts. Please try again.",
    })
  );

  return response.contacts;
}
