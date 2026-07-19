import type { Scene, SceneContext, SceneFactory } from "./scene.js";

/**
 * What the flow needs from its host (createGame in production, a stub in
 * tests): fresh per-scene stages and the shared context pieces.
 */
export interface FlowHost {
  /** Create and attach a fresh stage for an entering scene. */
  createStage(): SceneContext["stage"];
  /** Detach and destroy a leaving scene's stage. */
  destroyStage(stage: SceneContext["stage"]): void;
  /** Context members shared by every scene (app, event bus). */
  context: Omit<SceneContext, "stage" | "go">;
}

/**
 * The playable flow machine: one active scene at a time, factories re-run on
 * every entry (fresh state — retry-safe), previous scene fully torn down
 * before the next enters.
 */
export class Flow {
  private current?: Scene;
  private currentStage?: SceneContext["stage"];
  currentName?: string;

  constructor(
    private scenes: Record<string, SceneFactory>,
    private host: FlowHost,
  ) {}

  go(name: string): void {
    const factory = this.scenes[name];
    if (!factory) {
      const known = Object.keys(this.scenes).join(", ");
      throw new Error(`unknown scene "${name}" (scenes: ${known})`);
    }

    if (this.current?.exit) this.current.exit();
    if (this.currentStage) this.host.destroyStage(this.currentStage);

    const stage = this.host.createStage();
    const ctx: SceneContext = {
      ...this.host.context,
      stage,
      go: (next) => this.go(next),
    };
    this.currentName = name;
    this.currentStage = stage;
    this.current = factory(ctx) ?? {};
  }

  update(dt: number): void {
    this.current?.update?.(dt);
  }

  resize(width: number, height: number): void {
    this.current?.resize?.(width, height);
  }
}
