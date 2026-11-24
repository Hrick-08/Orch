// ---------------------------------------------------------------------------
// ProviderAdapter interface — each provider adapter must implement this
// ---------------------------------------------------------------------------

export type ProviderId = "chatgpt" | "claude" | "gemini";

export interface ProviderCapabilities {
  text: boolean;
  streaming: boolean;
  fileUpload: boolean;
}

export interface AdapterHealthResult {
  connected: boolean;
  healthy: boolean;
  loggedIn: boolean;
  capabilities: ProviderCapabilities;
}

export interface SendPromptResult {
  success: boolean;
  responseText?: string;
  error?: string;
}

/**
 * Every provider adapter exposes the same interface.
 * Adapters are injected as content scripts on their provider's origin.
 */
export interface ProviderAdapter {
  /** Provider identifier */
  readonly id: ProviderId;

  /** Human-readable name */
  readonly name: string;

  /** Check if the provider page is usable */
  healthCheck(): Promise<AdapterHealthResult>;

  /** Navigate to a new conversation page (if not already there) */
  navigateToNewChat(): Promise<void>;

  /**
   * Send a prompt to the provider's composer and submit it.
   * Returns the assistant's response text once generation completes.
   */
  sendPrompt(text: string): Promise<SendPromptResult>;

  /** Read the last assistant message on the page */
  readLastMessage(): Promise<string | null>;
}
