/**
 * The cat's body as a distance field: rounded cones along the skeleton, melted together.
 * Each cone also says which bones carry it, how long the fur grows there and which way it lies.
 */

import { FACE, TAIL_BONES, TAIL_STEP, bone, type Vec3 } from "../rig.ts";

export type Tag = "torso" | "ruff" | "head" | "cheek" | "muzzle" | "nose" | "arm" | "leg" | "paw" | "thigh" | "tail";
export const TAGS: Tag[] = ["torso", "ruff", "head", "cheek", "muzzle", "nose", "arm", "leg", "paw", "thigh", "tail"];

export type Prim = {
  a: Vec3;
  b: Vec3;
  ra: number;
  rb: number;
  /** How far it melts into its neighbors. */
  k: number;
  boneA: number;
  boneB: number;
  /** Fur length in meters, how flat it lies (0 stands straight out, 1 lies along the skin), and the way it is combed. */
  fur: number;
  lay: number;
  comb: Vec3;
  tag: Tag;
  /** Stretch about the midpoint, to make a round thing wider or deeper. */
  squash?: Vec3;
  // Filled in below: a ball that holds the whole cone.
  c: Vec3;
  reach: number;
};

type PrimIn = Omit<Prim, "boneA" | "boneB" | "c" | "reach"> & { bones: [string, string?] };

export const prims: Prim[] = [];

function add(p: PrimIn) {
  const { bones, ...rest } = p;
  const c: Vec3 = [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, (p.a[2] + p.b[2]) / 2];
  const half = Math.hypot(p.a[0] - p.b[0], p.a[1] - p.b[1], p.a[2] - p.b[2]) / 2;
  const stretch = p.squash ? Math.max(...p.squash) : 1;
  prims.push({ ...rest, boneA: bone(bones[0]), boneB: bone(bones[1] ?? bones[0]), c, reach: (half + Math.max(p.ra, p.rb)) * stretch });
}

const BACK: Vec3 = [0, -0.4, -1];
/** Four toes across the front of each paw: how far each sits from the paw's middle. */
const TOES = [-0.0132, -0.0044, 0.0044, 0.0132];
const DOWN: Vec3 = [0, -1, -0.15];

// Torso: deeper than it is wide, fullest at the ribs.
const torso = { k: 0.03, fur: 0.04, lay: 0.72, comb: BACK, tag: "torso" as Tag, squash: [0.93, 1.04, 1] as Vec3 };
add({ ...torso, a: [0, 0.205, -0.125], b: [0, 0.208, -0.045], ra: 0.056, rb: 0.064, bones: ["hips", "spine1"] });
add({ ...torso, a: [0, 0.203, -0.045], b: [0, 0.198, 0.04], ra: 0.064, rb: 0.066, bones: ["spine1", "ribs"] });
add({ ...torso, a: [0, 0.198, 0.04], b: [0, 0.2, 0.105], ra: 0.066, rb: 0.06, bones: ["ribs", "chest"] });
// The chest front and neck carry the ruff: the longest fur on the body, hanging down and back.
add({ a: [0, 0.184, 0.116], b: [0, 0.192, 0.134], ra: 0.047, rb: 0.04, k: 0.03, fur: 0.056, lay: 0.6, comb: [0, -1, 0.05], tag: "ruff", bones: ["chest"] });
add({ a: [0, 0.222, 0.138], b: [0, 0.256, 0.19], ra: 0.044, rb: 0.039, k: 0.028, fur: 0.05, lay: 0.56, comb: [0, -0.85, -0.5], tag: "ruff", bones: ["neck"] });

