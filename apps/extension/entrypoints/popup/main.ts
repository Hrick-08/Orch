// ---------------------------------------------------------------------------
// Popup script — Status display & tab manager
// ---------------------------------------------------------------------------

import { browser } from "wxt/browser";

interface ProviderStatusInfo {
  connected: boolean;
  healthy: boolean;
  loggedIn?: boolean;
  name: string;
  url: string;
}

interface AllProviderStatusResponse {
  chatgpt: ProviderStatusInfo;
  claude: ProviderStatusInfo;
  gemini: ProviderStatusInfo;
  error?: string;
}

async function loadStatus() {
  const overallBadge = document.getElementById("overall-status");
  if (overallBadge) {
    overallBadge.textContent = "Checking...";
    overallBadge.className = "status-pill status-loading";
  }

  try {
    const res: AllProviderStatusResponse = await browser.runtime.sendMessage({
      type: "GET_ALL_PROVIDER_STATUS",
    });

    if (res.error) {
      if (overallBadge) {
        overallBadge.textContent = "Error";
      }
      return;
    }

    let readyCount = 0;

    // Update each provider
    const providers: (keyof AllProviderStatusResponse)[] = [
      "chatgpt",
      "claude",
      "gemini",
    ];

    for (const p of providers) {
      const info = res[p] as ProviderStatusInfo | undefined;
      const stateEl = document.getElementById(`state-${p}`);
      const btn = document.getElementById(`btn-open-${p}`);

      if (info && stateEl) {
        if (info.healthy) {
          stateEl.textContent = "Ready";
          stateEl.className = "provider-state online";
          readyCount++;
          if (btn) {
            btn.textContent = "Switch";
            btn.setAttribute("data-url", info.url || btn.getAttribute("data-url") || "");
          }
        } else if (info.connected) {
          stateEl.textContent = info.loggedIn ? "Composer not ready" : "Needs sign-in";
          stateEl.className = "provider-state";
          if (btn) {
            btn.textContent = info.loggedIn ? "Open" : "Sign in";
            if (!info.loggedIn) {
              if (p === "chatgpt") btn.setAttribute("data-url", "https://chatgpt.com/auth/login");
              if (p === "claude") btn.setAttribute("data-url", "https://claude.ai/login");
            }
          }
        } else {
          stateEl.textContent = "No tab open";
          stateEl.className = "provider-state offline";
          if (btn) {
            btn.textContent = "Open";
          }
        }
      }
    }

    if (overallBadge) {
      if (readyCount > 0) {
        overallBadge.textContent = `${readyCount}/3 Ready`;
        overallBadge.className = "status-pill status-ready";
      } else {
        overallBadge.textContent = "0/3 Ready";
        overallBadge.className = "status-pill status-partial";
      }
    }
  } catch (err) {
    console.error("[Orchestrator Popup] Error checking provider status:", err);
    if (overallBadge) {
      overallBadge.textContent = "Offline";
    }
  }
}

// Bind button clicks
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();

  // Refresh
  document.getElementById("btn-refresh")?.addEventListener("click", () => {
    loadStatus();
  });

  // Open / Switch buttons
  const openButtons = document.querySelectorAll<HTMLButtonElement>(".btn-action");
  openButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = btn.getAttribute("data-url");
      if (url) {
        await browser.runtime.sendMessage({ type: "OPEN_TAB", url });
        window.close();
      }
    });
  });

  // Open web app
  document.getElementById("btn-open-app")?.addEventListener("click", async () => {
    await browser.runtime.sendMessage({
      type: "OPEN_TAB",
      url: "http://localhost:3000",
    });
    window.close();
  });
});
