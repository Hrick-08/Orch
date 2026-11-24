// ---------------------------------------------------------------------------
// /chat — conversation list empty state (no conversation selected)
// ---------------------------------------------------------------------------

"use client";

import { useRouter } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { createConversation } from "@/lib/db/conversations";
import { useUIStore } from "@/stores/ui-store";

export default function ChatPage() {
  const router = useRouter();
  const setActive = useUIStore((s) => s.setActiveConversation);

  const handleNew = async () => {
    const conv = await createConversation();
    setActive(conv.id);
    router.push(`/chat/view?id=${conv.id}`);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <MessageSquarePlus className="h-8 w-8 text-zinc-400" />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Orchestrator
        </h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          One conversation, every assistant. Select a conversation from the
          sidebar or start a new one.
        </p>
      </div>

      <button
        onClick={handleNew}
        className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        New conversation
      </button>

      <div className="mt-6 max-w-md rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
        <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
          Local-first & private
        </p>
        <p>
          All conversations are stored only on this device using IndexedDB.
          Nothing is ever sent to our servers. The companion browser extension
          bridges your existing AI provider sessions — no API keys needed.
        </p>
      </div>
    </div>
  );
}
