# Romu — Roadmap

## Guiding principle: the walking skeleton

The classic way framework projects die is months of infrastructure with nothing
running end-to-end. The antidote: get the **thinnest end-to-end thread** working
first (scaffold → play → build, however crude), then thicken that thread with every
phase. Each phase ends with something demoable — which, for an open-source project,
also means something to share.

## v1 in one sentence

> A stranger can run `npm create romu`, scaffold a project from a single template,
> play it in `romu dev`, and get valid, uploadable packages for
> **Meta + AppLovin + Unity LevelPlay** from `romu build`.

Everything not in that sentence is post-v1: simulator UI, genre templates, variant
matrix, Three.js, low-end device mode...

## Phases to v1

### Phase 0 — Foundation *(~1 week)*
Monorepo skeleton: pnpm workspaces, Turborepo, Biome, Vitest, GitHub Actions,
Changesets. Empty-but-wired `core`, `cli`, `sdk`, `specs` packages.
**Done when:** `pnpm build` compiles all packages in dependency order, CI is green.

### Phase 1 — Walking skeleton *(~2–3 weeks)*
The thinnest end-to-end thread: a hand-written Pixi game in `examples/`; `romu dev`
(first programmatic Vite server); `romu build` (naive single-HTML inlining, no
compression); SDK with just `cta()` + `onReady()` + the simulator bridge; **one
adapter: Meta**.
**Done when:** `dist/meta/playable.html` runs in a browser and the CTA flows
through the bridge. The framework's heart beats for the first time.

### Phase 2 — Spec registry + real adapters *(~2–3 weeks)*
First three entries in `@romu/specs`; the adapter contract finalized; AppLovin and
Unity LevelPlay (dapi) adapters; the spec linter + `romu check`; first size report.
**Done when:** `romu build --network all` produces three valid packages, each
manually verified against the networks' **official test tools**. That verification
is the real work of this phase — it's where we learn the specs from reality, not
from PDFs.

### Phase 3 — Asset pipeline *(~2 weeks)*
WebP conversion via sharp, audio compression, real base64 inlining; a size budget
report showing per-asset cost with the engine as its own line item.
**Done when:** the example game fits comfortably under every configured network's
size limit and the report says who costs how many KB.

### Phase 4 — DX polish and release → v1 🚀 *(~2 weeks)*
`create-romu` (interactive clack prompts) + one Pixi template; README + VitePress
docs (getting started, config reference, writing-an-adapter guide); first npm
release via Changesets (v0.1.0, "public alpha").
**Done when:** the v1 sentence can be lived end-to-end by a stranger.

Total: roughly **2–2.5 months** at side-project pace (half that full-time).
Estimates are soft — what's locked is the phase order and the done criteria.

## Post-v1 horizon (ordered, undated)

- **Phase 5 — Dev experience:** phone-framed preview, network simulator panel,
  QR on-device testing, live size HUD
- **Phase 6 — Game layer (`@romu/pixi`):** playable flow machine, responsive
  system, tutorial hand / end card components, audio manager
- **Phase 7 — Adapter expansion:** Mintegral, Vungle/Liftoff, Google,
  TikTok/Pangle, Moloco + a mature community adapter guide
- **Phase 8 — Genre templates:** runner, pin-pull, match-3... (where the game
  design muscle shows)
- **Beyond:** variant matrix, shareable previews, video fallback, low-end device
  simulation, `@romu/three`

The ordering logic: phases 5–6 improve life for existing users (retention),
phases 7–8 bring new users (growth) — harden the product first, then widen it.

## Decisions taken

| Decision | Rationale |
|---|---|
| First adapter: **Meta** | Most-requested network with the strictest content rules (single file, no external calls, no mraid), so passing it first de-risks everything after |
| Game layer is **post-v1** | v1 users write vanilla Pixi + our SDK; Romu's core value is the publish side |
| Release v1 as **0.1.0 public alpha** | Honest signal: usable, APIs may still move |
