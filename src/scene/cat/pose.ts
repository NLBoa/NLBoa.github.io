/**
 * Poses: a rotation for every bone, where the hips are, and a few extra dials (eyes, purr...).
 * Also the two things every pose needs before it is shown: where the bones end up in space,
 * and how far to lower the cat so it rests on the desk instead of floating or sinking.
 *
 * No renderer in here: all of it is plain numbers, and tested.
 */

import { BONE_COUNT, BONE_HEAD, BONE_NAMES, BONE_PARENT, CONTACTS, TAIL_BONES, TAIL_STEP, bone, type Vec3 } from "./rig";
import { lerp, qArc, qEuler, qMix, qMul, qMulInv, qRotate, qSet, rad } from "./math";

/** The dials beside the bones. */
export const CH = {
  /** Eyelids: 1 wide open, 0 shut. */
  eye: 0,
  /** Pupils: 0 a thin slit, 1 round and full. */
  pupil: 1,
  /** 0 to 1: how hard it is purring. */
  purr: 2,
  /** 0 to 1: how far the tongue is out. */
  tongue: 3,
  /** 0 to 1: how much the head and eyes may turn to what it is watching. */
  gaze: 4,
  /** Depth of breathing: 1 is calm rest. */
  breath: 5,
  /** 0 to 1: how lively the tail is. */
  tail: 6,
  /** -1 ears pricked forward, 0 neutral, 1 laid back. */
  ears: 7,
  /**
   * 0 to 1: the legs are folded away under the body and no longer hold it up. The body then
   * rests on its chest and haunches, and the folded legs sink out of sight below the desk top,
   * which is how a loaf looks: no legs at all.
   */
  tucked: 8,
} as const;
export const CH_COUNT = 9;
const CH_DEFAULT = [1, 0.62, 0, 0, 1, 1, 0.3, 0, 0];

export type Pose = { q: Float32Array; at: Float32Array; ch: Float32Array };

export function makePose(): Pose {
  const q = new Float32Array(BONE_COUNT * 4);
  for (let i = 0; i < BONE_COUNT; i++) q[i * 4 + 3] = 1;
  return { q, at: new Float32Array(3), ch: Float32Array.from(CH_DEFAULT) };
}

export function copyPose(out: Pose, a: Pose): Pose {
  out.q.set(a.q);
  out.at.set(a.at);
  out.ch.set(a.ch);
  return out;
}

// Parts of the body that may move at different moments of a change of pose.
export const GROUP = { core: 0, front: 1, head: 2, hind: 3, tail: 4 } as const;
const groupOf = (name: string): number => {
  if (/^(hips|spine|ribs)/.test(name)) return GROUP.core;
  if (/^(chest|arm|forearm|paw)/.test(name)) return GROUP.front;
  if (/^(neck|head|ear)/.test(name)) return GROUP.head;
  if (/^tail/.test(name)) return GROUP.tail;
  return GROUP.hind;
};
export const BONE_GROUP = BONE_NAMES.map(groupOf);

/** Blends a toward b. `t` is one number, or one per body part (see GROUP). */
export function mixPose(out: Pose, a: Pose, b: Pose, t: number | ArrayLike<number>): Pose {
  const whole = typeof t === "number" ? t : t[GROUP.core];
  for (let i = 0; i < BONE_COUNT; i++) qMix(out.q, i * 4, a.q, i * 4, b.q, i * 4, typeof t === "number" ? t : t[BONE_GROUP[i]]);
  for (let i = 0; i < 3; i++) out.at[i] = lerp(a.at[i], b.at[i], whole);
  for (let i = 0; i < CH_COUNT; i++) out.ch[i] = lerp(a.ch[i], b.ch[i], whole);
  return out;
}

