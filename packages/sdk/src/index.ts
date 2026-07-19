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
  /** Invoke the callback when the ad container says the playable may start. */
  onReady(callback: () => void): void;
  /**
   * Invoke the callback when the container's audio volume changes, with the
   * volume normalized to 0..1. Networks without a volume API never call it.
   */
  onVolumeChange?(callback: (volume: number) => void): void;
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

/**
 * Subscribes to the container's audio volume, normalized to 0..1. Mute your
 * game's audio when it reaches 0 — several networks require it. On networks
 * without a volume API (or without a bridge) the callback simply never fires.
 */
export function onVolumeChange(callback: (volume: number) => void): void {
  bridge()?.onVolumeChange?.(callback);
}

/**
 * Runs the callback when the playable is allowed to start. Each network
 * signals this differently; the bridge normalizes it. Without a bridge
 * (e.g. the raw HTML opened directly), falls back to DOM readiness so the
 * game still runs.
 */
export function onReady(callback: () => void): void {
  const b = bridge();
  if (b) {
    b.onReady(callback);
    return;
  }
  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => callback());
  } else {
    callback();
  }
}
