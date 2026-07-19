/**
 * Meta (Facebook/Instagram) playable adapter.
 * Delivery: one self-contained HTML file, max 5 MB, CTA via FbPlayableAd.
 * Generic size/self-containment checks live in core's lintPackage.
 */

import type {
  BuildOutput,
  RomuAdapter,
  RomuPackage,
  ValidationIssue,
} from "@romu/core";
import { meta } from "@romu/specs";

export const metaAdapter: RomuAdapter = {
  name: "meta",
  spec: meta,

  bridge(): string {
    // Meta ignores store URLs at runtime — the destination is configured in
    // Ads Manager; the playable only signals the click.
    return `window.__ROMU_BRIDGE__ = {
  cta: function () {
    if (typeof FbPlayableAd !== "undefined" && FbPlayableAd.onCTAClick) {
      FbPlayableAd.onCTAClick();
    } else {
      console.warn("[romu] FbPlayableAd unavailable - CTA ignored outside the Meta container");
    }
  },
  onReady: function (cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { cb(); });
    } else {
      cb();
    }
  }
};`;
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

    // Meta marks the CTA call "strongly recommended" rather than required,
    // so its absence is a warning, not a build failure.
    if (
      !primary.contents.toString("utf8").includes("FbPlayableAd.onCTAClick")
    ) {
      issues.push({
        severity: "warning",
        message:
          "FbPlayableAd.onCTAClick not found — Meta strongly recommends it",
      });
    }

    return issues;
  },
};

export default metaAdapter;
