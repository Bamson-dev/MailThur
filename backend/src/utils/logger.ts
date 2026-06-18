export interface LogContext {
  [key: string]: unknown;
}

/**
 * Structured logger wrapper.
 *
 * LOGGING HYGIENE — follow these rules for all future log calls:
 * - Never log full email addresses in plaintext where avoidable
 * - Never log passwords, tokens, or API keys (even partially)
 * - Prefer truncated or hashed user identifiers when the full value
 *   is not strictly necessary for debugging
 * - Log technical details server-side only; never include them in API responses
 */
export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        ...context,
        timestamp: new Date().toISOString(),
      })
    );
  },

  warn(message: string, context?: LogContext): void {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        ...context,
        timestamp: new Date().toISOString(),
      })
    );
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorDetail =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { raw: String(error) };

    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: errorDetail,
        ...context,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
