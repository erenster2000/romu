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
};

export default applovinAdapter;
