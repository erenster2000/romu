import { describe, expect, it } from "vitest";
import { metaAdapter } from "./index.js";

describe("metaAdapter chunk leakage check", () => {
  it("flags dynamic imports of relative chunks", () => {
    const pkg = metaAdapter.package({
      html: '<script type="module">import("./WebGLRenderer-abc.js")</script>',
    });
    const issues = metaAdapter.validate(pkg);
    expect(issues.some((i) => i.message.includes("dynamic import"))).toBe(true);
  });

  it("does not flag data-URL or absolute-URL-free bundles", () => {
    const pkg = metaAdapter.package({
      html: '<script type="module">const x = await import("data:text/javascript,export default 1");</script>',
    });
    expect(metaAdapter.validate(pkg)).toEqual([]);
  });
});
