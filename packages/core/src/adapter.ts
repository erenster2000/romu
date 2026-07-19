import type { NetworkSpec } from "@romujs/specs";
import type { RomuConfig } from "./config.js";

/** What the core build hands to an adapter: the fully inlined single HTML. */
export interface BuildOutput {
  html: string;
}

export interface PackagedFile {
  path: string;
  contents: Buffer;
}

export interface RomuPackage {
  files: PackagedFile[];
  /** The file the network's size limit applies to. */
  primary: string;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
}

/**
 * The adapter contract — see ARCHITECTURE.md. Four members; core works against
 * this interface and never looks inside an adapter.
 */
export interface RomuAdapter {
  name: string;
  spec: NetworkSpec;
  /** Produces the bridge script injected into the HTML (see the bridge pattern). */
  bridge(config: RomuConfig): string;
  /** Wraps the build output into the network's delivery format. */
  package(build: BuildOutput): RomuPackage;
  /** Network-specific checks beyond what the generic linter covers. */
  validate(pkg: RomuPackage): ValidationIssue[];
}
