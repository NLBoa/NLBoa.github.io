// Project screenshots: assets-src/projects/<slug>/*.{png,jpg} -> public/projects/<slug>/*.webp
// Usage: npm run assets:images
// Prints each file's pixel size, which the content file needs.
import { mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "assets-src/projects");
const target = path.join(root, "public/projects");
const MAX_WIDTH = 1600;

let total = 0;
for (const slug of readdirSync(source)) {
  const dir = path.join(source, slug);
  if (!statSync(dir).isDirectory()) continue;
  mkdirSync(path.join(target, slug), { recursive: true });
  for (const file of readdirSync(dir)) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const out = path.join(target, slug, file.replace(/\.\w+$/, ".webp"));
    const info = await sharp(path.join(dir, file))
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(out);
    total += info.size;
    console.log(`/projects/${slug}/${path.basename(out)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
console.log(`total ${(total / 1024).toFixed(0)} KB`);
