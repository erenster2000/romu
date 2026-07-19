/**
 * Turns Vite's multi-file output into a single self-contained HTML string:
 * script src → inline module script, stylesheet link → inline style,
 * modulepreload links dropped. Assets themselves are already inlined by Vite
 * (assetsInlineLimit is set to infinity during the build).
 */
export function inlineHtml(
  html: string,
  read: (assetPath: string) => string,
): string {
  let out = html;

  out = out.replace(/[ \t]*<link[^>]*rel="modulepreload"[^>]*>\n?/g, "");

  out = out.replace(/<link([^>]*)rel="stylesheet"([^>]*)>/g, (tag: string) => {
    const href = tag.match(/href="([^"]+)"/)?.[1];
    if (!href) return tag;
    return `<style>${read(href)}</style>`;
  });

  out = out.replace(
    /<script([^>]*)\ssrc="([^"]+)"([^>]*)><\/script>/g,
    (_tag: string, _pre: string, src: string) => {
      // "</script" inside the bundle would terminate the inline tag early.
      const js = read(src).replace(/<\/script/g, "<\\/script");
      return `<script type="module">${js}</script>`;
    },
  );

  return out;
}

/** Prepends the bridge so it exists before any game code runs. */
export function injectBridge(html: string, bridge: string): string {
  return html.replace("<head>", `<head>\n<script>${bridge}</script>`);
}
