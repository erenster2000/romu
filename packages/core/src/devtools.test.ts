import type { NetworkSpec } from "@romujs/specs";
import { describe, expect, it } from "vitest";
import type { RomuAdapter } from "./adapter.js";
import { devScripts, SIMULATOR } from "./devtools.js";

const spec: NetworkSpec = {
  network: "mock",
  displayName: "Mock",
  packageFormat: "single-html",
  maxSizeBytes: 1,
  ctaApi: "x",
  sources: [],
};

const config = {
  store: { ios: "https://a", android: "https://b" },
  networks: ["mock"],
};

function adapterWith(mock: boolean, name = "mock"): RomuAdapter {
  return {
    name,
    spec,
    bridge: () => `BRIDGE(${name})`,
    package: () => ({ files: [], primary: "x" }),
    validate: () => [],
    ...(mock ? { devMock: () => `MOCK(${name})` } : {}),
  };
}

describe("devScripts", () => {
  it("defaults to the simulator with the toolbar listing mockable networks", () => {
    const { selected, scripts } = devScripts(SIMULATOR, config, [
      adapterWith(true),
    ]);
    expect(selected).toBe(SIMULATOR);
    const joined = scripts.join("\n");
    expect(joined).toContain("__ROMU_BRIDGE__");
    expect(joined).not.toContain("MOCK(mock)");
    expect(joined).toContain('"mock"'); // toolbar option
  });

  it("injects the mock container plus the real bridge for a selected network", () => {
    const { selected, scripts } = devScripts("mock", config, [
      adapterWith(true),
    ]);
    expect(selected).toBe("mock");
    const joined = scripts.join("\n");
    expect(joined).toContain("MOCK(mock)");
    expect(joined).toContain("BRIDGE(mock)");
  });

  it("falls back to the simulator for unknown or mockless networks", () => {
    const noMock = devScripts("mockless", config, [
      adapterWith(false, "mockless"),
    ]);
    expect(noMock.selected).toBe(SIMULATOR);

    const unknown = devScripts("nope", config, [adapterWith(true)]);
    expect(unknown.selected).toBe(SIMULATOR);
  });

  it("orders scripts helpers-first so mocks and bridges can use __ROMU_DEV__", () => {
    const { scripts } = devScripts("mock", config, [adapterWith(true)]);
    expect(scripts[0]).toContain("__ROMU_DEV__");
  });
});

describe("pickLanUrl", () => {
  it("prefers real Wi-Fi ranges over virtual interfaces and loopback", async () => {
    const { pickLanUrl } = await import("./devtools.js");
    expect(
      pickLanUrl([
        "http://127.160.246.5:5173/",
        "http://172.26.11.149:5173/",
        "http://192.168.1.13:5173/",
      ]),
    ).toBe("http://192.168.1.13:5173/");
    expect(pickLanUrl(["http://127.0.0.1:5173/"])).toBeUndefined();
    expect(pickLanUrl([])).toBeUndefined();
  });
});
