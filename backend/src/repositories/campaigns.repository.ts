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
  userEmail: string,
  filters?: { status?: CampaignStatus; search?: string }
): Promise<CampaignListItem[]> {
  let query = supabase
    .from("campaigns")
    .select("id, user_email, name, status, created_at, updated_at")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data: campaigns, error } = await query;

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

export async function createPendingSendLog(entry: {
  campaignId: string;
  contactId: string;
  inboxId: string;
  stepOrder: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from("send_log")
    .insert({
      campaign_id: entry.campaignId,
      contact_id: entry.contactId,
      inbox_id: entry.inboxId,
      step_order: entry.stepOrder,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    logger.error("Failed to create pending send log", error);
    throw new Error("Send log failed");
  }

  return data.id as string;
}

export async function finalizeSendLog(
  sendLogId: string,
  status: "sent" | "failed" | "bounced",
  errorMessage?: string,
  gmailIds?: { threadId: string; messageId: string }
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    error_message: errorMessage ?? null,
    sent_at: new Date().toISOString(),
  };

  if (gmailIds) {
    updates.gmail_thread_id = gmailIds.threadId;
    updates.gmail_message_id = gmailIds.messageId;
  }

  const { error } = await supabase
    .from("send_log")
    .update(updates)
    .eq("id", sendLogId);

  if (error) {
    logger.error("Failed to finalize send log", error);
    throw new Error("Send log update failed");
  }
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
  opened_at?: string | null;
  replied_at?: string | null;
  gmail_thread_id?: string | null;
}

export interface CampaignContactRow {
  id: string;
  email: string;
  first_name: string | null;
  business_name: string | null;
  current_step: number;
  status: string;
  next_send_at: string | null;
  last_contacted_at: string | null;
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
      "id, campaign_id, contact_id, inbox_id, step_order, status, error_message, sent_at, opened_at, replied_at, gmail_thread_id"
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

  const contactIds = (data ?? []).map((c) => c.id);
  const lastContactMap = new Map<string, string>();

  if (contactIds.length > 0) {
    const { data: logs } = await supabase
      .from("send_log")
      .select("contact_id, sent_at")
      .in("contact_id", contactIds)
      .eq("status", "sent")
      .order("sent_at", { ascending: false });

    for (const log of logs ?? []) {
      if (!lastContactMap.has(log.contact_id)) {
        lastContactMap.set(log.contact_id, log.sent_at as string);
      }
    }
  }

  return (data ?? []).map((row) => ({
    ...(row as Omit<CampaignContactRow, "last_contacted_at">),
    last_contacted_at: lastContactMap.get(row.id) ?? null,
  }));
}

export async function unsubscribeBySendLogId(
  sendLogId: string
): Promise<{ found: boolean; updated: number }> {
  const { data: logRow, error: logError } = await supabase
    .from("send_log")
    .select("id, contact_id")
    .eq("id", sendLogId)
    .maybeSingle();

  if (logError || !logRow) {
    return { found: false, updated: 0 };
  }

  const { data: contact, error: contactError } = await supabase
    .from("campaign_contacts")
    .select("id, email, campaign_id")
    .eq("id", logRow.contact_id)
    .maybeSingle();

  if (contactError || !contact) {
    return { found: false, updated: 0 };
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("user_email")
    .eq("id", contact.campaign_id)
    .maybeSingle();

  if (campaignError || !campaign) {
    return { found: false, updated: 0 };
  }

  const userEmail = campaign.user_email as string;
  const contactEmail = (contact.email as string).toLowerCase();

  const { data: userCampaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_email", userEmail);

  const campaignIds = (userCampaigns ?? []).map((c) => c.id);
  if (campaignIds.length === 0) {
    return { found: true, updated: 0 };
  }

  const { data: updated, error: updateError } = await supabase
    .from("campaign_contacts")
    .update({
      status: "unsubscribed",
      next_send_at: null,
    })
    .in("campaign_id", campaignIds)
    .eq("email", contactEmail)
    .in("status", ["pending", "in_progress", "completed", "replied"])
    .select("id");

  if (updateError) {
    logger.error("Failed to unsubscribe contacts", updateError);
    throw new Error("Unsubscribe failed");
  }

  return { found: true, updated: updated?.length ?? 0 };
}

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

export async function getRecentActivityForUser(
  userEmail: string,
  limit: number
): Promise<ActivityEvent[]> {
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("user_email", userEmail);

  if (campaignError) {
    logger.error("Failed to fetch campaigns for activity", campaignError);
    throw new Error("Activity fetch failed");
  }

  if (!campaigns?.length) {
    return [];
  }

  const campaignIds = campaigns.map((c) => c.id);
  const nameById = new Map(campaigns.map((c) => [c.id, c.name as string]));

  const { data: logs, error: logError } = await supabase
    .from("send_log")
    .select(
      "id, campaign_id, contact_id, inbox_id, status, sent_at, opened_at"
    )
    .in("campaign_id", campaignIds)
    .in("status", ["sent", "failed", "bounced"])
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (logError) {
    logger.error("Failed to fetch activity send logs", logError);
    throw new Error("Activity fetch failed");
  }

  if (!logs?.length) {
    return [];
  }

  const contactIds = [...new Set(logs.map((l) => l.contact_id))];
  const inboxIds = [...new Set(logs.map((l) => l.inbox_id))];

  const [{ data: contacts }, { data: inboxes }] = await Promise.all([
    supabase
      .from("campaign_contacts")
      .select("id, email")
      .in("id", contactIds),
    supabase
      .from("connected_inboxes")
      .select("id, inbox_email")
      .in("id", inboxIds),
  ]);

  const emailByContact = new Map(
    (contacts ?? []).map((c) => [c.id, c.email as string])
  );
  const inboxById = new Map(
    (inboxes ?? []).map((i) => [i.id, i.inbox_email as string])
  );

  return logs.map((log) => ({
    send_log_id: log.id as string,
    campaign_id: log.campaign_id as string,
    campaign_name: nameById.get(log.campaign_id) ?? "Campaign",
    contact_email: emailByContact.get(log.contact_id) ?? "Unknown",
    inbox_email: inboxById.get(log.inbox_id) ?? "Unknown",
    status: log.status as string,
    sent_at: log.sent_at as string,
    opened_at: (log.opened_at as string | null) ?? null,
  }));
}

export interface SentLogAwaitingReply {
  send_log_id: string;
  gmail_thread_id: string;
  contact_id: string;
  contact_email: string;
  inbox_id: string;
  inbox_email: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

export async function fetchSentLogsAwaitingReply(
  since: Date
): Promise<SentLogAwaitingReply[]> {
  const { data: logs, error } = await supabase
    .from("send_log")
    .select("id, gmail_thread_id, contact_id, inbox_id")
    .eq("status", "sent")
    .is("replied_at", null)
    .not("gmail_thread_id", "is", null)
    .gte("sent_at", since.toISOString());

  if (error) {
    logger.error("Failed to fetch logs awaiting reply", error);
    throw new Error("Reply poll fetch failed");
  }

  if (!logs?.length) {
    return [];
  }

  const contactIds = [...new Set(logs.map((l) => l.contact_id))];
  const inboxIds = [...new Set(logs.map((l) => l.inbox_id))];

  const [{ data: contacts }, { data: inboxes }] = await Promise.all([
    supabase.from("campaign_contacts").select("id, email").in("id", contactIds),
    supabase
      .from("connected_inboxes")
      .select(
        "id, inbox_email, access_token, refresh_token, token_expires_at, status"
      )
      .in("id", inboxIds)
      .eq("status", "active"),
  ]);

  const contactMap = new Map(
    (contacts ?? []).map((c) => [c.id, c.email as string])
  );
  const inboxMap = new Map((inboxes ?? []).map((i) => [i.id, i]));

  const results: SentLogAwaitingReply[] = [];

  for (const log of logs) {
    const inbox = inboxMap.get(log.inbox_id);
    const contactEmail = contactMap.get(log.contact_id);
    if (!inbox || !contactEmail || !log.gmail_thread_id) {
      continue;
    }

    results.push({
      send_log_id: log.id as string,
      gmail_thread_id: log.gmail_thread_id as string,
      contact_id: log.contact_id as string,
      contact_email: contactEmail,
      inbox_id: log.inbox_id as string,
      inbox_email: inbox.inbox_email as string,
      access_token: inbox.access_token as string,
      refresh_token: inbox.refresh_token as string,
      token_expires_at: inbox.token_expires_at as string,
    });
  }

  return results;
}

export async function markSendLogReplied(
  sendLogId: string,
  contactId: string
): Promise<void> {
  const now = new Date().toISOString();

  const { error: logError } = await supabase
    .from("send_log")
    .update({ replied_at: now })
    .eq("id", sendLogId)
    .is("replied_at", null);

  if (logError) {
    logger.error("Failed to mark send log replied", logError);
    throw new Error("Reply update failed");
  }

  const { error: contactError } = await supabase
    .from("campaign_contacts")
    .update({ status: "replied", next_send_at: null })
    .eq("id", contactId);

  if (contactError) {
    logger.error("Failed to mark contact replied", contactError);
    throw new Error("Contact reply update failed");
  }
}

export async function getSendLogById(
  sendLogId: string
): Promise<{ id: string; status: string } | null> {
  const { data, error } = await supabase
    .from("send_log")
    .select("id, status")
    .eq("id", sendLogId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch send log by id", error);
    throw new Error("Send log fetch failed");
  }

  return data as { id: string; status: string } | null;
}
