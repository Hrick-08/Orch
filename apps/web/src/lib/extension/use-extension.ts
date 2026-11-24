// ---------------------------------------------------------------------------
// useExtension hook — tracks extension connection status & provider health
// ---------------------------------------------------------------------------

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  initBridge,
  destroyBridge,
  checkExtension,
  getExtensionStatus,
  getProviderHealth,
  openProviderTab,
  type ExtensionStatus,
  type ProviderHealthMap,
} from "./bridge";

export function useExtension() {
  const [status, setStatus] = useState<ExtensionStatus>("unknown");
  const [checking, setChecking] = useState(false);
  const [providers, setProviders] = useState<ProviderHealthMap | null>(null);

  const recheckNow = useCallback(async () => {
    setChecking(true);
    const provs = await checkExtension();
    setStatus(getExtensionStatus());
    setProviders(provs ?? getProviderHealth());
    setChecking(false);
  }, []);

  useEffect(() => {
    initBridge();

    const check = async () => {
      setChecking(true);
      const provs = await checkExtension();
      setStatus(getExtensionStatus());
      setProviders(provs ?? getProviderHealth());
      setChecking(false);
    };

    check();

    // Re-check periodically
    const interval = setInterval(check, 15_000);

    return () => {
      clearInterval(interval);
      destroyBridge();
    };
  }, []);

  const openProvider = useCallback(async (url: string) => {
    const success = await openProviderTab(url);
    // After opening, recheck shortly to see if tab/session is recognized
    setTimeout(() => {
      recheckNow();
    }, 2500);
    return success;
  }, [recheckNow]);

  return {
    status,
    checking,
    providers,
    recheckNow,
    openProvider,
  };
}
