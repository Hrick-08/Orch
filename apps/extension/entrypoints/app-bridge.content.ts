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
    "http://localhost:3001/*",
    "http://127.0.0.1:3000/*",
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
      } catch {
        // silent
      }
    };

    // Announce immediately and when DOM is loaded
    announcePresence();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", announcePresence, { once: true });
    }
    window.addEventListener("load", announcePresence, { once: true });

    // Listen for messages from the web app
    const messageHandler = async (event: MessageEvent) => {
      // Check if extension context is still alive
      try {
        if (!browser?.runtime?.id) {
          window.removeEventListener("message", messageHandler);
          window.postMessage(
            { type: "EXTENSION_CONTEXT_INVALIDATED", source: "orchestrator-extension" },
            window.location.origin
          );
          return;
        }
      } catch {
        window.removeEventListener("message", messageHandler);
        return;
      }

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
        data.type === "EXTENSION_CONTEXT_INVALIDATED" ||
        data.type === "HANDOFF_RESPONSE" ||
        data.type === "HEALTH_CHECK_RESPONSE" ||
        data.type === "OPEN_TAB_RESPONSE" ||
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
      if (
        data.type !== "HEALTH_CHECK" &&
        data.type !== "HANDOFF_REQUEST" &&
        data.type !== "OPEN_TAB"
      ) {
        return;
      }

      if (!isValidNonce(data.nonce)) {
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
        const errorMsg =
          err instanceof Error ? err.message : "Failed to communicate with extension background";

        const isInvalidated = errorMsg.includes("Extension context invalidated");
        if (isInvalidated) {
          // Extension was reloaded or updated; detach cleanly without logging console.error
          window.removeEventListener("message", messageHandler);
          window.postMessage(
            { type: "EXTENSION_CONTEXT_INVALIDATED", source: "orchestrator-extension" },
            window.location.origin
          );
        }

        // Return error response back to web app so promises don't hang
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
                chatgpt: { connected: false, healthy: false, loggedIn: false },
                claude: { connected: false, healthy: false, loggedIn: false },
                gemini: { connected: false, healthy: false, loggedIn: false },
              },
            },
            window.location.origin
          );
        } else if (data.type === "OPEN_TAB") {
          window.postMessage(
            {
              type: "OPEN_TAB_RESPONSE",
              nonce: data.nonce,
              success: false,
              error: errorMsg,
            },
            window.location.origin
          );
        }
      }
    };

    window.addEventListener("message", messageHandler);

    console.log("[Orchestrator Bridge] Injected & active on", window.location.origin);
  },
});
