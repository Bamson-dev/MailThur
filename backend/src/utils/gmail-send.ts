function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function buildMimeMessage(params: {
  to: string;
  from: string;
  subject: string;
  body: string;
}): string {
  const lines = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    params.body,
  ];

  return lines.join("\r\n");
}

export async function sendGmailMessage(params: {
  accessToken: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
}): Promise<void> {
  const raw = buildMimeMessage({
    to: params.toEmail,
    from: params.fromEmail,
    subject: params.subject,
    body: params.body,
  });

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlEncode(raw) }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gmail send failed: ${response.status} ${errorBody}`);
  }
}

const HARD_BOUNCE_PATTERNS = [
  /invalid/i,
  /not found/i,
  /does not exist/i,
  /rejected/i,
  /550/,
  /bounce/i,
  /undeliverable/i,
  /mailbox unavailable/i,
];

export function isHardBounceError(errorMessage: string): boolean {
  return HARD_BOUNCE_PATTERNS.some((pattern) => pattern.test(errorMessage));
}
