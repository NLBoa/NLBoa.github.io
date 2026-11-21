/**
 * Builds the cat's model: skin, bone weights, fur and coat color at every vertex, packed into
 * one small binary file. Run by scripts/bake-cat.mjs; the page only ever loads the result.
 *
 * Layout (little endian): "CAT1", vertex count, index count, index where the head begins;
 * then positions (3 x float32), normals (4 x int8), bone indices (4 x uint8), bone weights
 * (4 x uint8), coat (rgb + spare, uint8), fur (comb xyz scaled by lay, length / FUR_MAX; int8),
 * then the indices (uint16).
 */

import { BONE_COUNT, FACE, bone, type Vec3 } from "../rig.ts";
import { gradient, surfaceNets, type Field } from "./nets.ts";
import { COAT, cat, describe, type Described } from "./shape.ts";

export const FUR_MAX = 0.08;

type Vertex = { p: Vec3; n: Vec3 } & Described;

/** The head is meshed finer than the body: its markings are small. The two meet inside the ruff. */
const HEAD = { center: [0, 0.266, 0.224] as Vec3, radius: 0.079 };
/** The paws are meshed finer still, so the toes show. */
const PAWS: { center: Vec3; radius: number }[] = [1, -1].flatMap((s) => [
  { center: [s * 0.052, 0.02, 0.128] as Vec3, radius: 0.04 },
  { center: [s * 0.06, 0.018, -0.112] as Vec3, radius: 0.04 },
]);
const ball = (b: { center: Vec3; radius: number }): Field => (x, y, z) => Math.hypot(x - b.center[0], y - b.center[1], z - b.center[2]) - b.radius;
const headBall = ball(HEAD);
const pawBalls = PAWS.map(ball);
/** Negative inside any finely meshed region. */
const fine: Field = (x, y, z) => Math.min(headBall(x, y, z), ...pawBalls.map((f) => f(x, y, z)));

function part(field: Field, min: Vec3, max: Vec3, cell: number, out: Vertex[], indices: number[]) {
  const mesh = surfaceNets(field, min, max, cell);
  const count = mesh.positions.length / 3;
  // Vertices on the cut between the two parts lie inside the cat, not on its skin.
  const inside = new Uint8Array(count);
  const points: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    let p: Vec3 = [mesh.positions[i * 3], mesh.positions[i * 3 + 1], mesh.positions[i * 3 + 2]];
    if (cat(...p) < -cell * 0.6) inside[i] = 1;
    else
      for (let step = 0; step < 3; step++) {
        // Slide onto the true surface: surface nets alone leaves it faintly lumpy.
        const g = gradient(cat, p[0], p[1], p[2], cell * 0.25);
        const d = cat(...p);
        p = [p[0] - g[0] * d, p[1] - g[1] * d, p[2] - g[2] * d];
      }
    points.push(p);
  }
  const remap = new Int32Array(count).fill(-1);
  const keep = (i: number) => {
    if (remap[i] < 0) {
      const p = points[i];
      const n = gradient(cat, p[0], p[1], p[2], cell * 0.5);
      remap[i] = out.length;
      out.push({ p, n, ...describe(p, n) });
    }
    return remap[i];
  };
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const [a, b, c] = [mesh.indices[t], mesh.indices[t + 1], mesh.indices[t + 2]];
    if (inside[a] && inside[b] && inside[c]) continue;
    indices.push(keep(a), keep(b), keep(c));
  }
}

