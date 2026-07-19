import type { RomuConfig } from "./config.js";

/**
 * The bridge `romu dev` injects instead of a real network's: CTA clicks and
 * lifecycle events surface as console logs and an on-screen toast. Exposes
 * `window.__ROMU_ENV__` chaos hooks so the dev panel can fake container
 * events (volume changes, viewability).
 */
export function simulatorBridge(config: RomuConfig): string {
  return `window.__ROMU_BRIDGE__ = (function () {
  var volumeListeners = [];
  var pauseListeners = [];
  var resumeListeners = [];
  function toast(message) {
    if (window.__ROMU_DEV__) { window.__ROMU_DEV__.toast(message); return; }
    console.log("[romu-sim]", message);
  }
  window.__ROMU_ENV__ = {
    setVolume: function (volume) {
      console.log("[romu-sim] volume \\u2192", volume);
      volumeListeners.slice().forEach(function (cb) { cb(volume); });
    },
    setViewable: function (viewable) {
      console.log("[romu-sim] viewable \\u2192", viewable);
      (viewable ? resumeListeners : pauseListeners).slice().forEach(function (cb) { cb(); });
    }
  };
  return {
    cta: function () {
      console.log("[romu-sim] CTA click \\u2192 store:", ${JSON.stringify(config.store.android)});
      toast("CTA click \\u2192 app store");
    },
    onReady: function (cb) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { cb(); });
      } else {
        cb();
      }
    },
    onVolumeChange: function (cb) { volumeListeners.push(cb); },
    onPause: function (cb) { pauseListeners.push(cb); },
    onResume: function (cb) { resumeListeners.push(cb); }
  };
})();`;
}
