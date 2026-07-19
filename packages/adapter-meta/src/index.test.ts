import { describe, expect, it } from "vitest";
import { metaAdapter } from "./index.js";

function packageOf(html: string) {
  return metaAdapter.package({ html });
}

describe("metaAdapter", () => {
  it("packages the build as a single playable.html", () => {
    const pkg = packageOf("<html></html>");
    expect(pkg.files.map((f) => f.path)).toEqual(["playable.html"]);
    expect(pkg.primary).toBe("playable.html");
  });

  it("flags packages over the 2 MB limit", () => {
    const pkg = packageOf("x".repeat(2 * 1024 * 1024 + 1));
    const issues = metaAdapter.validate(pkg);
    expect(
      issues.some((i) => i.severity === "error" && i.message.includes("limit")),
    ).toBe(true);
  });

  it("flags external references", () => {
    const pkg = packageOf('<img src="https://cdn.example.com/a.png">');
    const issues = metaAdapter.validate(pkg);
    expect(issues.some((i) => i.message.includes("external"))).toBe(true);
  });

  it("accepts a small self-contained file", () => {
    const pkg = packageOf(
      "<html><head><script>window.x=1</script></head></html>",
    );
    expect(metaAdapter.validate(pkg)).toEqual([]);
  });

  it("injects a bridge that talks to FbPlayableAd", () => {
    const bridge = metaAdapter.bridge({
      store: { ios: "https://a", android: "https://b" },
      networks: ["meta"],
    });
    expect(bridge).toContain("__ROMU_BRIDGE__");
    expect(bridge).toContain("FbPlayableAd.onCTAClick");
  });
});