// Head: a broad rounded wedge with full cheeks and a short strong muzzle.
const head = { k: 0.014, fur: 0.021, lay: 0.6, comb: [0, 0.25, -1] as Vec3, tag: "head" as Tag };
add({ ...head, a: [0, 0.277, 0.204], b: [0, 0.2745, 0.224], ra: 0.0425, rb: 0.041, squash: [1.14, 0.95, 1.02], bones: ["head"] });
for (const s of [1, -1]) {
  add({ a: [s * 0.027, 0.2585, 0.226], b: [s * 0.03, 0.256, 0.218], ra: 0.0235, rb: 0.022, k: 0.016, fur: 0.04, lay: 0.5, comb: [s * 0.7, -0.55, -0.5], tag: "cheek", bones: ["head"] });
  // Jowls: the long fur that frames a Siberian's face and runs down into the ruff.
  add({ a: [s * 0.035, 0.249, 0.214], b: [s * 0.039, 0.243, 0.202], ra: 0.02, rb: 0.018, k: 0.016, fur: 0.05, lay: 0.48, comb: [s * 0.75, -0.7, -0.25], tag: "cheek", bones: ["head"] });
  // Brow ridge over each eye.
  add({ ...head, a: [s * 0.019, 0.2835, 0.2365], b: [s * 0.027, 0.2815, 0.23], ra: 0.0145, rb: 0.013, k: 0.012, fur: 0.013, bones: ["head"] });
  // Whisker pads.
  add({ a: [s * 0.009, 0.2532, 0.2655], b: [s * 0.0104, 0.2532, 0.2635], ra: 0.0096, rb: 0.009, k: 0.005, fur: 0.0035, lay: 0.85, comb: [s * 0.5, 0, -1], tag: "muzzle", bones: ["head"] });
}
add({ a: [0, 0.2585, 0.238], b: [0, 0.2555, 0.2635], ra: 0.0178, rb: 0.0118, k: 0.012, fur: 0.004, lay: 0.85, comb: [0, 0, -1], tag: "muzzle", bones: ["head"] });
add({ a: [0, 0.2448, 0.2565], b: [0, 0.2462, 0.249], ra: 0.0078, rb: 0.0098, k: 0.007, fur: 0.006, lay: 0.8, comb: [0, -0.6, -0.8], tag: "muzzle", bones: ["head"] });
// Bridge of the nose, then the nose leather itself (no fur).
add({ a: [0, 0.2725, 0.243], b: [0, 0.2632, 0.272], ra: 0.0145, rb: 0.0085, k: 0.01, fur: 0.0035, lay: 0.9, comb: [0, 0.4, -1], tag: "muzzle", bones: ["head"] });
add({ a: [0, 0.2595, 0.276], b: [0, 0.2595, 0.277], ra: 0.0068, rb: 0.0064, k: 0.002, fur: 0, lay: 0.9, comb: [0, 0, -1], tag: "nose", squash: [1.25, 0.85, 1], bones: ["head"] });

for (const [s, t] of [
  [1, "L"],
  [-1, "R"],
] as const) {
  // Front leg.
  add({ a: [s * 0.047, 0.172, 0.122], b: [s * 0.052, 0.106, 0.086], ra: 0.034, rb: 0.025, k: 0.026, fur: 0.03, lay: 0.72, comb: DOWN, tag: "arm", bones: [`arm${t}`] });
  add({ a: [s * 0.052, 0.106, 0.086], b: [s * 0.052, 0.034, 0.102], ra: 0.024, rb: 0.0175, k: 0.012, fur: 0.015, lay: 0.82, comb: [0, -1, 0], tag: "leg", bones: [`forearm${t}`] });
  add({ a: [s * 0.052, 0.03, 0.104], b: [s * 0.052, 0.0175, 0.13], ra: 0.018, rb: 0.0165, k: 0.008, fur: 0.0045, lay: 0.8, comb: [0, -0.3, 1], tag: "paw", bones: [`paw${t}`] });
  for (const dx of TOES) add({ a: [s * 0.052 + dx, 0.0105, 0.1395 - Math.abs(dx) * 0.3], b: [s * 0.052 + dx, 0.0125, 0.134 - Math.abs(dx) * 0.3], ra: 0.0066, rb: 0.007, k: 0.0025, fur: 0.003, lay: 0.8, comb: [0, -0.3, 1], tag: "paw", bones: [`paw${t}`] });
  // Hind leg: a big thigh with "britches" of long fur behind it.
  add({ a: [s * 0.05, 0.188, -0.118], b: [s * 0.062, 0.116, -0.066], ra: 0.052, rb: 0.033, k: 0.03, fur: 0.045, lay: 0.68, comb: [0, -1, -0.35], tag: "thigh", bones: [`thigh${t}`] });
  add({ a: [s * 0.062, 0.116, -0.066], b: [s * 0.06, 0.078, -0.152], ra: 0.03, rb: 0.019, k: 0.014, fur: 0.03, lay: 0.72, comb: [0, -0.8, -0.6], tag: "leg", bones: [`shin${t}`] });
  add({ a: [s * 0.06, 0.078, -0.152], b: [s * 0.06, 0.022, -0.14], ra: 0.0185, rb: 0.0165, k: 0.008, fur: 0.014, lay: 0.8, comb: [0, -1, 0], tag: "leg", bones: [`hock${t}`] });
  add({ a: [s * 0.06, 0.02, -0.138], b: [s * 0.06, 0.0175, -0.108], ra: 0.017, rb: 0.0165, k: 0.008, fur: 0.0045, lay: 0.8, comb: [0, -0.3, 1], tag: "paw", bones: [`foot${t}`] });
  for (const dx of TOES) add({ a: [s * 0.06 + dx, 0.0105, -0.0985 - Math.abs(dx) * 0.3], b: [s * 0.06 + dx, 0.0125, -0.104 - Math.abs(dx) * 0.3], ra: 0.0066, rb: 0.007, k: 0.0025, fur: 0.003, lay: 0.8, comb: [0, -0.3, 1], tag: "paw", bones: [`foot${t}`] });
}

