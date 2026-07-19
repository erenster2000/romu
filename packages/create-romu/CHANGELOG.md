# create-romu

## 0.1.1

### Patch Changes

- Template now depends on `romujs` (the CLI's published name) instead of the
  unpublishable `romu`, fixing `npm install` in freshly scaffolded projects.

## 0.1.0

### Minor Changes

- First public alpha. The end-to-end thread works: scaffold a Pixi.js playable
  with `npm create romu`, develop against the network simulator with `romu dev`,
  and `romu build` produces single-file, spec-validated packages for Meta,
  AppLovin, and Unity LevelPlay — with WebP asset inlining and a size breakdown
  per build.
