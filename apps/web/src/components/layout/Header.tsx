// ---------------------------------------------------------------------------
// Header — top bar with title and sidebar toggle
// ---------------------------------------------------------------------------

"use client";

import { Menu, Settings, Zap, ZapOff } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import { useExtension } from "@/lib/extension/use-extension";

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { status } = useExtension();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/chat" className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Orchestrator
          </span>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Extension status indicator */}
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            status === "connected"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
          title={`Extension: ${status}`}
        >
          {status === "connected" ? (
            <Zap className="h-3 w-3" />
          ) : (
            <ZapOff className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {status === "connected" ? "Extension" : "No extension"}
          </span>
        </div>

        <Link
          href="/settings"
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
