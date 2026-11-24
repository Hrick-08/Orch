import { defineConfig } from "wxt";
import path from "node:path";

export default defineConfig({
  srcDir: ".",
  vite: () => ({
    resolve: {
      alias: {
        "@orchestrator/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      },
    },
  }),
  manifest: {
    name: "Orchestrator — AI Conversation Handoff",
    description:
      "Companion extension for Orchestrator. Bridges your AI provider sessions for seamless cross-model conversations.",
    version: "0.1.0",
    permissions: ["activeTab", "tabs", "scripting"],
    host_permissions: [
      "https://chatgpt.com/*",
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
    ],
    externally_connectable: {
      matches: [
        "http://localhost:3000/*",
        "http://localhost:3001/*",
        "http://127.0.0.1:3000/*",
        "http://localhost:5173/*",
        "https://orchestrator.app/*",
      ],
    },
  },
});
