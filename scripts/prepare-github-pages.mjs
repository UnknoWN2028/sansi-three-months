#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist", "client");
const basePath = "/sansi-three-months/";
const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".webmanifest"]);

if (!existsSync(path.join(client, "index.html"))) {
  throw new Error("Missing GitHub Pages build input: dist/client/index.html");
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

for (const file of walk(client)) {
  if (!textExtensions.has(path.extname(file))) continue;

  const original = readFileSync(file, "utf8");
  const updated = original.replace(/([`"'(])\/assets\//g, `$1${basePath}assets/`);

  if (updated !== original) writeFileSync(file, updated);
}

const renamedAssets = new Map();
const assetDirectory = path.join(client, "assets");

for (const file of walk(assetDirectory)) {
  const extension = path.extname(file);
  if (extension !== ".js" && extension !== ".css") continue;

  const parsed = path.parse(file);
  const stem = parsed.name.replace(/-[a-zA-Z0-9_-]+$/, "");
  const digest = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);
  const nextFile = path.join(parsed.dir, `${stem}-${digest}${extension}`);

  if (nextFile === file) continue;

  renameSync(file, nextFile);
  renamedAssets.set(path.basename(file), path.basename(nextFile));
}

for (const file of walk(client)) {
  if (!textExtensions.has(path.extname(file))) continue;

  const original = readFileSync(file, "utf8");
  const updated = [...renamedAssets].reduce(
    (content, [previousName, nextName]) => content.replaceAll(previousName, nextName),
    original,
  );

  if (updated !== original) writeFileSync(file, updated);
}

copyFileSync(path.join(client, "index.html"), path.join(client, "404.html"));
writeFileSync(path.join(client, ".nojekyll"), "");

const unresolved = walk(client)
  .filter((file) => textExtensions.has(path.extname(file)))
  .filter((file) => /([`"'(])\/assets\//.test(readFileSync(file, "utf8")));

if (unresolved.length > 0) {
  throw new Error(
    `Unresolved root asset paths: ${unresolved.map((file) => path.relative(root, file)).join(", ")}`,
  );
}

const totalBytes = walk(client).reduce((sum, file) => sum + statSync(file).size, 0);
console.log(
  `Prepared GitHub Pages build at ${basePath} (${walk(client).length} files, ${totalBytes} bytes, ${renamedAssets.size} cache-busted assets).`,
);
