// ---------------------------------------------------------------------------
// Extension bridge — postMessage client to the companion extension
// ---------------------------------------------------------------------------

const EXTENSION_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

/** Generate a one-time nonce for message correlation */
function nonce(): string {
  return crypto.randomUUID();
}

export type ExtensionStatus = "connected" | "disconnected" | "unknown";
export type ProviderId = "chatgpt" | "claude" | "gemini";

export interface ProviderHealth {
  connected: boolean;
  healthy: boolean;
  loggedIn?: boolean;
}

export type ProviderHealthMap = Record<ProviderId, ProviderHealth>;

type MessageHandler = (event: MessageEvent) => void;

let _handler: MessageHandler | null = null;
let _status: ExtensionStatus = "unknown";
let _providerHealth: ProviderHealthMap | null = null;
const _pendingCallbacks = new Map<
  string,
  { resolve: (data: unknown) => void; reject: (err: Error) => void }
>();

/** Start listening for extension messages */
export function initBridge(): void {
  if (_handler || typeof window === "undefined") return;

  _handler = (event: MessageEvent) => {
    // Only accept messages from our own origin
    if (event.origin !== EXTENSION_ORIGIN) return;
    const data = event.data;
    if (!data || typeof data !== "object" || !data.type) return;

    // Route responses to pending callbacks
    if (data.nonce && _pendingCallbacks.has(data.nonce)) {
      const cb = _pendingCallbacks.get(data.nonce)!;
      _pendingCallbacks.delete(data.nonce);
      cb.resolve(data);
    }

    // Track connection status
    if (data.type === "EXTENSION_HELLO") {
      _status = "connected";
    }

    if (data.type === "EXTENSION_CONTEXT_INVALIDATED") {
      _status = "disconnected";
      _providerHealth = null;
    }
  };

  window.addEventListener("message", _handler);
}

/** Tear down the bridge listener */
export function destroyBridge(): void {
  if (_handler && typeof window !== "undefined") {
    window.removeEventListener("message", _handler);
    _handler = null;
  }
  _status = "unknown";
  _providerHealth = null;
  _pendingCallbacks.clear();
}

/** Send a message to the extension and wait for a correlated response */
export function sendToExtension<T = unknown>(
  message: Record<string, unknown>,
  timeoutMs?: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Bridge not available server-side"));
      return;
    }

    const defaultTimeout = message.type === "HANDOFF_REQUEST" ? 180_000 : 10_000;
    const timeout = timeoutMs ?? defaultTimeout;

    const id = nonce();
    const msg = { ...message, nonce: id };

    const timer = setTimeout(() => {
      _pendingCallbacks.delete(id);
      _status = "disconnected";
      reject(new Error("Extension response timed out"));
    }, timeout);

    _pendingCallbacks.set(id, {
      resolve: (data) => {
        clearTimeout(timer);
        _status = "connected";
        resolve(data as T);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });

    window.postMessage(msg, EXTENSION_ORIGIN);
  });
}

/** Check if the extension is responding and fetch provider statuses */
export async function checkExtension(): Promise<ProviderHealthMap | null> {
  try {
    const res = await sendToExtension<{
      type: string;
      providers?: ProviderHealthMap;
    }>({ type: "HEALTH_CHECK" }, 3_000);
    _status = "connected";
    if (res?.providers) {
      _providerHealth = res.providers;
      return res.providers;
    }
    return _providerHealth;
  } catch {
    _status = "disconnected";
    return null;
  }
}

/** Get the cached provider health map */
export function getProviderHealth(): ProviderHealthMap | null {
  return _providerHealth;
}

/** Open or switch to a provider's tab in browser */
export async function openProviderTab(url: string): Promise<boolean> {
  try {
    if (_status === "connected") {
      const res = await sendToExtension<{ success?: boolean }>({ type: "OPEN_TAB", url }, 3_000);
      if (res?.success) return true;
    }
  } catch {
    // Fall back to window.open
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }
  return false;
}

/** Get the current status */
export function getExtensionStatus(): ExtensionStatus {
  return _status;
}
