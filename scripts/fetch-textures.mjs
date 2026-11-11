// Downloads the desk texture and writes the WebP maps that ship.
// Usage: npm run assets:textures
//
// Walnut Veneer by Poly Haven (CC0): https://polyhaven.com/a/walnut_veneer
import sharp from "sharp";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const cache = path.join(root, "assets-src/textures");
const out = path.join(root, "public/textures");
mkdirSync(cache, { recursive: true });
mkdirSync(out, { recursive: true });

const base = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/walnut_veneer";
const maps = [
  { file: "walnut_veneer_diff_1k.jpg", to: "walnut-diff.webp", quality: 82 },
  { file: "walnut_veneer_nor_gl_1k.jpg", to: "walnut-normal.webp", quality: 80 },
  // The roughness map is left out: under one low light it read as glare, and
  // a flat matte value matches the real desk better.
];

for (const map of maps) {
  const cached = path.join(cache, map.file);
  if (!existsSync(cached)) {
    const res = await fetch(`${base}/${map.file}`);
    if (!res.ok) throw new Error(`${map.file}: HTTP ${res.status}`);
    writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  }
  const target = path.join(out, map.to);
  await sharp(cached).resize(1024, 1024, { fit: "inside" }).webp({ quality: map.quality }).toFile(target);
  console.log(`${map.to}: ${statSync(target).size} bytes`);
}
