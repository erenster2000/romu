---
"romujs": minor
"@romujs/sdk": minor
"@romujs/core": minor
"@romujs/adapter-applovin": minor
"@romujs/adapter-levelplay": minor
---

The dev toolbar grows into a collapsible overlay panel (corner badge → panel;
`Ctrl+.` hides it, `--no-overlay` disables it): environment picker, chaos
buttons that fake container events — volume 0/50/100 and ad visibility — and
a size HUD whose "measure" button runs the real build pipeline in memory and
reports each network's size against its limit.

New SDK member: `onVolumeChange(cb)` — container volume normalized to 0..1,
wired through MRAID's and dapi's `audioVolumeChange` on the respective
adapters (networks without a volume API simply never call it). The example
game shows a mute badge when volume hits 0.
