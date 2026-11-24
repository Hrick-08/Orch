// ---------------------------------------------------------------------------
// Context builder — select & format messages for a handoff payload
// ---------------------------------------------------------------------------

import type { MessageRecord } from "../db/schema";

export interface ContextBuildOptions {
  /** Maximum approximate character count for the payload */
  maxChars?: number;
  /** If provided, only include these message IDs */
  selectedIds?: string[];
}

/**
 * Build a plain-text context payload from a list of messages.
 * Messages are formatted chronologically with role/provider attribution.
 */
export function buildContext(
  messages: MessageRecord[],
  options: ContextBuildOptions = {}
): string {
  const { maxChars = 100_000, selectedIds } = options;

  let filtered = selectedIds
    ? messages.filter((m) => selectedIds.includes(m.id))
    : [...messages];

  // Build formatted lines
  const lines: string[] = [];
  let totalChars = 0;

  for (const msg of filtered) {
    const label = msg.provider
      ? `[${msg.role} via ${msg.provider}]`
      : `[${msg.role}]`;
    const line = `${label}\n${msg.content}\n`;

    if (totalChars + line.length > maxChars) {
      lines.push(
        "\n[... context truncated — older messages omitted to fit within limits ...]\n"
      );
      break;
    }

    lines.push(line);
    totalChars += line.length;
  }

  return lines.join("\n");
}

/**
 * Rough character-count estimate (not actual tokens).
 * ~4 chars ≈ 1 token for English text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
