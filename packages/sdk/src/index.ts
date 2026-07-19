/**
 * The unified SDK. Game code imports these functions and never learns which
 * network it runs on — every call goes through the bridge that the build
 * (or the dev server's simulator) injects as `window.__ROMU_BRIDGE__`.
 *
 * See ARCHITECTURE.md, "The bridge pattern".
 */

export interface RomuBridge {
  /** Send the user to the app store, the way the current network wants it. */
  cta(): void;
}

declare global {
  interface Window {
    __ROMU_BRIDGE__?: RomuBridge;
  }
}

function bridge(): RomuBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__ROMU_BRIDGE__;
}

/**
 * Call-to-action: sends the user to the app store.
 * Compiled builds route this to the network's own API (e.g. Meta's
 * `FbPlayableAd.onCTAClick()`); the dev server routes it to the simulator.
 */
export function cta(): void {
  const b = bridge();
  if (!b) {
    console.warn(
      "[romu] cta() called but no bridge is present — are you running outside `romu dev` or a Romu build?",
    );
    return;
  }
  b.cta();
}