/** Turns one bone a little more, on top of what it has: degrees about x, y, z. */
export function turn(pose: Pose, index: number, rx: number, ry: number, rz: number) {
  qEuler(tmpQ, 0, rad(rx), rad(ry), rad(rz));
  qMul(pose.q, index * 4, pose.q, index * 4, tmpQ, 0);
}
const tmpQ = [0, 0, 0, 1];

// Where the bones are -----------------------------------------------------------------

/** Each bone's place relative to the bone it hangs from, in the bind pose. */
export const BONE_OFFSET: Vec3[] = BONE_HEAD.map((head, i) => {
  const parent = BONE_PARENT[i];
  return parent < 0 ? head : [head[0] - BONE_HEAD[parent][0], head[1] - BONE_HEAD[parent][1], head[2] - BONE_HEAD[parent][2]];
});

export type World = { q: Float32Array; p: Float32Array; lift: number };
export const makeWorld = (): World => ({ q: new Float32Array(BONE_COUNT * 4), p: new Float32Array(BONE_COUNT * 3), lift: 0 });

/** Works out every bone's rotation and position in cat space, before the cat is set on the ground. */
export function solve(pose: Pose, world: World, from = 0) {
  for (let i = from; i < BONE_COUNT; i++) {
    const parent = BONE_PARENT[i];
    if (parent < 0) {
      world.q.set(pose.q.subarray(i * 4, i * 4 + 4), i * 4);
      world.p[i * 3] = BONE_OFFSET[i][0] + pose.at[0];
      world.p[i * 3 + 1] = BONE_OFFSET[i][1] + pose.at[1];
      world.p[i * 3 + 2] = BONE_OFFSET[i][2] + pose.at[2];
    } else {
      qMul(world.q, i * 4, world.q, parent * 4, pose.q, i * 4);
      qRotate(world.p, i * 3, world.q, parent * 4, BONE_OFFSET[i][0], BONE_OFFSET[i][1], BONE_OFFSET[i][2]);
      world.p[i * 3] += world.p[parent * 3];
      world.p[i * 3 + 1] += world.p[parent * 3 + 1];
      world.p[i * 3 + 2] += world.p[parent * 3 + 2];
    }
  }
}

const contacts = CONTACTS.map((c) => {
  const index = bone(c.bone);
  const head = BONE_HEAD[index];
  return { index, name: c.bone, local: [c.at[0] - head[0], c.at[1] - head[1], c.at[2] - head[2]] as Vec3, r: c.r, tail: c.bone.startsWith("tail"), leg: /^(forearm|paw|shin|hock|foot)/.test(c.bone) };
});
const point = [0, 0, 0];

/** Height of the underside of contact ball `i` above y = 0, as the bones now stand. */
function underside(world: World, i: number): number {
  const c = contacts[i];
  qRotate(point, 0, world.q, c.index * 4, c.local[0], c.local[1], c.local[2]);
  return world.p[c.index * 3 + 1] + point[1] - c.r;
}

/** The lowest underside among the contact balls on bones whose names start with one of `names`. */
export function lowest(world: World, names: string[]): number {
  let low = Infinity;
  for (let i = 0; i < contacts.length; i++) if (names.some((n) => contacts[i].name.startsWith(n))) low = Math.min(low, underside(world, i));
  return low;
}

/** A smooth stand-in for "the lowest point", so the cat does not jerk as its weight shifts from one part to another. */
const SOFT = 0.004;

/**
 * Sets the cat on the desk: lowers (or raises) every bone until its lowest part rests at y = 0.
 * The tail does not hold the cat up; it is laid on the desk afterwards (see layTail).
 */
export function settle(pose: Pose, world: World): number {
  solve(pose, world);
  // Folded-away legs count for less and less, then not at all.
  const tucked = pose.ch[CH.tucked] * 0.09;
  const height = (i: number) => underside(world, i) + (contacts[i].leg ? tucked : 0);
  let low = Infinity;
  for (let i = 0; i < contacts.length; i++) if (!contacts[i].tail) low = Math.min(low, height(i));
  let sum = 0;
  for (let i = 0; i < contacts.length; i++) if (!contacts[i].tail) sum += Math.exp(-(height(i) - low) / SOFT);
  const rest = low - SOFT * Math.log(sum) + SOFT * Math.log(2);
  for (let i = 0; i < BONE_COUNT; i++) world.p[i * 3 + 1] -= rest;
  world.lift = -rest;
  return world.lift;
}

