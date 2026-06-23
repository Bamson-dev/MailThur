interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailMessageHeader[];
  };
}

interface GmailThreadResponse {
  id: string;
  messages?: GmailMessage[];
}

function headerValue(
  headers: GmailMessageHeader[] | undefined,
  name: string
): string {
  const found = headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return found?.value ?? "";
}

function extractEmailAddress(header: string): string {
  const match = header.match(/<([^>]+)>/);
  if (match) {
    return match[1].trim().toLowerCase();
  }
  return header.trim().toLowerCase();
}

export async function fetchGmailThread(
  accessToken: string,
  threadId: string
): Promise<GmailThreadResponse | null> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail thread fetch failed: ${response.status} ${body}`);
  }

  return (await response.json()) as GmailThreadResponse;
}

/**
 * Returns true if the thread contains a reply from the contact (not from our inbox).
 */
export function threadHasReplyFromContact(
  thread: GmailThreadResponse,
  contactEmail: string,
  inboxEmail: string
): boolean {
  const contact = contactEmail.trim().toLowerCase();
  const inbox = inboxEmail.trim().toLowerCase();

  for (const message of thread.messages ?? []) {
    const from = extractEmailAddress(
      headerValue(message.payload?.headers, "From")
    );

    if (from === contact && from !== inbox) {
      return true;
    }

    if (from.includes(contact) && !from.includes(inbox)) {
      return true;
    }
  }

  return false;
}
