/**
 * The walking-skeleton example: a tiny tap-the-target playable that exercises
 * the whole Romu thread — onReady() to start, cta() from the end card, and
 * real image assets flowing through the asset pipeline as inlined WebP.
 */

import { cta, onPause, onReady, onResume, onVolumeChange } from "@romujs/sdk";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
} from "pixi.js";
import bgUrl from "../assets/images/bg.png";
import logoUrl from "../assets/images/logo.png";

const TAPS_TO_WIN = 5;

async function start(): Promise<void> {
  const app = new Application();
  await app.init({ resizeTo: window, background: "#1a1a2e", antialias: true });
  document.body.appendChild(app.canvas);

  const [bgTexture, logoTexture] = await Promise.all([
    Assets.load(bgUrl),
    Assets.load(logoUrl),
  ]);

  const background = new Sprite(bgTexture);
  app.stage.addChild(background);
  const layoutBackground = (): void => {
    const scale = Math.max(
      app.screen.width / bgTexture.width,
      app.screen.height / bgTexture.height,
    );
    background.scale.set(scale);
    background.position.set(
      (app.screen.width - bgTexture.width * scale) / 2,
      (app.screen.height - bgTexture.height * scale) / 2,
    );
  };
  layoutBackground();
  app.renderer.on("resize", layoutBackground);

  let score = 0;

  const scoreText = new Text({
    text: scoreLabel(),
    style: { fill: "#ffffff", fontSize: 28, fontFamily: "sans-serif" },
  });
  scoreText.position.set(16, 16);
  app.stage.addChild(scoreText);

  // The game has no audio yet, but reacting to container volume is part of
  // the contract — show a mute badge when the network says volume is 0.
  const muteBadge = new Text({
    text: "🔇",
    style: { fontSize: 28 },
  });
  muteBadge.position.set(app.screen.width - 48, 16);
  muteBadge.visible = false;
  app.stage.addChild(muteBadge);
  onVolumeChange((volume) => {
    muteBadge.visible = volume === 0;
  });

  // Freeze everything while the container says the ad is not visible —
  // networks reject playables that keep running while hidden.
  const pausedText = new Text({
    text: "⏸ paused",
    style: { fill: "#ffffff", fontSize: 32, fontFamily: "sans-serif" },
  });
  pausedText.anchor.set(0.5);
  pausedText.position.set(app.screen.width / 2, app.screen.height / 2);
  pausedText.visible = false;
  onPause(() => {
    pausedText.visible = true;
    app.stage.addChild(pausedText); // keep on top
    app.render(); // draw the paused frame, then stop
    app.ticker.stop();
  });
  onResume(() => {
    pausedText.visible = false;
    app.ticker.start();
  });

  const target = new Graphics().circle(0, 0, 44).fill("#e94560");
  target.eventMode = "static";
  target.cursor = "pointer";
  app.stage.addChild(target);
  moveTarget();

  target.on("pointerdown", () => {
    score += 1;
    scoreText.text = scoreLabel();
    if (score >= TAPS_TO_WIN) {
      target.destroy();
      showEndCard();
    } else {
      moveTarget();
    }
  });

  function scoreLabel(): string {
    return `${score} / ${TAPS_TO_WIN}`;
  }

  function moveTarget(): void {
    const margin = 80;
    target.position.set(
      margin + Math.random() * (app.screen.width - margin * 2),
      margin + Math.random() * (app.screen.height - margin * 2),
    );
  }

  function showEndCard(): void {
    const card = new Container();

    const backdrop = new Graphics()
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill({ color: "#000000", alpha: 0.7 });
    card.addChild(backdrop);

    const logo = new Sprite(logoTexture);
    logo.anchor.set(0.5);
    logo.width = 140;
    logo.height = 140;
    logo.position.set(app.screen.width / 2, app.screen.height / 2 - 160);
    card.addChild(logo);

    const title = new Text({
      text: "You win!",
      style: { fill: "#ffffff", fontSize: 48, fontFamily: "sans-serif" },
    });
    title.anchor.set(0.5);
    title.position.set(app.screen.width / 2, app.screen.height / 2 - 40);
    card.addChild(title);

    const button = new Container();
    const bg = new Graphics().roundRect(-130, -34, 260, 68, 16).fill("#e94560");
    const label = new Text({
      text: "Download now",
      style: { fill: "#ffffff", fontSize: 24, fontFamily: "sans-serif" },
    });
    label.anchor.set(0.5);
    button.addChild(bg, label);
    button.position.set(app.screen.width / 2, app.screen.height / 2 + 60);
    button.eventMode = "static";
    button.cursor = "pointer";
    button.on("pointerdown", () => cta());
    card.addChild(button);

    app.stage.addChild(card);
  }
}

onReady(() => {
  void start();
});
