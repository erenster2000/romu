import type { Application, Container } from "pixi.js";
import type { Layout } from "./layout.js";

/**
 * What the flow machine expects back from a scene: a plain object with
 * optional lifecycle handlers. A contract, not a base class — closures and
 * classes both satisfy it (see ARCHITECTURE: "publish'te katı, oyunda özgür").
 */
export interface Scene {
  /** Called every frame with the delta time in seconds. */
  update?(dt: number): void;
  /** Called on renderer resize (and once right after enter). */
  resize?(width: number, height: number): void;
  /** Called when the flow leaves this scene. The stage is destroyed after. */
  exit?(): void;
}

/** Game-level events scenes can subscribe to. */
export type GameEvent = "idle";

export interface SceneContext {
  /** The Pixi application (renderer, ticker, screen size). */
  app: Application;
  /**
   * This scene's own container, already on the main stage. Destroyed —
   * children included — when the flow moves on, so most scenes don't need
   * an exit() at all.
   */
  stage: Container;
  /**
   * This scene's responsive layout: pin objects to screen anchors, cover
   * backgrounds — re-applied automatically on every resize, cleaned up with
   * the scene.
   */
  layout: Layout;
  /** Move the flow to another scene. The current one exits first. */
  go(name: string): void;
  /** Subscribe to a game event (e.g. "idle"); returns an unsubscribe fn. */
  on(event: GameEvent, callback: () => void): () => void;
}

/**
 * A scene is a factory: it runs fresh on every entry, so state (score,
 * timers) resets naturally on retry — the classic playable replay bug can't
 * happen. Returning nothing is fine for static scenes.
 */
export type SceneFactory = (ctx: SceneContext) => Scene | undefined;

/**
 * Identity helper whose only job is typing/autocomplete — the golden-path
 * way to write a scene:
 *
 *   export const gameplay = scene(({ stage, go }) => {
 *     let score = 0;
 *     ...
 *     return { update(dt) {}, resize(w, h) {} };
 *   });
 */
export function scene(factory: SceneFactory): SceneFactory {
  return factory;
}
