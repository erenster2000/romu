import { onPause, onReady, onResume } from "@romujs/sdk";
import { Application, Container } from "pixi.js";
import { Flow } from "./flow.js";
import { createLayout } from "./layout.js";
import { type Rules, startRules } from "./rules.js";
import type { GameEvent, SceneFactory } from "./scene.js";

export interface GameOptions {
  /** The scenes of the playable, by name. */
  scenes: Record<string, SceneFactory>;
  /** Scene to enter once the ad container allows starting. */
  start: string;
  /**
   * Scene the flow is forced to when rules.maxDuration elapses.
   * Defaults to "endcard" when such a scene exists.
   */
  endScene?: string;
  rules?: Rules;
  /** Canvas background color (default #1a1a2e). */
  background?: string;
  antialias?: boolean;
}

/**
 * The golden-path entry point: boots Pixi, waits for the ad container
 * (SDK onReady), runs the flow machine, and wires the lifecycle every
 * network requires — the ticker freezes on onPause and resumes on onResume,
 * timing rules fire the "idle" event and force the end scene.
 *
 * Entirely optional: a game can keep using bare Pixi + @romujs/sdk and
 * `romu build` treats both the same.
 */
export function createGame(options: GameOptions): void {
  onReady(() => {
    void boot(options);
  });
}

async function boot(options: GameOptions): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: options.background ?? "#1a1a2e",
    antialias: options.antialias ?? true,
  });
  document.body.appendChild(app.canvas);

  // Minimal event bus for game-level events ("idle" for now).
  const listeners = new Map<GameEvent, Set<() => void>>();
  const emit = (event: GameEvent): void => {
    for (const cb of listeners.get(event) ?? []) cb();
  };

  const flow = new Flow(options.scenes, {
    createScene() {
      const stage = new Container();
      app.stage.addChild(stage);
      const layout = createLayout();
      layout.apply(app.screen.width, app.screen.height);
      return { stage, layout };
    },
    destroyScene({ stage }) {
      app.stage.removeChild(stage);
      stage.destroy({ children: true });
    },
    context: {
      app,
      on(event, callback) {
        const set = listeners.get(event) ?? new Set();
        listeners.set(event, set);
        set.add(callback);
        return () => set.delete(callback);
      },
    },
  });

  app.ticker.add((ticker) => flow.update(ticker.deltaMS / 1000));

  const dispatchResize = (): void =>
    flow.resize(app.screen.width, app.screen.height);
  app.renderer.on("resize", dispatchResize);

  const endScene =
    options.endScene ?? (options.scenes.endcard ? "endcard" : undefined);
  const timers = startRules(options.rules ?? {}, {
    onIdle: () => emit("idle"),
    onTimeout: () => {
      if (endScene && flow.currentName !== endScene) flow.go(endScene);
    },
  });
  window.addEventListener("pointerdown", () => timers.activity());

  // The lifecycle every network requires, for free:
  onPause(() => app.ticker.stop());
  onResume(() => app.ticker.start());

  flow.go(options.start);
  dispatchResize();
}
