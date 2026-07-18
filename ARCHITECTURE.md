# Romu — Architecture

How the pieces fit together. Three load-bearing ideas:

1. **Thin CLI / thick core** — the CLI is terminal UX only; everything real is a
   function in `@romu/core`.
2. **The bridge pattern** — the SDK never knows about networks; each adapter
   injects a tiny bridge script at build time.
3. **A four-member adapter contract** — adding a network = filling in four members.

---

## Monorepo layout

```
romu/
├── packages/
│   ├── create-romu/      # npm create romu → scaffolds a project
│   ├── cli/              # romu dev/build/check — THIN: parses commands,
│   │                     #   calls core, prints pretty output
│   ├── core/             # THE ENGINE: build pipeline, Vite plugins,
│   │                     #   asset pipeline, dev server, adapter runner
│   ├── sdk/              # user-facing API: cta(), onReady(), gameEnd()...
│   ├── specs/            # spec registry: network limits (data + types)
│   ├── adapter-meta/     # one package per network
│   ├── adapter-applovin/
│   ├── ...
│   └── pixi/             # game layer (scenes, responsive, flow machine)
├── templates/            # project templates copied by create-romu
├── examples/             # sample playables (double as our test bed)
└── docs/                 # VitePress site
```

**Why cli/core are separate:** `cli` owns the terminal experience (arg parsing,
spinners, colored errors); every real operation lives in `core` as an importable
function. A CI script — or a future cloud build service — can drive Romu without a
terminal. Analogy: `core` is the logic/hooks, `cli` is the component rendering it.

## Build flow

What happens on `romu build --network meta`:

```
romu.config.ts ──► [1] load config, validate with zod
                        │
                   [2] Vite build (user's game code → one JS bundle)
                        │     our Vite plugins run inside:
                        │     • asset plugin: png→webp (sharp), audio compression
                        │     • size tracking: who costs how many KB
                        │
                   [3] adapter-meta takes over:
                        │     • inject the SDK bridge (see below)
                        │     • inline everything into ONE HTML via base64
                        │
                   [4] validation: spec linter + size budget report
                        │     (against Meta's rules from @romu/specs)
                        ▼
                   dist/meta/playable.html   ✅ ready to publish
```

With `--network all`, steps [3]–[4] repeat per adapter; [1]–[2] run once.
`romu dev` runs the same [2] in server mode instead of build mode, and injects the
**simulator bridge** in place of a real adapter's bridge.

## The bridge pattern (the heart of the framework)

How does `cta()` end up calling Meta's code in a Meta build? Two options existed:

- **(a) Compile-time rewriting:** find `cta()` calls during build and replace them
  with network code. Clever but fragile — hard to debug, and the code that runs is
  no longer the code the user wrote.
- **(b) The bridge (build-time dependency injection):** the SDK never changes; only
  the thing it talks to changes per build. **Chosen: (b).**

Three small pieces:

```ts
// @romu/sdk — what users import. Knows NOTHING about networks:
export function cta() {
  window.__ROMU_BRIDGE__.cta();      // just talks to the bridge
}

// the ~15-line bridge adapter-meta injects into the HTML at build time:
window.__ROMU_BRIDGE__ = {
  cta: () => FbPlayableAd.onCTAClick(),
  getVolume: () => { /* Meta's way */ },
};

// adapter-applovin's version:
window.__ROMU_BRIDGE__ = {
  cta: () => mraid.open(config.storeUrl),
  // ...
};
```

The user's bundle is byte-identical across networks; each package just embeds a
different bridge script. The dev server injects a simulator bridge through the same
hole (`cta: () => console.log("[romu-sim] CTA!")` + an on-screen notification).
Writing an adapter reduces to "fill in this handful of bridge functions" — a low
bar for community contributions.

## The adapter contract

What an adapter **must** provide:

```ts
interface RomuAdapter {
  name: string;                         // "meta"
  spec: NetworkSpec;                    // from @romu/specs: limit, format, bans
  bridge(config: RomuConfig): string;   // produces the bridge script above
  package(build: BuildOutput): Package; // single HTML or ZIP — builds the package
  validate(pkg: Package): Issue[];      // network-specific extra checks
}
```

Four members, that's all. `core` works against this contract and never looks
inside an adapter — like React's "a component takes props and returns JSX"
contract. Adding a network = a new package implementing these four members.

## Anatomy of a user project

What `npm create romu` produces:

```
my-playable/
├── romu.config.ts        # store links, target networks, variants
├── package.json          # "dev": "romu dev", "build": "romu build"
├── index.html            # entry (most users never touch it)
├── src/
│   ├── main.ts           # game entry — SDK and Pixi meet here
│   └── scenes/           # tutorial, gameplay, endcard...
└── assets/
    ├── images/  audio/  fonts/
```

And the config:

```ts
export default defineConfig({
  store: {
    ios: "https://apps.apple.com/app/id...",
    android: "https://play.google.com/store/apps/details?id=...",
  },
  networks: ["meta", "applovin", "unity"],
});
```

`defineConfig` is the Vite/Next trick: it only exists to give TypeScript the shape,
so users get autocomplete while writing config.
