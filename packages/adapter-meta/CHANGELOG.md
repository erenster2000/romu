# @romujs/adapter-meta

## 0.2.0

### Minor Changes

- 7e79c57: `romu dev` grows two features. **Emulated network environments**: a floating
  picker (or `?network=<id>` / `--network`) runs the adapter's real production
  bridge against a mock ad container — fake `mraid`/`dapi`/`FbPlayableAd` with
  realistic readiness and viewability timing — so container-protocol bugs
  surface in dev instead of network review. Adapters can ship such a mock via
  the new optional `devMock()` contract member. **On-device testing**: the dev
  server now listens on the LAN and prints a QR code in the terminal; scan it
  with a phone on the same Wi-Fi, hot reload included.

### Patch Changes

- Updated dependencies [7e79c57]
- Updated dependencies [d937129]
- Updated dependencies [926566f]
  - @romujs/core@0.2.0

## 0.1.1

### Patch Changes

- 2ef26c3: Add npm metadata — keywords, homepage, and bugs links — so the packages are
  discoverable on the registry.
- Updated dependencies [2ef26c3]
  - @romujs/core@0.1.1
  - @romujs/specs@0.1.1

## 0.1.0

### Minor Changes

- First public alpha. The end-to-end thread works: scaffold a Pixi.js playable
  with `npm create romu`, develop against the network simulator with `romu dev`,
  and `romu build` produces single-file, spec-validated packages for Meta,
  AppLovin, and Unity LevelPlay — with WebP asset inlining and a size breakdown
  per build.

### Patch Changes

- Updated dependencies
  - @romujs/core@0.1.0
  - @romujs/specs@0.1.0
