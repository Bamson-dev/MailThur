const TRACKING_BASE_URL =
  process.env.TRACKING_BASE_URL ?? "https://staging-backend.mailthur.com";

export function buildTrackingPixelUrl(sendLogId: string): string {
  return `${TRACKING_BASE_URL}/track/open/${sendLogId}`;
}

export function appendTrackingPixel(body: string, sendLogId: string): string {
  const pixelUrl = buildTrackingPixelUrl(sendLogId);
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;" />`;

  if (body.includes("</body>")) {
    return body.replace("</body>", `${pixel}</body>`);
  }

  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>\n");

  return `<html><body>${escaped}${pixel}</body></html>`;
}

/** Standard 1x1 transparent GIF (43 bytes). */
export const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);
