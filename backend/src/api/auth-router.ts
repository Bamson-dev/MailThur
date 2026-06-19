import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate, ValidatedRequest } from "../middleware/validate";
import {
  requireAuth,
  AuthenticatedRequest,
  getAuthenticatedUser,
} from "../middleware/auth";
import {
  createSessionToken,
  createOAuthState,
  verifyOAuthState,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../utils/session";
import {
  buildGoogleConsentUrl,
  exchangeGoogleCode,
  fetchGoogleUserEmail,
} from "../utils/google-oauth";
import {
  upsertConnectedInbox,
  listInboxesForUser,
  disconnectInbox,
  getActiveInboxesWithTokensForUser,
  updateInboxTokens,
} from "../repositories/connected-inboxes.repository";
import { refreshGoogleAccessToken } from "../utils/google-oauth";
import { sendGmailMessage } from "../utils/gmail-send";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const sessionBodySchema = z.object({
  email: z.string().email().max(255),
});

const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

const inboxParamsSchema = z.object({
  id: z.string().uuid(),
});

type SessionBody = z.infer<typeof sessionBodySchema>;
type CallbackQuery = z.infer<typeof callbackQuerySchema>;
type InboxParams = z.infer<typeof inboxParamsSchema>;

const router = Router();

function dashboardRedirect(outcome: "success" | "error"): string {
  const url = new URL("/dashboard", env.FRONTEND_URL);
  url.searchParams.set("connected", outcome);
  return url.toString();
}

/**
 * Minimal session endpoint for staging E2E testing until full auth is built.
 * Sets a signed httpOnly cookie tied to user_email.
 */
router.post(
  "/auth/session",
  validate({ body: sessionBodySchema }),
  (req: Request, res: Response) => {
    const { email } = (req as ValidatedRequest<SessionBody>).validatedBody;
    const token = createSessionToken(email);

    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    res.json({ message: "Session established.", token });
  }
);

router.get("/auth/google", (req: Request, res: Response) => {
  let userEmail = getAuthenticatedUser(req);

  if (!userEmail && typeof req.query.session === "string") {
    userEmail = verifySessionToken(req.query.session);
  }

  if (!userEmail) {
    res.redirect(dashboardRedirect("error"));
    return;
  }

  const state = createOAuthState(userEmail);
  res.redirect(buildGoogleConsentUrl(state));
});

router.get(
  "/auth/google/callback",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.query.error) {
        logger.warn("Google OAuth denied by user");
        res.redirect(dashboardRedirect("error"));
        return;
      }

      const parsed = callbackQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.redirect(dashboardRedirect("error"));
        return;
      }

      const { code, state } = parsed.data;
      const userEmail = verifyOAuthState(state);

      if (!userEmail) {
        res.redirect(dashboardRedirect("error"));
        return;
      }

      const tokens = await exchangeGoogleCode(code);

      if (!tokens.refresh_token) {
        logger.warn("Google OAuth missing refresh token", {
          inboxEmail: "unknown",
        });
        res.redirect(dashboardRedirect("error"));
        return;
      }

      const inboxEmail = await fetchGoogleUserEmail(tokens.access_token);
      const tokenExpiresAt = new Date(
        Date.now() + tokens.expires_in * 1000
      );

      await upsertConnectedInbox({
        userEmail,
        inboxEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt,
      });

      logger.info("Inbox connected successfully", {
        inboxEmail,
        status: "success",
      });

      res.redirect(dashboardRedirect("success"));
    } catch (error) {
      logger.error("Google OAuth callback failed", error, { status: "failure" });
      res.redirect(dashboardRedirect("error"));
    }
  }
);

router.get(
  "/api/inboxes",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const inboxes = await listInboxesForUser(userEmail);
      res.json({ inboxes });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/api/inboxes/:id",
  requireAuth,
  validate({ params: inboxParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const { id } = (req as ValidatedRequest<unknown, unknown, InboxParams>)
        .validatedParams;

      const disconnected = await disconnectInbox(userEmail, id);

      if (!disconnected) {
        res.status(404).json({ error: "Inbox not found." });
        return;
      }

      res.json({ message: "Inbox disconnected." });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/api/inboxes/test-send",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req as AuthenticatedRequest;
      const inboxes = await getActiveInboxesWithTokensForUser(userEmail);

      if (inboxes.length === 0) {
        res.status(404).json({ error: "No active inbox found." });
        return;
      }

      const inbox = inboxes[0];
      let accessToken = inbox.access_token;
      let tokenSource = "stored";

      try {
        const refreshed = await refreshGoogleAccessToken(inbox.refresh_token);
        accessToken = refreshed.accessToken;
        await updateInboxTokens(
          inbox.id,
          refreshed.accessToken,
          refreshed.expiresAt
        );
        tokenSource = "refreshed";
      } catch (refreshError) {
        logger.warn("Test send using stored token after refresh failed", {
          inboxId: inbox.id,
        });
      }

      try {
        await sendGmailMessage({
          accessToken,
          fromEmail: inbox.inbox_email,
          toEmail: inbox.inbox_email,
          subject: "MailThur inbox send test",
          body: "This is a MailThur staging send test to verify Gmail API connectivity.",
        });

        res.json({
          success: true,
          inbox_email: inbox.inbox_email,
          token_source: tokenSource,
        });
      } catch (sendError) {
        const detail =
          sendError instanceof Error
            ? sendError.message.slice(0, 500)
            : "Unknown send error";

        logger.error("Inbox test send failed", sendError, { inboxId: inbox.id });

        res.json({
          success: false,
          inbox_email: inbox.inbox_email,
          token_source: tokenSource,
          error: "Gmail send failed. Check inbox connection and Google Cloud settings.",
          detail,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
