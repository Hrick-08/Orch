// ---------------------------------------------------------------------------
// Gemini adapter — interacts with the Gemini web UI
// ---------------------------------------------------------------------------

import type {
  ProviderAdapter,
  AdapterHealthResult,
  SendPromptResult,
} from "../types";
import { GEMINI_SELECTORS as S } from "./selectors";
import { waitForElement, waitUntilGone, sleep } from "../../lib/dom";

export class GeminiAdapter implements ProviderAdapter {
  readonly id = "gemini" as const;
  readonly name = "Gemini";

  async healthCheck(): Promise<AdapterHealthResult> {
    const composer =
      document.querySelector(S.composer) ??
      document.querySelector(S.composerFallback);
    const loggedIn = !!document.querySelector(S.userMenu);

    return {
      connected: true,
      healthy: !!composer,
      loggedIn,
      capabilities: { text: true, streaming: true, fileUpload: false },
    };
  }

  async navigateToNewChat(): Promise<void> {
    const btn = document.querySelector<HTMLElement>(S.newChatButton);
    if (btn) {
      btn.click();
      await sleep(1000);
    } else {
      window.location.href = "https://gemini.google.com/app";
      await sleep(2000);
    }
  }

  async sendPrompt(text: string): Promise<SendPromptResult> {
    try {
      // 1. Wait for composer
      const composer = await waitForElement<HTMLElement>(
        S.composer,
        5000,
        S.composerFallback
      );
      if (!composer) {
        return { success: false, error: "Composer not found" };
      }

      // 2. Set text
      composer.focus();
      if (composer.tagName === "TEXTAREA") {
        (composer as HTMLTextAreaElement).value = text;
      } else {
        composer.innerHTML = `<p>${text}</p>`;
      }
      composer.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(300);

      // 3. Click send
      const sendBtn =
        document.querySelector<HTMLButtonElement>(S.sendButton) ??
        document.querySelector<HTMLButtonElement>(S.sendButtonFallback);

      if (!sendBtn) {
        return { success: false, error: "Send button not found" };
      }

      sendBtn.click();

      // 4. Wait for response
      await sleep(3000);
      await waitUntilGone(S.streamingIndicator, 120_000);
      await sleep(1500);

      // 5. Read response
      const responseText = await this.readLastMessage();
      if (!responseText) {
        return { success: false, error: "Could not read response" };
      }

      return { success: true, responseText };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async readLastMessage(): Promise<string | null> {
    const responses = document.querySelectorAll(S.responseText);
    if (responses.length === 0) {
      // Fallback: try response containers directly
      const containers = document.querySelectorAll(S.responseContainers);
      if (containers.length === 0) return null;
      return containers[containers.length - 1].textContent?.trim() ?? null;
    }

    return responses[responses.length - 1].textContent?.trim() ?? null;
  }
}
