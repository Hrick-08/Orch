// ---------------------------------------------------------------------------
// /settings — export, import, wipe, encryption status, extension check
// ---------------------------------------------------------------------------

"use client";

import { useState, useRef, Suspense } from "react";
import {
  Download,
  Upload,
  Trash2,
  Shield,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { exportAll, importAll, wipeAllData } from "@/lib/db/export-import";
import type { ExportPayload } from "@/lib/db/export-import";
import { useExtension } from "@/lib/extension/use-extension";
import { downloadJson, readJsonFile } from "@/lib/utils";

function SettingsContent() {
  const { status, checking, recheckNow } = useExtension();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importResult, setImportResult] = useState<string>();
  const [confirmWipe, setConfirmWipe] = useState(false);

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

    // Reset the input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Wipe ---
  const handleWipe = async () => {
    await wipeAllData();
    setConfirmWipe(false);
    setImportResult("All data wiped.");
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

      {/* Extension status */}
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Browser Extension
        </h2>
        <div className="flex items-center justify-between">
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
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {status === "connected"
                ? "Connected"
                : status === "disconnected"
                ? "Not detected"
                : "Checking…"}
            </span>
          </div>
          <button
            onClick={recheckNow}
            disabled={checking}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`}
            />
            Recheck
          </button>
        </div>
        {status !== "connected" && (
          <p className="mt-2 text-xs text-zinc-400">
            Install the Orchestrator companion extension and reload this page.
            The extension enables automatic handoffs between AI providers.
            Without it, you can still use manual copy/paste.
          </p>
        )}
      </section>

      {/* Export / Import */}
      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Data
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
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
              onClick={handleWipe}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Yes, wipe everything
            </button>
            <button
              onClick={() => setConfirmWipe(false)}
              className="rounded-lg px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
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
