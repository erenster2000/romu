import { afterEach, describe, expect, it, vi } from "vitest";
import { cta, onReady, onVolumeChange } from "./index.js";

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

describe("onVolumeChange", () => {
  it("subscribes through the bridge when supported", () => {
    const subscribe = vi.fn((cb: (v: number) => void) => cb(0.5));
    vi.stubGlobal("window", {
      __ROMU_BRIDGE__: {
        cta: vi.fn(),
        onReady: vi.fn(),
        onVolumeChange: subscribe,
      },
    });
    const callback = vi.fn();

    onVolumeChange(callback);

    expect(subscribe).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(0.5);
  });

  it("is a silent no-op on bridges without a volume API", () => {
    vi.stubGlobal("window", {
      __ROMU_BRIDGE__: { cta: vi.fn(), onReady: vi.fn() },
    });
    expect(() => onVolumeChange(vi.fn())).not.toThrow();
  });
});

describe("onPause / onResume", () => {
  it("subscribe through the bridge when supported", async () => {
    const { onPause, onResume } = await import("./index.js");
    const pause = vi.fn((cb: () => void) => cb());
    const resume = vi.fn((cb: () => void) => cb());
    vi.stubGlobal("window", {
      __ROMU_BRIDGE__: {
        cta: vi.fn(),
        onReady: vi.fn(),
        onPause: pause,
        onResume: resume,
      },
    });
    const paused = vi.fn();
    const resumed = vi.fn();

    onPause(paused);
    onResume(resumed);

    expect(paused).toHaveBeenCalledOnce();
    expect(resumed).toHaveBeenCalledOnce();
  });

  it("are silent no-ops on bridges without lifecycle APIs", async () => {
    const { onPause, onResume } = await import("./index.js");
    vi.stubGlobal("window", {
      __ROMU_BRIDGE__: { cta: vi.fn(), onReady: vi.fn() },
    });
    expect(() => onPause(vi.fn())).not.toThrow();
    expect(() => onResume(vi.fn())).not.toThrow();
  });
});
