/**
 * The example playable, now on Romu's game layer: createGame boots Pixi,
 * waits for the ad container, freezes on pause, and enforces the timing
 * rules — the scenes only contain the game.
 */

import { createGame } from "@romujs/pixi";
import { endcard } from "./scenes/endcard";
import { gameplay } from "./scenes/gameplay";

createGame({
  scenes: { gameplay, endcard },
  start: "gameplay",
  rules: {
    idleCta: 8, // fire "idle" after 8 quiet seconds (endcard CTA reacts)
    maxDuration: 30, // hard cap: force the endcard at 30s
  },
});
