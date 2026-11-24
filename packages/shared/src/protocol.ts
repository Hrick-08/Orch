// ---------------------------------------------------------------------------
// Message protocol between the web app and the companion browser extension
// ---------------------------------------------------------------------------

import { z } from "zod";
import { ProviderIdSchema } from "./schemas";

// --- App → Extension messages ---

export const HandoffRequestSchema = z.object({
  type: z.literal("HANDOFF_REQUEST"),
  nonce: z.string(),
  provider: ProviderIdSchema,
  contextPayload: z.string(),
  conversationId: z.string().uuid(),
});

export const HealthCheckRequestSchema = z.object({
  type: z.literal("HEALTH_CHECK"),
  nonce: z.string(),
});

export const AppToExtensionSchema = z.discriminatedUnion("type", [
  HandoffRequestSchema,
  HealthCheckRequestSchema,
]);

export type AppToExtensionMessage = z.infer<typeof AppToExtensionSchema>;

// --- Extension → App messages ---

export const HandoffResponseSchema = z.object({
  type: z.literal("HANDOFF_RESPONSE"),
  nonce: z.string(),
  success: z.boolean(),
  responseText: z.string().optional(),
  provider: ProviderIdSchema,
  error: z.string().optional(),
});

export const HealthCheckResponseSchema = z.object({
  type: z.literal("HEALTH_CHECK_RESPONSE"),
  nonce: z.string(),
  providers: z.record(
    ProviderIdSchema,
    z.object({ connected: z.boolean(), healthy: z.boolean() })
  ),
});

export const ExtensionToAppSchema = z.discriminatedUnion("type", [
  HandoffResponseSchema,
  HealthCheckResponseSchema,
]);

export type ExtensionToAppMessage = z.infer<typeof ExtensionToAppSchema>;
