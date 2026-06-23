import { parse } from "csv-parse/sync";
import { z } from "zod";

const emailSchema = z.string().email().max(255);

export interface ContactInput {
  email: string;
  first_name?: string;
  business_name?: string;
  city?: string;
  custom_fields?: Record<string, unknown>;
}

export interface ImportRowResult {
  valid: ContactInput[];
  invalid: Array<{ row: number; reason: string }>;
}

const KNOWN_FIELDS = new Set([
  "email",
  "first_name",
  "business_name",
  "city",
]);

function normalizeRow(
  raw: Record<string, string | undefined>,
  rowNumber: number
): { contact?: ContactInput; error?: { row: number; reason: string } } {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null) {
      continue;
    }
    const trimmed = String(value).trim();
    if (trimmed) {
      normalized[key.toLowerCase().replace(/\s+/g, "_")] = trimmed;
    }
  }

  const email = normalized.email;
  if (!email) {
    return { error: { row: rowNumber, reason: "Missing email field." } };
  }

  const parsedEmail = emailSchema.safeParse(email.toLowerCase());
  if (!parsedEmail.success) {
    return { error: { row: rowNumber, reason: "Invalid email address." } };
  }

  const custom_fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(normalized)) {
    if (!KNOWN_FIELDS.has(key)) {
      custom_fields[key] = value;
    }
  }

  return {
    contact: {
      email: parsedEmail.data,
      first_name: normalized.first_name,
      business_name: normalized.business_name,
      city: normalized.city,
      custom_fields:
        Object.keys(custom_fields).length > 0 ? custom_fields : undefined,
    },
  };
}

export function parseContactsFromCsv(buffer: Buffer): ImportRowResult {
  let records: Record<string, string | undefined>[];

  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Record<string, string | undefined>[];
  } catch {
    return {
      valid: [],
      invalid: [{ row: 0, reason: "Unable to parse CSV file." }],
    };
  }

  const valid: ContactInput[] = [];
  const invalid: Array<{ row: number; reason: string }> = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const result = normalizeRow(record, rowNumber);
    if (result.contact) {
      valid.push(result.contact);
    } else if (result.error) {
      invalid.push(result.error);
    }
  });

  return { valid, invalid };
}

const contactSchema = z.object({
  email: emailSchema,
  first_name: z.string().max(255).optional(),
  business_name: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

export function parseContactsFromJson(
  contacts: unknown[]
): ImportRowResult {
  const valid: ContactInput[] = [];
  const invalid: Array<{ row: number; reason: string }> = [];

  contacts.forEach((item, index) => {
    const rowNumber = index + 1;
    const parsed = contactSchema.safeParse(item);
    if (!parsed.success) {
      invalid.push({ row: rowNumber, reason: "Invalid contact data." });
      return;
    }

    valid.push({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
    });
  });

  return { valid, invalid };
}
