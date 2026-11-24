// ---------------------------------------------------------------------------
// MessageList — scrollable list of messages for the active conversation
// ---------------------------------------------------------------------------

"use client";

import { useEffect, useRef } from "react";
import type { MessageRecord } from "@/lib/db/schema";
import { Message } from "./Message";

interface MessageListProps {
  messages: MessageRecord[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400 dark:text-zinc-500">
        <div className="text-center">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="mt-1 text-sm">Start a conversation or hand off to a provider.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
