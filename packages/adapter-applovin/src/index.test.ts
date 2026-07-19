import { describe, expect, it } from "vitest";
import { applovinAdapter } from "./index.js";

const config = {
  store: {
    ios: "https://apps.apple.com/app/id1",
    android: "https://play.google.com/store/apps/details?id=x",
  },
  networks: ["applovin"],
};

describe("applovinAdapter", () => {
  it("injects a bridge that exits through mraid.open with the store URLs", () => {
    const bridge = applovinAdapter.bridge(config);
    expect(bridge).toContain("mraid.open");
    expect(bridge).toContain(config.store.ios);
    expect(bridge).toContain(config.store.android);
  });

  it("waits for the mraid ready event before starting", () => {
    const bridge = applovinAdapter.bridge(config);
    expect(bridge).toContain('addEventListener("ready"');
    expect(bridge).toContain("viewableChange");
  });

  it("fails builds missing the MRAID exit", () => {
    const pkg = applovinAdapter.package({ html: "<html></html>" });
    const issues = applovinAdapter.validate(pkg);
    expect(issues.some((i) => i.message.includes("mraid.open"))).toBe(true);
  });
});