/** One ear: a cupped sheet, furred behind, bare and pink in front with long pale hairs at its inner edge. */
function ear(s: 1 | -1, out: Vertex[], indices: number[]) {
  const norm = (v: Vec3): Vec3 => {
    const l = Math.hypot(...v) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const base: Vec3 = [s * 0.0335, 0.2935, 0.2035];
  const up = norm([s * 0.34, 1, -0.1]);
  const across = norm(cross(up, norm([s * 0.3, 0.05, 1]))); // points outward
  const front = cross(across, up);
  const outward = s; // across points to +x for the left ear, -x for the right: both are outward
  const H = 0.056;
  const W = 0.0275;
  const NU = 8;
  const NV = 10;
  const at = (u: number, v: number): Vec3 => {
    const w = W * Math.pow(1 - v, 0.78) + 0.0012;
    const cup = -0.013 * (1 - u * u) * (1 - 0.55 * v) - 0.004 * v * v;
    return [0, 1, 2].map((i) => base[i] + across[i] * u * w * outward + up[i] * v * H + front[i] * cup) as Vec3;
  };
  const earBone = bone(s === 1 ? "earL" : "earR");
  const headBone = bone("head");
  for (const face of [1, -1]) {
    const start = out.length;
    for (let j = 0; j <= NV; j++)
      for (let i = 0; i <= NU; i++) {
        const u = (i / NU) * 2 - 1; // -1 is the inner edge (toward the other ear), +1 the outer
        const v = j / NV;
        const p = at(u, v);
        const e = 0.01;
        const du = at(Math.min(1, u + e), v).map((c, k) => c - at(Math.max(-1, u - e), v)[k]) as Vec3;
        const dv = at(u, Math.min(1, v + e)).map((c, k) => c - at(u, Math.max(0, v - e))[k]) as Vec3;
        const n0 = norm(cross(du, dv));
        // du runs outward, which flips with the side; make n0 always the front face's normal.
        const frontNormal: Vec3 = n0[0] * front[0] + n0[1] * front[1] + n0[2] * front[2] > 0 ? n0 : [-n0[0], -n0[1], -n0[2]];
        const n: Vec3 = face === 1 ? frontNormal : [-frontNormal[0], -frontNormal[1], -frontNormal[2]];
        const lift = Math.min(1, Math.max(0, v / 0.3));
        const w = lift * lift * (3 - 2 * lift);
        const edge = Math.max(Math.abs(u), v);
        let fur: number;
        let lay: number;
        let comb: Vec3;
        let color: Vec3;
        if (face === 1) {
          // Inside: bare pink skin, with a fringe of long pale hair along the inner edge.
          const fringe = Math.max(0, -u - 0.1) * (1 - v * 0.7);
          fur = 0.0015 + 0.03 * fringe;
          lay = 0.7;
          comb = norm([across[0] * outward + up[0] * 0.6, across[1] * outward + up[1] * 0.6, across[2] * outward + up[2] * 0.6]);
          const rim = Math.min(1, Math.max(0, (edge - 0.8) / 0.2));
          color = [0, 1, 2].map((k) => COAT.earInside[k] + (COAT.saddle[k] - COAT.earInside[k]) * rim + (COAT.pale[k] - COAT.earInside[k]) * Math.min(1, fringe * 1.6)) as Vec3;
        } else {
          // Behind: short dark fur, paler at the base, with a small tuft at the tip.
          fur = 0.008 + 0.02 * Math.max(0, (v - 0.72) / 0.28);
          lay = 0.75;
          comb = up;
          const t = Math.min(1, v * 1.3);
          color = [0, 1, 2].map((k) => COAT.ground[k] + (COAT.dark[k] - COAT.ground[k]) * (0.35 + 0.5 * t)) as Vec3;
        }
        // Keep the comb along the sheet.
        const d = comb[0] * n[0] + comb[1] * n[1] + comb[2] * n[2];
        comb = norm([comb[0] - n[0] * d, comb[1] - n[1] * d, comb[2] - n[2] * d]);
        out.push({ p, n, bones: [earBone, headBone, 0, 0], weights: [w, 1 - w, 0, 0], fur, lay, comb, color });
      }
    for (let j = 0; j < NV; j++)
      for (let i = 0; i < NU; i++) {
        const a = start + i + (NU + 1) * j;
        const b = a + 1;
        const c = a + NU + 1;
        const d = c + 1;
        // Wound so each face is seen from its own side.
        const ccw = (face === 1) === (s === 1);
        if (ccw) indices.push(a, b, d, a, d, c);
        else indices.push(a, d, b, a, c, d);
      }
  }
}

const srgb = (c: number) => Math.round(Math.min(1, Math.max(0, c)) * 255);
const snorm = (c: number) => Math.round(Math.min(1, Math.max(-1, c)) * 127);

export function bake(): { file: ArrayBuffer; vertices: number; triangles: number; headStart: number } {
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  part((x, y, z) => Math.max(cat(x, y, z), -fine(x, y, z)), [-0.145, -0.012, -0.515], [0.145, 0.33, 0.31], 0.0082, vertices, indices);
  const headStart = indices.length;
  const within = (b: { center: Vec3; radius: number }, field: Field, cell: number) => {
    const r = b.radius + 0.006;
    part((x, y, z) => Math.max(cat(x, y, z), field(x, y, z)), [b.center[0] - r, b.center[1] - r, b.center[2] - r], [b.center[0] + r, b.center[1] + r, b.center[2] + r], cell, vertices, indices);
  };
  within(HEAD, headBall, 0.0038);
  PAWS.forEach((paw, i) => within(paw, pawBalls[i], 0.0031));
  ear(1, vertices, indices);
  ear(-1, vertices, indices);

  const count = vertices.length;
  if (count > 65535) throw new Error(`${count} vertices is too many for 16-bit indices`);
  for (const v of vertices) for (const b of v.bones) if (b < 0 || b >= BONE_COUNT) throw new Error("bad bone index");

  const header = 16;
  const size = header + count * (12 + 4 + 4 + 4 + 4 + 4) + indices.length * 2;
  const file = new ArrayBuffer(Math.ceil(size / 4) * 4);
  const view = new DataView(file);
  "CAT1".split("").forEach((ch, i) => view.setUint8(i, ch.charCodeAt(0)));
  view.setUint32(4, count, true);
  view.setUint32(8, indices.length, true);
  view.setUint32(12, headStart, true);

  let o = header;
  for (const v of vertices)
    for (const c of v.p) {
      view.setFloat32(o, c, true);
      o += 4;
    }
  for (const v of vertices) {
    for (const c of v.n) view.setInt8(o++, snorm(c));
    o++;
  }
  for (const v of vertices) for (const b of v.bones) view.setUint8(o++, b);
  for (const v of vertices) {
    // Whole bytes that still add up to 255.
    const bytes = v.weights.map((w) => Math.round(w * 255));
    bytes[0] += 255 - bytes.reduce((a, b) => a + b, 0);
    for (const b of bytes) view.setUint8(o++, b);
  }
  for (const v of vertices) {
    for (const c of v.color) view.setUint8(o++, srgb(c));
    view.setUint8(o++, 255);
  }
  for (const v of vertices) {
    for (const c of v.comb) view.setInt8(o++, snorm(c * v.lay));
    view.setInt8(o++, snorm(v.fur / FUR_MAX));
  }
  for (const i of indices) {
    view.setUint16(o, i, true);
    o += 2;
  }

  return { file, vertices: count, triangles: indices.length / 3, headStart };
}

// Keeps the landmark import honest: the eyes must sit on the head part.
if (headBall(...FACE.eye) > 0) throw new Error("the eyes are outside the finely meshed head");
