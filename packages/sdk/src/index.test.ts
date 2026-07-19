import { afterEach, describe, expect, it, vi } from "vitest";
import { cta } from "./index.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("cta", () => {
  it("routes through the injected bridge", () => {
    const bridgeCta = vi.fn();
    vi.stubGlobal("window", { __ROMU_BRIDGE__: { cta: bridgeCta } });

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
