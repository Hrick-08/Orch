// ---------------------------------------------------------------------------
// Gemini adapter — interacts with the Gemini web UI
// ---------------------------------------------------------------------------

import type {
  ProviderAdapter,
  AdapterHealthResult,
  SendPromptResult,
} from "../types";
import { GEMINI_SELECTORS as S } from "./selectors";
import { waitForElement, waitUntilGone, sleep, extractErrorMessage } from "../../lib/dom";

export class GeminiAdapter implements ProviderAdapter {
  readonly id = "gemini" as const;
  readonly name = "Gemini";

  async healthCheck(): Promise<AdapterHealthResult> {
    const composer =
      document.querySelector(S.composer) ??
      document.querySelector(S.composerFallback) ??
      document.querySelector("rich-textarea") ??
      document.querySelector('div[contenteditable="true"]');

    const hasLoginIndicator = !!(
      document.querySelector('a[href*="accounts.google.com"]') ||
      document.querySelector('a[aria-label*="Sign in"]')
    );

    const hasAccount = !!(
      document.querySelector(S.userMenu) ||
      document.querySelector('a[aria-label*="Account"]') ||
      document.querySelector('img[aria-label*="Account"]') ||
      document.querySelector('button[aria-label*="Account"]') ||
      document.querySelector('a[href*="myaccount.google.com"]')
    );

    const composerReady = !!composer;
    const loggedIn = (!hasLoginIndicator && composerReady) || hasAccount;

    return {
      connected: true,
      healthy: composerReady && loggedIn,
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
        composer.dispatchEvent(new Event("input", { bubbles: true }));
        composer.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        const targetP = composer.querySelector("p") || composer;
        try {
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(targetP);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        } catch {}
        const inserted = document.execCommand("insertText", false, text);
        if (!inserted || !composer.textContent?.includes(text.slice(0, 10))) {
          composer.innerHTML = `<p>${text}</p>`;
          composer.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              inputType: "insertText",
              data: text,
            })
          );
        }
      }
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
        return { success: false, error: "Could not read response from Gemini" };
      }

      return { success: true, responseText };
    } catch (err) {
      return {
        success: false,
        error: extractErrorMessage(err),
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
