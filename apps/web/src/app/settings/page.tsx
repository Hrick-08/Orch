// ---------------------------------------------------------------------------
// /settings — export, import, wipe, encryption status, AI accounts & extension
// ---------------------------------------------------------------------------

"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import {
  Download,
  Upload,
  Trash2,
  Shield,
  ArrowLeft,
  RefreshCw,
  Bot,
  Sparkles,
  Brain,
  ExternalLink,
  Check,
  User,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { exportAll, importAll, wipeAllData } from "@/lib/db/export-import";
import type { ExportPayload } from "@/lib/db/export-import";
import { useExtension } from "@/lib/extension/use-extension";
import { downloadJson, readJsonFile } from "@/lib/utils";

interface ProviderAccountConfig {
  id: "chatgpt" | "claude" | "gemini";
  name: string;
  providerOrg: string;
  loginUrl: string;
  chatUrl: string;
  icon: React.ReactNode;
  brandBorder: string;
  brandBg: string;
  iconBg: string;
  loginTip: string;
}

const PROVIDER_CONFIGS: ProviderAccountConfig[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    providerOrg: "OpenAI",
    loginUrl: "https://chatgpt.com/auth/login",
    chatUrl: "https://chatgpt.com/",
    icon: <Bot className="h-5 w-5" />,
    brandBorder: "border-emerald-500/20 dark:border-emerald-500/30",
    brandBg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    loginTip: "Sign in with your OpenAI, Google, Apple, or Microsoft account on chatgpt.com",
  },
  {
    id: "claude",
    name: "Claude",
    providerOrg: "Anthropic",
    loginUrl: "https://claude.ai/login",
    chatUrl: "https://claude.ai/new",
    icon: <Sparkles className="h-5 w-5" />,
    brandBorder: "border-amber-500/20 dark:border-amber-500/30",
    brandBg: "bg-amber-50/40 dark:bg-amber-950/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    loginTip: "Sign in with your Anthropic or Google account on claude.ai",
  },
  {
    id: "gemini",
    name: "Gemini",
    providerOrg: "Google",
    loginUrl: "https://gemini.google.com/app",
    chatUrl: "https://gemini.google.com/app",
    icon: <Brain className="h-5 w-5" />,
    brandBorder: "border-blue-500/20 dark:border-blue-500/30",
    brandBg: "bg-blue-50/40 dark:bg-blue-950/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    loginTip: "Sign in with your Google Workspace or personal Google account on gemini.google.com",
  },
];

