import { Request, Response, NextFunction } from "express";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../utils/session";

export interface AuthenticatedRequest extends Request {
  userEmail: string;
}

function extractSessionToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractSessionToken(req);
  const userEmail = token ? verifySessionToken(token) : null;

  if (!userEmail) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  (req as AuthenticatedRequest).userEmail = userEmail;
  next();
}

export function getAuthenticatedUser(req: Request): string | null {
  const token = extractSessionToken(req);
  return token ? verifySessionToken(token) : null;
}
