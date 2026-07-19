# Romu

> The open-source framework for building playable ads.
> Write your game once — ship spec-compliant builds for every ad network.

[![CI](https://github.com/erenster2000/romu/actions/workflows/ci.yml/badge.svg)](https://github.com/erenster2000/romu/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/romujs?label=romujs)](https://www.npmjs.com/package/romujs)
[![npm](https://img.shields.io/npm/v/create-romu?label=create-romu)](https://www.npmjs.com/package/create-romu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Status: public alpha.** The core thread works end to end; APIs may still move.

## Why

The hard part of a playable ad isn't the game — it's publishing it. Every ad
network wants a different package (single HTML vs ZIP), a different size limit,
and a different call when the player taps "Download": Meta wants
`FbPlayableAd.onCTAClick()`, AppLovin wants `mraid.open(url)`, Unity LevelPlay
wants `dapi.openStoreUrl()`. Studios re-package the same game per network by
hand, or pay for closed tools.

Romu makes it one codebase and one command:

```bash
npm create romu            # scaffold a project (Pixi.js template)
npm run dev                # dev server + network simulator bridge
npm run build              # validated packages for every configured network
```

```
bundle breakdown (approx, minified):
  engine (pixi.js)  512.5 KB
  game code         1.3 KB
  assets (2):
    assets/images/bg.png  35.0 KB inlined → webp (was 207.0 KB)
meta       dist/meta/playable.html       587.9 KB / 5.00 MB (11%)
applovin   dist/applovin/playable.html   588.8 KB / 5.00 MB (12%)
levelplay  dist/levelplay/playable.html  588.5 KB / 5.00 MB (11%)
```

## How it works

Game code imports one SDK and never learns which network it runs on:

```ts
import { cta, onReady } from "@romujs/sdk";

onReady(() => startGame());
downloadButton.on("pointerdown", () => cta());
```

At build time each network's **adapter** injects a ~15-line bridge script that
routes `cta()` to that network's API, inlines everything into a single
self-contained HTML file (images re-encoded to WebP via the asset pipeline),
and validates the result against a **source-verified spec registry** — size
limits, forbidden APIs, packaging rules. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Packages

| Package | What it is |
|---|---|
| `romujs` | The CLI: `romu dev`, `romu build`, `romu check` |
| `create-romu` | Project scaffolding — `npm create romu` |
| `@romujs/sdk` | The unified SDK game code imports |
| `@romujs/core` | Build pipeline, dev server, asset pipeline, adapter runner |
| `@romujs/specs` | Machine-readable, dated, sourced network specs |
| `@romujs/adapter-meta` | Meta (Facebook/Instagram) |
| `@romujs/adapter-applovin` | AppLovin (MRAID v2) |
| `@romujs/adapter-levelplay` | Unity LevelPlay / ironSource (dapi) |

## Supported networks

Meta, AppLovin, and Unity LevelPlay today. Mintegral, Vungle/Liftoff, Google,
TikTok/Pangle, and Moloco are on the [roadmap](ROADMAP.md) — and the adapter
contract is four members, so [writing one](ARCHITECTURE.md#the-adapter-contract)
is a friendly first contribution.

## Project documents

- [VISION.md](VISION.md) — the full product vision
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the pieces fit together
- [TECH_STACK.md](TECH_STACK.md) — tooling decisions and why
- [ROADMAP.md](ROADMAP.md) — phases, done criteria, what's next

## Development

```bash
pnpm install
pnpm build     # builds every package + the example playable
pnpm test
pnpm lint
```

The example game lives in [examples/tap-game](examples/tap-game); building the
monorepo also builds it against every adapter, so the repo's own CI is an
end-to-end test of the whole thread.

## License

[MIT](LICENSE)
