import { existsSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scaffold } from "./scaffold.js";

describe("scaffold", () => {
  it("copies the pixi template and personalizes it", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "create-romu-"));
    const target = await scaffold({
      name: "my-playable",
      template: "pixi",
      cwd,
    });

    for (const file of [
      "package.json",
      "romu.config.ts",
      "index.html",
      "src/main.ts",
      ".gitignore",
    ]) {
      expect(existsSync(path.join(target, file)), file).toBe(true);
    }
    // the dotless template copy must not survive
    expect(existsSync(path.join(target, "gitignore"))).toBe(false);

    const pkg = JSON.parse(
      await readFile(path.join(target, "package.json"), "utf8"),
    );
    expect(pkg.name).toBe("my-playable");
  });

  it("refuses invalid names and existing directories", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "create-romu-"));
    await expect(
      scaffold({ name: "Bad Name!", template: "pixi", cwd }),
    ).rejects.toThrow(/invalid project name/);

    await scaffold({ name: "taken", template: "pixi", cwd });
    await expect(
      scaffold({ name: "taken", template: "pixi", cwd }),
    ).rejects.toThrow(/already exists/);
  });

  it("refuses unknown templates", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "create-romu-"));
    await expect(
      scaffold({ name: "x", template: "three", cwd }),
    ).rejects.toThrow(/unknown template/);
  });
});
