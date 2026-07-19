---
"@romujs/pixi": minor
---

First release of the game layer. `createGame({ scenes, start, rules })` boots
Pixi, waits for the ad container (SDK `onReady`), freezes the ticker on
`onPause`/resumes on `onResume`, and runs the playable flow machine: scenes
are closures created fresh on every entry (retry-safe state), torn down fully
on exit, with `go()` transitions. Timing rules ship with it — `idleCta`
fires an "idle" event scenes can react to, `maxDuration` forces the end
scene. Everything is optional: bare Pixi + `@romujs/sdk` keeps working.
