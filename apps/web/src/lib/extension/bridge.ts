// ---------------------------------------------------------------------------
// Extension bridge — postMessage client to the companion extension
// ---------------------------------------------------------------------------

const EXTENSION_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

/** Generate a one-time nonce for message correlation */
function nonce(): string {
  return crypto.randomUUID();
}

export type ExtensionStatus = "connected" | "disconnected" | "unknown";

type MessageHandler = (event: MessageEvent) => void;

let _handler: MessageHandler | null = null;
let _status: ExtensionStatus = "unknown";
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
  _pendingCallbacks.clear();
}

/** Send a message to the extension and wait for a correlated response */
export function sendToExtension<T = unknown>(
  message: Record<string, unknown>,
  timeoutMs = 10_000
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Bridge not available server-side"));
      return;
    }

    const id = nonce();
    const msg = { ...message, nonce: id };

    const timer = setTimeout(() => {
      _pendingCallbacks.delete(id);
      _status = "disconnected";
      reject(new Error("Extension response timed out"));
    }, timeoutMs);

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

/** Check if the extension is responding */
export async function checkExtension(): Promise<boolean> {
  try {
    await sendToExtension({ type: "HEALTH_CHECK" }, 3_000);
    return true;
  } catch {
    _status = "disconnected";
    return false;
  }
}

/** Get the current status */
export function getExtensionStatus(): ExtensionStatus {
  return _status;
}