// Tail: a thin tail under a wide plume.
for (let i = 0; i < TAIL_BONES; i++) {
  const z0 = -0.152 - i * TAIL_STEP;
  const r = (j: number) => 0.024 - 0.0115 * (j / TAIL_BONES);
  add({ a: [0, 0.228, z0 + (i === 0 ? 0.02 : 0)], b: [0, 0.228, z0 - TAIL_STEP], ra: r(i), rb: r(i + 1), k: 0.012, fur: 0.064 - 0.012 * (i / TAIL_BONES), lay: 0.5, comb: [0, -0.15, -1], tag: "tail", bones: [`tail${i + 1}`] });
}

// Distances ------------------------------------------------------------------

/** Set by dist(): how far along the cone (0 at a, 1 at b) the nearest point is. */
let along = 0;

function dist(p: Prim, x: number, y: number, z: number): number {
  let scale = 1;
  if (p.squash) {
    x = p.c[0] + (x - p.c[0]) / p.squash[0];
    y = p.c[1] + (y - p.c[1]) / p.squash[1];
    z = p.c[2] + (z - p.c[2]) / p.squash[2];
    scale = Math.min(p.squash[0], p.squash[1], p.squash[2]);
  }
  const bx = p.b[0] - p.a[0];
  const by = p.b[1] - p.a[1];
  const bz = p.b[2] - p.a[2];
  const px = x - p.a[0];
  const py = y - p.a[1];
  const pz = z - p.a[2];
  const t = Math.min(1, Math.max(0, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
  along = t;
  return (Math.hypot(px - bx * t, py - by * t, pz - bz * t) - (p.ra + (p.rb - p.ra) * t)) * scale;
}

/** The whole cat: negative inside. */
export function cat(x: number, y: number, z: number): number {
  let d = 1e9;
  for (const p of prims) {
    // Too far away to matter.
    if (Math.hypot(x - p.c[0], y - p.c[1], z - p.c[2]) - p.reach > d + p.k) continue;
    const di = dist(p, x, y, z);
    const h = Math.max(p.k - Math.abs(d - di), 0) / p.k;
    d = Math.min(d, di) - h * h * p.k * 0.25;
  }
  return d;
}

// What a point on the surface is like -------------------------------------------

export type Described = {
  bones: number[];
  weights: number[];
  fur: number;
  lay: number;
  comb: Vec3;
  color: Vec3;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

function hash(i: number, j: number, k: number): number {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, y: number, z: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const k = Math.floor(z);
  const u = smooth(0, 1, x - i);
  const v = smooth(0, 1, y - j);
  const w = smooth(0, 1, z - k);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(hash(i, j, k), hash(i + 1, j, k), u), l(hash(i, j + 1, k), hash(i + 1, j + 1, k), u), v),
    l(l(hash(i, j, k + 1), hash(i + 1, j, k + 1), u), l(hash(i, j + 1, k + 1), hash(i + 1, j + 1, k + 1), u), v),
    w,
  );
}

const fbm = (x: number, y: number, z: number) => noise(x, y, z) * 0.6 + noise(x * 2.1, y * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, y * 4.3, z * 4.3) * 0.12;

/** Distance from a point to a line segment. */
function toSegment(p: Vec3, a: Vec3, b: Vec3): number {
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const bz = b[2] - a[2];
  const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * bx + (p[1] - a[1]) * by + (p[2] - a[2]) * bz) / (bx * bx + by * by + bz * bz)));
  return Math.hypot(p[0] - a[0] - bx * t, p[1] - a[1] - by * t, p[2] - a[2] - bz * t);
}

// The coat, in sRGB. A grey tabby: warm grey ground, charcoal stripes, a paler ruff, belly and muzzle.
export const COAT = {
  ground: [0.47, 0.462, 0.45] as Vec3,
  saddle: [0.32, 0.312, 0.305] as Vec3,
  light: [0.72, 0.71, 0.69] as Vec3,
  pale: [0.78, 0.76, 0.72] as Vec3,
  dark: [0.12, 0.116, 0.112] as Vec3,
  bridge: [0.5, 0.42, 0.36] as Vec3,
  nose: [0.72, 0.42, 0.4] as Vec3,
  earInside: [0.66, 0.5, 0.47] as Vec3,
};

