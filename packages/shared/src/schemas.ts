// ---------------------------------------------------------------------------
// Zod schemas — single source of truth for the data model
// ---------------------------------------------------------------------------

import { z } from "zod";
import { PROVIDER_IDS } from "./providers";

// --- Provider ID enum ---
export const ProviderIdSchema = z.enum(PROVIDER_IDS);

// --- Message ---
export const MessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  provider: ProviderIdSchema.optional(),
  createdAt: z.string().datetime(),
  /** Optional reference to the parent message for branching */
  parentId: z.string().uuid().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// --- Conversation ---
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// --- Handoff ---
export const HandoffStatusSchema = z.enum([
  "pending",
  "context_sent",
  "waiting_response",
  "completed",
  "failed",
]);

export const HandoffSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  sourceProvider: ProviderIdSchema.optional(),
  destinationProvider: ProviderIdSchema,
  status: HandoffStatusSchema,
  selectedMessageIds: z.array(z.string().uuid()),
  contextPayload: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type Handoff = z.infer<typeof HandoffSchema>;

// --- Settings ---
export const SettingsSchema = z.object({
  id: z.literal("app-settings"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  encryptionEnabled: z.boolean().default(false),
  encryptionSalt: z.string().optional(),
  encryptionKdfParams: z.record(z.unknown()).optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

// --- Provider status (non-secret) ---
export const ProviderStatusSchema = z.object({
  providerId: ProviderIdSchema,
  connected: z.boolean(),
  healthy: z.boolean(),
  lastChecked: z.string().datetime().optional(),
  capabilities: z.object({
    text: z.boolean(),
    streaming: z.boolean(),
    fileUpload: z.boolean(),
  }),
});

export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;
