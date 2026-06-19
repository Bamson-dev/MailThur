import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";
import { ContactInput } from "../services/contact-import";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type ContactStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "bounced"
  | "unsubscribed"
  | "replied";

export interface Campaign {
  id: string;
  user_email: string;
  name: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  subject: string;
  body: string;
  delay_days: number;
  created_at: string;
}

export interface CampaignStepInput {
  subject: string;
  body: string;
  delay_days: number;
}

export interface CampaignWithDetails extends Campaign {
  steps: CampaignStep[];
  contact_count: number;
}

export interface CampaignListItem extends Campaign {
  contact_count: number;
}

export async function createCampaign(
  userEmail: string,
  name: string
): Promise<Campaign> {
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      user_email: userEmail,
      name,
      status: "draft",
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error("Failed to create campaign", error);
    throw new Error("Campaign create failed");
  }

  return data as Campaign;
}

export async function listCampaignsForUser(
  userEmail: string
): Promise<CampaignListItem[]> {
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, user_email, name, status, created_at, updated_at")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list campaigns", error);
    throw new Error("Campaign list failed");
  }

  if (!campaigns?.length) {
    return [];
  }

  const campaignIds = campaigns.map((c) => c.id);
  const { data: counts, error: countError } = await supabase
    .from("campaign_contacts")
    .select("campaign_id")
    .in("campaign_id", campaignIds);

  if (countError) {
    logger.error("Failed to count campaign contacts", countError);
    throw new Error("Campaign list failed");
  }

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.campaign_id, (countMap.get(row.campaign_id) ?? 0) + 1);
  }

  return campaigns.map((campaign) => ({
    ...(campaign as Campaign),
    contact_count: countMap.get(campaign.id) ?? 0,
  }));
}

export async function getCampaignForUser(
  userEmail: string,
  campaignId: string
): Promise<CampaignWithDetails | null> {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch campaign", error);
    throw new Error("Campaign fetch failed");
  }

  if (!campaign) {
    return null;
  }

  const [{ data: steps, error: stepsError }, { count, error: countError }] =
    await Promise.all([
      supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("step_order", { ascending: true }),
      supabase
        .from("campaign_contacts")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId),
    ]);

  if (stepsError || countError) {
    logger.error("Failed to fetch campaign details", stepsError ?? countError);
    throw new Error("Campaign fetch failed");
  }

  return {
    ...(campaign as Campaign),
    steps: (steps ?? []) as CampaignStep[],
    contact_count: count ?? 0,
  };
}

export async function replaceCampaignSteps(
  userEmail: string,
  campaignId: string,
  steps: CampaignStepInput[]
): Promise<CampaignStep[]> {
  const campaign = await getCampaignForUser(userEmail, campaignId);
  if (!campaign) {
    return [];
  }

  const { error: deleteError } = await supabase
    .from("campaign_steps")
    .delete()
    .eq("campaign_id", campaignId);

  if (deleteError) {
    logger.error("Failed to delete campaign steps", deleteError);
    throw new Error("Campaign steps update failed");
  }

  if (steps.length === 0) {
    return [];
  }

  const rows = steps.map((step, index) => ({
    campaign_id: campaignId,
    step_order: index,
    subject: step.subject,
    body: step.body,
    delay_days: step.delay_days,
  }));

  const { data, error } = await supabase
    .from("campaign_steps")
    .insert(rows)
    .select("*");

  if (error) {
    logger.error("Failed to insert campaign steps", error);
    throw new Error("Campaign steps update failed");
  }

  await supabase
    .from("campaigns")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("user_email", userEmail);

  return (data ?? []) as CampaignStep[];
}

export interface ContactImportResult {
  imported: number;
  skipped: number;
  invalid: Array<{ row: number; reason: string }>;
}

export async function importCampaignContacts(
  userEmail: string,
  campaignId: string,
  contacts: ContactInput[]
): Promise<ContactImportResult | null> {
  const campaign = await getCampaignForUser(userEmail, campaignId);
  if (!campaign) {
    return null;
  }

  if (contacts.length === 0) {
    return { imported: 0, skipped: 0, invalid: [] };
  }

  const now = new Date().toISOString();
  const rows = contacts.map((contact) => ({
    campaign_id: campaignId,
    email: contact.email,
    first_name: contact.first_name ?? null,
    business_name: contact.business_name ?? null,
    city: contact.city ?? null,
    custom_fields: contact.custom_fields ?? {},
    status: "pending",
    next_send_at: now,
  }));

  const { data, error } = await supabase
    .from("campaign_contacts")
    .insert(rows)
    .select("id");

  if (error) {
    logger.error("Failed to import campaign contacts", error);
    throw new Error("Contact import failed");
  }

  await supabase
    .from("campaigns")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("user_email", userEmail);

  return {
    imported: data?.length ?? 0,
    skipped: 0,
    invalid: [],
  };
}

export async function launchCampaign(
  userEmail: string,
  campaignId: string
): Promise<{ success: boolean; reason?: string }> {
  const campaign = await getCampaignForUser(userEmail, campaignId);
  if (!campaign) {
    return { success: false, reason: "not_found" };
  }

  if (campaign.steps.length === 0) {
    return { success: false, reason: "no_steps" };
  }

  if (campaign.contact_count === 0) {
    return { success: false, reason: "no_contacts" };
  }

  const { error } = await supabase
    .from("campaigns")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("user_email", userEmail);

  if (error) {
    logger.error("Failed to launch campaign", error);
    throw new Error("Campaign launch failed");
  }

  return { success: true };
}

