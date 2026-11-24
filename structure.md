orchestrator/
├── apps/
│   ├── web/                          # Next.js app (static export)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                  # landing / redirect to /chat
│   │   │   │   ├── chat/
│   │   │   │   │   ├── page.tsx              # conversation list + empty state
│   │   │   │   │   └── view/page.tsx         # open conversation via ?id=
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx              # export/import, wipe, encryption, extension status
│   │   │   ├── components/
│   │   │   │   ├── chat/                     # MessageList, Message, Composer, ProviderBadge
│   │   │   │   ├── handoff/                  # ProviderSelector, ContextPreview, HandoffStatus
│   │   │   │   ├── layout/                   # Sidebar, Header
│   │   │   │   └── ui/                       # shadcn components
│   │   │   ├── lib/
│   │   │   │   ├── db/
│   │   │   │   │   ├── schema.ts             # Dexie tables
│   │   │   │   │   ├── conversations.ts      # CRUD helpers
│   │   │   │   │   ├── messages.ts
│   │   │   │   │   └── export-import.ts
│   │   │   │   ├── crypto/                   # passphrase, AES-GCM wrappers
│   │   │   │   ├── extension/
│   │   │   │   │   ├── bridge.ts             # postMessage client to extension
│   │   │   │   │   └── use-extension.ts      # hook: connected? providers ready?
│   │   │   │   ├── context/
│   │   │   │   │   ├── build-context.ts      # select + format messages for handoff
│   │   │   │   │   └── token-estimate.ts
│   │   │   │   └── utils.ts
│   │   │   ├── hooks/                        # useConversations, useHandoff (Dexie live queries)
│   │   │   └── stores/                       # Zustand (UI state only, not persisted data)
│   │   ├── public/
│   │   ├── next.config.ts                    # output: 'export'
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── extension/                    # WXT (MV3)
│       ├── entrypoints/
│       │   ├── background.ts                 # message router, tab lookup, health checks
│       │   ├── app-bridge.content.ts         # injected on your app's origin, relays postMessage
│       │   ├── chatgpt.content.ts            # provider content scripts
│       │   ├── claude.content.ts
│       │   ├── gemini.content.ts
│       │   └── popup/                        # status popup (connected providers)
│       ├── adapters/
│       │   ├── types.ts                      # ProviderAdapter interface
│       │   ├── chatgpt/
│       │   │   ├── adapter.ts                # sendPrompt, waitForResponse, readLastMessage
│       │   │   └── selectors.ts              # all DOM selectors in one file
│       │   ├── claude/
│       │   └── gemini/
│       ├── lib/
│       │   ├── dom.ts                        # waitForElement, MutationObserver helpers
│       │   └── origin-guard.ts               # origin allowlist + nonce check
│       ├── tests/
│       │   ├── fixtures/                     # saved HTML of each provider page
│       │   └── adapters.spec.ts              # Playwright with extension loaded
│       ├── wxt.config.ts
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── schemas.ts                    # Zod: Message, Handoff, bridge protocol
│       │   ├── protocol.ts                   # message types between app <-> extension
│       │   ├── providers.ts                  # provider ids, names, capability flags
│       │   └── index.ts
│       └── package.json
│
├── docs/                             # architecture notes, adapter guide, privacy policy
├── .github/workflows/                # CI, extension build/zip
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md