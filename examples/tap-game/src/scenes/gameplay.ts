import { scene } from "@romujs/pixi";
import { onVolumeChange } from "@romujs/sdk";
import { Assets, Graphics, Sprite, Text } from "pixi.js";
import bgUrl from "../../assets/images/bg.png";

const TAPS_TO_WIN = 5;

export const gameplay = scene(({ app, stage, go }) => {
  let score = 0;

  const background = new Sprite();
  stage.addChild(background);
  void Assets.load(bgUrl).then((texture) => {
    background.texture = texture;
    layoutBackground();
  });

  const scoreText = new Text({
    text: `0 / ${TAPS_TO_WIN}`,
    style: { fill: "#ffffff", fontSize: 28, fontFamily: "sans-serif" },
  });
  stage.addChild(scoreText);

  // React to the container's volume — the game has no audio yet, but the
  // mute badge demonstrates the contract.
  const muteBadge = new Text({ text: "🔇", style: { fontSize: 28 } });
  muteBadge.visible = false;
  stage.addChild(muteBadge);
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

  function layoutBackground(): void {
    if (!background.texture.width) return;
    const scale = Math.max(
      app.screen.width / background.texture.width,
      app.screen.height / background.texture.height,
    );
    background.scale.set(scale);
    background.position.set(
      (app.screen.width - background.texture.width * scale) / 2,
      (app.screen.height - background.texture.height * scale) / 2,
    );
  }

  return {
    resize(w, h) {
      layoutBackground();
      scoreText.position.set(16, 16);
      muteBadge.position.set(w - 48, 16);
      if (target.x > w - 80 || target.y > h - 80) moveTarget();
    },
  };
});
