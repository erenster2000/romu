import type { NetworkSpec } from "@romujs/specs";
import { describe, expect, it } from "vitest";
import type { RomuPackage } from "./adapter.js";
import { lintPackage } from "./lint.js";

const spec: NetworkSpec = {
  network: "test",
  displayName: "Test Network",
  packageFormat: "single-html",
  maxSizeBytes: 100,
  ctaApi: "test.cta()",
  sources: [],
};

function pkg(html: string): RomuPackage {
  return {
    files: [{ path: "playable.html", contents: Buffer.from(html, "utf8") }],
    primary: "playable.html",
  };
}

describe("lintPackage", () => {
  it("accepts a small self-contained file", () => {
    expect(lintPackage(pkg("<html></html>"), spec)).toEqual([]);
  });

  it("flags packages over the size limit", () => {
    const issues = lintPackage(pkg("x".repeat(101)), spec);
    expect(
      issues.some((i) => i.severity === "error" && i.message.includes("limit")),
    ).toBe(true);
  });

  it("flags external references", () => {
    const issues = lintPackage(
      pkg('<img src="https://cdn.example.com/a.png">'),
      spec,
    );
    expect(issues.some((i) => i.message.includes("external"))).toBe(true);
  });

  it("flags dynamic imports of relative chunks", () => {
    const issues = lintPackage(
      pkg('<script>import("./chunk-abc.js")</script>'),
      spec,
    );
    expect(issues.some((i) => i.message.includes("dynamic import"))).toBe(true);
  });

  it("reports a missing primary file", () => {
    const broken: RomuPackage = { files: [], primary: "playable.html" };
    expect(lintPackage(broken, spec)[0]?.severity).toBe("error");
  });
});
