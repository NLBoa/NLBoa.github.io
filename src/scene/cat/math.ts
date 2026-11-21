/**
 * Small rotation helpers on plain arrays ([x, y, z, w] quaternions stored end to end),
 * so the cat's motion can be worked out and tested without a renderer.
 */

export type V3 = [number, number, number];
type Arr = Float32Array | number[];

export const rad = (d: number) => (d * Math.PI) / 180;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Slow in, slow out. */
export const ease = (t: number) => {
  const x = clamp(t);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** 0 before a, 1 after b, eased between. */
export const ramp = (a: number, b: number, x: number) => ease((x - a) / (b - a));
/** Rises over [a, b], holds, falls over [c, d]. */
export const window4 = (a: number, b: number, c: number, d: number, x: number) => ramp(a, b, x) * (1 - ramp(c, d, x));

export function qSet(out: Arr, o: number, x: number, y: number, z: number, w: number) {
  out[o] = x;
  out[o + 1] = y;
  out[o + 2] = z;
  out[o + 3] = w;
}

/** out = a * b (b is applied first). */
export function qMul(out: Arr, o: number, a: Arr, ai: number, b: Arr, bi: number) {
  const ax = a[ai], ay = a[ai + 1], az = a[ai + 2], aw = a[ai + 3];
  const bx = b[bi], by = b[bi + 1], bz = b[bi + 2], bw = b[bi + 3];
  out[o] = aw * bx + ax * bw + ay * bz - az * by;
  out[o + 1] = aw * by - ax * bz + ay * bw + az * bx;
  out[o + 2] = aw * bz + ax * by - ay * bx + az * bw;
  out[o + 3] = aw * bw - ax * bx - ay * by - az * bz;
}

/** out = inverse(a) * b. */
export function qMulInv(out: Arr, o: number, a: Arr, ai: number, b: Arr, bi: number) {
  const ax = -a[ai], ay = -a[ai + 1], az = -a[ai + 2], aw = a[ai + 3];
  const bx = b[bi], by = b[bi + 1], bz = b[bi + 2], bw = b[bi + 3];
  out[o] = aw * bx + ax * bw + ay * bz - az * by;
  out[o + 1] = aw * by - ax * bz + ay * bw + az * bx;
  out[o + 2] = aw * bz + ax * by - ay * bx + az * bw;
  out[o + 3] = aw * bw - ax * bx - ay * by - az * bz;
}

/** Rotates v by q. */
export function qRotate(out: Arr, o: number, q: Arr, qi: number, vx: number, vy: number, vz: number) {
  const x = q[qi], y = q[qi + 1], z = q[qi + 2], w = q[qi + 3];
  const tx = 2 * (y * vz - z * vy);
  const ty = 2 * (z * vx - x * vz);
  const tz = 2 * (x * vy - y * vx);
  out[o] = vx + w * tx + (y * tz - z * ty);
  out[o + 1] = vy + w * ty + (z * tx - x * tz);
  out[o + 2] = vz + w * tz + (x * ty - y * tx);
}

/** Yaw (y), then pitch (x), then roll (z), in radians. */
export function qEuler(out: Arr, o: number, rx: number, ry: number, rz: number) {
  const c1 = Math.cos(rx / 2), s1 = Math.sin(rx / 2);
  const c2 = Math.cos(ry / 2), s2 = Math.sin(ry / 2);
  const c3 = Math.cos(rz / 2), s3 = Math.sin(rz / 2);
  out[o] = s1 * c2 * c3 + c1 * s2 * s3;
  out[o + 1] = c1 * s2 * c3 - s1 * c2 * s3;
  out[o + 2] = c1 * c2 * s3 - s1 * s2 * c3;
  out[o + 3] = c1 * c2 * c3 + s1 * s2 * s3;
}

/** The shortest turn that takes unit vector a onto unit vector b. */
export function qArc(out: Arr, o: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  const d = ax * bx + ay * by + az * bz;
  if (d < -0.999999) {
    // Opposite: turn half way round any axis square to a.
    let x = 0, y = -az, z = ay;
    if (Math.abs(ax) > 0.9) {
      x = -az;
      y = 0;
      z = ax;
    }
    const l = Math.hypot(x, y, z);
    qSet(out, o, x / l, y / l, z / l, 0);
    return;
  }
  const x = ay * bz - az * by;
  const y = az * bx - ax * bz;
  const z = ax * by - ay * bx;
  const w = 1 + d;
  const l = Math.hypot(x, y, z, w);
  qSet(out, o, x / l, y / l, z / l, w / l);
}

/** Blend from a to b the short way round. */
export function qMix(out: Arr, o: number, a: Arr, ai: number, b: Arr, bi: number, t: number) {
  const dot = a[ai] * b[bi] + a[ai + 1] * b[bi + 1] + a[ai + 2] * b[bi + 2] + a[ai + 3] * b[bi + 3];
  const s = dot < 0 ? -1 : 1;
  let u = 1 - t;
  let v = t * s;
  // Far apart: follow the arc, so the turn keeps an even speed.
  const d = Math.abs(dot);
  if (d < 0.95) {
    const angle = Math.acos(d);
    const sin = Math.sin(angle);
    u = Math.sin((1 - t) * angle) / sin;
    v = (Math.sin(t * angle) / sin) * s;
  }
  const x = a[ai] * u + b[bi] * v;
  const y = a[ai + 1] * u + b[bi + 1] * v;
  const z = a[ai + 2] * u + b[bi + 2] * v;
  const w = a[ai + 3] * u + b[bi + 3] * v;
  const l = Math.hypot(x, y, z, w) || 1;
  qSet(out, o, x / l, y / l, z / l, w / l);
}

/** Smooth noise in one dimension, between -1 and 1: for motion that wanders without repeating. */
export function wander(t: number, seed = 0): number {
  const i = Math.floor(t);
  const f = t - i;
  const h = (n: number) => {
    const s = Math.sin((n + seed * 57.3) * 127.1) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const u = f * f * f * (f * (6 * f - 15) + 10);
  return h(i) * (1 - u) + h(i + 1) * u;
}