const TAIL_FIRST = bone("tail1");
const TAIL_FLOOR = 0.026;
const arc = [0, 0, 0, 1];
const dir = [0, 0, 0];

/** Lays the tail on the desk: it falls to it from wherever the pose left it, and never passes through. */
export function layTail(pose: Pose, world: World) {
  // The way the tail was last heading over the desk: a joint that points almost straight down has
  // no heading of its own, and borrows this one, so it never spins about.
  qRotate(dir, 0, world.q, BONE_PARENT[TAIL_FIRST] * 4, 0, 0, -1);
  let headX = dir[0];
  let headZ = dir[2];
  for (let k = 0; k < TAIL_BONES; k++) {
    const i = TAIL_FIRST + k;
    const parent = BONE_PARENT[i];
    // This joint's place and heading follow from its parent, which may just have been bent.
    qMul(world.q, i * 4, world.q, parent * 4, pose.q, i * 4);
    qRotate(world.p, i * 3, world.q, parent * 4, BONE_OFFSET[i][0], BONE_OFFSET[i][1], BONE_OFFSET[i][2]);
    for (let a = 0; a < 3; a++) world.p[i * 3 + a] += world.p[parent * 3 + a];
    qRotate(dir, 0, world.q, i * 4, 0, 0, -1);
    const base = world.p[i * 3 + 1];
    // The floor rises a little toward the tip, where the plume is thinner.
    const floor = TAIL_FLOOR - 0.008 * (k / TAIL_BONES);
    // A resting tail has weight: each joint drops its end to the desk, as steeply as a tail bends
    // (about 50 degrees a joint), and one already lower than that is bent up on to it.
    const need = (floor - base) / TAIL_STEP;
    const up = Math.max(-0.78, Math.min(1, need));
    const hx = dir[0] + headX * 0.12;
    const hz = dir[2] + headZ * 0.12;
    const flat = Math.hypot(hx, hz) || 1;
    const reach = Math.sqrt(Math.max(0, 1 - up * up));
    const fx = (hx / flat) * reach;
    const fz = (hz / flat) * reach;
    if (reach > 0.2) {
      headX = hx / flat;
      headZ = hz / flat;
    }
    qArc(arc, 0, dir[0], dir[1], dir[2], fx, up, fz);
    qMul(world.q, i * 4, arc, 0, world.q, i * 4);
    qMulInv(pose.q, i * 4, world.q, parent * 4, world.q, i * 4);
  }
}

// Writing a pose down ----------------------------------------------------------------

type Euler = [rx: number, ry: number, rz: number];
/** Which way a leg segment points: degrees forward of straight down, then degrees out to the side. */
export type Aim = [forward: number, out?: number];

