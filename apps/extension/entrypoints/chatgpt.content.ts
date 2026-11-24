// ---------------------------------------------------------------------------
// ChatGPT Content Script
// ---------------------------------------------------------------------------

import { defineContentScript } from "wxt/sandbox";
import { ChatGPTAdapter } from "../adapters/chatgpt/adapter";
import { registerProviderAdapter } from "../lib/provider-runner";

export default defineContentScript({
  matches: ["*://chatgpt.com/*", "*://chat.openai.com/*"],
  runAt: "document_idle",
  main() {
    const adapter = new ChatGPTAdapter();
    registerProviderAdapter(adapter);
  },
});
