import type { NetworkSpec } from "@romujs/specs";
import type { RomuPackage, ValidationIssue } from "./adapter.js";
import { formatBytes } from "./format.js";

/**
 * Generic spec checks every package must pass, driven by the network's spec
 * entry. Adapters only add checks that are truly network-specific.
 */
export function lintPackage(
  pkg: RomuPackage,
  spec: NetworkSpec,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const primary = pkg.files.find((f) => f.path === pkg.primary);
  if (!primary) {
    return [
      { severity: "error", message: `missing primary file ${pkg.primary}` },
    ];
  }

  if (primary.contents.byteLength > spec.maxSizeBytes) {
    issues.push({
      severity: "error",
      message: `${pkg.primary} is ${formatBytes(primary.contents.byteLength)} — over ${spec.displayName}'s ${formatBytes(spec.maxSizeBytes)} limit`,
    });
  }

  if (spec.packageFormat === "single-html") {
    const html = primary.contents.toString("utf8");

    if (/\s(?:src|href)=["']https?:\/\//.test(html)) {
      issues.push({
        severity: "error",
        message: `external src/href references found — ${spec.displayName} requires a fully self-contained file`,
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
  }

  return issues;
}
