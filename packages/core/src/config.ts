import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build as esbuild } from "esbuild";
import { z } from "zod";

export const configSchema = z.object({
  store: z.object({
    ios: z.url({ error: "store.ios must be a full App Store URL" }),
    android: z.url({ error: "store.android must be a full Play Store URL" }),
  }),
  networks: z
    .array(z.string())
    .min(1, { error: "list at least one target network" }),
});

export type RomuConfig = z.infer<typeof configSchema>;

/** Identity helper whose only job is giving users autocomplete in romu.config.ts. */
export function defineConfig(config: RomuConfig): RomuConfig {
  return config;
}

/**
 * Loads and validates the project's romu.config.ts.
 *
 * The config is TypeScript, so we bundle it with esbuild first (bare imports
 * stay external and resolve from the project's node_modules), import the
 * temporary output, and delete it — the same approach Vite uses for its own
 * config files.
 */
export async function loadConfig(cwd: string): Promise<RomuConfig> {
  const file = path.join(cwd, "romu.config.ts");
  if (!existsSync(file)) {
    throw new Error(`no romu.config.ts found in ${cwd}`);
  }

  const compiled = `${file}.tmp-${process.pid}.mjs`;
  await esbuild({
    entryPoints: [file],
    outfile: compiled,
    bundle: true,
    packages: "external",
    format: "esm",
    platform: "node",
    logLevel: "silent",
  });

  let exported: unknown;
  try {
    const module = (await import(pathToFileURL(compiled).href)) as {
      default?: unknown;
    };
    exported = module.default;
  } finally {
    await rm(compiled, { force: true });
  }

  const parsed = configSchema.safeParse(exported);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "config"}: ${issue.message}`,
      )
      .join("\n");
    throw new Error(`invalid romu.config.ts:\n${issues}`);
  }
  return parsed.data;
}