const SIGMA = 0.015;

export function describe(p: Vec3, n: Vec3): Described {
  const [x, y, z] = p;
  const boneWeight = new Map<number, number>();
  const tag: Record<string, number> = {};
  let total = 0;
  let fur = 0;
  let lay = 0;
  const comb: Vec3 = [0, 0, 0];

  for (const prim of prims) {
    const d = Math.max(0, dist(prim, x, y, z));
    if (d > SIGMA * 3.5) continue;
    const t = smooth(0, 1, along);
    const w = Math.exp(-((d / SIGMA) ** 2));
    boneWeight.set(prim.boneA, (boneWeight.get(prim.boneA) ?? 0) + w * (1 - t));
    boneWeight.set(prim.boneB, (boneWeight.get(prim.boneB) ?? 0) + w * t);
    tag[prim.tag] = (tag[prim.tag] ?? 0) + w;
    total += w;
    fur += w * prim.fur;
    lay += w * prim.lay;
    comb[0] += w * (prim.comb[0]);
    comb[1] += w * prim.comb[1];
    comb[2] += w * prim.comb[2];
  }
  if (total === 0) throw new Error(`a vertex at ${p} belongs to nothing`);
  fur /= total;
  lay /= total;
  for (const key of Object.keys(tag)) tag[key] /= total;
  const m = (name: Tag) => tag[name] ?? 0;

  // The four strongest bones.
  const ranked = [...boneWeight.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = ranked.reduce((s, r) => s + r[1], 0);
  const bones = ranked.map((r) => r[0]);
  const weights = ranked.map((r) => r[1] / sum);
  while (bones.length < 4) {
    bones.push(0);
    weights.push(0);
  }

  // Comb direction: along the skin.
  const dot = comb[0] * n[0] + comb[1] * n[1] + comb[2] * n[2];
  let cx = comb[0] - n[0] * dot;
  let cy = comb[1] - n[1] * dot;
  let cz = comb[2] - n[2] * dot;
  let cl = Math.hypot(cx, cy, cz);
  if (cl < 1e-4) {
    // Combed straight out of the skin (the rump, the tail's tip): there is no "along".
    cx = cy = cz = 0;
    lay = 0;
    cl = 1;
  }
  // Where the comb runs nearly straight out, the fur stands up rather than lying flat.
  const flat = Math.min(1, cl / (Math.hypot(comb[0], comb[1], comb[2]) || 1));
  lay *= smooth(0, 0.6, flat);
  // Under the body the fur hangs: it stands out from the skin, which there means straight down.
  const hang = smooth(-0.15, -0.8, n[1]) * ((tag.torso ?? 0) + (tag.ruff ?? 0) + (tag.thigh ?? 0) + (tag.arm ?? 0));
  lay *= 1 - 0.75 * Math.min(1, hang);
  fur *= 1 + 0.3 * Math.min(1, hang);

  // Face ----------------------------------------------------------------------
  const face = m("head") + m("cheek") + m("muzzle") + m("nose");
  const eyeL = Math.hypot(x - FACE.eye[0], y - FACE.eye[1], z - FACE.eye[2]);
  const eyeR = Math.hypot(x + FACE.eye[0], y - FACE.eye[1], z - FACE.eye[2]);
  const eye = Math.min(eyeL, eyeR);
  // Short, tidy fur round the eyes; none on the nose.
  fur *= mix(1, smooth(0.01, 0.02, eye), face);
  const leather = smooth(0.55, 0.8, m("nose"));
  fur *= 1 - leather;

  // Colors --------------------------------------------------------------------
  const grain = fbm(x * 16, y * 16, z * 16);
  const body = m("torso") + m("thigh") + m("ruff");
  const under = smooth(0.15, -0.75, n[1]);
  const ruff = m("ruff") * smooth(-0.3, 0.5, n[2] - n[1] * 0.6);
  const saddle = smooth(0.25, 0.9, n[1]) * (m("torso") + m("thigh") * 0.6);

  let color = mix3(COAT.ground, COAT.saddle, saddle * 0.55);
  color = mix3(color, COAT.light, Math.min(1, under * 0.85 * body + ruff * 0.8 + m("cheek") * 0.35));

  // Mackerel stripes down the flanks, a little bent and broken.
  const flank = (m("torso") + m("thigh")) * smooth(-0.55, 0.05, n[1]);
  const bodyBand = smooth(0.52, 0.8, 0.5 + 0.5 * Math.sin(2 * Math.PI * (z / 0.047 + fbm(x * 13, y * 13, z * 13) * 1.1 + Math.abs(x) * 2.2 - y * 1.5)));
  // A dark line along the spine.
  const spine = Math.exp(-((x / 0.016) ** 2)) * smooth(0.6, 0.95, n[1]) * m("torso");
  // Rings round the legs and the tail.
  const legBand = smooth(0.5, 0.78, 0.5 + 0.5 * Math.sin(2 * Math.PI * (y / 0.034 + grain * 0.6 + z * 4)));
  const tailBand = smooth(0.45, 0.75, 0.5 + 0.5 * Math.sin(2 * Math.PI * (z / 0.058 + grain * 0.35)));
  const tailTip = smooth(-0.415, -0.455, z) * m("tail");
  const legs = m("arm") * 0.75 + m("leg");

  let stripe = Math.max(bodyBand * flank * 0.78, spine * 0.85, legBand * legs * 0.7, tailBand * m("tail") * 0.72, tailTip);
  // The tail is darker than the body all over.
  color = mix3(color, COAT.saddle, m("tail") * 0.5);

  if (face > 0.3) {
    const h: Vec3 = [x - FACE.center[0], y - FACE.center[1], z - FACE.center[2]];
    const ax = Math.abs(h[0]);
    // The tabby "M": lines running back over the forehead between the ears.
    const forehead = smooth(0.011, 0.02, h[1]) * smooth(0.042, 0.034, ax) * m("head");
    const lines = smooth(0.35, 0.75, 0.5 + 0.5 * Math.cos((2 * Math.PI * ax) / 0.0125 + grain * 0.8));
    stripe = Math.max(stripe, forehead * lines * 0.95);
    // Two stripes back across each cheek from the eye's outer corner.
    const mirrored: Vec3 = [ax, h[1], h[2]];
    const cheek1 = toSegment(mirrored, [0.031, 0.002, 0.024], [0.05, -0.006, -0.012]);
    const cheek2 = toSegment(mirrored, [0.03, -0.012, 0.02], [0.048, -0.022, -0.008]);
    stripe = Math.max(stripe, smooth(0.0042, 0.0018, cheek1) * 0.75, smooth(0.0038, 0.0016, cheek2) * 0.6);
    // Pale muzzle and chin, a warmer bridge, pale "spectacles" round the eyes inside a dark liner.
    const muzzle = m("muzzle");
    const bridge = smooth(0.006, 0.0, ax - 0.004) * smooth(-0.012, 0.004, h[1]) * smooth(0.02, 0.035, h[2]) * muzzle;
    color = mix3(color, COAT.pale, Math.min(1, muzzle * 0.95));
    color = mix3(color, COAT.bridge, bridge * 0.85);
    color = mix3(color, COAT.pale, smooth(0.028, 0.018, eye) * 0.7);
    stripe = Math.max(stripe * (1 - muzzle * 0.9), smooth(0.014, 0.0128, eye) * 0.9);
    // The mouth: a short dark line down from the nose and out to each side.
    const mouth = Math.min(toSegment(p, FACE.nose, FACE.mouth), toSegment([ax, y, z], FACE.mouth, [0.011, 0.2462, 0.2655]));
    stripe = Math.max(stripe, smooth(0.0022, 0.0008, mouth) * smooth(0.25, 0.262, z) * 0.8);
  }

  if (m("paw") > 0.4) {
    // The lines between the toes: what makes a paw read as a paw.
    const front = z > 0;
    const across = Math.abs(Math.abs(x) - (front ? 0.052 : 0.06));
    const tip = front ? smooth(0.124, 0.134, z) : smooth(-0.114, -0.104, z);
    const crease = Math.max(Math.exp(-((across / 0.0015) ** 2)), Math.exp(-(((across - 0.0088) / 0.0015) ** 2)));
    stripe = Math.max(stripe * 0.4, crease * tip * 0.9 * smooth(0.03, 0.006, y));
  }

  color = mix3(color, COAT.dark, Math.min(1, stripe));
  color = mix3(color, COAT.nose, leather);
  const shade = 0.9 + 0.2 * grain;
  color = [color[0] * shade, color[1] * shade, color[2] * shade];

  return { bones, weights, fur, lay, comb: [cx / cl, cy / cl, cz / cl], color };
}
