// ---------------------------------------------------------------------------
// Gemini Content Script
// ---------------------------------------------------------------------------

import { defineContentScript } from "wxt/sandbox";
import { GeminiAdapter } from "../adapters/gemini/adapter";
import { registerProviderAdapter } from "../lib/provider-runner";

export default defineContentScript({
  matches: ["*://gemini.google.com/*"],
  runAt: "document_idle",
  main() {
    const adapter = new GeminiAdapter();
    registerProviderAdapter(adapter);
  },
});
