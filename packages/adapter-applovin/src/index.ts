/**
 * AppLovin playable adapter (MRAID v2).
 * Delivery: one self-contained HTML file, max 5 MB, CTA via mraid.open(url).
 * The bridge waits for the mraid ready event and viewability before starting —
 * AppLovin requires not touching the DOM until mraid is ready.
 */

import type {
  BuildOutput,
  RomuAdapter,
  RomuConfig,
  RomuPackage,
  ValidationIssue,
} from "@romujs/core";
import { applovin } from "@romujs/specs";

export const applovinAdapter: RomuAdapter = {
  name: "applovin",
  spec: applovin,

  bridge(config: RomuConfig): string {
    return `window.__ROMU_BRIDGE__ = (function () {
  var store = ${JSON.stringify(config.store)};
  function storeUrl() {
    var ua = navigator.userAgent || "";
    return /iPhone|iPad|iPod/i.test(ua) ? store.ios : store.android;
  }
  function domReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { cb(); });
    } else {
      cb();
    }
  }
  function whenViewable(cb) {
    if (typeof mraid !== "undefined" && mraid.isViewable && !mraid.isViewable()) {
      mraid.addEventListener("viewableChange", function once(viewable) {
        if (viewable) {
          mraid.removeEventListener("viewableChange", once);
          cb();
        }
      });
    } else {
      cb();
    }
  }
  return {
    cta: function () {
      if (typeof mraid !== "undefined" && mraid.open) {
        mraid.open(storeUrl());
      } else {
        console.warn("[romu] mraid unavailable - CTA ignored outside the AppLovin container");
      }
    },
    onReady: function (cb) {
      if (typeof mraid === "undefined") {
        domReady(cb);
      } else if (mraid.getState && mraid.getState() === "loading") {
        mraid.addEventListener("ready", function () { whenViewable(cb); });
      } else {
        whenViewable(cb);
      }
    }
  };
})();`;
  },

  package(build: BuildOutput): RomuPackage {
    return {
      files: [
        { path: "playable.html", contents: Buffer.from(build.html, "utf8") },
      ],
      primary: "playable.html",
    };
  },

  validate(pkg: RomuPackage): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const primary = pkg.files.find((f) => f.path === pkg.primary);
    if (!primary) return [];

    if (!primary.contents.toString("utf8").includes("mraid.open")) {
      issues.push({
        severity: "error",
        message:
          "mraid.open not found — AppLovin playables must exit through MRAID",
      });
    }

    return issues;
  },

  devMock(): string {
    // A fake MRAID container: starts in "loading", fires ready shortly after,
    // becomes viewable a beat later — the timing games actually get wrong.
    return `window.mraid = (function () {
  var state = "loading";
  var viewable = false;
  var listeners = {};
  function emit(event) {
    var args = Array.prototype.slice.call(arguments, 1);
    (listeners[event] || []).slice().forEach(function (cb) {
      cb.apply(null, args);
    });
  }
  setTimeout(function () {
    state = "default";
    emit("ready");
    window.__ROMU_DEV__ && window.__ROMU_DEV__.log("[mraid-mock] ready");
    setTimeout(function () {
      viewable = true;
      emit("viewableChange", true);
      window.__ROMU_DEV__ && window.__ROMU_DEV__.log("[mraid-mock] viewable");
    }, 800);
  }, 300);
  return {
    getState: function () { return state; },
    isViewable: function () { return viewable; },
    addEventListener: function (event, cb) {
      (listeners[event] = listeners[event] || []).push(cb);
    },
    removeEventListener: function (event, cb) {
      listeners[event] = (listeners[event] || []).filter(function (x) { return x !== cb; });
    },
    open: function (url) {
      window.__ROMU_DEV__ && window.__ROMU_DEV__.toast("mraid.open \\u2192 " + url);
      console.log("[mraid-mock] open:", url);
    }
  };
})();`;
  },
};

export default applovinAdapter;
