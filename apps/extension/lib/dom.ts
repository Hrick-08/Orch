// ---------------------------------------------------------------------------
// DOM utilities for provider adapters
// ---------------------------------------------------------------------------

/**
 * Pause execution for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for an element matching selector (or fallback selector) to appear in the DOM
 */
export function waitForElement<T extends Element = Element>(
  selector: string,
  timeoutMs = 5000,
  fallbackSelector?: string
): Promise<T | null> {
  // Check immediately first
  const immediate =
    document.querySelector<T>(selector) ??
    (fallbackSelector ? document.querySelector<T>(fallbackSelector) : null);
  if (immediate) return Promise.resolve(immediate);

  return new Promise<T | null>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new MutationObserver(() => {
      const match =
        document.querySelector<T>(selector) ??
        (fallbackSelector ? document.querySelector<T>(fallbackSelector) : null);
      if (match) {
        if (timer) clearTimeout(timer);
        observer.disconnect();
        resolve(match);
      }
    });

    const targetNode = document.body || document.documentElement;
    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    timer = setTimeout(() => {
      observer.disconnect();
      const finalCheck =
        document.querySelector<T>(selector) ??
        (fallbackSelector ? document.querySelector<T>(fallbackSelector) : null);
      resolve(finalCheck);
    }, timeoutMs);
  });
}

/**
 * Wait until an element matching the selector disappears from the DOM
 */
export function waitUntilGone(
  selector: string,
  timeoutMs = 120_000
): Promise<boolean> {
  // If already gone, return true immediately
  if (!document.querySelector(selector)) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) {
        if (timer) clearTimeout(timer);
        observer.disconnect();
        resolve(true);
      }
    });

    const targetNode = document.body || document.documentElement;
    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    timer = setTimeout(() => {
      observer.disconnect();
      resolve(!document.querySelector(selector));
    }, timeoutMs);
  });
}

/**
 * Wait for a custom condition to evaluate to true
 */
export function waitForCondition(
  predicate: () => boolean,
  timeoutMs = 10_000,
  pollIntervalMs = 100
): Promise<boolean> {
  if (predicate()) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (predicate()) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, pollIntervalMs);
  });
}
