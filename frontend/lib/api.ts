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

/** Thrown when the API returns 403 due to plan or usage limits. */
export class LimitReachedError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "LimitReachedError";
  }
}

export function isLimitReachedError(error: unknown): error is LimitReachedError {
  return error instanceof LimitReachedError;
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
      let message = userMessage ?? GENERIC_ERROR_MESSAGE;

      try {
        const body = (await response.json()) as {
          message?: string;
          error?: string;
        };
        if (body.message) {
          message = body.message;
        } else if (body.error) {
          message = body.error;
        }
      } catch {
        // Non-JSON error body — keep generic message.
      }

      if (process.env.NODE_ENV === "development") {
        console.error(
          `API request failed: ${response.status} ${response.statusText}`,
          { url }
        );
      }

      if (response.status === 403) {
        throw new LimitReachedError(message);
      }

      throw new ApiError(message);
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
