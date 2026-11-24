// ---------------------------------------------------------------------------
// Dexie database — local-first IndexedDB schema
// ---------------------------------------------------------------------------

import Dexie, { type EntityTable } from "dexie";

// ---- Table interfaces (match the Zod schemas in @orchestrator/shared) ----

export interface ConversationRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider?: "chatgpt" | "claude" | "gemini";
  createdAt: string;
  parentId?: string;
}

export interface HandoffRecord {
  id: string;
  conversationId: string;
  sourceProvider?: "chatgpt" | "claude" | "gemini";
  destinationProvider: "chatgpt" | "claude" | "gemini";
  status: "pending" | "context_sent" | "waiting_response" | "completed" | "failed";
  selectedMessageIds: string[];
  contextPayload?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SettingsRecord {
  id: "app-settings";
  theme: "light" | "dark" | "system";
  encryptionEnabled: boolean;
  encryptionSalt?: string;
  encryptionKdfParams?: Record<string, unknown>;
}

// ---- Database class ----

export class OrchestratorDB extends Dexie {
  conversations!: EntityTable<ConversationRecord, "id">;
  messages!: EntityTable<MessageRecord, "id">;
  handoffs!: EntityTable<HandoffRecord, "id">;
  settings!: EntityTable<SettingsRecord, "id">;

  constructor() {
    super("OrchestratorDB");

    this.version(1).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, createdAt",
      handoffs: "id, conversationId, createdAt",
      settings: "id",
    });
  }
}

export const db = new OrchestratorDB();
