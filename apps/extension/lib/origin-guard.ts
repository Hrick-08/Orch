// ---------------------------------------------------------------------------
// Origin Guard — Origin allowlist and nonce validation
// ---------------------------------------------------------------------------

export const ALLOWED_ORIGINS: readonly string[] = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://orchestrator.app",
] as const;

/**
 * Validate whether the origin is an authorized Orchestrator app origin
 */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;

  // Direct allowlist match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Allow standard localhost and 127.0.0.1 development ports
  const localMatch = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (localMatch) {
    return true;
  }

  return false;
}

/**
 * Validate that a message has a valid non-empty nonce string
 */
export function isValidNonce(nonce: unknown): nonce is string {
  return typeof nonce === "string" && nonce.trim().length > 0;
}
