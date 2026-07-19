import { createRequire } from "node:module";
import { createServer } from "vite";
import type { RomuAdapter } from "./adapter.js";
import { loadConfig } from "./config.js";
import { devScripts, pickLanUrl, SIMULATOR } from "./devtools.js";

export interface DevOptions {
  /** Project root; defaults to the current working directory. */
  cwd?: string;
  /** Adapters whose environments the dev server can emulate. */
  adapters?: RomuAdapter[];
  /** Environment to start in when the URL doesn't say otherwise. */
  network?: string;
}

/**
 * `romu dev`: Vite's dev server, exposed to the LAN with a QR code for
 * on-device testing. Each page load gets the selected environment injected —
 * the generic simulator by default, or a network's mock container plus its
 * real bridge via ?network=<id> (switchable from the floating toolbar).
 */
export async function dev(options: DevOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd);
  const adapters = options.adapters ?? [];
  const fallback = options.network ?? SIMULATOR;

  const server = await createServer({
    root: cwd,
    configFile: false,
    server: { host: true },
    plugins: [
      {
        name: "romu:dev-environment",
        transformIndexHtml: {
          order: "pre",
          handler(_html, ctx) {
            const query = ctx.originalUrl?.split("?")[1] ?? "";
            const requested =
              new URLSearchParams(query).get("network") ?? fallback;
            const { scripts } = devScripts(requested, config, adapters);
            return scripts.map((children) => ({
              tag: "script",
              children,
              injectTo: "head-prepend" as const,
            }));
          },
        },
      },
    ],
  });

  await server.listen();
  const info = server.config.logger.info.bind(server.config.logger);
  info(
    "\n  romu dev — environments: simulator (default)" +
      (adapters.some((a) => a.devMock)
        ? `, ${adapters
            .filter((a) => a.devMock)
            .map((a) => a.name)
            .join(", ")}`
        : ""),
  );
  server.printUrls();

  const lanUrl = pickLanUrl(server.resolvedUrls?.network ?? []);
  if (lanUrl) {
    const require = createRequire(import.meta.url);
    const qrcode = require("qrcode-terminal") as {
      generate(
        text: string,
        opts: { small: boolean },
        cb: (qr: string) => void,
      ): void;
    };
    qrcode.generate(lanUrl, { small: true }, (qr) => {
      info(`\n${qr}`);
      info("  Scan with your phone (same Wi-Fi) to test on-device.\n");
    });
  } else {
    info("  (no LAN address found — on-device QR unavailable)\n");
  }
}
