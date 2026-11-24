// ---------------------------------------------------------------------------
// useConversations — Dexie live query hook for conversation list
// ---------------------------------------------------------------------------

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db/schema";

export function useConversations() {
  const conversations = useLiveQuery(
    () => db.conversations.orderBy("updatedAt").reverse().toArray(),
    [],
    []
  );

  return conversations;
}

export function useConversation(id: string | null) {
  const conversation = useLiveQuery(
    () => (id ? db.conversations.get(id) : undefined),
    [id],
    undefined
  );

  return conversation;
}
