# Romu — Roadmap

## Guiding principle: the walking skeleton

Get the thinnest end-to-end thread working first, then thicken it with every
phase. Each phase ends with something demoable. It worked: the v1 thread went
from empty repo to published packages in five phases.

## Status

**v0.1.x is live on npm** (July 19, 2026): `npm create romu` scaffolds a
Pixi.js playable and `romu build` produces validated single-file packages for
Meta, AppLovin, and Unity LevelPlay. Releases are automated — changesets on
`main` open a Version Packages PR; merging it publishes.

| Phase | Scope | Status |
|---|---|---|
| 0 | Monorepo foundation (pnpm, Turborepo, CI, Changesets) | ✅ |
| 1 | Walking skeleton: `romu dev`, naive build, Meta adapter, example game | ✅ |
| 2 | Source-verified spec registry, AppLovin + LevelPlay adapters, generic linter, `romu check` | ✅ |
| 3 | Asset pipeline: WebP inlining, size breakdown (engine/game/assets) | ✅ |
| 4 | `create-romu`, README, VitePress docs, npm release → **v0.1.0** | ✅ |
| 5 | Dev experience (below) | ✅ |
| 6 | Game layer + low-end device tooling | next |
| 7 | Adapter expansion | planned |
| 8 | Genre templates | planned |

## Phase 5 — Dev experience (shipped)

- **Emulated network environments**: the adapter's real production bridge
  running against a mock ad container (`mraid`/`dapi`/`FbPlayableAd` with
  realistic readiness/viewability timing), switchable per page load. Adapters
  ship their own mock via the optional `devMock()` contract member.
- **On-device testing**: LAN-exposed dev server + terminal QR code, hot
  reload included; LAN URL selection avoids virtual interfaces.
- **Overlay panel**: corner badge → panel with environment picker, volume
  slider and ad-visibility toggle (chaos controls driving real container
  events), and a size HUD running the actual build pipeline in memory with
  color-coded budget bars. `Ctrl+.` hides it; `--no-overlay` disables it.
- **SDK lifecycle growth**: `onVolumeChange` (0..1 normalized) and
  `onPause`/`onResume` (viewability-driven — games must freeze while hidden).
- **Phone-framed preview**: `/__romu/frame` shell with viewport presets
  (Android S 360×640 default, phone M/L, tablet) and rotation; the panel
  controls the game inside the frame.

## Phase 6 — Game layer + low-end device tooling

The `@romujs/pixi` package plus the performance story, which belongs with it:

- Playable flow machine (load → tutorial → gameplay → end card, with
  industry timing rules), responsive layout system, ready-made components
  (tutorial hand, CTA button, end card), audio manager wired to
  `onVolumeChange`/`onPause`.
- **Low-end device simulation** (moved here from phase 5): FPS meter and
  long-frame warnings in the overlay; an in-page "CPU tax" throttle that also
  works on devices; optionally real CDP-driven CPU throttling via a managed
  Chrome. Draw-call / texture-memory warnings come from the Pixi layer, which
  is why this lives in phase 6.

## Phase 7 — Adapter expansion

Mintegral, Vungle/Liftoff, Google, TikTok/Pangle, Moloco — each lands with a
sourced spec entry, a bridge, a dev mock, and verification against the
network's official test tool. The community adapter guide matures alongside.

## Phase 8 — Genre templates

`npm create romu --template runner|pin-pull|match3` — skeletons with working
mechanics designed around conversion patterns, not tech demos.

## Beyond

Variant build matrix (language × network × A/B), shareable preview pages,
video fallback capture, `@romujs/three`.

## Decisions taken

| Decision | Rationale |
|---|---|
| First adapter: Meta | Most-requested network with the strictest content rules; passing it first de-risked the rest |
| Game layer post-v1 | Romu's core value is the publish side; v1 users write vanilla Pixi + the SDK |
| v1 as 0.1.0 public alpha | Honest signal: usable, APIs may move |
| npm scope `@romujs`, CLI package `romujs` | "romu" org was taken; unscoped `romu` blocked by npm's typosquat filter (≈"rome"). The binary is still `romu` — UX unchanged |
| Meta spec: 5 MB | Corrected from the widely-cited 2 MB against Meta's current help page — the registry working as intended |
| Low-end device simulation in phase 6 | CPU throttling is a standalone feature; draw-call/texture warnings need the Pixi layer anyway |
