---
"romujs": minor
"@romujs/sdk": minor
"@romujs/core": minor
"@romujs/adapter-applovin": minor
"@romujs/adapter-levelplay": minor
---

The dev toolbar grows into a collapsible overlay panel (corner badge → panel;
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
