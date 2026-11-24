// ---------------------------------------------------------------------------
// Export / Import — JSON file for backup & device transfer
// ---------------------------------------------------------------------------

import { db, type ConversationRecord, type MessageRecord } from "./schema";

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  conversations: ConversationRecord[];
  messages: MessageRecord[];
}

/** Export the full local database to a JSON blob. */
export async function exportAll(): Promise<ExportPayload> {
  const [conversations, messages] = await Promise.all([
    db.conversations.toArray(),
    db.messages.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    conversations,
    messages,
  };
}

/** Import conversations and messages from a JSON payload (merge strategy). */
export async function importAll(payload: ExportPayload): Promise<{
  conversationsImported: number;
  messagesImported: number;
}> {
  let conversationsImported = 0;
  let messagesImported = 0;

  await db.transaction("rw", [db.conversations, db.messages], async () => {
    for (const conv of payload.conversations) {
      const existing = await db.conversations.get(conv.id);
      if (!existing) {
        await db.conversations.add(conv);
        conversationsImported++;
      }
    }
    for (const msg of payload.messages) {
      const existing = await db.messages.get(msg.id);
      if (!existing) {
        await db.messages.add(msg);
        messagesImported++;
      }
    }
  });

  return { conversationsImported, messagesImported };
}

/** Wipe all local data — conversations, messages, handoffs, settings. */
export async function wipeAllData(): Promise<void> {
  await db.transaction(
    "rw",
    [db.conversations, db.messages, db.handoffs, db.settings],
    async () => {
      await db.conversations.clear();
      await db.messages.clear();
      await db.handoffs.clear();
      await db.settings.clear();
    }
  );
}
