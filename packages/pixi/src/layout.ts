import type { Container, Sprite } from "pixi.js";

/**
 * Screen anchors. Edge offsets point inward (CSS-margin intuition):
 * pin(badge, "top-right", { x: 16, y: 16 }) sits 16px from the right and
 * 16px from the top — on every screen size and orientation.
 */
export type Anchor =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export interface PinOptions {
  /** Inward offset from the anchor's horizontal edge (or from center). */
  x?: number;
  /** Inward offset from the anchor's vertical edge (or from center). */
  y?: number;
  /**
   * When the object has a Pixi anchor (Sprite/Text), align it to match the
   * screen anchor so the object hugs its corner regardless of its size.
   * Default true; set false to keep the object's own anchor.
   */
  anchor?: boolean;
}

export interface Layout {
  /** Keep the object at a screen anchor across every resize. */
  pin(object: Container, at: Anchor, options?: PinOptions): void;
  /** Scale a sprite to cover the whole screen, centered (backgrounds). */
  cover(sprite: Sprite): void;
  /** Stop managing an object. */
  release(object: Container): void;
  /** Re-apply with the given size — the game calls this on every resize. */
  apply(width: number, height: number): void;
  /** Re-apply with the last known size (e.g. after an async texture lands). */
  refresh(): void;
}

const FACTORS: Record<Anchor, { fx: number; fy: number }> = {
  "top-left": { fx: 0, fy: 0 },
  top: { fx: 0.5, fy: 0 },
  "top-right": { fx: 1, fy: 0 },
  left: { fx: 0, fy: 0.5 },
  center: { fx: 0.5, fy: 0.5 },
  right: { fx: 1, fy: 0.5 },
  "bottom-left": { fx: 0, fy: 1 },
  bottom: { fx: 0.5, fy: 1 },
  "bottom-right": { fx: 1, fy: 1 },
};

interface Anchorable {
  anchor?: { set(x: number, y: number): void };
}

type Entry =
  | { kind: "pin"; object: Container; at: Anchor; options: PinOptions }
  | { kind: "cover"; sprite: Sprite };

export function createLayout(): Layout {
  const entries: Entry[] = [];
  let lastWidth = 0;
  let lastHeight = 0;

  function applyEntry(entry: Entry, width: number, height: number): void {
    if (entry.kind === "cover") {
      const texture = entry.sprite.texture;
      if (!texture || texture.width <= 1) return; // not loaded yet
      const scale = Math.max(width / texture.width, height / texture.height);
      entry.sprite.scale.set(scale);
      entry.sprite.position.set(
        (width - texture.width * scale) / 2,
        (height - texture.height * scale) / 2,
      );
      return;
    }

    const { fx, fy } = FACTORS[entry.at];
    const ox = entry.options.x ?? 0;
    const oy = entry.options.y ?? 0;
    // Edge offsets point inward; center offsets are plain offsets.
    const x = fx === 0 ? ox : fx === 1 ? width - ox : width / 2 + ox;
    const y = fy === 0 ? oy : fy === 1 ? height - oy : height / 2 + oy;

    if (entry.options.anchor !== false) {
      (entry.object as Anchorable).anchor?.set(fx, fy);
    }
    entry.object.position.set(x, y);
  }

  return {
    pin(object, at, options = {}) {
      entries.push({ kind: "pin", object, at, options });
      if (lastWidth > 0) {
        applyEntry(entries[entries.length - 1] as Entry, lastWidth, lastHeight);
      }
    },
    cover(sprite) {
      entries.push({ kind: "cover", sprite });
      if (lastWidth > 0) {
        applyEntry(entries[entries.length - 1] as Entry, lastWidth, lastHeight);
      }
    },
    release(object) {
      const index = entries.findIndex(
        (e) => (e.kind === "pin" ? e.object : e.sprite) === object,
      );
      if (index !== -1) entries.splice(index, 1);
    },
    apply(width, height) {
      lastWidth = width;
      lastHeight = height;
      for (const entry of entries) applyEntry(entry, width, height);
    },
    refresh() {
      if (lastWidth > 0) this.apply(lastWidth, lastHeight);
    },
  };
}
