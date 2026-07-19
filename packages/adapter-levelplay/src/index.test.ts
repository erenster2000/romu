import { describe, expect, it } from "vitest";
import { levelplayAdapter } from "./index.js";

const config = {
  store: { ios: "https://a", android: "https://b" },
  networks: ["levelplay"],
};

describe("levelplayAdapter", () => {
  it("injects a bridge that exits through dapi.openStoreUrl", () => {
    const bridge = levelplayAdapter.bridge(config);
    expect(bridge).toContain("dapi.openStoreUrl");
  });

  it("waits for dapi readiness and viewability before starting", () => {
    const bridge = levelplayAdapter.bridge(config);
    expect(bridge).toContain("dapi.isReady");
    expect(bridge).toContain("viewableChange");
  });

  it("fails builds missing the dapi exit", () => {
    const pkg = levelplayAdapter.package({ html: "<html></html>" });
    const issues = levelplayAdapter.validate(pkg);
    expect(issues.some((i) => i.message.includes("dapi.openStoreUrl"))).toBe(
      true,
    );
  });
});
