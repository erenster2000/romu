# CLI commands

The `romu` CLI ships with your project (`npm install` puts it in
`node_modules/.bin`), so the npm scripts in a scaffolded project just work.

## `romu dev`

Vite dev server with hot reload and the **simulator bridge** injected: SDK
calls work without any ad container. CTA clicks log to the console and show an
on-screen toast.

## `romu build [--network <id>]`

Builds publish-ready packages. Defaults to `--network all` (every network in
your config). Pipeline per network:

1. one Vite build of your game (assets inlined, WebP conversion, no code
   splitting),
2. inject that network's bridge script,
3. package into the network's delivery format,
4. lint against the spec registry + adapter-specific checks,
5. write `dist/<network>/` and print the size report.

Validation **errors** fail the build (non-zero exit); warnings don't.

## `romu check`

The exact build pipeline without writing `dist/` — validates every configured
network in memory. Useful in CI.

## `romu networks`

Lists the network ids known to the installed spec registry.
