/**
 * Unity LevelPlay (ironSource) playable adapter — the dapi protocol.
 * Delivery: one self-contained HTML file, max 5 MB, CTA via dapi.openStoreUrl().
 * The bridge waits for dapi readiness and viewability before starting the game.
 */

import type {
  BuildOutput,
  RomuAdapter,
  RomuPackage,
  ValidationIssue,
} from "@romu/core";
import { levelplay } from "@romu/specs";

export const levelplayAdapter: RomuAdapter = {
  name: "levelplay",
  spec: levelplay,

  bridge(): string {
    // dapi.openStoreUrl() takes no URL — the network injects the destination.
    return `window.__ROMU_BRIDGE__ = (function () {
  function domReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { cb(); });
    } else {
      cb();
    }
  }
  function whenViewable(cb) {
    if (typeof dapi !== "undefined" && dapi.isViewable && !dapi.isViewable()) {
      dapi.addEventListener("viewableChange", function once(event) {
        if (event && event.isViewable) {
          dapi.removeEventListener("viewableChange", once);
          cb();
        }
      });
    } else {
      cb();
    }
  }
  return {
    cta: function () {
      if (typeof dapi !== "undefined" && dapi.openStoreUrl) {
        dapi.openStoreUrl();
      } else {
        console.warn("[romu] dapi unavailable - CTA ignored outside the LevelPlay container");
      }
    },
    onReady: function (cb) {
      if (typeof dapi === "undefined") {
        domReady(cb);
      } else if (dapi.isReady && dapi.isReady()) {
        whenViewable(cb);
      } else {
        dapi.addEventListener("ready", function () { whenViewable(cb); });
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

    if (!primary.contents.toString("utf8").includes("dapi.openStoreUrl")) {
      issues.push({
        severity: "error",
        message:
          "dapi.openStoreUrl not found — LevelPlay playables must exit through dapi",
      });
    }

    return issues;
  },
};

export default levelplayAdapter;
