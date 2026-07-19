---
"@romujs/pixi": minor
---

Responsive layout system. Every scene gets a `layout` in its context:
`layout.pin(obj, "top-right", { x: 16, y: 16 })` keeps objects at screen
anchors across every resize and orientation (edge offsets point inward,
CSS-margin style; Pixi anchors auto-align so pinned objects hug their corner
regardless of size), and `layout.cover(sprite)` fits backgrounds to the
screen. Re-applied automatically on resize, before the scene's own
`resize()`; `layout.refresh()` re-fits after async textures land. Cleaned up
with the scene.
