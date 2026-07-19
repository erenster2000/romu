import { describe, expect, it } from "vitest";
import { meta, specs } from "./index.js";

describe("spec registry", () => {
  it("exposes every spec through the registry", () => {
    expect(specs.meta).toBe(meta);
  });

  it("meta requires a single HTML file under 2 MB", () => {
    expect(meta.packageFormat).toBe("single-html");
    expect(meta.maxSizeBytes).toBe(2 * 1024 * 1024);
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
