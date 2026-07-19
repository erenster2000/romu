import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";
import type { RomuAdapter, ValidationIssue } from "./adapter.js";
import { loadConfig } from "./config.js";
import { injectBridge, inlineHtml } from "./inline.js";

export interface BuildOptions {
  /** Network to build for, or "all" for every network in the config. */
  network: string;
  /** Project root; defaults to the current working directory. */
  cwd?: string;
  /** Available adapters; the CLI passes the built-in set. */
  adapters?: RomuAdapter[];
}

/**
 * `romu build`: one Vite build of the game, then per network — inject that
 * network's bridge, package, validate, report size against the spec.
 */
export async function build(options: BuildOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd);
  const adapters = options.adapters ?? [];
  const targets =
    options.network === "all" ? config.networks : [options.network];

  for (const name of targets) {
    if (!adapters.some((a) => a.name === name)) {
      const known = adapters.map((a) => a.name).join(", ") || "none";
      throw new Error(`no adapter for network "${name}" (available: ${known})`);
    }
  }

  const viteOut = path.join(cwd, ".romu", "vite");
  await viteBuild({
    root: cwd,
    configFile: false,
    logLevel: "warn",
    base: "./",
    build: {
      outDir: viteOut,
      emptyOutDir: true,
      // Vite inlines every asset as base64; inlineHtml() folds in JS/CSS after.
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      modulePreload: { polyfill: false },
      rollupOptions: {
        // No code splitting: dynamic import() chunks (e.g. Pixi's lazy-loaded
        // renderers) would be separate files a single-HTML playable can't load.
        output: { inlineDynamicImports: true },
      },
    },
  });

  const rawHtml = await readFile(path.join(viteOut, "index.html"), "utf8");
  // build.base is "./", so asset refs are relative to the output root
  const readAsset = (assetPath: string): string =>
    readFileSync(path.join(viteOut, assetPath), "utf8");
  const inlined = inlineHtml(rawHtml, readAsset);

  const failures: string[] = [];
  for (const name of targets) {
    const adapter = adapters.find((a) => a.name === name);
    if (!adapter) continue;

    const html = injectBridge(inlined, adapter.bridge(config));
    const pkg = adapter.package({ html });
    const outDir = path.join(cwd, "dist", name);
    await mkdir(outDir, { recursive: true });
    for (const file of pkg.files) {
      await writeFile(path.join(outDir, file.path), file.contents);
    }

    const primary = pkg.files.find((f) => f.path === pkg.primary);
    const size = primary?.contents.byteLength ?? 0;
    const limit = adapter.spec.maxSizeBytes;
    const pct = Math.round((size / limit) * 100);
    console.log(
      `  ${name}  dist/${name}/${pkg.primary}  ${formatBytes(size)} / ${formatBytes(limit)} (${pct}%)`,
    );

    for (const issue of adapter.validate(pkg)) {
      report(issue, name);
      if (issue.severity === "error") failures.push(name);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `validation failed for: ${[...new Set(failures)].join(", ")}`,
    );
  }
}

function report(issue: ValidationIssue, network: string): void {
  const label = issue.severity === "error" ? "error" : "warning";
  console.log(`  ${network}  ${label}: ${issue.message}`);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
