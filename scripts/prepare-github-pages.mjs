#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
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
  const updated = original.replace(/(["'(])\/assets\//g, `$1${basePath}assets/`);

  if (updated !== original) writeFileSync(file, updated);
}

copyFileSync(path.join(client, "index.html"), path.join(client, "404.html"));
writeFileSync(path.join(client, ".nojekyll"), "");

const unresolved = walk(client)
  .filter((file) => textExtensions.has(path.extname(file)))
  .filter((file) => /(["'(])\/assets\//.test(readFileSync(file, "utf8")));

if (unresolved.length > 0) {
  throw new Error(
    `Unresolved root asset paths: ${unresolved.map((file) => path.relative(root, file)).join(", ")}`,
  );
}

const totalBytes = walk(client).reduce((sum, file) => sum + statSync(file).size, 0);
console.log(
  `Prepared GitHub Pages build at ${basePath} (${walk(client).length} files, ${totalBytes} bytes).`,
);
