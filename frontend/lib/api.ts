/**
 * API error thrown when a fetch request fails.
 * Carries a user-safe message only — never expose technical details to callers.
 */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const GENERIC_ERROR_MESSAGE =
  "Something went wrong. Please try again later.";

type FetchOptions = RequestInit & {
  /** Optional user-facing message override on failure */
  userMessage?: string;
};

/**
 * Wrapped fetch for all API calls. Always returns parsed JSON on success.
 * On failure, throws ApiError with a generic user-facing message.
 * Technical details are logged to console in development only.
 */
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { userMessage, ...fetchOptions } = options;

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          `API request failed: ${response.status} ${response.statusText}`,
          { url }
        );
      }
      throw new ApiError(userMessage ?? GENERIC_ERROR_MESSAGE);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (process.env.NODE_ENV === "development") {
      console.error("API request error:", error);
    }

    throw new ApiError(userMessage ?? GENERIC_ERROR_MESSAGE);
  }
}

/**
 * Returns a user-safe error message from any caught error.
 * Use in UI catch blocks to display friendly messages.
 */
export function getUserErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return GENERIC_ERROR_MESSAGE;
}
