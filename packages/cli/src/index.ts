#!/usr/bin/env node
/**
 * The `romu` command. Thin by design: parse arguments, call @romujs/core, print
 * nicely. Anything smarter than that belongs in core.
 */

import { createRequire } from "node:module";
import { applovinAdapter } from "@romujs/adapter-applovin";
import { levelplayAdapter } from "@romujs/adapter-levelplay";
import { metaAdapter } from "@romujs/adapter-meta";
import {
  build,
  check,
  dev,
  knownNetworks,
  type RomuAdapter,
} from "@romujs/core";
import { Command } from "commander";

const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

/** Adapters that ship with the CLI. */
const builtinAdapters: RomuAdapter[] = [
  metaAdapter,
  applovinAdapter,
  levelplayAdapter,
];

const program = new Command();

program
  .name("romu")
  .description("The open-source framework for building playable ads")
  .version(version);

program
  .command("dev")
  .description("Start the dev server with the network simulator")
  .option(
    "--network <name>",
    "start in a network's emulated environment (e.g. applovin)",
  )
  .option("--no-overlay", "don't inject the dev overlay panel")
  .action(async (options: { network?: string; overlay: boolean }) => {
    await run(() =>
      dev({
        adapters: builtinAdapters,
        network: options.network,
        overlay: options.overlay,
      }),
    );
  });

program
  .command("build")
  .description("Build publish-ready packages for ad networks")
  .option("--network <name>", "target network, or 'all'", "all")
  .action(async (options: { network: string }) => {
    await run(() =>
      build({ network: options.network, adapters: builtinAdapters }),
    );
  });

program
  .command("check")
  .description("Validate every configured network without writing dist/")
  .action(async () => {
    await run(async () => {
      await check({ adapters: builtinAdapters });
    });
  });

program
  .command("networks")
  .description("List networks known to the installed spec registry")
  .action(() => {
    for (const network of knownNetworks()) {
      console.log(network);
    }
  });

async function run(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`romu: ${message}`);
    process.exitCode = 1;
  }
}

program.parse();
