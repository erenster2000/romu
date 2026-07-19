import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Plugin } from "vite";

/** One asset that entered the bundle, with what it cost. */
export interface AssetEntry {
  /** File name relative to the project (for the report). */
  file: string;
  kind: "image" | "audio" | "font";
  /** Bytes on disk before any processing. */
  originalBytes: number;
  /** Bytes the asset occupies in the bundle (as a base64 data URI). */
  encodedBytes: number;
  /** Set when the pipeline re-encoded the asset (e.g. "webp"). */
  convertedTo?: string;
  warning?: string;
}

export interface AssetReport {
  entries: AssetEntry[];
}

const CONVERTIBLE_IMAGE = /\.(png|jpe?g)$/i;
const PASSTHROUGH =
  /\.(webp|avif|gif|svg|mp3|m4a|aac|ogg|wav|woff2?|ttf|otf)$/i;
const AUDIO = /\.(mp3|m4a|aac|ogg|wav)$/i;
const FONT = /\.(woff2?|ttf|otf)$/i;

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

/**
 * The asset pipeline, as a Vite plugin. Every matching import becomes an
 * inlined data URI module:
 *  - PNG/JPEG are re-encoded to WebP via sharp (kept only when smaller);
 *  - other media passes through as-is, with a warning for uncompressed audio;
 *  - every asset is recorded in the report the size breakdown prints later.
 */
export function romuAssetsPlugin(report: AssetReport, cwd: string): Plugin {
  return {
    name: "romu:assets",
    enforce: "pre",
    async load(id) {
      const file = id.split("?")[0] ?? id;
      if (file.includes("node_modules")) return null;

      if (CONVERTIBLE_IMAGE.test(file)) {
        const original = await readFile(file);
        const webp = await sharp(original).webp({ quality: 82 }).toBuffer();
        const useWebp = webp.byteLength < original.byteLength;
        const out = useWebp ? webp : original;
        const mime = useWebp ? "image/webp" : mimeOf(file);
        const uri = toDataUri(mime, out);
        report.entries.push({
          file: path.relative(cwd, file),
          kind: "image",
          originalBytes: original.byteLength,
          encodedBytes: uri.length,
          convertedTo: useWebp ? "webp" : undefined,
        });
        return moduleFor(uri);
      }

      if (PASSTHROUGH.test(file)) {
        const original = await readFile(file);
        const uri = toDataUri(mimeOf(file), original);
        const kind = AUDIO.test(file)
          ? "audio"
          : FONT.test(file)
            ? "font"
            : "image";
        const warning = /\.wav$/i.test(file)
          ? "uncompressed audio — re-encode to mp3/m4a before shipping"
          : undefined;
        report.entries.push({
          file: path.relative(cwd, file),
          kind,
          originalBytes: original.byteLength,
          encodedBytes: uri.length,
          warning,
        });
        return moduleFor(uri);
      }

      return null;
    },
  };
}

function mimeOf(file: string): string {
  return MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

function toDataUri(mime: string, contents: Buffer): string {
  return `data:${mime};base64,${contents.toString("base64")}`;
}

function moduleFor(uri: string): string {
  return `export default ${JSON.stringify(uri)};`;
}
