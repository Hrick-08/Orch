// ---------------------------------------------------------------------------
// ChatGPT DOM selectors — single source of truth, easy to update
// ---------------------------------------------------------------------------

export const CHATGPT_SELECTORS = {
  /** The main composer textarea / contenteditable */
  composer: "#prompt-textarea",

  /** The send button inside the composer area */
  sendButton: 'button[data-testid="send-button"]',

  /** Fallback: any send button near the composer */
  sendButtonFallback: 'form button[aria-label="Send prompt"]',

  /** All assistant message containers */
  assistantMessages: '[data-message-author-role="assistant"]',

  /** The streaming indicator (thinking / generating) */
  streamingIndicator: 'button[aria-label="Stop streaming"]',

  /** User avatar / login indicator */
  userMenu: '[data-testid="profile-button"]',

  /** New chat button */
  newChatButton: 'a[href="/"]',

  /** Navigation sidebar */
  sidebar: "nav",
} as const;
