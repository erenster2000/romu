import { describe, expect, it, vi } from "vitest";
import { createLayout } from "./layout.js";

function fakeObject() {
  return {
    position: { set: vi.fn() },
    anchor: { set: vi.fn() },
  };
}

function fakeSprite(textureWidth: number, textureHeight: number) {
  return {
    texture: { width: textureWidth, height: textureHeight },
    scale: { set: vi.fn() },
    position: { set: vi.fn() },
  };
}

// biome-ignore lint/suspicious/noExplicitAny: duck-typed Pixi stand-ins
const anyObj = (o: unknown): any => o;

describe("createLayout", () => {
  it("edge offsets point inward on every corner", () => {
    const layout = createLayout();
    const tl = fakeObject();
    const br = fakeObject();
    layout.pin(anyObj(tl), "top-left", { x: 16, y: 16 });
    layout.pin(anyObj(br), "bottom-right", { x: 16, y: 16 });

    layout.apply(360, 640);

    expect(tl.position.set).toHaveBeenCalledWith(16, 16);
    expect(br.position.set).toHaveBeenCalledWith(360 - 16, 640 - 16);
  });

  it("center pins offset from the middle", () => {
    const layout = createLayout();
    const button = fakeObject();
    layout.pin(anyObj(button), "center", { y: 60 });

    layout.apply(360, 640);

    expect(button.position.set).toHaveBeenCalledWith(180, 320 + 60);
  });

  it("aligns the Pixi anchor to the screen anchor by default, opt-out works", () => {
    const layout = createLayout();
    const auto = fakeObject();
    const manual = fakeObject();
    layout.pin(anyObj(auto), "top-right");
    layout.pin(anyObj(manual), "top-right", { anchor: false });

    layout.apply(360, 640);

    expect(auto.anchor.set).toHaveBeenCalledWith(1, 0);
    expect(manual.anchor.set).not.toHaveBeenCalled();
  });

  it("applies immediately when a size is already known", () => {
    const layout = createLayout();
    layout.apply(360, 640);
    const late = fakeObject();
    layout.pin(anyObj(late), "top-left", { x: 5, y: 5 });
    expect(late.position.set).toHaveBeenCalledWith(5, 5);
  });

  it("cover scales a sprite to fill the screen, centered", () => {
    const layout = createLayout();
    const bg = fakeSprite(1440, 2560);
    layout.cover(anyObj(bg));

    layout.apply(360, 640); // 4x smaller, same ratio → scale 0.25
    expect(bg.scale.set).toHaveBeenCalledWith(0.25);
    expect(bg.position.set).toHaveBeenCalledWith(0, 0);

    layout.apply(640, 360); // landscape: cover by width → scale 640/1440
    const scale = 640 / 1440;
    expect(bg.scale.set).toHaveBeenLastCalledWith(scale);
    expect(bg.position.set).toHaveBeenLastCalledWith(
      0,
      (360 - 2560 * scale) / 2,
    );
  });

  it("skips cover for unloaded textures and refresh() re-applies later", () => {
    const layout = createLayout();
    const bg = fakeSprite(1, 1); // Pixi's empty texture is 1x1
    layout.cover(anyObj(bg));
    layout.apply(360, 640);
    expect(bg.scale.set).not.toHaveBeenCalled();

    bg.texture.width = 1440;
    bg.texture.height = 2560;
    layout.refresh();
    expect(bg.scale.set).toHaveBeenCalledWith(0.25);
  });

  it("released objects are no longer managed", () => {
    const layout = createLayout();
    const obj = fakeObject();
    layout.pin(anyObj(obj), "top-left");
    layout.release(anyObj(obj));
    layout.apply(360, 640);
    expect(obj.position.set).not.toHaveBeenCalled();
  });
});
