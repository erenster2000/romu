import { describe, expect, it } from "vitest";
import { applovin, levelplay, meta, specs } from "./index.js";

describe("spec registry", () => {
  it("exposes every spec through the registry under its own id", () => {
    expect(specs.meta).toBe(meta);
    expect(specs.applovin).toBe(applovin);
    expect(specs.levelplay).toBe(levelplay);
    for (const [id, spec] of Object.entries(specs)) {
      expect(spec.network).toBe(id);
    }
  });

  it("all three networks currently allow 5 MB single HTML", () => {
    for (const spec of [meta, applovin, levelplay]) {
      expect(spec.packageFormat).toBe("single-html");
      expect(spec.maxSizeBytes).toBe(5 * 1024 * 1024);
    }
  });

  it("every spec cites at least one dated source", () => {
    for (const spec of Object.values(specs)) {
      expect(spec.sources.length).toBeGreaterThan(0);
      for (const source of spec.sources) {
        expect(source.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
