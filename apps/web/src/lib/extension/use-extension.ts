// ---------------------------------------------------------------------------
// useExtension hook — tracks extension connection status
// ---------------------------------------------------------------------------

"use client";

import { useEffect, useState } from "react";
import {
  initBridge,
  destroyBridge,
  checkExtension,
  getExtensionStatus,
  type ExtensionStatus,
} from "./bridge";

export function useExtension() {
  const [status, setStatus] = useState<ExtensionStatus>("unknown");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    initBridge();

    const check = async () => {
      setChecking(true);
      await checkExtension();
      setStatus(getExtensionStatus());
      setChecking(false);
    };

    check();

    // Re-check periodically
    const interval = setInterval(check, 30_000);

    return () => {
      clearInterval(interval);
      destroyBridge();
    };
  }, []);

  const recheckNow = async () => {
    setChecking(true);
    await checkExtension();
    setStatus(getExtensionStatus());
    setChecking(false);
  };

  return { status, checking, recheckNow };
}
