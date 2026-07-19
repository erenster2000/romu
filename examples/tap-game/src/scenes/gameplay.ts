import { scene } from "@romujs/pixi";
import { onVolumeChange } from "@romujs/sdk";
import { Assets, Graphics, Sprite, Text } from "pixi.js";
import bgUrl from "../../assets/images/bg.png";

const TAPS_TO_WIN = 5;

export const gameplay = scene(({ app, stage, layout, go }) => {
  let score = 0;

  const background = new Sprite();
  stage.addChild(background);
  layout.cover(background);
  void Assets.load(bgUrl).then((texture) => {
    background.texture = texture;
    layout.refresh(); // texture arrived after layout — re-fit the cover
  });

  const scoreText = new Text({
    text: `0 / ${TAPS_TO_WIN}`,
    style: { fill: "#ffffff", fontSize: 28, fontFamily: "sans-serif" },
  });
  stage.addChild(scoreText);
  layout.pin(scoreText, "top-left", { x: 16, y: 16 });

  // React to the container's volume — the game has no audio yet, but the
  // mute badge demonstrates the contract.
  const muteBadge = new Text({ text: "🔇", style: { fontSize: 28 } });
  muteBadge.visible = false;
  stage.addChild(muteBadge);
  layout.pin(muteBadge, "top-right", { x: 16, y: 16 });
  onVolumeChange((volume) => {
    muteBadge.visible = volume === 0;
  });

  const target = new Graphics().circle(0, 0, 44).fill("#e94560");
  target.eventMode = "static";
  target.cursor = "pointer";
  stage.addChild(target);
  moveTarget();

  target.on("pointerdown", () => {
    score += 1;
    scoreText.text = `${score} / ${TAPS_TO_WIN}`;
    if (score >= TAPS_TO_WIN) go("endcard");
    else moveTarget();
  });

  function moveTarget(): void {
    const margin = 80;
    target.position.set(
      margin + Math.random() * (app.screen.width - margin * 2),
      margin + Math.random() * (app.screen.height - margin * 2),
    );
  }

  return {
    resize(w, h) {
      // The layout handles everything pinned; only the free-roaming target
      // needs a hand when the screen shrinks under it.
      if (target.x > w - 80 || target.y > h - 80) moveTarget();
    },
  };
});
