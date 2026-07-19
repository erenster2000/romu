import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startRules } from "./rules.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("startRules", () => {
  it("fires idle after the configured quiet period", () => {
    const onIdle = vi.fn();
    startRules({ idleCta: 8 }, { onIdle, onTimeout: vi.fn() });

    vi.advanceTimersByTime(7999);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("activity resets the idle countdown", () => {
    const onIdle = vi.fn();
    const timers = startRules({ idleCta: 8 }, { onIdle, onTimeout: vi.fn() });

    vi.advanceTimersByTime(6000);
    timers.activity();
    vi.advanceTimersByTime(6000);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("maxDuration fires regardless of activity", () => {
    const onTimeout = vi.fn();
    const timers = startRules(
      { idleCta: 8, maxDuration: 30 },
      { onIdle: vi.fn(), onTimeout },
    );

    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(3000);
      timers.activity();
    }
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it("stop() silences everything", () => {
    const onIdle = vi.fn();
    const onTimeout = vi.fn();
    const timers = startRules(
      { idleCta: 1, maxDuration: 2 },
      { onIdle, onTimeout },
    );

    timers.stop();
    vi.advanceTimersByTime(10_000);
    expect(onIdle).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("does nothing when no rules are configured", () => {
    const onIdle = vi.fn();
    const onTimeout = vi.fn();
    startRules({}, { onIdle, onTimeout });
    vi.advanceTimersByTime(120_000);
    expect(onIdle).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
