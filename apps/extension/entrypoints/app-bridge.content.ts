// ---------------------------------------------------------------------------
// App Bridge Content Script — Relays postMessage between web app and extension
// Injected on Orchestrator web app origins
// ---------------------------------------------------------------------------

import { defineContentScript } from "wxt/sandbox";
import { browser } from "wxt/browser";
import { isAllowedOrigin, isValidNonce } from "../lib/origin-guard";

export default defineContentScript({
  matches: [
    "http://localhost:3000/*",
    "http://localhost:5173/*",
    "https://orchestrator.app/*",
  ],
  runAt: "document_start",
  main() {
    const announcePresence = () => {
      try {
        window.postMessage(
          {
            type: "EXTENSION_HELLO",
            version: "0.1.0",
            source: "orchestrator-extension",
          },
          window.location.origin
        );
      } catch (err) {
        console.error("[Orchestrator Bridge] Failed to announce presence:", err);
      }
    };

    // Announce immediately and when DOM is loaded
    announcePresence();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", announcePresence, { once: true });
    }
    window.addEventListener("load", announcePresence, { once: true });

    // Listen for messages from the web app
    window.addEventListener("message", async (event: MessageEvent) => {
      // Security: Only accept messages from allowed origin and same window
      if (!isAllowedOrigin(event.origin) || event.source !== window) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object") {
        return;
      }

      // Ignore our own outgoing messages and internal dev messages
      if (
        data.type === "EXTENSION_HELLO" ||
        data.type === "HANDOFF_RESPONSE" ||
        data.type === "HEALTH_CHECK_RESPONSE" ||
        data.source === "orchestrator-extension" ||
        typeof data.type !== "string"
      ) {
        return;
      }

      // Handle Ping / Hello inquiry from app
      if (data.type === "PING") {
        announcePresence();
        return;
      }

      // Validate allowed request types
      if (data.type !== "HEALTH_CHECK" && data.type !== "HANDOFF_REQUEST") {
        return;
      }

      if (!isValidNonce(data.nonce)) {
        console.warn("[Orchestrator Bridge] Missing or invalid nonce in message:", data);
        return;
      }

      try {
        // Forward message to extension background worker
        const response = await browser.runtime.sendMessage(data);

        // Send response back to the web app
        if (response) {
          window.postMessage(response, window.location.origin);
        }
      } catch (err) {
        console.error("[Orchestrator Bridge] Error relaying message to background:", err);

        // Return error response back to web app so promises don't hang
        const errorMsg =
          err instanceof Error ? err.message : "Failed to communicate with extension background";

        if (data.type === "HANDOFF_REQUEST") {
          window.postMessage(
            {
              type: "HANDOFF_RESPONSE",
              nonce: data.nonce,
              success: false,
              provider: data.provider,
              error: errorMsg,
            },
            window.location.origin
          );
        } else if (data.type === "HEALTH_CHECK") {
          window.postMessage(
            {
              type: "HEALTH_CHECK_RESPONSE",
              nonce: data.nonce,
              providers: {
                chatgpt: { connected: false, healthy: false },
                claude: { connected: false, healthy: false },
                gemini: { connected: false, healthy: false },
              },
            },
            window.location.origin
          );
        }
      }
    });

    console.log("[Orchestrator Bridge] Injected & active on", window.location.origin);
  },
});
