/**
 * The cat's skeleton, in its standing bind pose.
 *
 * Cat space: meters, +z is forward (nose), +y is up, +x is the cat's left; the ground is y = 0.
 * Every bone's rest orientation is the identity, so a pose is just a rotation per bone in these
 * same axes: +x turns the nose down (or swings a leg backward), +y turns left, +z rolls the left
 * side up.
 *
 * This file has no imports on purpose: the bake script runs it in plain Node.
 */

export type Vec3 = [number, number, number];

type BoneDef = readonly [name: string, parent: string | null, head: Vec3];

const side = (s: 1 | -1, tag: "L" | "R"): BoneDef[] => [
  [`ear${tag}`, "head", [s * 0.034, 0.3, 0.2]],
  // Front leg: shoulder, elbow, wrist.
  [`arm${tag}`, "chest", [s * 0.047, 0.172, 0.122]],
  [`forearm${tag}`, `arm${tag}`, [s * 0.052, 0.106, 0.086]],
  [`paw${tag}`, `forearm${tag}`, [s * 0.052, 0.034, 0.102]],
  // Hind leg: hip, knee, hock, toes.
  [`thigh${tag}`, "hips", [s * 0.05, 0.188, -0.118]],
  [`shin${tag}`, `thigh${tag}`, [s * 0.062, 0.116, -0.066]],
  [`hock${tag}`, `shin${tag}`, [s * 0.06, 0.078, -0.152]],
  [`foot${tag}`, `hock${tag}`, [s * 0.06, 0.022, -0.14]],
];

export const TAIL_BONES = 7;
const TAIL_START: Vec3 = [0, 0.228, -0.152];
export const TAIL_STEP = 0.048;

const defs: BoneDef[] = [
  ["hips", null, [0, 0.215, -0.105]],
  ["spine1", "hips", [0, 0.222, -0.04]],
  ["spine2", "spine1", [0, 0.224, 0.03]],
  // Only ever scaled: it carries the ribcage, so breathing moves no leg.
  ["ribs", "spine2", [0, 0.2, 0.03]],
  ["chest", "spine2", [0, 0.218, 0.095]],
  ["neck", "chest", [0, 0.232, 0.15]],
  ["head", "neck", [0, 0.262, 0.198]],
  ...Array.from({ length: TAIL_BONES }, (_, i): BoneDef => [
    `tail${i + 1}`,
    i === 0 ? "hips" : `tail${i}`,
    [TAIL_START[0], TAIL_START[1], TAIL_START[2] - i * TAIL_STEP],
  ]),
  ...side(1, "L"),
  ...side(-1, "R"),
];

export const BONE_NAMES = defs.map((d) => d[0]);
export type BoneName = string;

export const BONE_INDEX: Record<string, number> = Object.fromEntries(BONE_NAMES.map((n, i) => [n, i]));
export const BONE_PARENT: number[] = defs.map((d) => (d[1] === null ? -1 : BONE_INDEX[d[1]]));
export const BONE_HEAD: Vec3[] = defs.map((d) => d[2]);
export const BONE_COUNT = defs.length;

export const bone = (name: string): number => {
  const i = BONE_INDEX[name];
  if (i === undefined) throw new Error(`no bone called ${name}`);
  return i;
};

/** Where the tail ends, in the bind pose. */
export const TAIL_TIP: Vec3 = [0, TAIL_START[1], TAIL_START[2] - TAIL_BONES * TAIL_STEP];

/** Face landmarks in bind space; the eyes, nose and whiskers are placed from these. */
export const FACE = {
  /** Middle of the skull: the head's markings are drawn around it. */
  center: [0, 0.27, 0.214] as Vec3,
  eye: [0.0222, 0.2752, 0.2516] as Vec3, // left; mirror x for the right
  eyeRadius: 0.012,
  /** The eyes look a little outward. */
  eyeYaw: 0.2,
  nose: [0, 0.2595, 0.2768] as Vec3,
  mouth: [0, 0.2495, 0.2695] as Vec3,
  whiskerPad: [0.0105, 0.253, 0.2675] as Vec3,
} as const;

/**
 * Balls fixed to bones that may rest on the ground. After a pose is set the cat is lowered until
 * the lowest of them touches the desk.
 */
export const CONTACTS: { bone: string; at: Vec3; r: number }[] = [
  { bone: "hips", at: [0, 0.2, -0.13], r: 0.062 },
  { bone: "hips", at: [0.045, 0.185, -0.12], r: 0.058 },
  { bone: "hips", at: [-0.045, 0.185, -0.12], r: 0.058 },
  { bone: "spine1", at: [0, 0.203, -0.045], r: 0.07 },
  { bone: "spine2", at: [0, 0.198, 0.04], r: 0.072 },
  { bone: "chest", at: [0, 0.195, 0.105], r: 0.066 },
  { bone: "chest", at: [0.045, 0.17, 0.12], r: 0.04 },
  { bone: "chest", at: [-0.045, 0.17, 0.12], r: 0.04 },
  { bone: "head", at: [0, 0.27, 0.214], r: 0.05 },
  { bone: "head", at: [0.027, 0.259, 0.226], r: 0.03 },
  { bone: "head", at: [-0.027, 0.259, 0.226], r: 0.03 },
  ...(["L", "R"] as const).flatMap((tag) => {
    const s = tag === "L" ? 1 : -1;
    return [
      { bone: `forearm${tag}`, at: [s * 0.052, 0.106, 0.086] as Vec3, r: 0.026 },
      { bone: `paw${tag}`, at: [s * 0.052, 0.03, 0.104] as Vec3, r: 0.019 },
      { bone: `paw${tag}`, at: [s * 0.052, 0.019, 0.132] as Vec3, r: 0.019 },
      { bone: `shin${tag}`, at: [s * 0.062, 0.116, -0.066] as Vec3, r: 0.034 },
      { bone: `hock${tag}`, at: [s * 0.06, 0.078, -0.152] as Vec3, r: 0.019 },
      { bone: `foot${tag}`, at: [s * 0.06, 0.02, -0.138] as Vec3, r: 0.018 },
      { bone: `foot${tag}`, at: [s * 0.06, 0.0185, -0.106] as Vec3, r: 0.0185 },
    ];
  }),
  ...Array.from({ length: TAIL_BONES }, (_, i) => ({
    bone: `tail${i + 1}`,
    at: [0, TAIL_START[1], TAIL_START[2] - (i + 0.5) * TAIL_STEP] as Vec3,
    r: 0.03,
  })),
];
