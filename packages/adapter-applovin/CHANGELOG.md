# @romujs/adapter-applovin

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
- d937129: The dev toolbar grows into a collapsible overlay panel (corner badge → panel;
  `Ctrl+.` hides it, `--no-overlay` disables it): environment picker, a volume
  slider and an ad-visibility toggle that fake real container events, and a
  size HUD whose "measure" button runs the real build pipeline in memory and
  renders each network's budget as a color-coded bar.

  New SDK lifecycle members: `onVolumeChange(cb)` (container volume normalized
  to 0..1, wired through MRAID's and dapi's `audioVolumeChange`) and
  `onPause(cb)` / `onResume(cb)` (driven by the container's viewability —
  freeze your game while hidden; networks reject playables that keep running).
  The example game shows a mute badge at volume 0 and visibly freezes with a
  "paused" indicator when the ad is hidden.

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
