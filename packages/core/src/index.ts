/**
 * Romu's engine. The CLI is a thin skin over these functions; anything Romu can
 * do is callable from here without a terminal (CI scripts, future cloud builds).
 */

import { specs } from "@romu/specs";

export type {
  BuildOutput,
  PackagedFile,
  RomuAdapter,
  RomuPackage,
  ValidationIssue,
} from "./adapter.js";
export type { BuildOptions } from "./build.js";
export { build, formatBytes } from "./build.js";
export type { RomuConfig } from "./config.js";
export { configSchema, defineConfig, loadConfig } from "./config.js";
export type { DevOptions } from "./dev.js";
export { dev } from "./dev.js";
export { injectBridge, inlineHtml } from "./inline.js";

/** Networks the installed spec registry knows about. */
export function knownNetworks(): string[] {
  return Object.keys(specs);
}
