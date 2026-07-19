#!/usr/bin/env node
/**
 * The `romu` command. Thin by design: parse arguments, call @romu/core, print
 * nicely. Anything smarter than that belongs in core.
 */

import { build, dev, knownNetworks } from "@romu/core";
import { Command } from "commander";

const program = new Command();

program
  .name("romu")
  .description("The open-source framework for building playable ads")
  .version("0.0.0");

program
  .command("dev")
  .description("Start the dev server with the network simulator")
  .action(async () => {
    await run(() => dev());
  });

program
  .command("build")
  .description("Build publish-ready packages for ad networks")
  .option("--network <name>", "target network, or 'all'", "all")
  .action(async (options: { network: string }) => {
    await run(() => build({ network: options.network }));
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
