// ---------------------------------------------------------------------------
// Sidebar — conversation list with create / search / delete
// ---------------------------------------------------------------------------

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, MessageSquare } from "lucide-react";
import { useConversations } from "@/hooks/use-conversations";
import { useUIStore } from "@/stores/ui-store";
import { createConversation, deleteConversation } from "@/lib/db/conversations";
import { formatTime } from "@/lib/utils";

export function Sidebar() {
  const router = useRouter();
  const conversations = useConversations();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const activeId = useUIStore((s) => s.activeConversationId);
  const setActive = useUIStore((s) => s.setActiveConversation);
  const [search, setSearch] = useState("");

  if (!sidebarOpen) return null;

  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const handleNew = async () => {
    const conv = await createConversation();
    setActive(conv.id);
    router.push(`/chat/view?id=${conv.id}`);
  };

  const handleSelect = (id: string) => {
    setActive(id);
    router.push(`/chat/view?id=${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (activeId === id) {
      setActive(null);
      router.push("/chat");
    }
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      {/* New conversation button */}
      <div className="p-3">
        <button
          onClick={handleNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 && (
          <p className="p-3 text-center text-xs text-zinc-400">
            {search ? "No matches" : "No conversations yet"}
          </p>
        )}
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv.id)}
            className={`group mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              activeId === conv.id
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{conv.title}</p>
              <p className="text-[10px] opacity-50">
                {formatTime(conv.updatedAt)}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, conv.id)}
              className="hidden rounded p-1 text-zinc-400 hover:text-red-500 group-hover:block"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </button>
        ))}
      </nav>
    </aside>
  );
}
