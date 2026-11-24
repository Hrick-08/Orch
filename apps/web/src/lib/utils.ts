// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

import { type ClassValue, clsx } from "clsx";

/** Merge Tailwind classes safely (using clsx — no tailwind-merge for now) */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format an ISO date string as a friendly relative/absolute time */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/** Download a JSON blob as a file */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read a JSON file from a File input */
export function readJsonFile<T = unknown>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string) as T);
      } catch (err) {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
