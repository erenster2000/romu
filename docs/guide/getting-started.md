# Getting started

## Create a project

```bash
npm create romu
```

Pick a name and a template (Pixi.js 2D). Then:

```bash
cd my-playable
npm install
npm run dev
```

`npm run dev` starts a dev server with the **simulator bridge**: your game runs
in the browser with hot reload, and SDK calls are visible — tapping your CTA
shows a toast instead of opening a store.

## Write the game

Two functions make your game network-ready:

```ts
import { cta, onReady } from "@romujs/sdk";

onReady(() => {
  // the ad container says the playable may start
  startGame();
});

downloadButton.on("pointerdown", () => {
  // sends the player to the store, however the current network wants it
  cta();
});
```

Import assets like modules — Romu's pipeline inlines and compresses them:

```ts
import bgUrl from "../assets/images/bg.png"; // becomes an inlined WebP data URI
```

## Configure

`romu.config.ts` holds your store links and target networks:

```ts
import { defineConfig } from "romu/config";

export default defineConfig({
  store: {
    ios: "https://apps.apple.com/app/id...",
    android: "https://play.google.com/store/apps/details?id=...",
  },
  networks: ["meta", "applovin", "levelplay"],
});
```

## Build

```bash
npm run build
```

Each `dist/<network>/playable.html` is a single self-contained file, validated
against that network's spec. The build prints a size breakdown first:

```
bundle breakdown (approx, minified):
  engine (pixi.js)  512.5 KB
  game code         1.3 KB
  assets (2):
    assets/images/bg.png  35.0 KB inlined → webp (was 207.0 KB)
meta       dist/meta/playable.html  587.9 KB / 5.00 MB (11%)
```

`npm run check` runs the same validation without writing `dist/`.

## Test on real network tools

- **AppLovin** — upload `dist/applovin/playable.html` to the
  [Playable Preview tool](https://p.applov.in/playablePreview?create=1).
- **Unity LevelPlay** — host the file on HTTPS and use the
  [test tool](https://demos.ironsrc.com/test-tool/).
- **Meta** — upload in Ads Manager when creating the ad.
