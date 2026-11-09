import console from "node:console";
import process from "node:process";
import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const dist = new URL("../apps/web/dist/", import.meta.url);
const index = await readFile(new URL("index.html", dist), "utf8");
const initialAssets = new Set(
  Array.from(
    index.matchAll(
      /<(?:script\b[^>]*\bsrc|link\b[^>]*\brel="modulepreload"[^>]*\bhref)="([^"]+\.js)"/g,
    ),
    ([, path]) => path,
  ),
);
if (!initialAssets.size) {
  throw new Error("No initial JavaScript found in the Vite build");
}
let total = 0;
for (const path of initialAssets) {
  total += gzipSync(
    await readFile(new URL(path.replace(/^\//, ""), dist)),
  ).length;
}
console.log(`Initial JavaScript: ${total} bytes gzip (limit: 180000)`);
if (total > 180_000) process.exitCode = 1;
