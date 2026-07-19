/**
 * Meta (Facebook/Instagram) playable adapter.
 * Delivery: one self-contained HTML file, max 2 MB, CTA via FbPlayableAd.
 */

import type {
  BuildOutput,
  RomuAdapter,
  RomuPackage,
  ValidationIssue,
} from "@romu/core";
import { formatBytes } from "@romu/core";
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
    if (!primary)
      return [{ severity: "error", message: "missing playable.html" }];

    if (primary.contents.byteLength > meta.maxSizeBytes) {
      issues.push({
        severity: "error",
        message: `playable.html is ${formatBytes(primary.contents.byteLength)} — over Meta's ${formatBytes(meta.maxSizeBytes)} limit`,
      });
    }

    const html = primary.contents.toString("utf8");
    if (/\s(?:src|href)=["']https?:\/\//.test(html)) {
      issues.push({
        severity: "error",
        message:
          "external src/href references found — Meta requires a fully self-contained file",
      });
    }

    // Dynamic import() of a relative chunk means code splitting leaked into
    // the bundle — those files won't exist next to a single-HTML playable.
    if (/import\(\s*["']\.{0,2}\//.test(html)) {
      issues.push({
        severity: "error",
        message:
          "dynamic import of a relative chunk found — the bundle is not fully self-contained",
      });
    }

    return issues;
  },
};

export default metaAdapter;
