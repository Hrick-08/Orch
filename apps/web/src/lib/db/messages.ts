// ---------------------------------------------------------------------------
// Message CRUD helpers
// ---------------------------------------------------------------------------

import { v4 as uuid } from "uuid";
import { db, type MessageRecord } from "./schema";

/** Add a message to a conversation. */
export async function addMessage(
  conversationId: string,
  role: MessageRecord["role"],
  content: string,
  provider?: MessageRecord["provider"]
): Promise<MessageRecord> {
  const message: MessageRecord = {
    id: uuid(),
    conversationId,
    role,
    content,
    provider,
    createdAt: new Date().toISOString(),
  };

  await db.transaction("rw", [db.messages, db.conversations], async () => {
    await db.messages.add(message);
    await db.conversations.update(conversationId, {
      updatedAt: new Date().toISOString(),
    });
  });

  return message;
}

/** Get all messages for a conversation, oldest first. */
export async function getMessages(
  conversationId: string
): Promise<MessageRecord[]> {
  return db.messages
    .where("conversationId")
    .equals(conversationId)
    .sortBy("createdAt");
}

/** Delete a single message. */
export async function deleteMessage(id: string): Promise<void> {
  await db.messages.delete(id);
}