function SettingsContent() {
  const { status, checking, providers, recheckNow, openProvider } = useExtension();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importResult, setImportResult] = useState<string>();
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [accountIds, setAccountIds] = useState<Record<string, string>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("orchestrator_provider_accounts");
      if (raw) {
        setAccountIds(JSON.parse(raw));
      }
    } catch {}
  }, []);

  const handleSaveAccountId = (provider: string, value: string) => {
    const updated = { ...accountIds, [provider]: value.trim() };
    setAccountIds(updated);
    try {
      localStorage.setItem("orchestrator_provider_accounts", JSON.stringify(updated));
      setSavedNotice(provider);
      setTimeout(() => setSavedNotice(null), 2000);
    } catch {}
  };

  const handleConnectTab = async (providerId: string) => {
    setConnectingProvider(providerId);
    await recheckNow();
    setTimeout(() => setConnectingProvider(null), 1000);
  };

  // --- Export ---
  const handleExport = async () => {
    const data = await exportAll();
    const filename = `orchestrator-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJson(data, filename);
  };

  // --- Import ---
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const payload = await readJsonFile<ExportPayload>(file);

      if (payload.version !== 1) {
        setImportResult("Unsupported export version.");
        return;
      }

      const result = await importAll(payload);
      setImportResult(
        `Imported ${result.conversationsImported} conversations and ${result.messagesImported} messages.`
      );
    } catch {
      setImportResult("Failed to import — invalid file.");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Wipe ---
  const handleWipe = async () => {
    await wipeAllData();
    setConfirmWipe(false);
    setImportResult("All data wiped.");
  };

  const getProviderStatusBadge = (providerId: "chatgpt" | "claude" | "gemini") => {
    if (status !== "connected") {
      return {
        statusText: "Extension needed",
        badgeClass: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
        dotClass: "bg-zinc-400",
        description: "Install or reload the companion extension in chrome://extensions.",
        isReady: false,
        isOpen: false,
      };
    }

    const p = providers?.[providerId];
    if (!p || !p.connected) {
      return {
        statusText: "No tab open",
        badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        dotClass: "bg-zinc-400",
        description: "Open the site in your browser and sign in to connect.",
        isReady: false,
        isOpen: false,
      };
    }

    if (p.healthy) {
      return {
        statusText: "Connected & Ready",
        badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        dotClass: "bg-emerald-500",
        description: "Active session linked. Ready for conversation handoffs.",
        isReady: true,
        isOpen: true,
      };
    }

    if (p.loggedIn) {
      return {
        statusText: "Logged in (Loading)",
        badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        dotClass: "bg-amber-500",
        description: "Session detected. Waiting for chat composer to be ready.",
        isReady: false,
        isOpen: true,
      };
    }

    return {
      statusText: "Tab open (Needs sign-in)",
      badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      dotClass: "bg-orange-500",
      description: "Tab is open. Complete sign-in on their site to connect.",
      isReady: false,
      isOpen: true,
    };
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-6">
      {/* Back */}
      <Link
        href="/chat"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to chat
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Settings
      </h1>

      {/* Instructions Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
        <p className="font-semibold text-blue-950 dark:text-blue-200">
          How to connect your ChatGPT, Claude, and Gemini accounts:
        </p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-blue-800 dark:text-blue-300">
          <li>
            Click <strong>Open Sign-in Page</strong> below to navigate to the official login screen in your browser.
          </li>
          <li>Sign into your account (Google, Apple, Microsoft, or email).</li>
          <li>
            Keep the tab open in your browser, then click <strong>Connect Tab</strong>.
          </li>
          <li>
            The companion extension automatically links the session to Orchestrator—no API keys required!
          </li>
        </ol>
        <p className="mt-2.5 text-[11px] text-blue-700/80 dark:text-blue-400/80">
          * Note: If you recently reloaded the extension in <code className="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900/60">chrome://extensions</code>, please reload your open ChatGPT/Claude tabs once so the extension can attach.
        </p>
      </div>

      {/* AI Accounts / Web Logins */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Connected AI Accounts
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Link your web sessions for cross-model conversations and handoffs.
            </p>
          </div>
          <button
            type="button"
            onClick={recheckNow}
            disabled={checking}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${checking ? "animate-spin text-zinc-400" : ""}`}
            />
            {checking ? "Checking…" : "Check sessions"}
          </button>
        </div>

        <div className="grid gap-3">
          {PROVIDER_CONFIGS.map((p) => {
            const badge = getProviderStatusBadge(p.id);
            const userAccountId = accountIds[p.id] || "";
            const isConnecting = connectingProvider === p.id;

            return (
              <div
                key={p.id}
                className={`rounded-xl border ${p.brandBorder} ${p.brandBg} p-4 transition-all`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Icon & Name */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${p.iconBg}`}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          ({p.providerOrg})
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.badgeClass}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`}
                          />
                          {badge.statusText}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {badge.isReady ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openProvider(p.chatUrl)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                          Open Tab
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConnectTab(p.id)}
                          disabled={checking || isConnecting}
                          title="Re-check this session"
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${checking || isConnecting ? "animate-spin" : ""}`}
                          />
                          Recheck
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openProvider(p.loginUrl)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          Open Sign-in Page
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConnectTab(p.id)}
                          disabled={checking || isConnecting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                          <Link2
                            className={`h-3.5 w-3.5 ${isConnecting ? "animate-spin" : ""}`}
                          />
                          {isConnecting ? "Connecting…" : "Connect Tab"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Account identifier row */}
                <div className="mt-3 space-y-2 border-t border-zinc-200/60 pt-3 dark:border-zinc-800/60">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                      <User className="h-3.5 w-3.5 opacity-70" /> Linked ID / Email:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. user@gmail.com"
                      value={userAccountId}
                      onChange={(e) =>
                        setAccountIds((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      onBlur={(e) => handleSaveAccountId(p.id, e.target.value)}
                      className="w-56 rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
                    />
                    {savedNotice === p.id && (
                      <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" /> Saved
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {p.loginTip}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Extension status */}
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Companion Browser Extension
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === "connected"
                  ? "bg-emerald-500"
                  : status === "disconnected"
                  ? "bg-red-400"
                  : "bg-zinc-300"
              }`}
            />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {status === "connected"
                ? "Active & Connected"
                : status === "disconnected"
                ? "Not detected"
                : "Checking…"}
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          The extension securely detects open tabs for ChatGPT, Claude, and Gemini on your machine, enabling automatic prompt handoffs and response retrieval without API costs.
        </p>

        {status !== "connected" && (
          <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              How to install the companion extension:
            </p>
            <ol className="mt-1.5 list-inside list-decimal space-y-1 text-zinc-500 dark:text-zinc-400">
              <li>Open <code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px] dark:bg-zinc-700">chrome://extensions</code> in Chrome, Brave, or Edge.</li>
              <li>Toggle on <span className="font-medium text-zinc-700 dark:text-zinc-300">Developer mode</span> (top-right switch).</li>
              <li>Click <span className="font-medium text-zinc-700 dark:text-zinc-300">Load unpacked</span> and choose: <code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px] dark:bg-zinc-700">apps/extension/.output/chrome-mv3</code></li>
              <li>Reload this page or click <span className="font-medium text-zinc-700 dark:text-zinc-300">Check sessions</span> above.</li>
            </ol>
          </div>
        )}
      </section>

      {/* Export / Import */}
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Data
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <Upload className="h-4 w-4" />
            Import JSON
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>

        {importResult && (
          <p className="mt-3 text-xs text-zinc-500">{importResult}</p>
        )}
      </section>

      {/* Wipe data */}
      <section className="rounded-xl border border-red-200 p-4 dark:border-red-900/50">
        <h2 className="mb-1 text-sm font-semibold text-red-600 dark:text-red-400">
          Danger zone
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Permanently delete all conversations and messages from this device.
          This cannot be undone.
        </p>
        {confirmWipe ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWipe}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Yes, wipe everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmWipe(false)}
              className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmWipe(true)}
            className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Wipe all data
          </button>
        )}
      </section>

      {/* Privacy note */}
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">
              Local-first privacy
            </p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Conversations are stored in this browser&apos;s IndexedDB only.</li>
              <li>No conversation data is ever sent to our servers.</li>
              <li>ChatGPT, Claude, and Gemini keep their own copies of prompts you send.</li>
              <li>Browser storage can be cleared — export regularly for backup.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
