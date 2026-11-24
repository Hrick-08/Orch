// ---------------------------------------------------------------------------
// ChatGPT adapter — interacts with the ChatGPT web UI
// ---------------------------------------------------------------------------

import type {
  ProviderAdapter,
  AdapterHealthResult,
  SendPromptResult,
} from "../types";
import { CHATGPT_SELECTORS as S } from "./selectors";
import { waitForElement, waitUntilGone, sleep, extractErrorMessage } from "../../lib/dom";

export class ChatGPTAdapter implements ProviderAdapter {
  readonly id = "chatgpt" as const;
  readonly name = "ChatGPT";

  async healthCheck(): Promise<AdapterHealthResult> {
    const composer =
      document.querySelector(S.composer) ??
      document.querySelector("div#prompt-textarea") ??
      document.querySelector('div[contenteditable="true"][role="textbox"]') ??
      document.querySelector('textarea[data-id="root"]') ??
      document.querySelector("form textarea") ??
      document.querySelector('div[contenteditable="true"]');

    const hasLoginButton = !!(
      document.querySelector('a[href*="/login"]') ||
      document.querySelector('a[href*="/auth/login"]') ||
      document.querySelector('button[data-testid="login-button"]') ||
      document.querySelector('a[data-testid="login-button"]')
    );

    const hasProfileOrHistory = !!(
      document.querySelector(S.userMenu) ||
      document.querySelector('button[aria-label*="Profile"]') ||
      document.querySelector('button[aria-label*="User"]') ||
      document.querySelector('button[aria-label*="Account"]') ||
      document.querySelector('[data-testid*="user-menu"]') ||
      document.querySelector('nav a[href="/"]') ||
      document.querySelector('button[data-testid="new-chat-button"]') ||
      document.querySelector("nav")
    );

    const composerReady = !!composer;
    const loggedIn = (!hasLoginButton && composerReady) || hasProfileOrHistory;

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
    }
  }

  async sendPrompt(text: string): Promise<SendPromptResult> {
    try {
      // 1. Wait for the composer to be available (checking multiple selectors)
      const composer: HTMLElement | null =
        (await waitForElement<HTMLElement>(S.composer, 5000)) ??
        document.querySelector<HTMLElement>("div#prompt-textarea") ??
        document.querySelector<HTMLElement>('div[contenteditable="true"][role="textbox"]') ??
        document.querySelector<HTMLElement>('textarea[data-id="root"]') ??
        document.querySelector<HTMLElement>("form textarea") ??
        document.querySelector<HTMLElement>('div[contenteditable="true"]');

      if (!composer) {
        return {
          success: false,
          error: "ChatGPT input composer not found. Ensure ChatGPT tab is active and ready.",
        };
      }

      // 2. Focus and set the text
      composer.focus();
      if (composer.tagName === "TEXTAREA") {
        (composer as HTMLTextAreaElement).value = text;
        composer.dispatchEvent(new Event("input", { bubbles: true }));
        composer.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // ProseMirror contenteditable
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

      // 3. Find and click the send button
      let sendBtn: HTMLButtonElement | null = null;
      for (let i = 0; i < 20; i++) {
        sendBtn =
          document.querySelector<HTMLButtonElement>(S.sendButton) ??
          document.querySelector<HTMLButtonElement>(S.sendButtonFallback) ??
          document.querySelector<HTMLButtonElement>('button[data-testid="send-button"]') ??
          document.querySelector<HTMLButtonElement>('button[data-testid="fruitjuice-send-button"]') ??
          document.querySelector<HTMLButtonElement>('button[aria-label="Send prompt"]') ??
          document.querySelector<HTMLButtonElement>('button[aria-label="Send message"]') ??
          document.querySelector<HTMLButtonElement>('form button[aria-label*="Send"]') ??
          document.querySelector<HTMLButtonElement>('button[data-testid*="send"]') ??
          document.querySelector<HTMLButtonElement>('form button[type="submit"]');

        if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute("aria-disabled") !== "true") {
          break;
        }
        await sleep(150);
      }

      if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute("aria-disabled") !== "true") {
        sendBtn.click();
      } else {
        // Fallback: Dispatch Enter key
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

      // 4. Wait for streaming to start
      let isStreaming = false;
      for (let i = 0; i < 25; i++) {
        const stopBtn =
          document.querySelector('button[aria-label*="Stop"]') ??
          document.querySelector('button[data-testid*="stop"]') ??
          document.querySelector(".result-streaming");
        if (stopBtn) {
          isStreaming = true;
          break;
        }
        await sleep(200);
      }

      // If streaming started, wait until stop button disappears
      if (isStreaming) {
        for (let i = 0; i < 600; i++) {
          const stopBtn =
            document.querySelector('button[aria-label*="Stop"]') ??
            document.querySelector('button[data-testid*="stop"]') ??
            document.querySelector(".result-streaming");
          if (!stopBtn) break;
          await sleep(200);
        }
      } else {
        await sleep(4000);
      }

      await sleep(1000);

      // 5. Read the last assistant message
      const responseText = await this.readLastMessage();
      if (!responseText) {
        return {
          success: false,
          error: "Could not read response from ChatGPT. Check the tab to see if a verification challenge appeared.",
        };
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
    const assistantNodes = document.querySelectorAll(
      '[data-message-author-role="assistant"], [data-testid*="conversation-turn-assistant"], .agent-turn'
    );
    if (assistantNodes.length > 0) {
      const last = assistantNodes[assistantNodes.length - 1];
      const markdown = last.querySelector(".markdown") ?? last;
      return markdown.textContent?.trim() ?? null;
    }

    const allMarkdown = document.querySelectorAll("div.markdown, div.prose");
    if (allMarkdown.length > 0) {
      return allMarkdown[allMarkdown.length - 1].textContent?.trim() ?? null;
    }

    return null;
  }
}
