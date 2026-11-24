// ---------------------------------------------------------------------------
// Claude Content Script
// ---------------------------------------------------------------------------

import { defineContentScript } from "wxt/sandbox";
import { ClaudeAdapter } from "../adapters/claude/adapter";
import { registerProviderAdapter } from "../lib/provider-runner";

export default defineContentScript({
  matches: ["*://claude.ai/*"],
  runAt: "document_idle",
  main() {
    const adapter = new ClaudeAdapter();
    registerProviderAdapter(adapter);
  },
});
