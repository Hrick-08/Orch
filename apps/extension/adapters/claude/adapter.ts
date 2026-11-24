// ---------------------------------------------------------------------------
// Claude adapter — interacts with the Claude web UI
// ---------------------------------------------------------------------------

import type {
  ProviderAdapter,
  AdapterHealthResult,
  SendPromptResult,
} from "../types";
import { CLAUDE_SELECTORS as S } from "./selectors";
import { waitForElement, waitUntilGone, sleep, extractErrorMessage } from "../../lib/dom";

export class ClaudeAdapter implements ProviderAdapter {
  readonly id = "claude" as const;
  readonly name = "Claude";

  async healthCheck(): Promise<AdapterHealthResult> {
    const composer =
      document.querySelector(S.composer) ??
      document.querySelector(S.composerFallback) ??
      document.querySelector('div[contenteditable="true"]') ??
      document.querySelector('fieldset div[contenteditable="true"]');

    const hasLoginIndicator = !!(
      document.querySelector('a[href*="/login"]') ||
      document.querySelector('input[type="email"]') ||
      window.location.pathname.startsWith("/login")
    );

    const hasUserMenu = !!(
      document.querySelector(S.userMenu) ||
      document.querySelector('button[aria-label*="User"]') ||
      document.querySelector('button[aria-label*="Account"]') ||
      document.querySelector('a[href="/new"]') ||
      document.querySelector("nav")
    );

    const composerReady = !!composer;
    const loggedIn = (!hasLoginIndicator && composerReady) || hasUserMenu;

    return {
      connected: true,
      healthy: composerReady && loggedIn,
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
      const composer =
        (await waitForElement<HTMLElement>(S.composer, 5000, S.composerFallback)) ??
        document.querySelector<HTMLElement>('div[contenteditable="true"]');

      if (!composer) {
        return { success: false, error: "Claude composer not found. Ensure Claude tab is open." };
      }

      // 2. Set text in contenteditable
      composer.focus();
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
      await sleep(300);

      // 3. Click send
      let sendBtn: HTMLButtonElement | null = null;
      for (let i = 0; i < 15; i++) {
        sendBtn =
          document.querySelector<HTMLButtonElement>(S.sendButton) ??
          document.querySelector<HTMLButtonElement>(S.sendButtonFallback) ??
          document.querySelector<HTMLButtonElement>('button[aria-label*="Send"]');

        if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute("aria-disabled") !== "true") {
          break;
        }
        await sleep(150);
      }

      if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute("aria-disabled") !== "true") {
        sendBtn.click();
      } else {
        composer.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
        );
      }

      // 4. Wait for streaming to complete
      await sleep(2000);
      await waitUntilGone(S.streamingIndicator, 120_000);
      await sleep(1000);

      // 5. Read response
      const responseText = await this.readLastMessage();
      if (!responseText) {
        return { success: false, error: "Could not read response from Claude" };
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
