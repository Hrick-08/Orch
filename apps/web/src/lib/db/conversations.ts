// ---------------------------------------------------------------------------
// Conversation CRUD helpers
// ---------------------------------------------------------------------------

import { v4 as uuid } from "uuid";
import { db, type ConversationRecord } from "./schema";

/** Create a new conversation and return it. */
export async function createConversation(
  title = "New conversation"
): Promise<ConversationRecord> {
  const now = new Date().toISOString();
  const conversation: ConversationRecord = {
    id: uuid(),
    title,
    createdAt: now,
    updatedAt: now,
  };
  await db.conversations.add(conversation);
  return conversation;
}

/** Get a single conversation by id. */
export async function getConversation(
  id: string
): Promise<ConversationRecord | undefined> {
  return db.conversations.get(id);
}

/** List all conversations, most recently updated first. */
export async function listConversations(): Promise<ConversationRecord[]> {
  return db.conversations.orderBy("updatedAt").reverse().toArray();
}

/** Update title or metadata and touch updatedAt. */
export async function updateConversation(
  id: string,
  patch: Partial<Pick<ConversationRecord, "title" | "metadata">>
): Promise<void> {
  await db.conversations.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

/** Delete a conversation and all its messages / handoffs. */
export async function deleteConversation(id: string): Promise<void> {
  await db.transaction("rw", [db.conversations, db.messages, db.handoffs], async () => {
    await db.messages.where("conversationId").equals(id).delete();
    await db.handoffs.where("conversationId").equals(id).delete();
    await db.conversations.delete(id);
  });
}

/** Full-text search over conversation titles. */
export async function searchConversations(
  query: string
): Promise<ConversationRecord[]> {
  const q = query.toLowerCase();
  return db.conversations
    .filter((c) => c.title.toLowerCase().includes(q))
    .toArray();
}
