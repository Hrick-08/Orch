// ---------------------------------------------------------------------------
// Zustand store — ephemeral UI state (not persisted to IndexedDB)
// ---------------------------------------------------------------------------

import { create } from "zustand";

interface UIState {
  /** Currently active conversation id */
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;

  /** Sidebar collapsed state */
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  /** Handoff modal / panel visibility */
  handoffPanelOpen: boolean;
  setHandoffPanelOpen: (open: boolean) => void;

  /** Selected provider for the next handoff */
  selectedProvider: "chatgpt" | "claude" | "gemini" | null;
  setSelectedProvider: (provider: "chatgpt" | "claude" | "gemini" | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  handoffPanelOpen: false,
  setHandoffPanelOpen: (open) => set({ handoffPanelOpen: open }),

  selectedProvider: null,
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
}));
