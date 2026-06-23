import {
  InboxWithTokens,
  countSendsTodayForInbox,
} from "../repositories/connected-inboxes.repository";

export interface InboxRotationState {
  nextIndex: number;
  sendsToday: Map<string, number>;
}

export async function buildInboxRotationState(
  inboxes: InboxWithTokens[]
): Promise<InboxRotationState> {
  const sendsToday = new Map<string, number>();

  await Promise.all(
    inboxes.map(async (inbox) => {
      const count = await countSendsTodayForInbox(inbox.id);
      sendsToday.set(inbox.id, count);
    })
  );

  return { nextIndex: 0, sendsToday };
}

export function selectAvailableInbox(
  inboxes: InboxWithTokens[],
  state: InboxRotationState
): InboxWithTokens | null {
  if (inboxes.length === 0) {
    return null;
  }

  for (let attempt = 0; attempt < inboxes.length; attempt += 1) {
    const inbox = inboxes[state.nextIndex % inboxes.length];
    state.nextIndex = (state.nextIndex + 1) % inboxes.length;

    const sentToday = state.sendsToday.get(inbox.id) ?? 0;
    if (sentToday < inbox.daily_send_cap) {
      return inbox;
    }
  }

  return null;
}

export function recordInboxSend(
  inboxId: string,
  state: InboxRotationState
): void {
  const current = state.sendsToday.get(inboxId) ?? 0;
  state.sendsToday.set(inboxId, current + 1);
}
