import { describe, expect, it } from "vitest";
import { metaAdapter } from "./index.js";

const config = {
  store: { ios: "https://a", android: "https://b" },
  networks: ["meta"],
};

describe("metaAdapter", () => {
  it("packages the build as a single playable.html", () => {
    const pkg = metaAdapter.package({ html: "<html></html>" });
    expect(pkg.files.map((f) => f.path)).toEqual(["playable.html"]);
    expect(pkg.primary).toBe("playable.html");
  });

  it("injects a bridge that talks to FbPlayableAd", () => {
    const bridge = metaAdapter.bridge(config);
    expect(bridge).toContain("__ROMU_BRIDGE__");
    expect(bridge).toContain("FbPlayableAd.onCTAClick");
  });

  it("fails builds missing the CTA call", () => {
    const pkg = metaAdapter.package({ html: "<html>no bridge here</html>" });
    const issues = metaAdapter.validate(pkg);
    expect(issues.some((i) => i.message.includes("onCTAClick"))).toBe(true);
  });

  it("accepts builds carrying the bridge", () => {
    const pkg = metaAdapter.package({
      html: `<html><script>${metaAdapter.bridge(config)}</script></html>`,
    });
    expect(metaAdapter.validate(pkg)).toEqual([]);
  });
});
