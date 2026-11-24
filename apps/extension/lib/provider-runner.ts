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
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender: unknown, sendResponse: (response: unknown) => void) => {
      const msg = message as ProviderMessage | undefined;
      if (!msg || typeof msg !== "object") {
        return false;
      }

      // If message specifies targetProvider, ensure it matches this adapter
      if (msg.targetProvider && msg.targetProvider !== adapter.id) {
        return false;
      }

      switch (msg.type) {
        case "PROVIDER_HEALTH_CHECK": {
          adapter
            .healthCheck()
            .then((result) => sendResponse({ success: true, result }))
            .catch((err) =>
              sendResponse({
                success: false,
                error: err instanceof Error ? err.message : String(err),
                result: {
                  connected: true,
                  healthy: false,
                  loggedIn: false,
                  capabilities: { text: true, streaming: false, fileUpload: false },
                },
              })
            );
          return true; // Keep channel open for async response
        }

        case "SEND_PROMPT": {
          if (!msg.text) {
            sendResponse({ success: false, error: "Prompt text is empty" });
            return false;
          }

          adapter
            .sendPrompt(msg.text)
            .then((result) => sendResponse(result))
            .catch((err) =>
              sendResponse({
                success: false,
                error: err instanceof Error ? err.message : String(err),
              })
            );
          return true;
        }

        case "READ_LAST_MESSAGE": {
          adapter
            .readLastMessage()
            .then((text) => sendResponse({ success: true, responseText: text }))
            .catch((err) =>
              sendResponse({
                success: false,
                error: err instanceof Error ? err.message : String(err),
              })
            );
          return true;
        }

        case "NAVIGATE_NEW_CHAT": {
          adapter
            .navigateToNewChat()
            .then(() => sendResponse({ success: true }))
            .catch((err) =>
              sendResponse({
                success: false,
                error: err instanceof Error ? err.message : String(err),
              })
            );
          return true;
        }

        default:
          return false;
      }
    }
  );

  console.log(`[Orchestrator Adapter] ${adapter.name} adapter registered.`);
}
