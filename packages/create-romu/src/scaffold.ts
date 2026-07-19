import { existsSync } from "node:fs";
import { cp, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Templates ship inside the published package, next to dist/. */
const templatesDir = fileURLToPath(new URL("../templates", import.meta.url));

export const VALID_NAME = /^[a-z0-9][a-z0-9._-]*$/;

export interface ScaffoldOptions {
  name: string;
  template: string;
  /** Directory the project folder is created in. */
  cwd: string;
}

/**
 * Copies the template into `<cwd>/<name>` and personalizes it. Pure logic —
 * all prompting lives in the CLI so this stays testable.
 */
export async function scaffold(options: ScaffoldOptions): Promise<string> {
  const { name, template, cwd } = options;
  if (!VALID_NAME.test(name)) {
    throw new Error(
      `invalid project name "${name}" — use lowercase letters, digits, ., _ and -`,
    );
  }

  const source = path.join(templatesDir, template);
  if (!existsSync(source)) {
    throw new Error(`unknown template "${template}"`);
  }

  const target = path.resolve(cwd, name);
  if (existsSync(target)) {
    throw new Error(`directory ${name} already exists`);
  }

  await cp(source, target, { recursive: true });

  // npm strips .gitignore from published tarballs, so the template carries
  // "gitignore" and we restore the dot here.
  const gitignore = path.join(target, "gitignore");
  if (existsSync(gitignore)) {
    await rename(gitignore, path.join(target, ".gitignore"));
  }

  const pkgPath = path.join(target, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as {
    name: string;
  };
  pkg.name = name;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  return target;
}
