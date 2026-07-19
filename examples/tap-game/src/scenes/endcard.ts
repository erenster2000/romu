import { scene } from "@romujs/pixi";
import { cta } from "@romujs/sdk";
import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import logoUrl from "../../assets/images/logo.png";

export const endcard = scene(({ app, stage, on }) => {
  const backdrop = new Graphics();
  stage.addChild(backdrop);

  const logo = new Sprite();
  logo.anchor.set(0.5);
  stage.addChild(logo);
  void Assets.load(logoUrl).then((texture) => {
    logo.texture = texture;
    logo.width = 140;
    logo.height = 140;
  });

  const title = new Text({
    text: "You win!",
    style: { fill: "#ffffff", fontSize: 48, fontFamily: "sans-serif" },
  });
  title.anchor.set(0.5);
  stage.addChild(title);

  const button = new Container();
  const bg = new Graphics().roundRect(-130, -34, 260, 68, 16).fill("#e94560");
  const label = new Text({
    text: "Download now",
    style: { fill: "#ffffff", fontSize: 24, fontFamily: "sans-serif" },
  });
  label.anchor.set(0.5);
  button.addChild(bg, label);
  button.eventMode = "static";
  button.cursor = "pointer";
  button.on("pointerdown", () => cta());
  stage.addChild(button);

  // The idle rule: nudge the button when the player goes quiet.
  const offIdle = on("idle", () => {
    button.scale.set(1.12);
    setTimeout(() => button.scale.set(1), 250);
  });

  return {
    resize(w, h) {
      backdrop.clear().rect(0, 0, w, h).fill({ color: "#000000", alpha: 0.7 });
      logo.position.set(w / 2, h / 2 - 160);
      title.position.set(w / 2, h / 2 - 40);
      button.position.set(w / 2, h / 2 + 60);
    },
    exit: offIdle,
  };
});
