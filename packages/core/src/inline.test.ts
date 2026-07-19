import { describe, expect, it } from "vitest";
import { injectBridge, inlineHtml } from "./inline.js";

const viteHtml = `<html>
<head>
  <link rel="modulepreload" crossorigin href="./assets/vendor-abc.js">
  <link rel="stylesheet" crossorigin href="./assets/index-abc.css">
</head>
<body>
<script type="module" crossorigin src="./assets/index-abc.js"></script>
</body>
</html>`;

const assets: Record<string, string> = {
  "./assets/index-abc.css": "body{margin:0}",
  "./assets/index-abc.js": 'console.log("</script> trap");',
};

describe("inlineHtml", () => {
  const read = (p: string): string => {
    const contents = assets[p];
    if (contents === undefined) throw new Error(`unexpected asset read: ${p}`);
    return contents;
  };

  it("inlines scripts and styles and drops modulepreload links", () => {
    const out = inlineHtml(viteHtml, read);

    expect(out).toContain("<style>body{margin:0}</style>");
    expect(out).toContain('<script type="module">console.log(');
    expect(out).not.toContain("modulepreload");
    expect(out).not.toContain("src=");
    expect(out).not.toContain("href=");
  });

  it("escapes closing script tags inside the bundle", () => {
    const out = inlineHtml(viteHtml, read);
    expect(out).toContain("<\\/script> trap");
  });
});

describe("injectBridge", () => {
  it("prepends the bridge inside head, before any other script", () => {
    const out = injectBridge(
      "<html><head><script>game()</script></head></html>",
      "BRIDGE",
    );
    expect(out.indexOf("BRIDGE")).toBeLessThan(out.indexOf("game()"));
  });
});
