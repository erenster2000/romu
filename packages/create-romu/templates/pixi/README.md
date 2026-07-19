# My Playable

A playable ad built with [Romu](https://github.com/erenster2000/romu).

## Commands

```bash
npm run dev     # dev server with the network simulator (CTA shows a toast)
npm run build   # publish-ready packages in dist/<network>/
npm run check   # validate against every configured network without building
```

## Before you ship

1. Put your app's real store links in `romu.config.ts`.
2. Pick your target networks in `romu.config.ts` (`meta`, `applovin`, `levelplay`).
3. `npm run build` — each `dist/<network>/playable.html` is a single
   self-contained file, sized and validated against that network's spec.
