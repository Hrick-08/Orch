// ---------------------------------------------------------------------------
// Provider definitions — shared between the web app and the browser extension
// ---------------------------------------------------------------------------

export const PROVIDER_IDS = ["chatgpt", "claude", "gemini"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  url: string;
  color: string;
  /** What the adapter can currently do */
  capabilities: {
    text: boolean;
    streaming: boolean;
    fileUpload: boolean;
  };
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com",
    color: "#10A37F",
    capabilities: { text: true, streaming: true, fileUpload: false },
  },
  claude: {
    id: "claude",
    name: "Claude",
    url: "https://claude.ai",
    color: "#D97706",
    capabilities: { text: true, streaming: true, fileUpload: false },
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    url: "https://gemini.google.com",
    color: "#4285F4",
    capabilities: { text: true, streaming: true, fileUpload: false },
  },
};

export function getProvider(id: ProviderId): ProviderMeta {
  return PROVIDERS[id];
}
