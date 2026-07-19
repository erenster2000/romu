import { scene } from "@romujs/pixi";
import { cta } from "@romujs/sdk";
import { Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import logoUrl from "../../assets/images/logo.png";

export const endcard = scene(({ stage, layout, on }) => {
  const backdrop = new Graphics();
  stage.addChild(backdrop);

  const logo = new Sprite();
  stage.addChild(logo);
  layout.pin(logo, "center", { y: -160 });
  void Assets.load(logoUrl).then((texture) => {
    logo.texture = texture;
    logo.width = 140;
    logo.height = 140;
  });

  const title = new Text({
    text: "You win!",
    style: { fill: "#ffffff", fontSize: 48, fontFamily: "sans-serif" },
  });
  stage.addChild(title);
  layout.pin(title, "center", { y: -40 });

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
  layout.pin(button, "center", { y: 60 });

  // The idle rule: nudge the button when the player goes quiet.
  const offIdle = on("idle", () => {
    button.scale.set(1.12);
    setTimeout(() => button.scale.set(1), 250);
  });

  return {
    resize(w, h) {
      // Full-screen dim needs a redraw — the one thing pins can't express.
      backdrop.clear().rect(0, 0, w, h).fill({ color: "#000000", alpha: 0.7 });
    },
    exit: offIdle,
  };
});
