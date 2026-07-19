import { createServer } from "vite";
import { loadConfig } from "./config.js";
import { simulatorBridge } from "./simulator.js";

export interface DevOptions {
  /** Project root; defaults to the current working directory. */
  cwd?: string;
}

/**
 * `romu dev`: Vite's dev server with the simulator bridge injected, so SDK
 * calls work (and are visible) without any ad network container.
 */
export async function dev(options: DevOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd);

  const server = await createServer({
    root: cwd,
    configFile: false,
    plugins: [
      {
        name: "romu:simulator-bridge",
        transformIndexHtml() {
          return [
            {
              tag: "script",
              children: simulatorBridge(config),
              injectTo: "head-prepend",
            },
          ];
        },
      },
    ],
  });

  await server.listen();
  server.config.logger.info("\n  romu dev — simulator bridge active\n");
  server.printUrls();
}
