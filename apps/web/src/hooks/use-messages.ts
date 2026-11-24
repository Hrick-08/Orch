// ---------------------------------------------------------------------------
// useMessages — Dexie live query hook for a conversation's messages
// ---------------------------------------------------------------------------

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db/schema";

export function useMessages(conversationId: string | null) {
  const messages = useLiveQuery(
    () =>
      conversationId
        ? db.messages
            .where("conversationId")
            .equals(conversationId)
            .sortBy("createdAt")
        : [],
    [conversationId],
    []
  );

  return messages;
}
