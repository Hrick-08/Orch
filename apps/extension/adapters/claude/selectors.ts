// ---------------------------------------------------------------------------
// Claude DOM selectors
// ---------------------------------------------------------------------------

export const CLAUDE_SELECTORS = {
  /** The main composer contenteditable */
  composer: '[contenteditable="true"].ProseMirror',

  /** Fallback composer selector */
  composerFallback: 'div[enterkeyhint="enter"]',

  /** The send button */
  sendButton: 'button[aria-label="Send Message"]',

  /** Fallback send button */
  sendButtonFallback: 'fieldset button:last-of-type',

  /** All assistant message containers */
  assistantMessages: '[data-is-streaming]',

  /** Completed assistant messages (not streaming) */
  completedMessages: '[data-is-streaming="false"]',

  /** Streaming indicator */
  streamingIndicator: '[data-is-streaming="true"]',

  /** User avatar / login indicator */
  userMenu: 'button[data-testid="user-menu"]',

  /** New chat button */
  newChatButton: 'a[href="/new"]',

  /** Response text blocks */
  responseBlocks: ".font-claude-message",
} as const;
