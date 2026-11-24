// ---------------------------------------------------------------------------
// ContextPreview — shows the user what context will be sent to the provider
// ---------------------------------------------------------------------------

"use client";

import { useState } from "react";
import { estimateTokens } from "@/lib/context/build-context";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface ContextPreviewProps {
  contextPayload: string;
  onEdit: (edited: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ContextPreview({
  contextPayload,
  onEdit,
  onConfirm,
  onCancel,
}: ContextPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const tokenEstimate = estimateTokens(contextPayload);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contextPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Context Preview
          </h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
            ~{tokenEstimate.toLocaleString()} tokens
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            title="Copy context"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <textarea
          className="mb-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
          rows={12}
          value={contextPayload}
          onChange={(e) => onEdit(e.target.value)}
        />
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Confirm & Send
        </button>
      </div>
    </div>
  );
}
