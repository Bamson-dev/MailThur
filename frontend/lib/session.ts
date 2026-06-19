const SESSION_KEY = "mailthur_session";

export function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem(SESSION_KEY)
      : null;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function fetchOptions(
  extra: RequestInit & { userMessage?: string } = {}
): RequestInit & { userMessage?: string } {
  const { userMessage, ...rest } = extra;
  return {
    credentials: "include",
    userMessage,
    ...rest,
    headers: {
      ...authHeaders(),
      ...rest.headers,
    },
  };
}

export function hasSession(): boolean {
  return !!sessionStorage.getItem(SESSION_KEY);
}
