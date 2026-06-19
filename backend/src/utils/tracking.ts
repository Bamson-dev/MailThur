import { env } from "../config/env";

const TRACKING_BASE_URL = env.TRACKING_BASE_URL ?? env.PUBLIC_BACKEND_URL;

export function buildTrackingPixelUrl(sendLogId: string): string {
  return `${TRACKING_BASE_URL}/track/open/${sendLogId}`;
}

export function buildUnsubscribeUrl(sendLogId: string): string {
  return `${env.PUBLIC_BACKEND_URL}/unsubscribe/${sendLogId}`;
}

export function appendTrackingPixel(body: string, sendLogId: string): string {
  const pixelUrl = buildTrackingPixelUrl(sendLogId);
  const unsubscribeUrl = buildUnsubscribeUrl(sendLogId);
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;" />`;
  const footer = `<p style="font-size:12px;color:#888;margin-top:24px;">Unsubscribe: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>`;

  if (body.includes("</body>")) {
    return body.replace("</body>", `${pixel}${footer}</body>`);
  }

  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>\n");

  return `<html><body>${escaped}${pixel}${footer}</body></html>`;
}

/** Plain-text unsubscribe line appended before HTML conversion in queue. */
export function appendPlainUnsubscribeLine(body: string, sendLogId: string): string {
  const url = buildUnsubscribeUrl(sendLogId);
  return `${body}\n\nUnsubscribe: ${url}`;
}

/** Standard 1x1 transparent GIF (43 bytes). */
export const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);