export type PoseSpec = {
  hips?: Euler;
  /** Hips moved from where they stand in the bind pose: left, up, forward (meters). */
  at?: Vec3;
  spine1?: Euler;
  spine2?: Euler;
  chest?: Euler;
  neck?: Euler;
  head?: Euler;
  /** Both ears, mirrored; or each on its own. */
  ears?: Euler;
  earL?: Euler;
  earR?: Euler;
  /**
   * Each tail joint, base to tip: which way it heads (0 straight back, 90 toward the cat's left,
   * 180 forward, negative toward its right) and how many degrees it dips below level (the dip
   * hardly matters: the tail is laid on the desk afterwards, see layTail).
   * Joints left out carry on the way the one before them was going.
   */
  tail?: [heading: number, dip?: number][];
  arm?: Aim;
  forearm?: Aim;
  paw?: Aim;
  thigh?: Aim;
  shin?: Aim;
  hock?: Aim;
  foot?: Aim;
  armL?: Aim;
  armR?: Aim;
  forearmL?: Aim;
  forearmR?: Aim;
  pawL?: Aim;
  pawR?: Aim;
  thighL?: Aim;
  thighR?: Aim;
  shinL?: Aim;
  shinR?: Aim;
  hockL?: Aim;
  hockR?: Aim;
  footL?: Aim;
  footR?: Aim;
  /**
   * One front paw reaching for a point that rides on another bone (the mouth, an ear): the
   * shoulder and elbow are bent to put the wrist there. `at` is the point in the bind pose;
   * `pole` is roughly which way the elbow should stick out.
   */
  reach?: { side: "L" | "R"; on: string; at: Vec3; pole: Vec3 };
  /**
   * Tip the whole body until the front and the back both rest on the ground: the contact balls
   * on bones starting with these names. Saves guessing the one angle that makes a pose sit true.
   */
  level?: { front: string[]; back: string[] };
  ch?: Partial<Record<keyof typeof CH, number>>;
};

const LEGS: [segment: "arm" | "forearm" | "paw" | "thigh" | "shin" | "hock" | "foot", toward: string | Vec3][] = [
  ["arm", "forearm"],
  ["forearm", "paw"],
  ["paw", [0, -0.011, 0.028]],
  ["thigh", "shin"],
  ["shin", "hock"],
  ["hock", "foot"],
  ["foot", [0, -0.0015, 0.032]],
];

const unit = (v: number[]): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

function setTrunk(pose: Pose, spec: PoseSpec, pitch: number) {
  const set = (name: string, e: Euler | undefined, mirror = 1) => {
    const i = bone(name);
    if (e) qEuler(pose.q, i * 4, rad(e[0]), rad(e[1] * mirror), rad(e[2] * mirror));
    else qSet(pose.q, i * 4, 0, 0, 0, 1);
  };
  const hips = spec.hips ?? [0, 0, 0];
  set("hips", [hips[0] + pitch, hips[1], hips[2]]);
  set("spine1", spec.spine1);
  set("spine2", spec.spine2);
  set("chest", spec.chest);
  set("neck", spec.neck);
  set("head", spec.head);
  set("earL", spec.earL ?? spec.ears);
  set("earR", spec.earR ?? spec.ears, spec.earR ? 1 : -1);
}

/** Where a reaching paw's shoulder and elbow must point, by bone. */
function reachAims(spec: PoseSpec, world: World): Map<number, Vec3> {
  const aims = new Map<number, Vec3>();
  const reach = spec.reach;
  if (!reach) return aims;
  const arm = bone(`arm${reach.side}`);
  const fore = bone(`forearm${reach.side}`);
  const wrist = bone(`paw${reach.side}`);
  const on = bone(reach.on);
  const length = (a: number, b: number) => Math.hypot(BONE_HEAD[b][0] - BONE_HEAD[a][0], BONE_HEAD[b][1] - BONE_HEAD[a][1], BONE_HEAD[b][2] - BONE_HEAD[a][2]);
  const l1 = length(arm, fore);
  const l2 = length(fore, wrist);
  const t = [0, 0, 0];
  qRotate(t, 0, world.q, on * 4, reach.at[0] - BONE_HEAD[on][0], reach.at[1] - BONE_HEAD[on][1], reach.at[2] - BONE_HEAD[on][2]);
  const d = [0, 1, 2].map((a) => t[a] + world.p[on * 3 + a] - world.p[arm * 3 + a]);
  const far = Math.hypot(d[0], d[1], d[2]);
  const n = unit(d);
  const dist = Math.min(l1 + l2 - 1e-4, Math.max(Math.abs(l1 - l2) + 1e-4, far));
  // The elbow sits on a circle round the shoulder-to-wrist line; the pole picks the point on it.
  const along = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const dot = reach.pole[0] * n[0] + reach.pole[1] * n[1] + reach.pole[2] * n[2];
  const side = unit([reach.pole[0] - n[0] * dot, reach.pole[1] - n[1] * dot, reach.pole[2] - n[2] * dot]);
  const elbow = [0, 1, 2].map((a) => n[a] * along + side[a] * off);
  aims.set(arm, unit(elbow));
  aims.set(fore, unit([n[0] * dist - elbow[0], n[1] * dist - elbow[1], n[2] * dist - elbow[2]]));
  return aims;
}

