# @romujs/pixi

## 0.1.0

### Minor Changes

- 0b1510e: First release of the game layer. `createGame({ scenes, start, rules })` boots
  Pixi, waits for the ad container (SDK `onReady`), freezes the ticker on
  `onPause`/resumes on `onResume`, and runs the playable flow machine: scenes
  are closures created fresh on every entry (retry-safe state), torn down fully
  on exit, with `go()` transitions. Timing rules ship with it — `idleCta`
  fires an "idle" event scenes can react to, `maxDuration` forces the end
  scene. Everything is optional: bare Pixi + `@romujs/sdk` keeps working.
- be6188b: Responsive layout system. Every scene gets a `layout` in its context:
  `layout.pin(obj, "top-right", { x: 16, y: 16 })` keeps objects at screen
  anchors across every resize and orientation (edge offsets point inward,
  CSS-margin style; Pixi anchors auto-align so pinned objects hug their corner
  regardless of size), and `layout.cover(sprite)` fits backgrounds to the
  screen. Re-applied automatically on resize, before the scene's own
  `resize()`; `layout.refresh()` re-fits after async textures land. Cleaned up
  with the scene.
