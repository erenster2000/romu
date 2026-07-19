/**
 * Meta (Facebook/Instagram) playable adapter.
 * Delivery: one self-contained HTML file, max 2 MB, CTA via FbPlayableAd.
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

    // Meta's review looks for the CTA call; a build without it will be rejected.
    if (
      !primary.contents.toString("utf8").includes("FbPlayableAd.onCTAClick")
    ) {
      issues.push({
        severity: "error",
        message:
          "FbPlayableAd.onCTAClick not found — Meta rejects playables without it",
      });
    }

    return issues;
  },
};

export default metaAdapter;
