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
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(SESSION_KEY);
}

export function getSessionEmail(): string | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(SESSION_KEY);
  if (!token) return null;

  try {
    const [data] = token.split(".");
    if (!data) return null;
    let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const payload = JSON.parse(atob(base64)) as {
      email?: string;
      exp?: number;
    };
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function onboardingKey(email: string): string {
  return `mailthur_onboarding_done_${email.toLowerCase()}`;
}

export function isOnboardingDone(email: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(onboardingKey(email)) === "true";
}

export function markOnboardingDone(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(onboardingKey(email), "true");
}
