// Turns the raw downloads in assets-src/ into what ships in public/models/.
// Usage: npm run assets:models
//
// keyboard.glb is the Sketchfab "Apple Magic Keyboard" by infohack (CC BY).
// That model is the full-size keyboard with a numeric keypad; the desk has
// the compact one. So this script keeps only the keycaps of the main block
// (legends included), drops the rest, and normalizes scale, orientation and
// origin. The aluminum body is built in code at the compact size.
import { NodeIO } from "@gltf-transform/core";
import { prune, weld } from "@gltf-transform/functions";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "assets-src/keyboard.glb");
const outDir = path.join(root, "public/models");
const tmp = path.join(root, "assets-src/.keyboard-cropped.glb");
const out = path.join(outDir, "keyboard-keys.glb");

if (!existsSync(src)) {
  console.log("assets-src/keyboard.glb is missing: the scene will use its placeholder.");
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });

// Target: Magic Keyboard (compact), meters.
const WIDTH = 0.279;
const DEPTH = 0.115;

const io = new NodeIO();
const doc = await io.read(src);
const docRoot = doc.getRoot();

let keysNode;
let body;
for (const node of docRoot.listNodes()) {
  const material = node.getMesh()?.listPrimitives()[0].getMaterial().getName();
  if (material === "Keys") keysNode = node;
  if (material === "Body") body = node;
}
if (!keysNode || !body) throw new Error("Unexpected model structure: Keys or Body mesh not found.");

const apply = (m, [x, y, z]) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

function worldBounds(node) {
  const m = node.getWorldMatrix();
  const pos = node.getMesh().listPrimitives()[0].getAttribute("POSITION");
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const v = [0, 0, 0];
  for (let i = 0; i < pos.getCount(); i++) {
    const w = apply(m, pos.getElement(i, v));
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], w[k]);
      max[k] = Math.max(max[k], w[k]);
    }
  }
  return { min, max };
}

const bodyBounds = worldBounds(body);
const keysBounds = worldBounds(keysNode);

// The main block ends at 66.1% of the keycaps' width and the navigation
// cluster starts after a gap (measured from the model's key texture).
const keysWidth = keysBounds.max[0] - keysBounds.min[0];
const cutX = keysBounds.min[0] + keysWidth * 0.6675;
const mainBlockRight = keysBounds.min[0] + keysWidth * 0.661;
const margin = keysBounds.min[0] - bodyBounds.min[0];
const compact = { min: bodyBounds.min[0], max: mainBlockRight + margin };

const sx = WIDTH / (compact.max - compact.min);
const sz = DEPTH / (bodyBounds.max[2] - bodyBounds.min[2]);
const sy = (sx + sz) / 2;
const cx = (compact.min + compact.max) / 2;
const cz = (bodyBounds.min[2] + bodyBounds.max[2]) / 2;
const y0 = bodyBounds.min[1];

// Bake the transform and drop every key right of the cut.
const prim = keysNode.getMesh().listPrimitives()[0];
const m = keysNode.getWorldMatrix();
const pos = prim.getAttribute("POSITION");
const v = [0, 0, 0];
const worldX = new Float32Array(pos.getCount());
for (let i = 0; i < pos.getCount(); i++) {
  const w = apply(m, pos.getElement(i, v));
  worldX[i] = w[0];
  pos.setElement(i, [(w[0] - cx) * sx, (w[1] - y0) * sy, (w[2] - cz) * sz]);
}
const indices = prim.getIndices();
const kept = [];
for (let i = 0; i < indices.getCount(); i += 3) {
  const a = indices.getScalar(i);
  const b = indices.getScalar(i + 1);
  const c = indices.getScalar(i + 2);
  if (worldX[a] < cutX && worldX[b] < cutX && worldX[c] < cutX) kept.push(a, b, c);
}
indices.setArray(new Uint32Array(kept));
prim.getMaterial().setDoubleSided(false).setName("KeyboardKeys");

// Keep only the keycaps, at the scene root with no transform.
const scene = docRoot.listScenes()[0];
for (const child of scene.listChildren()) scene.removeChild(child);
keysNode.setMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).setName("KeyboardKeys");
scene.addChild(keysNode);
for (const node of docRoot.listNodes()) if (node !== keysNode) node.dispose();

await doc.transform(prune(), weld());
await io.write(tmp, doc);

// Meshopt geometry, WebP textures no larger than 1024 px.
execFileSync(
  path.join(root, "node_modules/.bin/gltf-transform"),
  ["optimize", tmp, out, "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024",
   "--simplify", "false", "--palette", "false", "--instance", "false"],
  { stdio: "ignore" },
);
rmSync(tmp);

const bodyHeight = (bodyBounds.max[1] - y0) * sy;
const keysTop = (keysBounds.max[1] - y0) * sy;
console.log(`keyboard-keys.glb: ${kept.length / 3} triangles, ${statSync(out).size} bytes`);
console.log(`body to build in code: ${WIDTH} x ${bodyHeight.toFixed(4)} x ${DEPTH} m; key tops at ${keysTop.toFixed(4)} m`);
