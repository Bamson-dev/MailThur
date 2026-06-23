export interface PersonalizationFields {
  first_name?: string | null;
  business_name?: string | null;
  city?: string | null;
  custom_fields?: Record<string, unknown> | null;
}

const TOKEN_PATTERN = /\{\{(\w+)\}\}/g;

export function personalizeText(
  template: string,
  fields: PersonalizationFields
): string {
  const values: Record<string, string> = {
    first_name: fields.first_name?.trim() ?? "",
    business_name: fields.business_name?.trim() ?? "",
    city: fields.city?.trim() ?? "",
  };

  if (fields.custom_fields) {
    for (const [key, value] of Object.entries(fields.custom_fields)) {
      if (typeof value === "string" || typeof value === "number") {
        values[key] = String(value);
      }
    }
  }

  return template.replace(TOKEN_PATTERN, (_match, key: string) => {
    return values[key] ?? "";
  });
}
