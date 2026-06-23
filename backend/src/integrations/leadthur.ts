/**
 * LEADTHUR → MAILTHUR INTEGRATION POINT
 * --------------------------------------
 * When wiring LeadThur's "Start Campaign" action, POST business contacts to:
 *
 *   POST {MAILTHUR_API_URL}/api/campaigns/{campaignId}/contacts/leadthur
 *   Authorization: Bearer {user_mailthur_session_token}
 *   Content-Type: application/json
 *
 * Payload shape: LeadThurImportPayload (see below).
 *
 * LeadThur should obtain the MailThur campaign ID when the user creates or
 * selects a campaign, then push contacts on Start Campaign. Contacts without
 * an email are skipped server-side and reported in the response.
 */
import { z } from "zod";
import { ContactInput } from "../services/contact-import";

const optionalString = z.string().trim().max(500).optional();

export const leadThurContactSchema = z.object({
  business_name: z.string().trim().min(1).max(255),
  email: optionalString,
  phone: optionalString,
  city: optionalString,
  website: optionalString,
});

export const leadThurImportPayloadSchema = z.object({
  contacts: z.array(leadThurContactSchema).min(1).max(5000),
});

export type LeadThurContact = z.infer<typeof leadThurContactSchema>;
export type LeadThurImportPayload = z.infer<typeof leadThurImportPayloadSchema>;

export interface LeadThurImportResult {
  valid: ContactInput[];
  skipped: Array<{ index: number; business_name: string; reason: string }>;
}

export function mapLeadThurContacts(
  contacts: LeadThurContact[]
): LeadThurImportResult {
  const valid: ContactInput[] = [];
  const skipped: Array<{ index: number; business_name: string; reason: string }> =
    [];

  contacts.forEach((contact, index) => {
    const email = contact.email?.trim().toLowerCase();

    if (!email) {
      skipped.push({
        index: index + 1,
        business_name: contact.business_name,
        reason: "no email found",
      });
      return;
    }

    const emailValid = z.string().email().safeParse(email);
    if (!emailValid.success) {
      skipped.push({
        index: index + 1,
        business_name: contact.business_name,
        reason: "invalid email",
      });
      return;
    }

    const custom_fields: Record<string, unknown> = { source: "leadthur" };
    if (contact.phone) {
      custom_fields.phone = contact.phone;
    }
    if (contact.website) {
      custom_fields.website = contact.website;
    }

    valid.push({
      email: emailValid.data,
      first_name: contact.business_name,
      business_name: contact.business_name,
      city: contact.city,
      custom_fields,
    });
  });

  return { valid, skipped };
}
