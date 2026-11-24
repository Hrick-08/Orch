// ---------------------------------------------------------------------------
// Claude adapter — interacts with the Claude web UI
// ---------------------------------------------------------------------------

import type {
  ProviderAdapter,
  AdapterHealthResult,
  SendPromptResult,
} from "../types";
import { CLAUDE_SELECTORS as S } from "./selectors";
import { waitForElement, waitUntilGone, sleep } from "../../lib/dom";

export class ClaudeAdapter implements ProviderAdapter {
  readonly id = "claude" as const;
  readonly name = "Claude";

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
    const btn = document.querySelector<HTMLAnchorElement>(S.newChatButton);
    if (btn) {
      btn.click();
      await sleep(1000);
    } else {
      // Fallback: navigate directly
      window.location.href = "https://claude.ai/new";
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

      // 2. Set text in contenteditable
      composer.focus();
      composer.innerHTML = `<p>${text}</p>`;
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

      // 4. Wait for streaming to complete
      await sleep(2000);
      await waitUntilGone(S.streamingIndicator, 120_000);
      await sleep(1000);

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
    // Get all completed assistant messages
    const messages = document.querySelectorAll(S.completedMessages);
    if (messages.length === 0) {
      // Fallback to response blocks
      const blocks = document.querySelectorAll(S.responseBlocks);
      if (blocks.length === 0) return null;
      return blocks[blocks.length - 1].textContent?.trim() ?? null;
    }

    const last = messages[messages.length - 1];
    return last.textContent?.trim() ?? null;
  }
}
