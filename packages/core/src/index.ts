/**
 * Romu's engine. The CLI is a thin skin over these functions; anything Romu can
 * do is callable from here without a terminal (CI scripts, future cloud builds).
 *
 * Phase 0: wired placeholders. `dev` and `build` land in phase 1 — see ROADMAP.md.
 */

import { specs } from "@romu/specs";

export interface DevOptions {
  /** Project root; defaults to the current working directory. */
  cwd?: string;
}

export interface BuildOptions {
  /** Network to build for, or "all" for every configured network. */
  network: string;
  /** Project root; defaults to the current working directory. */
  cwd?: string;
}

/** Networks the installed spec registry knows about. */
export function knownNetworks(): string[] {
  return Object.keys(specs);
}

export async function dev(_options: DevOptions = {}): Promise<void> {
  throw new Error("`romu dev` lands in phase 1 — see ROADMAP.md");
}

export async function build(_options: BuildOptions): Promise<void> {
  throw new Error("`romu build` lands in phase 1 — see ROADMAP.md");
}
