import type { RomuConfig } from "./config.js";

/**
 * The bridge `romu dev` injects instead of a real network's: CTA clicks and
 * lifecycle events surface as console logs and an on-screen toast, so the
 * developer sees the playable behave without any ad container around it.
 */
export function simulatorBridge(config: RomuConfig): string {
  return `window.__ROMU_BRIDGE__ = (function () {
  function toast(message) {
    var el = document.createElement("div");
    el.textContent = message;
    el.style.cssText =
      "position:fixed;top:12px;left:50%;transform:translateX(-50%);" +
      "background:#111;color:#fff;padding:8px 14px;border-radius:8px;" +
      "font:13px system-ui,sans-serif;z-index:99999;opacity:.95;pointer-events:none";
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }
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
    }
  };
})();`;
}