function setLegs(pose: Pose, spec: PoseSpec, world: World) {
  const reaching = reachAims(spec, world);
  for (const [tag, s] of [
    ["L", 1],
    ["R", -1],
  ] as const) {
    for (const [segment, toward] of LEGS) {
      const i = bone(segment + tag);
      const parent = BONE_PARENT[i];
      const aim = spec[`${segment}${tag}`] ?? spec[segment];
      const reach = reaching.get(i);
      if (!aim && !reach) {
        // Left as it is in the bind pose, relative to what it hangs from.
        qSet(pose.q, i * 4, 0, 0, 0, 1);
        world.q.set(world.q.subarray(parent * 4, parent * 4 + 4), i * 4);
        continue;
      }
      const rest = unit(
        typeof toward === "string"
          ? [BONE_HEAD[bone(toward + tag)][0] - BONE_HEAD[i][0], BONE_HEAD[bone(toward + tag)][1] - BONE_HEAD[i][1], BONE_HEAD[bone(toward + tag)][2] - BONE_HEAD[i][2]]
          : toward,
      );
      const f = rad(aim?.[0] ?? 0);
      const o = rad(aim?.[1] ?? 0);
      const d: Vec3 = reach ?? [s * Math.sin(o), -Math.cos(f) * Math.cos(o), Math.sin(f) * Math.cos(o)];
      qArc(world.q, i * 4, rest[0], rest[1], rest[2], d[0], d[1], d[2]);
      qMulInv(pose.q, i * 4, world.q, parent * 4, world.q, i * 4);
    }
  }
}

function setTail(pose: Pose, spec: PoseSpec, world: World) {
  for (let k = 0; k < TAIL_BONES; k++) {
    const i = TAIL_FIRST + k;
    const parent = BONE_PARENT[i];
    const t = spec.tail?.[k];
    if (!t) {
      qSet(pose.q, i * 4, 0, 0, 0, 1);
      world.q.set(world.q.subarray(parent * 4, parent * 4 + 4), i * 4);
      continue;
    }
    const h = rad(t[0]);
    const dip = rad(t[1] ?? 0);
    qArc(world.q, i * 4, 0, 0, -1, Math.sin(h) * Math.cos(dip), -Math.sin(dip), -Math.cos(h) * Math.cos(dip));
    qMulInv(pose.q, i * 4, world.q, parent * 4, world.q, i * 4);
  }
}

/** Builds a pose from its written description. */
export function buildPose(spec: PoseSpec): Pose {
  const pose = makePose();
  const world = makeWorld();
  let pitch = 0;
  for (let pass = 0; pass < (spec.level ? 24 : 1); pass++) {
    setTrunk(pose, spec, pitch);
    if (spec.at) pose.at.set(spec.at);
    solve(pose, world);
    setLegs(pose, spec, world);
    setTail(pose, spec, world);
    if (!spec.level) break;
    solve(pose, world);
    // Front higher than back: tip the nose down a little, and look again.
    const gap = lowest(world, spec.level.front) - lowest(world, spec.level.back);
    if (Math.abs(gap) < 0.0002) break;
    pitch += (gap / 0.22) * (180 / Math.PI) * 0.8;
  }
  for (const [name, value] of Object.entries(spec.ch ?? {})) pose.ch[CH[name as keyof typeof CH]] = value;
  return pose;
}
