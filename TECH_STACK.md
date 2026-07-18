# Romu — Tech Stack

Decisions locked for building the Romu monorepo. This covers the tools **we** use to
develop Romu; end users only need Node and the package manager of their choice
(`npm`/`yarn`/`pnpm`/`bun`) — published `@romu/*` packages are consumable by any of them.

## Overview

| Area | Choice | Role |
|---|---|---|
| Language | **TypeScript** (strict) | Everything is typed; published types power user DX |
| Package manager / workspace | **pnpm workspaces** | Links `@romu/*` packages to each other during development |
| Task runner | **Turborepo** | Builds packages in dependency order, caches unchanged ones |
| Library bundler | **tsup** | Compiles `@romu/*` packages to publish-ready ESM + `.d.ts` |
| Build & dev engine | **Vite** (programmatic API) | Powers `romu dev` (HMR server) and `romu build` (bundling) |
| CLI | **commander** + **@clack/prompts** | Command/flag parsing + interactive scaffolding prompts |
| Config validation | **zod** | Validates `romu.config.ts` with human-friendly errors |
| Image processing | **sharp** | WebP conversion & compression in the asset pipeline |
| Unit testing | **Vitest** | Fast, Vite-native, Jest-compatible API |
| E2E testing | **Playwright** | Loads built playables in real browsers; spec compliance checks |
| Lint + format | **Biome** | Single fast tool replacing ESLint + Prettier |
| Versioning & publishing | **Changesets** | Per-package versioning, changelogs, automated npm releases |
| CI | **GitHub Actions** | Tests + lint on every PR; release automation via Changesets |
| Docs site | **VitePress** | Markdown-driven docs, same ecosystem as the rest of the stack |
| Node target | **>= 20** | Safest common baseline for a user-facing tool |

## Rationale

### TypeScript
Non-negotiable for a framework: the types we publish are what give users
autocomplete and inline docs for `cta()`, `romu.config.ts`, and every adapter option.

### pnpm workspaces
The de facto monorepo standard (used by Vite, Next.js, SvelteKit). The `workspace:*`
protocol links local packages without publishing; strict dependency resolution
prevents "accidentally works on my machine, breaks for users" phantom dependencies.

### Turborepo
Solves task ordering ("build `@romu/sdk` before `@romu/cli`") and caching ("only one
package changed — rebuild that one, restore the rest from cache"). Chosen over Nx for
its near-zero learning curve: one `turbo.json`.

### tsup
Compiles our library packages into publish-ready output (ESM + type declarations)
with near-zero config, avoiding the module-resolution minefield of hand-rolled
`tsc` setups. Note: tsup builds **Romu's packages**; users' games are built by Vite.

### Vite (programmatic API)
The heart of `romu dev` and `romu build`. We inherit a battle-tested dev server,
HMR, fast bundling, and a mature plugin ecosystem for free, and only write the
playable-specific parts as Vite plugins (single-file inlining, size reporting, SDK
injection, network shims). Same approach as Astro and SvelteKit.

### commander + @clack/prompts
commander is the long-standing standard for command/flag parsing. clack provides the
polished interactive prompts (template picker, project name) behind modern `create-*`
CLIs like Astro's and Svelte's — it's what makes `npm create romu` feel first-class.

### zod
Schema validation for `romu.config.ts`: missing store URLs, invalid network names,
and malformed variants fail fast with readable errors instead of exploding
mid-build.

### sharp
The standard Node image library (libvips under the hood). Critical because inlining
has a cost: base64 encoding inflates bytes by ~33%, so aggressive compression
(PNG → WebP) *before* inlining is what makes fitting a 2 MB budget possible.

### Vitest + Playwright
Vitest for unit tests (adapter output, size math, config parsing). Playwright for
what Romu actually promises: loading a built playable in a real browser and
asserting spec compliance — no external requests, no console errors, CTA wired.

### Biome
Lint + format in one fast tool with one config file. For an open-source repo,
automated style enforcement in CI keeps contributions frictionless. We have no
exotic ESLint-plugin needs, so there is no downside.

### Changesets
The monorepo release standard (Vite, SvelteKit). Contributors attach a small
markdown note to their PR; CI computes per-package version bumps, writes
changelogs, and publishes to npm on merge.

### GitHub Actions
Free for open source, native to where the repo lives, first-class Changesets
integration.

### VitePress
Markdown in, polished docs site out (search, dark mode, default theme). Powers
Vite's and Rollup's own docs. Lives in `docs/`, separate from shipped code.

## Deliberately not chosen

- **Bun** as runtime — Romu is a user-facing tool; Node >= 20 is the safest common
  denominator. (Users can still install Romu with bun.)
- **Nx** — more powerful than Turborepo, but too much conceptual overhead here.
- **Lerna** — legacy.
- **webpack** — no place in a greenfield 2026 project.
- **GSAP in the core** — free now, but heavy for playable size budgets; the tween
  decision belongs to the game-layer design (architecture phase).

## The stack at a glance

- **Around our code:** TypeScript, Biome, Vitest, Playwright
- **Running the monorepo:** pnpm, Turborepo, Changesets, GitHub Actions
- **Embedded inside Romu:** Vite, commander/clack, zod, sharp
- **On the side:** tsup (package output), VitePress (docs)

One philosophy throughout: ESM-native, minimal config, fast — Vite, Vitest,
VitePress, tsup, and Biome are all cut from the same cloth.
