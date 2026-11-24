// ---------------------------------------------------------------------------
// Gemini DOM selectors
// ---------------------------------------------------------------------------

export const GEMINI_SELECTORS = {
  /** The main composer — rich text editor */
  composer: '.ql-editor[contenteditable="true"]',

  /** Fallback composer (plain textarea) */
  composerFallback: 'rich-textarea .ql-editor, textarea[aria-label*="prompt"]',

  /** The send button */
  sendButton: 'button[aria-label="Send message"]',

  /** Fallback send button */
  sendButtonFallback: ".send-button, button.send",

  /** All response containers */
  responseContainers: "model-response",

  /** Text content inside a response */
  responseText: "model-response .markdown",

  /** Streaming / thinking indicator */
  streamingIndicator: ".loading-indicator, .thinking-indicator",

  /** User avatar / sign-in state */
  userMenu: 'a[aria-label*="Account"], img[aria-label*="Account"]',

  /** New chat button */
  newChatButton: 'a[href="/app"], button[aria-label="New chat"]',
} as const;
