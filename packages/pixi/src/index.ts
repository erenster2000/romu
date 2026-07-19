/**
 * @romujs/pixi — Romu's game layer for Pixi.js playables.
 *
 * The golden path:
 *
 *   createGame({
 *     scenes: { gameplay, endcard },
 *     start: "gameplay",
 *     rules: { idleCta: 8, maxDuration: 30 },
 *   });
 *
 * with scenes written as closures via scene(). All of it optional — bare
 * Pixi + @romujs/sdk keeps working; `romu build` treats both the same.
 */

export { Flow, type FlowHost } from "./flow.js";
export { createGame, type GameOptions } from "./game.js";
export {
  type RuleHooks,
  type Rules,
  type RuleTimers,
  startRules,
} from "./rules.js";
export {
  type GameEvent,
  type Scene,
  type SceneContext,
  type SceneFactory,
  scene,
} from "./scene.js";
