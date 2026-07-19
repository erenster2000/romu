/**
 * Your playable starts here.
 *
 * The two imports from @romujs/sdk are all you need to be network-ready:
 *  - onReady(cb): the ad container says the playable may start
 *  - cta(): send the player to the app store, however the network wants it
 *
 * Image/audio imports (e.g. `import bg from "../assets/bg.png"`) are inlined
 * and compressed by Romu's asset pipeline automatically.
 */

import { cta, onReady } from "@romujs/sdk";
import { Application, Container, Graphics, Text } from "pixi.js";

const TAPS_TO_WIN = 5;

async function start(): Promise<void> {
  const app = new Application();
  await app.init({ resizeTo: window, background: "#1a1a2e", antialias: true });
  document.body.appendChild(app.canvas);

  let score = 0;

  const scoreText = new Text({
    text: `0 / ${TAPS_TO_WIN}`,
    style: { fill: "#ffffff", fontSize: 28, fontFamily: "sans-serif" },
  });
  scoreText.position.set(16, 16);
  app.stage.addChild(scoreText);

  const target = new Graphics().circle(0, 0, 44).fill("#e94560");
  target.eventMode = "static";
  target.cursor = "pointer";
  app.stage.addChild(target);
  moveTarget();

  target.on("pointerdown", () => {
    score += 1;
    scoreText.text = `${score} / ${TAPS_TO_WIN}`;
    if (score >= TAPS_TO_WIN) {
      target.destroy();
      showEndCard();
    } else {
      moveTarget();
    }
  });

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

    const title = new Text({
      text: "You win!",
      style: { fill: "#ffffff", fontSize: 48, fontFamily: "sans-serif" },
    });
    title.anchor.set(0.5);
    title.position.set(app.screen.width / 2, app.screen.height / 2 - 70);
    card.addChild(title);

    const button = new Container();
    const bg = new Graphics().roundRect(-130, -34, 260, 68, 16).fill("#e94560");
    const label = new Text({
      text: "Download now",
      style: { fill: "#ffffff", fontSize: 24, fontFamily: "sans-serif" },
    });
    label.anchor.set(0.5);
    button.addChild(bg, label);
    button.position.set(app.screen.width / 2, app.screen.height / 2 + 40);
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
