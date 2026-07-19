import { createRequire } from "node:module";
import { createServer } from "vite";
import type { RomuAdapter } from "./adapter.js";
import { measure } from "./build.js";
import { loadConfig } from "./config.js";
import { devScripts, pickLanUrl, SIMULATOR } from "./devtools.js";
import { formatBytes } from "./format.js";

export interface DevOptions {
  /** Project root; defaults to the current working directory. */
  cwd?: string;
  /** Adapters whose environments the dev server can emulate. */
  adapters?: RomuAdapter[];
  /** Environment to start in when the URL doesn't say otherwise. */
  network?: string;
  /** Set false to never inject the dev overlay panel. */
  overlay?: boolean;
}

/**
 * `romu dev`: Vite's dev server, exposed to the LAN with a QR code for
 * on-device testing. Each page load gets the selected environment injected —
 * the generic simulator by default, or a network's mock container plus its
 * real bridge via ?network=<id> (switchable from the overlay panel). The
 * panel also offers chaos buttons and an on-demand size HUD backed by the
 * /__romu/measure endpoint, which runs the real build pipeline in memory.
 */
export async function dev(options: DevOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd);
  const adapters = options.adapters ?? [];
  const fallback = options.network ?? SIMULATOR;
  const overlay = options.overlay ?? true;

  const server = await createServer({
    root: cwd,
    configFile: false,
    server: { host: true },
    plugins: [
      {
        name: "romu:dev-environment",
        configureServer(viteServer) {
          viteServer.middlewares.use("/__romu/measure", (_req, res) => {
            measure({ cwd, adapters })
              .then((results) => {
                const payload = results.map((r) => ({
                  network: r.network,
                  size: r.size,
                  limit: r.limit,
                  pct: Math.round((r.size / r.limit) * 100),
                  pretty: `${formatBytes(r.size)} / ${formatBytes(r.limit)}`,
                  errors: r.issues.filter((i) => i.severity === "error").length,
                }));
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(payload));
              })
              .catch((error: unknown) => {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              });
          });
        },
        transformIndexHtml: {
          order: "pre",
          handler(_html, ctx) {
            const query = ctx.originalUrl?.split("?")[1] ?? "";
            const requested =
              new URLSearchParams(query).get("network") ?? fallback;
            const { scripts } = devScripts(requested, config, adapters, {
              overlay,
            });
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
