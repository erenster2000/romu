import { describe, expect, it, vi } from "vitest";
import { Flow, type FlowHost } from "./flow.js";
import type { SceneContext } from "./scene.js";

function makeHost(): FlowHost & { destroyed: unknown[] } {
  const destroyed: unknown[] = [];
  return {
    destroyed,
    createStage: () => ({}) as SceneContext["stage"],
    destroyStage: (stage) => destroyed.push(stage),
    context: {
      app: {} as SceneContext["app"],
      on: () => () => {},
    },
  };
}

describe("Flow", () => {
  it("re-runs the factory on every entry, so state is fresh on retry", () => {
    const entries: number[] = [];
    let counter = 0;
    const flow = new Flow(
      {
        gameplay: () => {
          counter += 1;
          entries.push(counter);
          return {};
        },
        endcard: () => ({}),
      },
      makeHost(),
    );

    flow.go("gameplay");
    flow.go("endcard");
    flow.go("gameplay"); // retry

    expect(entries).toEqual([1, 2]);
  });

  it("exits and destroys the old scene before entering the new one", () => {
    const order: string[] = [];
    const host = makeHost();
    host.destroyStage = () => order.push("destroy");
    const flow = new Flow(
      {
        a: () => ({ exit: () => order.push("exit-a") }),
        b: () => {
          order.push("enter-b");
          return {};
        },
      },
      host,
    );

    flow.go("a");
    flow.go("b");

    expect(order).toEqual(["exit-a", "destroy", "enter-b"]);
  });

  it("routes update and resize to the active scene only", () => {
    const update = vi.fn();
    const resize = vi.fn();
    const flow = new Flow(
      { a: () => ({ update, resize }), b: () => ({}) },
      makeHost(),
    );

    flow.go("a");
    flow.update(0.016);
    flow.resize(360, 640);
    flow.go("b");
    flow.update(0.016);

    expect(update).toHaveBeenCalledTimes(1);
    expect(resize).toHaveBeenCalledWith(360, 640);
  });

  it("scenes can navigate through their context's go()", () => {
    const flow = new Flow(
      {
        a: ({ go }) => {
          go("b");
          return {};
        },
        b: () => ({}),
      },
      makeHost(),
    );

    flow.go("a");
    expect(flow.currentName).toBe("b");
  });

  it("throws a helpful error for unknown scenes", () => {
    const flow = new Flow({ a: () => ({}) }, makeHost());
    expect(() => flow.go("nope")).toThrow(/unknown scene "nope"/);
  });
});
