# romu.config.ts

The config lives at the project root and is validated with zod — mistakes fail
fast with readable errors before the build starts.

```ts
import { defineConfig } from "romujs/config";

export default defineConfig({
  store: {
    ios: "https://apps.apple.com/app/id284882215",
    android: "https://play.google.com/store/apps/details?id=com.example.app",
  },
  networks: ["meta", "applovin", "levelplay"],
});
```

## Fields

### `store.ios` / `store.android`

Full store-page URLs for your app. Networks whose CTA API takes a URL (e.g.
AppLovin's `mraid.open`) receive the right one based on the player's device.
Networks that configure the destination on their side (Meta, LevelPlay) ignore
these at runtime.

### `networks`

The networks `romu build` and `romu check` target. Available today:

| id | Network | CTA routed to |
|---|---|---|
| `meta` | Meta (Facebook/Instagram) | `FbPlayableAd.onCTAClick()` |
| `applovin` | AppLovin | `mraid.open(storeUrl)` |
| `levelplay` | Unity LevelPlay (ironSource) | `dapi.openStoreUrl()` |
