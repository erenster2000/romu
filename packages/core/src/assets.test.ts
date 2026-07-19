import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { type AssetReport, romuAssetsPlugin } from "./assets.js";

let dir: string;
let pngFile: string;
let wavFile: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "romu-assets-"));

  // A smooth 256x256 gradient: heavy as PNG, tiny as lossy WebP.
  const gradient = Buffer.alloc(256 * 256 * 3);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 3;
      gradient[i] = Math.round(128 + 127 * Math.sin(x / 40));
      gradient[i + 1] = Math.round(128 + 127 * Math.sin(y / 30));
      gradient[i + 2] = Math.round((x + y) / 2);
    }
  }
  pngFile = path.join(dir, "busy.png");
  await sharp(gradient, { raw: { width: 256, height: 256, channels: 3 } })
    .png()
    .toFile(pngFile);

  // A minimal WAV header + a little silence.
  wavFile = path.join(dir, "tap.wav");
  const wav = Buffer.alloc(44 + 1000);
  wav.write("RIFF", 0);
  wav.write("WAVEfmt ", 8);
  await writeFile(wavFile, wav);
});

async function loadWith(report: AssetReport, file: string): Promise<string> {
  const plugin = romuAssetsPlugin(report, dir);
  const load = plugin.load as (id: string) => Promise<string | null>;
  const result = await load.call({}, file);
  if (result === null) throw new Error("plugin ignored the file");
  return result;
}

describe("romuAssetsPlugin", () => {
  it("re-encodes PNG to WebP as an inlined data URI and records it", async () => {
    const report: AssetReport = { entries: [] };
    const code = await loadWith(report, pngFile);

    expect(code).toContain("data:image/webp;base64,");
    const entry = report.entries[0];
    expect(entry?.convertedTo).toBe("webp");
    expect(entry?.kind).toBe("image");
    expect(entry?.file).toBe("busy.png");
    expect(entry?.encodedBytes).toBeGreaterThan(0);
  });

  it("passes audio through and warns about uncompressed WAV", async () => {
    const report: AssetReport = { entries: [] };
    const code = await loadWith(report, wavFile);

    expect(code).toContain("data:audio/wav;base64,");
    const entry = report.entries[0];
    expect(entry?.kind).toBe("audio");
    expect(entry?.warning).toContain("uncompressed");
  });

  it("ignores unrelated modules and node_modules", async () => {
    const report: AssetReport = { entries: [] };
    const plugin = romuAssetsPlugin(report, dir);
    const load = plugin.load as (id: string) => Promise<string | null>;
    expect(await load.call({}, path.join(dir, "main.ts"))).toBeNull();
    expect(
      await load.call({}, `${dir}/node_modules/pixi.js/icon.png`),
    ).toBeNull();
    expect(report.entries).toEqual([]);
  });
});
