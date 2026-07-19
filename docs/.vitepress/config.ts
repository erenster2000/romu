import { defineConfig } from "vitepress";

export default defineConfig({
  // Served from https://erenster2000.github.io/romu/
  base: "/romu/",
  title: "Romu",
  description:
    "The open-source framework for building playable ads — one codebase, every ad network.",
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/config" },
      { text: "GitHub", link: "https://github.com/erenster2000/romu" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Writing an adapter", link: "/guide/writing-an-adapter" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "romu.config.ts", link: "/reference/config" },
          { text: "CLI commands", link: "/reference/cli" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/erenster2000/romu" },
    ],
  },
});
