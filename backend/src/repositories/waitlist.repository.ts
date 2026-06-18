import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

/**
 * Adds an email to the waitlist. Duplicate emails are treated as success
 * to avoid revealing whether an address is already registered.
 */
export async function addToWaitlist(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase
    .from("waitlist")
    .insert({ email: normalizedEmail });

  if (!error) {
    return;
  }

  // PostgreSQL unique violation — email already on the list
  if (error.code === "23505") {
    return;
  }

  logger.error("Failed to add email to waitlist", error);
  throw new Error("Waitlist insert failed");
}
