// ---------------------------------------------------------------------------
// HandoffStatus — shows the current state of an in-progress handoff
// ---------------------------------------------------------------------------

"use client";

import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

type HandoffState =
  | "idle"
  | "pending"
  | "context_sent"
  | "waiting_response"
  | "completed"
  | "failed";

interface HandoffStatusProps {
  status: HandoffState;
  provider?: string;
  error?: string;
}

const STATUS_CONFIG: Record<
  HandoffState,
  { icon: React.ReactNode; label: string; color: string }
> = {
  idle: {
    icon: <ArrowRight className="h-4 w-4" />,
    label: "Ready to hand off",
    color: "text-zinc-500",
  },
  pending: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Preparing handoff…",
    color: "text-amber-500",
  },
  context_sent: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Context sent, waiting…",
    color: "text-blue-500",
  },
  waiting_response: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Waiting for response…",
    color: "text-blue-500",
  },
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Handoff complete",
    color: "text-emerald-500",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Handoff failed",
    color: "text-red-500",
  },
};

export function HandoffStatus({ status, provider, error }: HandoffStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`flex items-center gap-2 text-sm ${config.color}`}>
      {config.icon}
      <span>
        {config.label}
        {provider && status !== "idle" && ` → ${provider}`}
      </span>
      {error && (
        <span className="ml-2 text-xs text-red-400">({error})</span>
      )}
    </div>
  );
}
