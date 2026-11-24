// ---------------------------------------------------------------------------
// /chat/view?id=<uuid> — open conversation view
// ---------------------------------------------------------------------------

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useConversation } from "@/hooks/use-conversations";
import { useMessages } from "@/hooks/use-messages";
import { useUIStore } from "@/stores/ui-store";
import { addMessage } from "@/lib/db/messages";
import { updateConversation } from "@/lib/db/conversations";
import { buildContext } from "@/lib/context/build-context";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { ProviderSelector } from "@/components/handoff/ProviderSelector";
import { ContextPreview } from "@/components/handoff/ContextPreview";
import { HandoffStatus } from "@/components/handoff/HandoffStatus";
import { sendToExtension } from "@/lib/extension/bridge";
import { Pencil, Check, X } from "lucide-react";

function ConversationView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const conversation = useConversation(id);
  const messages = useMessages(id);
  const setActive = useUIStore((s) => s.setActiveConversation);
  const selectedProvider = useUIStore((s) => s.selectedProvider);
  const setSelectedProvider = useUIStore((s) => s.setSelectedProvider);

  // Title editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // Handoff state
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [contextPayload, setContextPayload] = useState("");
  const [handoffStatus, setHandoffStatus] = useState<
    "idle" | "pending" | "context_sent" | "waiting_response" | "completed" | "failed"
  >("idle");
  const [handoffError, setHandoffError] = useState<string>();

  useEffect(() => {
    if (id) setActive(id);
  }, [id, setActive]);

  // --- Send a user message (local only — adds to IndexedDB) ---
  const handleSend = useCallback(
    async (content: string) => {
      if (!id) return;
      await addMessage(id, "user", content);

      // Auto-title on first message
      if (messages.length === 0) {
        const title =
          content.length > 50 ? content.slice(0, 50) + "…" : content;
        await updateConversation(id, { title });
      }
    },
    [id, messages.length]
  );

  // --- Handoff flow ---
  const handleInitiateHandoff = useCallback(() => {
    if (!selectedProvider || !messages.length) return;
    const payload = buildContext(messages);
    setContextPayload(payload);
    setShowContextPreview(true);
  }, [selectedProvider, messages]);

  const handleConfirmHandoff = useCallback(async () => {
    if (!id || !selectedProvider) return;

    setShowContextPreview(false);
    setHandoffStatus("pending");
    setHandoffError(undefined);

    try {
      setHandoffStatus("context_sent");

      const response = await sendToExtension<{
        type: string;
        success: boolean;
        responseText?: string;
        error?: string;
      }>({
        type: "HANDOFF_REQUEST",
        provider: selectedProvider,
        contextPayload,
        conversationId: id,
      });

      if (response.success && response.responseText) {
        setHandoffStatus("completed");
        await addMessage(id, "assistant", response.responseText, selectedProvider);
      } else {
        setHandoffStatus("failed");
        setHandoffError(response.error ?? "Unknown error");
      }
    } catch (err) {
      setHandoffStatus("failed");
      setHandoffError(
        err instanceof Error ? err.message : "Extension not available"
      );
    }

    // Reset after a few seconds
    setTimeout(() => {
      setHandoffStatus("idle");
      setHandoffError(undefined);
    }, 5000);
  }, [id, selectedProvider, contextPayload]);

  // --- Title editing ---
  const startEditTitle = () => {
    setTitleDraft(conversation?.title ?? "");
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    if (id && titleDraft.trim()) {
      await updateConversation(id, { title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  if (!id || !conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400">
        Conversation not found
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Conversation title bar */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
        {editingTitle ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              className="rounded border border-zinc-300 bg-transparent px-2 py-0.5 text-sm font-medium outline-none dark:border-zinc-600"
            />
            <button onClick={saveTitle} className="text-emerald-500">
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditingTitle(false)}
              className="text-zinc-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={startEditTitle}
            className="group flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {conversation.title}
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
          </button>
        )}
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Context preview overlay */}
      {showContextPreview && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-700">
          <ContextPreview
            contextPayload={contextPayload}
            onEdit={setContextPayload}
            onConfirm={handleConfirmHandoff}
            onCancel={() => setShowContextPreview(false)}
          />
        </div>
      )}

      {/* Handoff bar */}
      <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <ProviderSelector
            selected={selectedProvider}
            onSelect={setSelectedProvider}
          />
          <div className="flex items-center gap-3">
            <HandoffStatus
              status={handoffStatus}
              provider={selectedProvider ?? undefined}
              error={handoffError}
            />
            {selectedProvider && messages.length > 0 && handoffStatus === "idle" && (
              <button
                onClick={handleInitiateHandoff}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Continue with{" "}
                {selectedProvider === "chatgpt"
                  ? "ChatGPT"
                  : selectedProvider === "claude"
                  ? "Claude"
                  : "Gemini"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <Composer onSend={handleSend} />
    </div>
  );
}

export default function ConversationViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-zinc-400">
          Loading…
        </div>
      }
    >
      <ConversationView />
    </Suspense>
  );
}
