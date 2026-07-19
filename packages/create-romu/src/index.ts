#!/usr/bin/env node
/**
 * `npm create romu` — interactive scaffolding for playable ad projects.
 * Prompting only; the actual copying lives in scaffold.ts.
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { scaffold, VALID_NAME } from "./scaffold.js";

async function main(): Promise<void> {
  p.intro(pc.bgMagenta(pc.black(" create-romu ")));

  const args = process.argv.slice(2);
  const templateFlag = args.indexOf("--template");
  const templateArg = templateFlag !== -1 ? args[templateFlag + 1] : undefined;
  let name = args.find((a, i) => !a.startsWith("--") && i !== templateFlag + 1);
  if (!name) {
    const answer = await p.text({
      message: "Project name?",
      placeholder: "my-playable",
      validate: (value) =>
        VALID_NAME.test(value)
          ? undefined
          : "use lowercase letters, digits, ., _ and -",
    });
    if (p.isCancel(answer)) {
      p.cancel("Cancelled.");
      return;
    }
    name = answer;
  }

  let template = templateArg;
  if (!template) {
    const answer = await p.select({
      message: "Template?",
      options: [
        {
          value: "pixi",
          label: "Pixi.js 2D",
          hint: "the recommended starting point",
        },
      ],
    });
    if (p.isCancel(answer)) {
      p.cancel("Cancelled.");
      return;
    }
    template = answer;
  }

  try {
    await scaffold({ name, template, cwd: process.cwd() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    p.cancel(message);
    process.exitCode = 1;
    return;
  }

  p.note(
    [
      `cd ${name}`,
      "npm install",
      "npm run dev      # play with the network simulator",
      "npm run build    # publish-ready packages in dist/",
    ].join("\n"),
    "Next steps",
  );
  p.outro(
    `Edit ${pc.cyan("romu.config.ts")} with your store links before building.`,
  );
}

void main();
