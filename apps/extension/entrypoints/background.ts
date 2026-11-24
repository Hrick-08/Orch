// ---------------------------------------------------------------------------
// Background Service Worker — Message routing, tab lookup, and health checks
// ---------------------------------------------------------------------------

import { defineBackground } from "wxt/sandbox";
import { browser } from "wxt/browser";
import type { ProviderId } from "../adapters/types";

interface BackgroundMessage {
  type?: string;
  nonce?: string;
  provider?: ProviderId;
  contextPayload?: string;
  conversationId?: string;
  url?: string;
  [key: string]: unknown;
}

interface ProviderResponse {
  success?: boolean;
  result?: {
    connected?: boolean;
    healthy?: boolean;
    loggedIn?: boolean;
    capabilities?: { text: boolean; streaming: boolean; fileUpload: boolean };
  };
  responseText?: string;
  error?: string;
}

const PROVIDER_URL_PATTERNS: Record<ProviderId, string[]> = {
  chatgpt: ["*://chatgpt.com/*", "*://chat.openai.com/*"],
  claude: ["*://claude.ai/*"],
  gemini: ["*://gemini.google.com/*"],
};

const PROVIDER_URLS: Record<ProviderId, string> = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/new",
  gemini: "https://gemini.google.com/app",
};

const PROVIDER_NAMES: Record<ProviderId, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

/** Match a URL against simple wildcard patterns (e.g. *://chatgpt.com/*) */
function urlMatchesPattern(pattern: string, url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (pattern.includes("chatgpt.com") && parsedUrl.hostname.includes("chatgpt.com")) return true;
    if (pattern.includes("chat.openai.com") && parsedUrl.hostname.includes("chat.openai.com")) return true;
    if (pattern.includes("claude.ai") && parsedUrl.hostname.includes("claude.ai")) return true;
    if (pattern.includes("gemini.google.com") && parsedUrl.hostname.includes("gemini.google.com")) return true;
    return false;
  } catch {
    return false;
  }
}

/** Find all browser tabs for a given provider */
async function findProviderTabs(provider: ProviderId) {
  const patterns = PROVIDER_URL_PATTERNS[provider];
  try {
    const tabs = await browser.tabs.query({ url: patterns });
    if (tabs.length > 0) return tabs;
  } catch {
    // If browser.tabs.query with patterns fails, query all tabs and filter manually
  }

  const allTabs = await browser.tabs.query({});
  return allTabs.filter(
    (tab) => tab.url && patterns.some((p) => urlMatchesPattern(p, tab.url!))
  );
}

/** Check health and login status of a provider tab */
async function checkProviderHealth(provider: ProviderId): Promise<{
  connected: boolean;
  healthy: boolean;
  loggedIn?: boolean;
}> {
  const tabs = await findProviderTabs(provider);
  if (tabs.length === 0) {
    return { connected: false, healthy: false, loggedIn: false };
  }

  const tab = tabs[0];
  if (!tab.id) {
    return { connected: false, healthy: false, loggedIn: false };
  }

  try {
    const response = (await browser.tabs.sendMessage(tab.id, {
      type: "PROVIDER_HEALTH_CHECK",
      targetProvider: provider,
    })) as ProviderResponse | undefined;

    if (response?.success && response.result) {
      return {
        connected: true,
        healthy: Boolean(response.result.healthy),
        loggedIn: Boolean(response.result.loggedIn),
      };
    }

    return { connected: true, healthy: false, loggedIn: false };
  } catch {
    // Tab is open, but content script may still be loading or tab is sleeping
    return { connected: true, healthy: false, loggedIn: false };
  }
}

export default defineBackground(() => {
  console.log("[Orchestrator Background] Service worker initialized.");

  browser.runtime.onMessage.addListener(async (message: any) => {
    const msg = message as BackgroundMessage | undefined;
    if (!msg || typeof msg !== "object" || !msg.type) return;

    // --- 1. Health Check Request ---
    if (msg.type === "HEALTH_CHECK") {
      try {
        const [chatgpt, claude, gemini] = await Promise.all([
          checkProviderHealth("chatgpt"),
          checkProviderHealth("claude"),
          checkProviderHealth("gemini"),
        ]);

        return {
          type: "HEALTH_CHECK_RESPONSE",
          nonce: msg.nonce ?? "",
          providers: {
            chatgpt: { connected: chatgpt.connected, healthy: chatgpt.healthy },
            claude: { connected: claude.connected, healthy: claude.healthy },
            gemini: { connected: gemini.connected, healthy: gemini.healthy },
          },
        };
      } catch (err) {
        return {
          type: "HEALTH_CHECK_RESPONSE",
          nonce: msg.nonce ?? "",
          providers: {
            chatgpt: { connected: false, healthy: false },
            claude: { connected: false, healthy: false },
            gemini: { connected: false, healthy: false },
          },
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    // --- 2. Handoff Request ---
    if (msg.type === "HANDOFF_REQUEST") {
      const provider = msg.provider as ProviderId;
      const providerName = PROVIDER_NAMES[provider] ?? provider;

      try {
        const tabs = await findProviderTabs(provider);
        if (tabs.length === 0) {
          return {
            type: "HANDOFF_RESPONSE",
            nonce: msg.nonce ?? "",
            success: false,
            provider,
            error: `No open ${providerName} tab found. Please open ${providerName} in a tab, ensure you are logged in, and try again.`,
          };
        }

        const tab = tabs[0];
        if (!tab.id) {
          return {
            type: "HANDOFF_RESPONSE",
            nonce: msg.nonce ?? "",
            success: false,
            provider,
            error: `Could not access ${providerName} tab.`,
          };
        }

        const res = (await browser.tabs.sendMessage(tab.id, {
          type: "SEND_PROMPT",
          targetProvider: provider,
          text: msg.contextPayload,
        })) as ProviderResponse | undefined;

        if (res?.success && res.responseText) {
          return {
            type: "HANDOFF_RESPONSE",
            nonce: msg.nonce ?? "",
            success: true,
            provider,
            responseText: res.responseText,
          };
        }

        return {
          type: "HANDOFF_RESPONSE",
          nonce: msg.nonce ?? "",
          success: false,
          provider,
          error: res?.error || `Failed to receive response from ${providerName}.`,
        };
      } catch (err) {
        return {
          type: "HANDOFF_RESPONSE",
          nonce: msg.nonce ?? "",
          success: false,
          provider,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    // --- 3. Popup / Internal: Get Detailed Provider Status ---
    if (msg.type === "GET_ALL_PROVIDER_STATUS") {
      try {
        const [chatgpt, claude, gemini] = await Promise.all([
          checkProviderHealth("chatgpt"),
          checkProviderHealth("claude"),
          checkProviderHealth("gemini"),
        ]);

        return {
          chatgpt: { ...chatgpt, name: PROVIDER_NAMES.chatgpt, url: PROVIDER_URLS.chatgpt },
          claude: { ...claude, name: PROVIDER_NAMES.claude, url: PROVIDER_URLS.claude },
          gemini: { ...gemini, name: PROVIDER_NAMES.gemini, url: PROVIDER_URLS.gemini },
        };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    }

    // --- 4. Popup / Internal: Open Provider or App Tab ---
    if (msg.type === "OPEN_TAB") {
      const url = msg.url;
      if (url) {
        const tab = await browser.tabs.create({ url });
        return { success: true, tabId: tab.id };
      }
    }

    return;
  });
});
