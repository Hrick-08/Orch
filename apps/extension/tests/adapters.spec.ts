// ---------------------------------------------------------------------------
// Adapters & Extension Unit / Integration Tests
// ---------------------------------------------------------------------------

import { isAllowedOrigin, isValidNonce } from "../lib/origin-guard";
import { ChatGPTAdapter } from "../adapters/chatgpt/adapter";
import { ClaudeAdapter } from "../adapters/claude/adapter";
import { GeminiAdapter } from "../adapters/gemini/adapter";

describe("Origin Guard", () => {
  test("allows authorized origins", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://localhost:5173")).toBe(true);
    expect(isAllowedOrigin("https://orchestrator.app")).toBe(true);
  });

  test("rejects unauthorized origins", () => {
    expect(isAllowedOrigin("https://evil.com")).toBe(false);
    expect(isAllowedOrigin("http://fake-orchestrator.app")).toBe(false);
    expect(isAllowedOrigin("")).toBe(false);
  });

  test("validates nonces", () => {
    expect(isValidNonce("some-uuid-string")).toBe(true);
    expect(isValidNonce("")).toBe(false);
    expect(isValidNonce(null)).toBe(false);
    expect(isValidNonce(undefined)).toBe(false);
  });
});

describe("ChatGPT Adapter DOM handling", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-testid="profile-button">Profile</div>
      <div id="prompt-textarea" contenteditable="true"></div>
      <button data-testid="send-button">Send</button>
      <div data-message-author-role="assistant">Hello from ChatGPT</div>
    `;
  });

  test("identifies healthy state and reads last message", async () => {
    const adapter = new ChatGPTAdapter();
    const health = await adapter.healthCheck();
    expect(health.connected).toBe(true);
    expect(health.healthy).toBe(true);
    expect(health.loggedIn).toBe(true);

    const lastMsg = await adapter.readLastMessage();
    expect(lastMsg).toBe("Hello from ChatGPT");
  });
});

describe("Claude Adapter DOM handling", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-testid="user-menu">Profile</button>
      <div contenteditable="true" class="ProseMirror"></div>
      <button aria-label="Send Message">Send</button>
      <div class="font-claude-message" data-is-streaming="false">Hello from Claude</div>
    `;
  });

  test("identifies healthy state and reads last message", async () => {
    const adapter = new ClaudeAdapter();
    const health = await adapter.healthCheck();
    expect(health.connected).toBe(true);
    expect(health.healthy).toBe(true);
    expect(health.loggedIn).toBe(true);

    const lastMsg = await adapter.readLastMessage();
    expect(lastMsg).toBe("Hello from Claude");
  });
});

describe("Gemini Adapter DOM handling", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <img aria-label="Google Account" src="" />
      <div class="ql-editor" contenteditable="true"></div>
      <button aria-label="Send message">Send</button>
      <model-response><div class="markdown">Hello from Gemini</div></model-response>
    `;
  });

  test("identifies healthy state and reads last message", async () => {
    const adapter = new GeminiAdapter();
    const health = await adapter.healthCheck();
    expect(health.connected).toBe(true);
    expect(health.healthy).toBe(true);
    expect(health.loggedIn).toBe(true);

    const lastMsg = await adapter.readLastMessage();
    expect(lastMsg).toBe("Hello from Gemini");
  });
});
