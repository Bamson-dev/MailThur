import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

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

export async function listUnifiedContactsForUser(
  userEmail: string,
  filters?: { search?: string; status?: string }
): Promise<UnifiedContact[]> {
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("user_email", userEmail);

  if (campaignError) {
    logger.error("Failed to fetch campaigns for contacts", campaignError);
    throw new Error("Contacts fetch failed");
  }

  if (!campaigns?.length) {
    return [];
  }

  const nameById = new Map(campaigns.map((c) => [c.id as string, c.name as string]));
  const campaignIds = campaigns.map((c) => c.id as string);

  let query = supabase
    .from("campaign_contacts")
    .select(
      "id, campaign_id, email, business_name, city, status, last_contacted_at"
    )
    .in("campaign_id", campaignIds)
    .order("last_contacted_at", { ascending: false, nullsFirst: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `email.ilike.${term},business_name.ilike.${term},city.ilike.${term}`
    );
  }

  const { data: contacts, error: contactError } = await query.limit(5000);

  if (contactError) {
    logger.error("Failed to fetch unified contacts", contactError);
    throw new Error("Contacts fetch failed");
  }

  if (!contacts?.length) {
    return [];
  }

  const contactIds = contacts.map((c) => c.id as string);

  const { data: sendLogs, error: logError } = await supabase
    .from("send_log")
    .select("contact_id, opened_at, replied_at")
    .in("contact_id", contactIds)
    .eq("status", "sent");

  if (logError) {
    logger.error("Failed to fetch contact engagement", logError);
    throw new Error("Contacts fetch failed");
  }

  const openedSet = new Set<string>();
  const repliedSet = new Set<string>();

  for (const log of sendLogs ?? []) {
    if (log.opened_at) openedSet.add(log.contact_id as string);
    if (log.replied_at) repliedSet.add(log.contact_id as string);
  }

  return contacts.map((contact) => ({
    id: contact.id as string,
    campaign_id: contact.campaign_id as string,
    campaign_name: nameById.get(contact.campaign_id as string) ?? "Campaign",
    email: contact.email as string,
    business_name: (contact.business_name as string | null) ?? null,
    city: (contact.city as string | null) ?? null,
    status: contact.status as string,
    last_contacted_at: (contact.last_contacted_at as string | null) ?? null,
    opened: openedSet.has(contact.id as string),
    replied: repliedSet.has(contact.id as string),
  }));
}
