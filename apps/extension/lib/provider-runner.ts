// ---------------------------------------------------------------------------
// Provider Runner — Shared message handling for provider content scripts
// ---------------------------------------------------------------------------

import { browser } from "wxt/browser";
import type { ProviderAdapter } from "../adapters/types";

export interface ProviderMessage {
  type: string;
  targetProvider?: string;
  text?: string;
  nonce?: string;
}

/**
 * Attaches standard background message handlers to a provider adapter
 */
export function registerProviderAdapter(adapter: ProviderAdapter): void {
  browser.runtime.onMessage.addListener(async (message: any) => {
    if (!message || typeof message !== "object") return;

    // If message specifies targetProvider, ensure it matches this adapter
    if (message.targetProvider && message.targetProvider !== adapter.id) {
      return;
    }

    switch (message.type) {
      case "PROVIDER_HEALTH_CHECK": {
        try {
          const result = await adapter.healthCheck();
          return { success: true, result };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
            result: {
              connected: true,
              healthy: false,
              loggedIn: false,
              capabilities: { text: true, streaming: false, fileUpload: false },
            },
          };
        }
      }

      case "SEND_PROMPT": {
        if (!message.text) {
          return { success: false, error: "Prompt text is empty" };
        }
        try {
          return await adapter.sendPrompt(message.text);
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      case "READ_LAST_MESSAGE": {
        try {
          const text = await adapter.readLastMessage();
          return { success: true, responseText: text };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      case "NAVIGATE_NEW_CHAT": {
        try {
          await adapter.navigateToNewChat();
          return { success: true };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      default:
        return;
    }
  });

  console.log(`[Orchestrator Adapter] ${adapter.name} adapter registered.`);
}