export async function pauseCampaign(
  userEmail: string,
  campaignId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("user_email", userEmail)
    .select("id")
    .maybeSingle();

  if (error) {
    logger.error("Failed to pause campaign", error);
    throw new Error("Campaign pause failed");
  }

  return !!data;
}

export interface EligibleContact {
  id: string;
  campaign_id: string;
  email: string;
  first_name: string | null;
  business_name: string | null;
  city: string | null;
  custom_fields: Record<string, unknown>;
  current_step: number;
  status: ContactStatus;
  next_send_at: string | null;
  user_email: string;
}

export async function fetchEligibleContacts(): Promise<EligibleContact[]> {
  const now = new Date().toISOString();

  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, user_email")
    .eq("status", "active");

  if (campaignError) {
    logger.error("Failed to fetch active campaigns", campaignError);
    throw new Error("Queue fetch failed");
  }

  if (!campaigns?.length) {
    return [];
  }

  const campaignIds = campaigns.map((c) => c.id);
  const userByCampaign = new Map(
    campaigns.map((c) => [c.id, c.user_email as string])
  );

  const { data: contacts, error: contactError } = await supabase
    .from("campaign_contacts")
    .select(
      "id, campaign_id, email, first_name, business_name, city, custom_fields, current_step, status, next_send_at"
    )
    .in("campaign_id", campaignIds)
    .in("status", ["pending", "in_progress"])
    .lte("next_send_at", now);

  if (contactError) {
    logger.error("Failed to fetch eligible contacts", contactError);
    throw new Error("Queue fetch failed");
  }

  return (contacts ?? []).map((contact) => ({
    ...(contact as Omit<EligibleContact, "user_email">),
    custom_fields: (contact.custom_fields ?? {}) as Record<string, unknown>,
    user_email: userByCampaign.get(contact.campaign_id) ?? "",
  }));
}

export async function getCampaignStep(
  campaignId: string,
  stepOrder: number
): Promise<CampaignStep | null> {
  const { data, error } = await supabase
    .from("campaign_steps")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("step_order", stepOrder)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch campaign step", error);
    throw new Error("Step fetch failed");
  }

  return data as CampaignStep | null;
}

export async function getCampaignSteps(
  campaignId: string
): Promise<CampaignStep[]> {
  const { data, error } = await supabase
    .from("campaign_steps")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("step_order", { ascending: true });

  if (error) {
    logger.error("Failed to fetch campaign steps", error);
    throw new Error("Steps fetch failed");
  }

  return (data ?? []) as CampaignStep[];
}

export async function recordSendLog(entry: {
  campaignId: string;
  contactId: string;
  inboxId: string;
  stepOrder: number;
  status: "sent" | "failed" | "bounced";
  errorMessage?: string;
}): Promise<void> {
  const { error } = await supabase.from("send_log").insert({
    campaign_id: entry.campaignId,
    contact_id: entry.contactId,
    inbox_id: entry.inboxId,
    step_order: entry.stepOrder,
    status: entry.status,
    error_message: entry.errorMessage ?? null,
  });

  if (error) {
    logger.error("Failed to record send log", error);
    throw new Error("Send log failed");
  }
}

export async function advanceContactAfterSend(
  contactId: string,
  nextStep: number,
  totalSteps: number,
  delayDays: number
): Promise<void> {
  const now = new Date();
  const updates: Record<string, unknown> = {
    current_step: nextStep,
    status: nextStep >= totalSteps ? "completed" : "in_progress",
  };

  if (nextStep < totalSteps) {
    const nextSend = new Date(now);
    nextSend.setDate(nextSend.getDate() + delayDays);
    updates.next_send_at = nextSend.toISOString();
  } else {
    updates.next_send_at = null;
  }

  const { error } = await supabase
    .from("campaign_contacts")
    .update(updates)
    .eq("id", contactId);

  if (error) {
    logger.error("Failed to advance contact", error);
    throw new Error("Contact update failed");
  }
}

export async function updateContactStatus(
  contactId: string,
  status: ContactStatus
): Promise<void> {
  const { error } = await supabase
    .from("campaign_contacts")
    .update({ status })
    .eq("id", contactId);

  if (error) {
    logger.error("Failed to update contact status", error);
    throw new Error("Contact status update failed");
  }
}

export async function isCampaignActive(campaignId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("status")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to check campaign status", error);
    return false;
  }

  return data?.status === "active";
}

export interface SendLogEntry {
  id: string;
  campaign_id: string;
  contact_id: string;
  inbox_id: string;
  step_order: number;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export interface CampaignContactRow {
  id: string;
  email: string;
  first_name: string | null;
  business_name: string | null;
  current_step: number;
  status: string;
  next_send_at: string | null;
}

export async function getSendLogForCampaign(
  userEmail: string,
  campaignId: string
): Promise<SendLogEntry[] | null> {
  const campaign = await getCampaignForUser(userEmail, campaignId);
  if (!campaign) {
    return null;
  }

  const { data, error } = await supabase
    .from("send_log")
    .select(
      "id, campaign_id, contact_id, inbox_id, step_order, status, error_message, sent_at"
    )
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to fetch send log", error);
    throw new Error("Send log fetch failed");
  }

  return (data ?? []) as SendLogEntry[];
}

export async function getContactsForCampaign(
  userEmail: string,
  campaignId: string
): Promise<CampaignContactRow[] | null> {
  const campaign = await getCampaignForUser(userEmail, campaignId);
  if (!campaign) {
    return null;
  }

  const { data, error } = await supabase
    .from("campaign_contacts")
    .select(
      "id, email, first_name, business_name, current_step, status, next_send_at"
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to fetch campaign contacts", error);
    throw new Error("Contacts fetch failed");
  }

  return (data ?? []) as CampaignContactRow[];
}
