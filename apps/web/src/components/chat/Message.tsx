// ---------------------------------------------------------------------------
// Message bubble — renders a single message with role + provider attribution
// ---------------------------------------------------------------------------

"use client";

import type { MessageRecord } from "@/lib/db/schema";
import { ProviderBadge } from "./ProviderBadge";
import { formatTime } from "@/lib/utils";

interface MessageProps {
  message: MessageRecord;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {/* Provider attribution */}
        <div className="mb-1 flex items-center gap-2">
          {!isUser && <ProviderBadge provider={message.provider} />}
          <span className="text-[10px] opacity-50">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Content */}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}
