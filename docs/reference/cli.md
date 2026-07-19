# CLI commands

The `romu` CLI ships with your project (`npm install` puts it in
`node_modules/.bin`), so the npm scripts in a scaffolded project just work.

## `romu dev [--network <id>]`

Vite dev server with hot reload. By default the **simulator bridge** is
injected: SDK calls work without any ad container, and CTA clicks log to the
console with an on-screen toast.

**Emulated environments.** The floating "romu env" picker (or `?network=<id>`
in the URL, or the `--network` flag) switches the page into a network's
emulated environment: the adapter's **real production bridge** runs against a
mock ad container — a fake `mraid`/`dapi`/`FbPlayableAd` with realistic
readiness and viewability timing. Games that start before the container allows
it surface here instead of in network review.

**On-device testing.** The server listens on your LAN and prints a QR code in
the terminal — scan it with a phone on the same Wi-Fi. Hot reload works on the
device too. (macOS may ask to allow incoming connections on first run.)

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
