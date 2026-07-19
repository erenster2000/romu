import { afterEach, describe, expect, it, vi } from "vitest";
import { cta, onReady } from "./index.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("cta", () => {
  it("routes through the injected bridge", () => {
    const bridgeCta = vi.fn();
    vi.stubGlobal("window", {
      __ROMU_BRIDGE__: { cta: bridgeCta, onReady: vi.fn() },
    });

    cta();

    expect(bridgeCta).toHaveBeenCalledOnce();
  });

  it("warns instead of crashing when no bridge is present", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("window", {});

    expect(() => cta()).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("onReady", () => {
  it("delegates to the bridge when present", () => {
    const bridgeOnReady = vi.fn((cb: () => void) => cb());
    vi.stubGlobal("window", {
      __ROMU_BRIDGE__: { cta: vi.fn(), onReady: bridgeOnReady },
    });
    const callback = vi.fn();

    onReady(callback);

    expect(bridgeOnReady).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("falls back to DOM readiness without a bridge", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { readyState: "complete" });
    const callback = vi.fn();

    onReady(callback);

    expect(callback).toHaveBeenCalledOnce();
  });
});
