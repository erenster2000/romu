import type { Scene, SceneContext, SceneFactory } from "./scene.js";

/** The per-scene pieces the host creates fresh on every entry. */
export interface ScenePieces {
  stage: SceneContext["stage"];
  layout: SceneContext["layout"];
}

/**
 * What the flow needs from its host (createGame in production, a stub in
 * tests): fresh per-scene pieces and the shared context members.
 */
export interface FlowHost {
  /** Create and attach a fresh stage + layout for an entering scene. */
  createScene(): ScenePieces;
  /** Detach and destroy a leaving scene's pieces. */
  destroyScene(pieces: ScenePieces): void;
  /** Context members shared by every scene (app, event bus). */
  context: Omit<SceneContext, "stage" | "layout" | "go">;
}

/**
 * The playable flow machine: one active scene at a time, factories re-run on
 * every entry (fresh state — retry-safe), previous scene fully torn down
 * before the next enters.
 */
export class Flow {
  private current?: Scene;
  private pieces?: ScenePieces;
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
    if (this.pieces) this.host.destroyScene(this.pieces);

    const pieces = this.host.createScene();
    const ctx: SceneContext = {
      ...this.host.context,
      ...pieces,
      go: (next) => this.go(next),
    };
    this.currentName = name;
    this.pieces = pieces;
    this.current = factory(ctx) ?? {};
  }

  update(dt: number): void {
    this.current?.update?.(dt);
  }

  resize(width: number, height: number): void {
    // Layout first so scenes can adjust on top of pinned positions.
    this.pieces?.layout.apply(width, height);
    this.current?.resize?.(width, height);
  }
}
