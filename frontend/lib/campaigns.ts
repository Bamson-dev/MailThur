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

export async function fetchCampaigns(): Promise<Campaign[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch<{ campaigns: Campaign[] }>(
    `${apiUrl}/api/campaigns`,
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
