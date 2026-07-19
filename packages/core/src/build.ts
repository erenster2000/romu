import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build as viteBuild } from "vite";
import type { RomuAdapter, RomuPackage, ValidationIssue } from "./adapter.js";
import { loadConfig, type RomuConfig } from "./config.js";
import { formatBytes } from "./format.js";
import { injectBridge, inlineHtml } from "./inline.js";
import { lintPackage } from "./lint.js";

export interface BuildOptions {
  /** Network to build for, or "all" for every network in the config. */
  network?: string;
  /** Project root; defaults to the current working directory. */
  cwd?: string;
  /** Available adapters; the CLI passes the built-in set. */
  adapters?: RomuAdapter[];
}

export interface NetworkResult {
  network: string;
  pkg: RomuPackage;
  size: number;
  limit: number;
  issues: ValidationIssue[];
}

/**
 * `romu build`: one Vite build of the game, then per network — inject that
 * network's bridge, package, lint + validate, write to dist/, report size.
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const results = await packageAll(cwd, options);

  const failures: string[] = [];
  for (const result of results) {
    const outDir = path.join(cwd, "dist", result.network);
    await mkdir(outDir, { recursive: true });
    for (const file of result.pkg.files) {
      await writeFile(path.join(outDir, file.path), file.contents);
    }
    printResult(result, `dist/${result.network}/${result.pkg.primary}`);
    if (result.issues.some((i) => i.severity === "error")) {
      failures.push(result.network);
    }
  }

  if (failures.length > 0) {
    throw new Error(`validation failed for: ${failures.join(", ")}`);
  }
}

/**
 * `romu check`: the exact build pipeline without writing dist/ — packages
 * every configured network in memory and reports issues and sizes.
 */
export async function check(
  options: Omit<BuildOptions, "network"> = {},
): Promise<NetworkResult[]> {
  const cwd = options.cwd ?? process.cwd();
  const results = await packageAll(cwd, { ...options, network: "all" });
  for (const result of results) {
    printResult(result, result.pkg.primary);
  }
  const failures = results
    .filter((r) => r.issues.some((i) => i.severity === "error"))
    .map((r) => r.network);
  if (failures.length > 0) {
    throw new Error(`check failed for: ${failures.join(", ")}`);
  }
  return results;
}

async function packageAll(
  cwd: string,
  options: BuildOptions,
): Promise<NetworkResult[]> {
  const config = await loadConfig(cwd);
  const adapters = options.adapters ?? [];
  const network = options.network ?? "all";
  const targets = network === "all" ? config.networks : [network];

  for (const name of targets) {
    if (!adapters.some((a) => a.name === name)) {
      const known = adapters.map((a) => a.name).join(", ") || "none";
      throw new Error(`no adapter for network "${name}" (available: ${known})`);
    }
  }

  const inlined = await bundleGame(cwd);

  return targets.map((name) => {
    // targets are validated above, so the adapter is always found
    const adapter = adapters.find((a) => a.name === name) as RomuAdapter;
    return packageFor(adapter, config, inlined);
  });
}

/** One Vite build of the user's game, folded into a single HTML string. */
async function bundleGame(cwd: string): Promise<string> {
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
      // Single-bundle output is the point; Vite's chunk-size warning is noise here.
      chunkSizeWarningLimit: 10 * 1024,
      rollupOptions: {
        // No code splitting: dynamic import() chunks (e.g. Pixi's lazy-loaded
        // renderers) would be separate files a single-HTML playable can't load.
        output: { inlineDynamicImports: true },
      },
    },
  });

  const rawHtml = await readFile(path.join(viteOut, "index.html"), "utf8");
  // build.base is "./", so asset refs are relative to the output root
  return inlineHtml(rawHtml, (assetPath) =>
    readFileSync(path.join(viteOut, assetPath), "utf8"),
  );
}

function packageFor(
  adapter: RomuAdapter,
  config: RomuConfig,
  inlined: string,
): NetworkResult {
  const html = injectBridge(inlined, adapter.bridge(config));
  const pkg = adapter.package({ html });
  const primary = pkg.files.find((f) => f.path === pkg.primary);
  return {
    network: adapter.name,
    pkg,
    size: primary?.contents.byteLength ?? 0,
    limit: adapter.spec.maxSizeBytes,
    issues: [...lintPackage(pkg, adapter.spec), ...adapter.validate(pkg)],
  };
}

function printResult(result: NetworkResult, label: string): void {
  const pct = Math.round((result.size / result.limit) * 100);
  console.log(
    `  ${result.network}  ${label}  ${formatBytes(result.size)} / ${formatBytes(result.limit)} (${pct}%)`,
  );
  for (const issue of result.issues) {
    console.log(`  ${result.network}  ${issue.severity}: ${issue.message}`);
  }
}
