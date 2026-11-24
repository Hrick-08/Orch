// ---------------------------------------------------------------------------
// ProviderBadge — small colored pill showing which AI provider sent a message
// ---------------------------------------------------------------------------

"use client";

const PROVIDER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  chatgpt: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "ChatGPT" },
  claude: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", label: "Claude" },
  gemini: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", label: "Gemini" },
};

interface ProviderBadgeProps {
  provider?: string;
  className?: string;
}

export function ProviderBadge({ provider, className = "" }: ProviderBadgeProps) {
  if (!provider) return null;

  const style = PROVIDER_COLORS[provider] ?? {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    label: provider,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${className}`}
    >
      {style.label}
    </span>
  );
}
