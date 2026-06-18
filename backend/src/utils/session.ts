import crypto from "crypto";
import { env } from "../config/env";

interface SessionPayload {
  email: string;
  exp: number;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sign(data: string): string {
  return crypto
    .createHmac("sha256", env.SESSION_SECRET)
    .update(data)
    .digest("base64url");
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(data: string): SessionPayload | null {
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const data = encodePayload(payload);
  return `${data}.${sign(data)}`;
}

export function verifySessionToken(token: string): string | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  if (signature !== sign(data)) {
    return null;
  }

  const payload = decodePayload(data);
  if (!payload || payload.exp < Date.now()) {
    return null;
  }

  return payload.email;
}

interface OAuthStatePayload {
  userEmail: string;
  nonce: string;
  exp: number;
}

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export function createOAuthState(userEmail: string): string {
  const payload: OAuthStatePayload = {
    userEmail: userEmail.trim().toLowerCase(),
    nonce: crypto.randomBytes(16).toString("hex"),
    exp: Date.now() + OAUTH_STATE_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyOAuthState(state: string): string | null {
  const [data, signature] = state.split(".");
  if (!data || !signature || signature !== sign(data)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    ) as OAuthStatePayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload.userEmail;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "mailthur_session";

export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  maxAge: number;
  path: string;
  domain?: string;
} {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.COOKIE_DOMAIN ? "none" : "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}
