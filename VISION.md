# Romu — Vision

> An open-source framework for playable ads. Set up with Next.js-level ease, write
> your game once, and get publish-ready packages for every ad network with a single
> build command.

This document describes the **full product vision**; it is not a v1 scope. What goes
into v1 will be selected from this map during the roadmap phase.

---

## The problem

The hard part of making a playable ad is not writing the game — it's **publishing
it**. Every ad network has its own rules, and they are incompatible with each other:

| Network | Package format | Size limit | CTA call |
|---|---|---|---|
| Meta (Facebook) | Single HTML | 5 MB | `FbPlayableAd.onCTAClick()` |
| Google Ads | ZIP | 5 MB | `ExitApi.exit()` |
| AppLovin | Single HTML | 5 MB | `mraid.open(url)` |
| Unity LevelPlay (ironSource) | Single HTML | 5 MB | `dapi.openStoreUrl()` |
| Mintegral | ZIP + custom calls | 5 MB | `window.install()` |
| Vungle / Liftoff | ZIP | 5 MB | MRAID |
| TikTok / Pangle | ZIP + config | 5 MB | Proprietary API |

*(Values are representative; the up-to-date, sourced truth will live in `@romujs/specs`.)*

Today, studios package the same game for each network by hand — with ad-hoc scripts
or expensive closed tools like Luna Labs. There is no web-native, open, well-designed
playable framework. Romu fills that gap.

## The solution: the Next.js analogy

- `npm create romu` → scaffold a project from a template
- `romu dev` → hot reload + phone-framed preview + network simulator
- One API in game code: `cta()`, `gameEnd()`, `onVolumeChange()` — no network differences
- `romu build --network all` → spec-compliant, size-validated output for every network

Three pillars set Romu apart from "yet another boilerplate":
**unified SDK + adapter architecture + size-budgeted asset pipeline.**

## Engine stance

**Engine-agnostic core, Pixi.js as a first-class citizen.** The Vite model: the CLI,
build, adapters, and SDK depend on no engine; engine integration lives at the
template + helper-package level (`@romujs/pixi` first, `@romujs/three` later). The
community can add integrations like `@romujs/phaser` on its own. Industry reality:
~75-80% of playables are 2D and Pixi is the de facto standard; Three.js leads in 3D.

## Audience and model

**Open-source community project.** Published on npm, documented, open to
contributions. User profile: studios/agencies producing playables, indie developers,
and frontend developers building for UA (user acquisition) teams.

---

## Feature map

### 1. CLI and project scaffolding
- `npm create romu` — template selection, TypeScript by default
- `romu dev`, `romu build`, `romu check` (spec validation), `romu preview`
- `romu.config.ts` — CTA store links (iOS/Android), target networks, variants

### 2. Unified SDK (`@romujs/sdk`) — the heart of the framework
- Lifecycle: `onReady`, `onPause` / `onResume` (visibility), `onVolumeChange`
- `cta()` — compiled to the correct network call based on the build target
- `gameEnd()`, `retry()`, orientation changes, `getLanguage()`
- Standard analytics events (`interaction`, `level_complete`) → mapped to whatever
  mechanism the network supports

### 3. Adapter system (`@romujs/adapter-*`)
- Each adapter is a contract: package format, SDK shim, size limit, forbidden-API
  list, validation rules
- Targets: Meta, Google, AppLovin, Unity LevelPlay, Mintegral, Vungle/Liftoff,
  Moloco, TikTok/Pangle
- An open API so the community can write new adapters

### 4. Spec registry (`@romujs/specs`)
- Every network's limits, formats, and restrictions — machine-readable,
  date-stamped, sourced, in one place. Consumed by adapters and the linter.
- The "caniuse of playable specs": a reference even non-users will visit, and the
  easiest place to contribute. Networks change specs silently, so the community
  keeps it current.

### 5. Asset pipeline
- Single-file inlining (base64), texture atlases, WebP conversion, audio
  compression, font subsetting
- **Size budget report**: per network — "you're at X% of the limit, your 5 largest
  assets are these" — with the engine/library share shown as its own line item
- Compression level can auto-adjust to the network's limit

### 6. Engine size discipline
- Game + engine must fit together inside the network size limits
- Aggressive tree-shaking, bundling only the Pixi modules actually used,
  a lightweight tween alternative (not being locked into GSAP)

### 7. Developer experience
- Dev server with hot reload, phone-framed preview (device/orientation selection)
- **Network simulator**: MRAID / dapi / FbPlayableAd mocks — "how does this
  playable behave inside ironSource"
- Instant on-device testing via QR code
- Live size indicator (HUD)
- **Low-end device simulation**: CPU/GPU throttling mode, draw call / texture
  memory warnings (playables run in low-end Android webviews)

### 8. Game layer (`@romujs/pixi`)
- Scene management and a **playable flow machine**: load → tutorial → gameplay →
  win/lose → end card; industry rules like "show the CTA after X seconds of
  inactivity" or "gameplay must start within Y seconds" are enforced at this layer
- Portrait/landscape responsive layout system
- Ready-made components: tutorial hand, CTA button, end card, countdown
- Audio manager (auto-wired to network volume events), tween integration

### 9. Genre templates
- `npm create romu --template runner` → a skeleton with working mechanics where
  only assets and tuning need to change
- Proven playable patterns: match-3 teaser, runner, pin-pull puzzle, merge,
  tower defense...
- Templates are not tech demos — they are games designed with conversion
  patterns in mind

### 10. Quality and validation
- Spec linter: external requests, forbidden APIs, size overruns, traps like
  `localStorage`
- An automated checklist ensuring output passes each network's official test tool
- A test suite tracking spec changes (CI validation against network specs)

### 11. Growth features (further vision)
- **Variant build matrix**: language × network × A/B variant → dozens of outputs
  from a single command
- Shareable preview page (send a client a link, they try it on their phone)
- Video fallback capture (some networks require a static/video backup)

### 12. Ecosystem
- Docs site, live playground, example gallery, plugin API, contribution guide

---

## Non-goals (for now)

- **WebAssembly is not an output target.** Networks want a single HTML/ZIP; WASM
  can only be a technology inside the package, and is generally avoided due to size.
- Competing with Unity/Cocos export pipelines — Romu plays on the web-native side.
- Automatic upload to ad networks / campaign management (maybe much later).

## Locked decisions

| Decision | Outcome |
|---|---|
| Model | Open-source community project |
| Engine | Agnostic core + `@romujs/pixi` first-class, `@romujs/three` later |
| Structure | Monorepo, multiple packages (`@romujs/*`), TypeScript |
| Output | Spec-compliant HTML/ZIP per network (not WASM) |
| Next step | Tech stack → architecture → roadmap (v1 scope chosen in the roadmap) |
