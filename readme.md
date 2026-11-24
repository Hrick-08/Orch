<div align="center">

```text
 ╔═╗╦═╗╔═╗╦ ╦╔═╗╔═╗╔╦╗╦═╗╔═╗╔╦╗╔═╗╦═╗
 ║ ║╠╦╝║  ╠═╣║╣ ╚═╗ ║ ╠╦╝╠═╣ ║ ║ ║╠╦╝
 ╚═╝╩╚═╚═╝╩ ╩╚═╝╚═╝ ╩ ╩╚═╩ ╩ ╩ ╚═╝╩╚═
   multi-model ai conversation handoff
```

**one conversation. every assistant. your history never leaves your device.**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-MV3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB-orange?style=flat-square)
![Local First](https://img.shields.io/badge/Local--First-no_server_history-success?style=flat-square)

</div>

---

## Overview

A web app for continuing a conversation across ChatGPT, Claude, Gemini, and other AI assistants, without relying on official model APIs.

The product is a unified conversation workspace with a companion browser extension. The web app displays and stores the conversation history **locally on the user's device**; the extension bridges the app to the user's already-authenticated AI provider tabs.

> **Important:** A standalone website cannot directly access or control another website's logged-in session. A browser extension is required for the no-API approach. Provider interfaces and terms can change, so feasibility and commercial permission must be validated before launch.

## Product vision

Users start a conversation with one assistant and hand it off to another at any point, while seeing one continuous conversation in a single interface.

1.  A user discusses a codebase with ChatGPT.
2.  They select **Continue with Claude**.
3.  The system transfers the relevant context through the user's browser.
4.  Claude responds on its official website.
5.  The response is added to the unified history, stored on the user's device.

Provider-side threads remain separate. The orchestrator maintains the unified history and transfers context between providers.

## Goals

-   Unified conversation history across multiple AI providers.
-   User-controlled handoff between models at any point.
-   Use users' existing provider accounts and browser sessions.
-   Avoid official model API calls and per-token costs.
-   **Local-first: conversation content lives only on the user's device.**
-   Keep provider credentials and session cookies out of any backend.

## Non-goals for the initial version

-   Reimplementing or hosting the underlying AI models.
-   Bypassing authentication, paywalls, rate limits, or anti-bot controls.
-   Storing provider passwords or session cookies anywhere.
-   Server-side storage, syncing, or analysis of conversation content.
-   Guaranteeing that every provider interface will remain automatable.
-   Autonomous model routing before reliable manual handoff works.

## Local-first data policy

This is a core product rule, not a setting.

-   **The server never receives conversation content.** No messages, titles, summaries, or context payloads are sent to or stored on any backend.
-   **Storage is on-device.** History is stored in the web app's IndexedDB (via Dexie). The extension is stateless: it relays messages and holds nothing beyond transient in-memory state.
-   **No accounts required for core use.** If accounts or licensing are added later, the account record holds identity and billing data only, never conversation data.
-   **No message bodies in logs or telemetry.** Diagnostics are limited to error codes, adapter versions, and provider status flags.
-   **No third-party scripts** on the app origin; strict Content Security Policy.
-   **Optional encryption at rest.** The user can set a passphrase; messages are encrypted in IndexedDB with the Web Crypto API (AES-GCM, key derived with PBKDF2/Argon2). Without the passphrase the data is unreadable.
-   **User-owned export/import.** Full-history export to a JSON file (optionally encrypted), plus import, so users can back up or move devices without any server.
-   **Deletion is real.** Deleting a conversation removes it from IndexedDB. A "wipe all data" action clears the database and any extension state.

What local-first does **not** mean (state this plainly in the UI):

-   ChatGPT, Claude, and Gemini keep their own copies of every prompt sent to them. The orchestrator cannot delete those.
-   Browser storage can be cleared by the browser or the user. Request persistent storage (`navigator.storage.persist()`) and nudge users toward periodic exports.
-   History does not sync across devices in the MVP. Cross-device sync, if ever added, must be end-to-end encrypted so the server only holds ciphertext.

## Proposed architecture

```text
┌─────────────────────────────────────────┐
│     Web app (static / PWA-capable)      │
│ Unified chat · Model selector · History │
│   IndexedDB: all conversation data      │
└──────────────────┬──────────────────────┘
                   │ local messaging only
                   │ (no server in this path)
┌──────────────────▼──────────────────────┐
│        Companion browser extension      │
│ Provider adapters · Context transfer    │
│ Stateless relay · User-session tabs     │
└──────────┬───────────┬──────────────────┘
           │           │
      ChatGPT tab   Claude tab   Gemini tab
```

### Web app

Owns the interface, model selector, and the local conversation store. It can be served as static assets, so there is no backend that could see user data. It talks to the extension directly in the browser.

### Browser extension

Runs where provider sessions already exist. It reads permitted conversation content, transfers context, submits user-authorized prompts, and returns responses to the web app. It does not persist conversation content.

### Web app ↔ extension channel

-   Use `externally_connectable` (or a content script on the app origin with `window.postMessage`) so messages never touch a server.
-   Allowlist the exact app origin; reject all others.
-   Validate message schemas on both sides and include a per-session nonce to prevent spoofing by other pages.
-   Require explicit user confirmation in the UI before any prompt is submitted to a provider.

### Provider adapters

One adapter per provider, because page structure, composer controls, and response rendering differ. Adapters are isolated and versioned so one provider's UI change does not break the others. Each adapter exposes capability flags (text, streaming detection, file support) and a health check.

### Context manager

Converts provider messages into a normalized format, selects relevant context, and handles context-length limits. Truncation or summarization is user-approved and previewed; important context is never silently dropped. All of this runs client-side.

## Core user flow

1.  User installs the companion extension and grants the required browser permissions.
2.  User opens and signs in to the provider websites themselves.
3.  User starts or imports a conversation in the web app (stored locally).
4.  User selects a provider for the next turn.
5.  The web app sends a handoff request to the extension.
6.  The extension shows or receives the user-approved context, transfers it to the chosen provider tab, and submits the prompt.
7.  The extension detects response completion and returns the text to the web app.
8.  The web app stores the message locally with provider attribution.

The UI must clearly report when a provider is unavailable, the user is logged out, a transfer fails, or a response cannot be retrieved. Never show a handoff as successful until the provider response is confirmed.

## MVP scope

### Required

-   Next.js web app (static export) with a unified conversation interface.
-   Local persistence in IndexedDB; no backend storing conversation data.
-   Create, rename, search, delete, and view conversations.
-   Message history with role and provider attribution.
-   Provider selector for ChatGPT, Claude, and Gemini.
-   Chrome extension (Manifest V3) with provider-specific adapters.
-   Explicit **Continue with [provider]** handoff action.
-   Context preview/editing before transfer.
-   JSON export/import and a "wipe all data" control.
-   Clear connection and error states, with manual copy/paste fallback.

### Defer until after the MVP

-   Optional passphrase encryption at rest (move into MVP if time allows).
-   End-to-end encrypted cross-device sync.
-   Automatic model selection and autonomous routing.
-   Parallel responses from multiple providers.
-   Team workspaces and shared conversations.
-   Additional AI websites and Firefox/Safari support.
-   Mobile app and remote browser automation.
-   Paid plans, usage limits, and enterprise controls.

## Suggested technology stack

| Layer | Suggested technology |
| --- | --- |
| Web frontend | Next.js + React (static export) |
| Local storage | IndexedDB via Dexie |
| Encryption (optional) | Web Crypto API (AES-GCM) |
| Extension | TypeScript, Chrome Extension Manifest V3 |
| Extension ↔ app channel | `externally_connectable` / `postMessage` |
| Auth (later, if needed) | Auth.js; identity/billing only |
| Testing | Playwright (adapter tests), Vitest (unit) |

No database or backend is needed for conversation data. Add a minimal service only if accounts, licensing, or billing require one, and keep it blind to message content.

## Local data model

Stored in IndexedDB object stores:

-   **Conversation**: id, title, createdAt, updatedAt, metadata.
-   **Message**: id, conversationId, role, content, provider, createdAt, optional parent/source reference.
-   **Handoff**: id, source provider, destination provider, status, selected message ids, error details.
-   **ProviderStatus**: non-secret connection state and capability flags. Never passwords or cookies.
-   **Settings**: preferences, encryption metadata (salt, KDF params; never the key).

Example normalized message:

```json
{
  "role": "assistant",
  "provider": "chatgpt",
  "content": "The response text...",
  "createdAt": "2026-01-01T12:00:00Z"
}
```

Support text first. Images, files, tool calls, and citations need explicit serialization and transfer rules before being promised.

## Security and privacy

-   Do not collect provider passwords or session cookies.
-   Keep all provider interaction inside the user's browser.
-   Request the narrowest practical extension permissions (host permissions only for supported providers).
-   Tell users exactly what is read, stored, and transferred, and that provider sites retain their own copies.
-   Protect the extension channel against spoofing (origin allowlist, nonce, schema validation).
-   Strict CSP, no remote code, no third-party analytics.
-   Avoid logging message bodies; redact sensitive data in diagnostics.
-   Never bypass provider access controls or anti-automation protections.

## Reliability and provider compatibility

The no-API model depends on provider websites and their policies. A provider may change its DOM, composer, response rendering, login flow, or automation restrictions.

Plan for:

-   Adapter health checks and compatibility tests.
-   Graceful failures and manual copy/paste fallback.
-   Provider-specific capability flags.
-   Context-size checks before handoff.
-   User-visible confirmation of the exact content being transferred.
-   Local-only error reporting that never includes conversation data.

## Commercial and policy considerations

Technical feasibility does not establish permission for commercial automation. Before offering a paid service, review each provider's current terms, acceptable-use rules, and automation policies. A paid subscription to a provider does not necessarily authorize third-party automated access.

A safer promise is **conversation context transfer through the user's browser**, not guaranteed access to provider models. Provider changes may require maintenance or temporarily disable a connector. The local-first design also helps with privacy compliance, since the service holds no user conversation data.

## Development roadmap

### Phase 1: validate the interaction

-   Build a simple web conversation view backed by IndexedDB.
-   Implement manual context export/import.
-   Prove a user-authorized handoff between two providers.
-   Confirm it works with no API access, no stored credentials, and no server-side history.

### Phase 2: extension MVP

-   Build the extension shell and local messaging with the web app.
-   Implement one provider adapter at a time.
-   Add explicit handoff, context preview, and error handling.
-   Test with real sessions and different conversation lengths.

### Phase 3: unified history

-   Persist normalized messages locally with provider attribution.
-   Add search, rename, deletion, export/import, and wipe.
-   Add context selection and length handling.
-   Add optional passphrase encryption.

### Phase 4: SaaS readiness

-   Review provider terms and commercial constraints.
-   Add a privacy-preserving licensing/billing path (no conversation data).
-   Consider E2E-encrypted sync if users need multi-device history.
-   Validate reliability across supported browser versions.

## Main risks

| Risk | Mitigation |
| --- | --- |
| Provider UI changes break automation | Isolated adapters, compatibility tests, manual fallback |
| Provider policies restrict automation | Review terms before launch; avoid bypassing controls |
| Long context exceeds target model limits | Context preview, selection, transparent summarization |
| Local data lost (cleared browser data, device loss) | Persistent storage request, export/backup prompts |
| Local data exposed on a shared device | Optional passphrase encryption, wipe control |
| Malicious page talks to the extension | Origin allowlist, nonce, schema validation |
| Provider response cannot be reliably captured | Explicit status, retry/manual fallback, no false success |
| Users expect one native provider thread | Explain that unified history is local and provider threads remain separate |

## Definition of MVP success

A user can:

1.  Open the web app and view a unified conversation stored on their device.
2.  Choose a supported provider for the next turn.
3.  Review and approve the context being transferred.
4.  Complete a handoff using their existing browser session, without an official API.
5.  See the response attributed to the correct provider.
6.  Verify (via network inspector) that no conversation content is sent to our servers.
7.  Recover cleanly from a disconnected session or failed transfer.

## Current product decisions

-   Product format: web app plus companion browser extension.
-   Initial providers: ChatGPT, Claude, and Gemini.
-   Access model: user's existing logged-in browser sessions; no official model API.
-   Core feature: user-initiated cross-provider handoff.
-   **Storage: local-only (IndexedDB) on the user's device; no server-side conversation storage.**
-   Architecture: web app owns local history; extension is a stateless browser bridge.
-   Recommended MVP: manual/explicit handoff first; automatic routing later.
