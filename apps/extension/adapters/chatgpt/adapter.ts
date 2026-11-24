// ---------------------------------------------------------------------------
// ChatGPT adapter — interacts with the ChatGPT web UI
// ---------------------------------------------------------------------------

import type {
  ProviderAdapter,
  AdapterHealthResult,
  SendPromptResult,
} from "../types";
import { CHATGPT_SELECTORS as S } from "./selectors";
import { waitForElement, waitUntilGone, sleep } from "../../lib/dom";

export class ChatGPTAdapter implements ProviderAdapter {
  readonly id = "chatgpt" as const;
  readonly name = "ChatGPT";

  async healthCheck(): Promise<AdapterHealthResult> {
    const loggedIn = !!document.querySelector(S.userMenu);
    const composerReady = !!document.querySelector(S.composer);

    return {
      connected: true,
      healthy: composerReady,
      loggedIn,
      capabilities: { text: true, streaming: true, fileUpload: false },
    };
  }

  async navigateToNewChat(): Promise<void> {
    const btn = document.querySelector<HTMLAnchorElement>(S.newChatButton);
    if (btn) {
      btn.click();
      await sleep(1000);
    }
  }

  async sendPrompt(text: string): Promise<SendPromptResult> {
    try {
      // 1. Wait for the composer to be available
      const composer = await waitForElement<HTMLElement>(S.composer, 5000);
      if (!composer) {
        return { success: false, error: "Composer not found" };
      }

      // 2. Focus and set the text
      composer.focus();
      // Use the ProseMirror-compatible approach: set innerHTML for contenteditable
      if (composer.tagName === "TEXTAREA") {
        (composer as HTMLTextAreaElement).value = text;
        composer.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        // contenteditable div (ProseMirror)
        composer.innerHTML = `<p>${text}</p>`;
        composer.dispatchEvent(new Event("input", { bubbles: true }));
      }

      await sleep(300);

      // 3. Click the send button
      const sendBtn =
        document.querySelector<HTMLButtonElement>(S.sendButton) ??
        document.querySelector<HTMLButtonElement>(S.sendButtonFallback);

      if (!sendBtn) {
        return { success: false, error: "Send button not found" };
      }

      sendBtn.click();

      // 4. Wait for streaming to start, then finish
      await sleep(2000);
      await waitUntilGone(S.streamingIndicator, 120_000);
      await sleep(1000);

      // 5. Read the last assistant message
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
    const messages = document.querySelectorAll(S.assistantMessages);
    if (messages.length === 0) return null;

    const last = messages[messages.length - 1];
    return last.textContent?.trim() ?? null;
  }
}
