// ---------------------------------------------------------------------------
// ProviderSelector — pick which AI provider to continue the conversation with
// ---------------------------------------------------------------------------

"use client";

import { Bot, Sparkles, Brain } from "lucide-react";
import type { ReactNode } from "react";

type ProviderId = "chatgpt" | "claude" | "gemini";

interface ProviderOption {
  id: ProviderId;
  name: string;
  icon: ReactNode;
  color: string;
  hoverColor: string;
}

const providers: ProviderOption[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: <Bot className="h-5 w-5" />,
    color: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    hoverColor: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
  },
  {
    id: "claude",
    name: "Claude",
    icon: <Sparkles className="h-5 w-5" />,
    color: "border-amber-500/30 text-amber-600 dark:text-amber-400",
    hoverColor: "hover:bg-amber-50 dark:hover:bg-amber-900/20",
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: <Brain className="h-5 w-5" />,
    color: "border-blue-500/30 text-blue-600 dark:text-blue-400",
    hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
  },
];

interface ProviderSelectorProps {
  selected: ProviderId | null;
  onSelect: (provider: ProviderId) => void;
}

export function ProviderSelector({ selected, onSelect }: ProviderSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Continue with:
      </span>
      {providers.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
            p.color
          } ${p.hoverColor} ${
            selected === p.id
              ? "ring-2 ring-offset-1 ring-current bg-white dark:bg-zinc-800 dark:ring-offset-zinc-900"
              : "opacity-70"
          }`}
        >
          {p.icon}
          {p.name}
        </button>
      ))}
    </div>
  );
}
