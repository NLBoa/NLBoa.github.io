/**
 * How the cat moves. A queue of clips (rests, changes of stance, emotes) gives a base pose for
 * each moment; on top of it run the things a living animal never stops doing (breathing,
 * blinking, an ear flick, the tail, the eyes going to whatever it is watching); then the cat is
 * set on the desk. Everything is a smooth function of time: nothing snaps.
 *
 * Plain numbers only, so it runs in tests without a renderer.
 */

import { clamp, ease, lerp, qArc, qMix, qMul, qMulInv, qRotate, ramp, wander, window4, type V3 } from "./math";
import { BONE_OFFSET, CH, GROUP, buildPose, copyPose, layTail, makePose, makeWorld, mixPose, settle, turn, type Pose } from "./pose";
import { BONE_PARENT, TAIL_BONES, bone } from "./rig";
import { SPECS, STANCES, type StanceName } from "./stances";

export const EMOTES = ["loaf", "purr", "clean", "roll", "stare"] as const;
export type EmoteName = (typeof EMOTES)[number];

export type Clip = {
  name: string;
  /** The stance the cat is in once the clip is over. */
  stance: StanceName;
  /** Seconds; Infinity for a rest that lasts until something else is asked for. */
  duration: number;
  /** Seconds over which it takes over from whatever came before. */
  fade: number;
  sample: (t: number, out: Pose) => void;
  /** 0 to 1: how firmly the cat fixes the viewer at this moment. */
  stare?: (t: number) => number;
  /** A rest is not busy: the picture may be redrawn less often. */
  busy: boolean;
};

const B = {
  hips: bone("hips"),
  spine1: bone("spine1"),
  spine2: bone("spine2"),
  chest: bone("chest"),
  neck: bone("neck"),
  head: bone("head"),
  earL: bone("earL"),
  earR: bone("earR"),
  tail1: bone("tail1"),
  armL: bone("armL"),
  armR: bone("armR"),
  forearmL: bone("forearmL"),
  forearmR: bone("forearmR"),
  pawL: bone("pawL"),
  pawR: bone("pawR"),
  thighL: bone("thighL"),
  thighR: bone("thighR"),
  shinL: bone("shinL"),
  shinR: bone("shinR"),
};

const TAU = Math.PI * 2;

// Rests and changes of stance ----------------------------------------------------------

const rest = (stance: StanceName): Clip => ({
  name: stance,
  stance,
  duration: Infinity,
  fade: 0.5,
  busy: false,
  sample: (_t, out) => void copyPose(out, STANCES[stance]),
});

/**
 * When each part of the body makes its move during a change of stance, as fractions of the
 * change: [core, front, head, hind, tail], each [start, end]. A cat does not move all at once.
 */
const SHIFTS: Record<string, { seconds: number; parts: [number, number][] }> = {
  // Up on the front legs first; the haunches settle after.
  "loaf>sit": { seconds: 1.5, parts: [[0.06, 0.9], [0, 0.72], [0, 0.6], [0.2, 1], [0.3, 1]] },
  // Haunches and body sink; the front legs slide out and fold last.
  "sit>loaf": { seconds: 1.7, parts: [[0, 0.8], [0.14, 1], [0.25, 1], [0, 0.7], [0.1, 1]] },
  // The head leads the flop; the legs let go once the body is over.
  "loaf>side": { seconds: 1.7, parts: [[0, 0.86], [0.25, 1], [0, 0.6], [0.3, 1], [0.2, 1]] },
  "side>loaf": { seconds: 1.8, parts: [[0.1, 0.92], [0, 0.72], [0, 0.5], [0, 0.78], [0.3, 1]] },
};
const ORDER: StanceName[] = ["sit", "loaf", "side"];
const parts = [0, 0, 0, 0, 0];

function shift(a: StanceName, b: StanceName): Clip {
  const plan = SHIFTS[`${a}>${b}`];
  return {
    name: `${a}>${b}`,
    stance: b,
    duration: plan.seconds,
    fade: 0.3,
    busy: true,
    sample: (t, out) => {
      for (let g = 0; g < 5; g++) parts[g] = ramp(plan.parts[g][0], plan.parts[g][1], t / plan.seconds);
      mixPose(out, STANCES[a], STANCES[b], parts);
    },
  };
}

/** The changes of stance that lead from one to another: sit and side are both reached through the loaf. */
export function route(from: StanceName, to: StanceName): Clip[] {
  const clips: Clip[] = [];
  let i = ORDER.indexOf(from);
  const j = ORDER.indexOf(to);
  while (i !== j) {
    const next = i + Math.sign(j - i);
    clips.push(shift(ORDER[i], ORDER[next]));
    i = next;
  }
  return clips;
}

// Emotes -------------------------------------------------------------------------------------

/** Seconds for one lean of the head from side to side and back while purring. */
const PURR_SWAY = 2.5;

/** Purr: eyes close to slits, the chin lifts, and the whole coat trembles. */
function purr(stance: StanceName): Clip {
  return {
    name: "purr",
    stance,
    duration: 8,
    fade: 0.5,
    busy: true,
    sample: (t, out) => {
      copyPose(out, STANCES[stance]);
      const k = window4(0, 1.5, 6.4, 8, t);
      out.ch[CH.purr] = k;
      out.ch[CH.eye] = lerp(out.ch[CH.eye], 0.1, k);
      out.ch[CH.gaze] = lerp(1, 0.2, k);
      out.ch[CH.ears] = 0.25 * k;
      out.ch[CH.breath] = 1 + 0.6 * k;
      out.ch[CH.tail] = lerp(out.ch[CH.tail], 0.45, k);
      // Chin up and a slow, pleased lean of the head from side to side.
      turn(out, B.neck, -7 * k, 0, 0);
      turn(out, B.head, -6 * k, 0, 9 * k * Math.sin((t * TAU) / PURR_SWAY));
    },
  };
}

/** Stare: everything goes still, the ears come forward, the pupils open, and it looks straight at you. */
function stare(stance: StanceName): Clip {
  const hold = (t: number) => window4(0, 0.7, 7.3, 8.2, t);
  return {
    name: "stare",
    stance,
    duration: 8.2,
    fade: 0.4,
    busy: true,
    stare: hold,
    sample: (t, out) => {
      copyPose(out, STANCES[stance]);
      const k = hold(t);
      // It ends with one slow blink: a cat's way of saying it is at ease with you.
      const blink = window4(5.9, 6.5, 6.7, 7.3, t);
      out.ch[CH.eye] = lerp(out.ch[CH.eye], 1.08, k) * (1 - 0.94 * blink);
      out.ch[CH.pupil] = lerp(out.ch[CH.pupil], 0.96, ramp(0.4, 3, t) * k);
      out.ch[CH.ears] = -k;
      out.ch[CH.breath] = lerp(1, 0.45, k);
      out.ch[CH.tail] = lerp(out.ch[CH.tail], 0.9, k);
      out.ch[CH.gaze] = 1;
      turn(out, B.neck, -5 * k, 0, 0);
      turn(out, B.chest, 2 * k, 0, 0);
    },
  };
}

// Cleaning: one front paw comes up to the mouth to be licked, then is drawn over the face.
const sitUp = { ...SPECS.sit, spine2: [10, 0, 2] as [number, number, number], chest: [14, -4, 3] as [number, number, number] };
const LICK = buildPose({
  ...sitUp,
  neck: [-12, -8, 0],
  head: [50, -10, 8],
  reach: { side: "R", on: "head", at: [-0.012, 0.212, 0.268], pole: [-1, -0.5, 0.2] },
  pawR: [168, 8],
  ch: { tail: 0.2, eye: 0.55, gaze: 0 },
});
const WIPE = buildPose({
  ...sitUp,
  neck: [-18, -6, -8],
  head: [44, -14, -16],
  reach: { side: "R", on: "head", at: [-0.04, 0.286, 0.262], pole: [-1, -0.5, 0.2] },
  pawR: [166, 4],
  ch: { tail: 0.2, eye: 0.08, gaze: 0 },
});
const scratchA = makePose();

function clean(): Clip {
  const total = 10;
  return {
    name: "clean",
    stance: "sit",
    duration: total,
    fade: 0.4,
    busy: true,
    sample: (t, out) => {
      // Paw up, and down again at the end.
      for (let g = 0; g < 5; g++) parts[g] = 0;
      const up = ramp(0, 1.1, t) * (1 - ramp(total - 1.2, total - 0.1, t));
      parts[GROUP.front] = up;
      parts[GROUP.head] = ramp(0.15, 1.0, t) * (1 - ramp(total - 1.3, total - 0.35, t));
      parts[GROUP.core] = up;
      // Three slow wipes over the face, in the middle.
      const wiping = window4(3.9, 4.3, 7.6, 8.0, t);
      const wipe = wiping * (0.5 - 0.5 * Math.cos(((t - 4.0) / 1.3) * TAU));
      mixPose(scratchA, LICK, WIPE, wipe);
      mixPose(out, STANCES.sit, scratchA, parts);
      // Licking: short strokes of the head, the tongue out on each, the paw meeting it.
      const licking = clamp(window4(1.0, 1.3, 3.9, 4.2, t) + window4(7.9, 8.1, 8.7, 8.9, t)) * (1 - wipe);
      const stroke = Math.sin(t * TAU * 2.2);
      turn(out, B.head, 5 * stroke * licking, 0, 0);
      turn(out, B.pawR, -6 * stroke * licking, 0, 0);
      out.ch[CH.tongue] = licking * (0.5 + 0.5 * stroke);
      out.ch[CH.ears] = 0.2 * up;
    },
  };
}

// Rolling over: from the side on to the back, a wriggle with the paws in the air, and back to the side.
const BACK = buildPose({
  hips: [0, 0, 162],
  at: [-0.1, 0, 0],
  spine1: [0, -5, 0],
  spine2: [0, -6, 0],
  chest: [0, -6, 6],
  neck: [-8, -10, -24],
  head: [6, -8, -42],
  armL: [150, 28],
  forearmL: [70, 16],
  pawL: [10, 0],
  armR: [142, -30],
  forearmR: [64, -18],
  pawR: [4, 0],
  thighL: [-162, 38],
  shinL: [-78, 28],
  hockL: [-150, 22],
  footL: [-110, 12],
  thighR: [-158, -42],
  shinR: [-72, -30],
  hockR: [-146, -24],
  footR: [-108, -14],
  tail: [[-14, 4], [-30, 2], [-48], [-66], [-82], [-96], [-108]],
  ch: { tail: 0.8, eye: 0.7, pupil: 0.7, tucked: 1 },
});

function roll(): Clip {
  const over = shift("loaf", "side");
  const d = over.duration;
  const total = d + 4.9;
  return {
    name: "roll",
    stance: "side",
    duration: total,
    fade: 0.35,
    busy: true,
    sample: (t, out) => {
      if (t < d) return over.sample(t, out);
      const u = t - d;
      // On to the back, hold, and ease down again on to the side.
      const onBack = ramp(0, 0.9, u) * (1 - ramp(3.5, 4.8, u));
      mixPose(out, STANCES.side, BACK, onBack);
      // The wriggle: the body twists one way and the other, the paws paddle.
      const w = window4(0.6, 1.2, 3.0, 3.8, u);
      const s = Math.sin(u * TAU * 1.35);
      const c = Math.cos(u * TAU * 1.35);
      turn(out, B.hips, 0, 7 * s * w, 0);
      turn(out, B.spine2, 0, -9 * s * w, 0);
      turn(out, B.chest, 0, -6 * s * w, 5 * c * w);
      turn(out, B.armL, 9 * c * w, 0, 0);
      turn(out, B.armR, -9 * c * w, 0, 0);
      turn(out, B.forearmL, 12 * s * w, 0, 0);
      turn(out, B.forearmR, -12 * s * w, 0, 0);
      turn(out, B.thighL, 7 * s * w, 0, 0);
      turn(out, B.thighR, -7 * s * w, 0, 0);
    },
  };
}

/** Settling into the loaf: a small shuffle as the paws tuck in, then the eyes half close. */
function tuck(): Clip {
  return {
    name: "loaf",
    stance: "loaf",
    duration: 2.2,
    fade: 0.4,
    busy: true,
    sample: (t, out) => {
      copyPose(out, STANCES.loaf);
      const w = window4(0, 0.3, 0.9, 1.9, t);
      const s = Math.sin(t * TAU * 1.5);
      turn(out, B.hips, 0, 2.6 * s * w, 2 * s * w);
      turn(out, B.chest, 1.5 * w, -2.6 * s * w, 0);
      out.ch[CH.eye] = lerp(1, STANCES.loaf.ch[CH.eye], ramp(1.2, 2.2, t));
    },
  };
}

/** The clips that make up an emote, starting from `stance`: any change of stance it needs, then the emote. */
export function plan(name: EmoteName, stance: StanceName): Clip[] {
  switch (name) {
    case "loaf":
      return [...route(stance, "loaf"), tuck()];
    case "clean":
      return [...route(stance, "sit"), clean()];
    case "roll":
      return [...route(stance, "loaf"), roll()];
    case "purr":
      return [purr(stance)];
    case "stare":
      return [stare(stance)];
  }
}

// The engine --------------------------------------------------------------------------------

export type MotionInput = {
  /** Something to watch, in cat space (the pointer), or null. */
  pointer: V3 | null;
  /** 0 to 1: how much the pointer holds its interest right now. */
  attention: number;
  /** The viewer's eye, in cat space. */
  camera: V3;
};

const IDENTITY = [0, 0, 0, 1];
const forward = [0, 0, 0];
const local = [0, 0, 0];
const turnQ = [0, 0, 0, 1];

export class CatMotion {
  /** The finished pose for this moment, and where its bones are. */
  readonly pose = makePose();
  readonly world = makeWorld();
  /** The ribcage's swell: 1 at rest. */
  ribs = 1;
  /** Where the eyes turn within the head, in radians, and how far they turn in toward each other. */
  eyeYaw = 0;
  eyePitch = 0;
  converge = 0.4;
  /** The stance of the last clip that finished. */
  stance: StanceName;

  private readonly base = makePose();
  private readonly from = makePose();
  private readonly scratch = makePose();
  private fade = 0;
  private clip: Clip;
  private queue: Clip[] = [];
  private t = 0;
  private fadeT = 0;
  private now = 0;
  private breath = 0;
  private readonly look: V3 = [0, 0.3, 1];
  private blinkAt: number;
  private blinkT = -1;
  private twitchAt: number;
  private twitchT = -1;
  private twitchSide = 1;
  private flickAt: number;
  private flickT = -1;
  private flickWay = 1;

  constructor(
    stance: StanceName = "loaf",
    private readonly random: () => number = Math.random,
    /**
     * Quiet: nothing but breathing and blinking. No ear or tail flicks, no wave in the tail, and
     * the head stays where the pose puts it instead of following the pointer or wandering.
     */
    readonly quiet = false,
  ) {
    this.stance = stance;
    this.clip = rest(stance);
    this.clip.sample(0, this.base);
    copyPose(this.from, this.base);
    this.fadeT = this.fade = this.clip.fade;
    this.blinkAt = 2 + random() * 3;
    this.twitchAt = 3 + random() * 5;
    this.flickAt = 2 + random() * 4;
    settle(copyPose(this.pose, this.base), this.world);
    layTail(this.pose, this.world);
  }

  /** What it is doing: a stance while resting, an emote, or a change like "loaf>sit". */
  get doing(): string {
    return this.clip.name;
  }

  /** True while it is only resting, with nothing queued. */
  get resting(): boolean {
    return !this.clip.busy && this.queue.length === 0;
  }

  /** Starts an emote now, from wherever the cat is. */
  play(name: EmoteName) {
    this.queue = plan(name, this.clip.stance);
    this.next();
  }

  /** Keeps a purr going while the cat is still being stroked. */
  sustain() {
    // Step back by one whole sway of the head, so nothing jumps.
    if (this.clip.name === "purr" && this.t > 5.5) this.t -= PURR_SWAY;
  }

  /** Samples one emote at one moment, with none of the idle life: for looking at stills. */
  preview(name: EmoteName, t: number, stance: StanceName = "loaf") {
    const clips = plan(name, stance);
    const clip = clips[clips.length - 1];
    clip.sample(t, this.base);
    settle(copyPose(this.pose, this.base), this.world);
    layTail(this.pose, this.world);
    this.ribs = 1;
  }

  private next() {
    copyPose(this.from, this.base);
    this.clip = this.queue.shift() ?? rest(this.clip.stance);
    this.t = 0;
    this.fadeT = 0;
    // The further the cat is from where the new clip starts, the longer it takes to get there:
    // no joint is asked to turn faster than about 150 degrees a second on the way.
    this.clip.sample(0, this.scratch);
    let far = 0;
    for (let i = 0; i < this.from.q.length; i += 4) {
      const dot = Math.abs(this.from.q[i] * this.scratch.q[i] + this.from.q[i + 1] * this.scratch.q[i + 1] + this.from.q[i + 2] * this.scratch.q[i + 2] + this.from.q[i + 3] * this.scratch.q[i + 3]);
      far = Math.max(far, 2 * Math.acos(Math.min(1, dot)));
    }
    this.fade = Math.max(this.clip.fade, far / 2.6);
  }

  /** Turns bone `i` toward a point: by `share` of the way, and never more than `limit` radians. */
  private aim(i: number, share: number, limit: number, x: number, y: number, z: number) {
    const w = this.world;
    const parent = BONE_PARENT[i];
    qMul(w.q, i * 4, w.q, parent * 4, this.pose.q, i * 4);
    qRotate(w.p, i * 3, w.q, parent * 4, BONE_OFFSET[i][0], BONE_OFFSET[i][1], BONE_OFFSET[i][2]);
    for (let a = 0; a < 3; a++) w.p[i * 3 + a] += w.p[parent * 3 + a];
    qRotate(forward, 0, w.q, i * 4, 0, 0, 1);
    const dx = x - w.p[i * 3];
    const dy = y - w.p[i * 3 + 1];
    const dz = z - w.p[i * 3 + 2];
    const l = Math.hypot(dx, dy, dz) || 1;
    qArc(turnQ, 0, forward[0], forward[1], forward[2], dx / l, dy / l, dz / l);
    const angle = 2 * Math.acos(clamp(Math.abs(turnQ[3]), 0, 1));
    if (angle < 1e-4) return;
    qMix(turnQ, 0, IDENTITY, 0, turnQ, 0, Math.min(angle * share, limit) / angle);
    qMul(w.q, i * 4, turnQ, 0, w.q, i * 4);
    qMulInv(this.pose.q, i * 4, w.q, parent * 4, w.q, i * 4);
  }

  /**
   * Moves the cat on by `dt` seconds. Returns true while something is visibly in motion (a rest
   * with nothing but breathing returns false, and may be drawn at a gentler rate).
   */
  update(dt: number, input: MotionInput): boolean {
    this.now += dt;
    this.t += dt;
    if (this.t >= this.clip.duration) {
      this.stance = this.clip.stance;
      this.next();
    }
    if (this.clip.duration === Infinity) this.stance = this.clip.stance;
    const { base, pose, clip } = this;
    clip.sample(this.t, base);
    let busy = clip.busy;
    if (this.fadeT < this.fade) {
      this.fadeT += dt;
      mixPose(base, this.from, base, ease(this.fadeT / this.fade));
      busy = true;
    }
    copyPose(pose, base);
    const now = this.now;
    const purring = pose.ch[CH.purr];

    // Breathing: the ribs swell and sink, and the head rides on it a little. A purr hums on top.
    this.breath += dt * TAU * 0.3 * (1 + 0.25 * purring);
    const swell = Math.sin(this.breath);
    this.ribs = 1 + 0.02 * pose.ch[CH.breath] * swell + 0.004 * purring * Math.sin(now * TAU * 23) * Math.sin(now * TAU * 3.1 + 1);
    turn(pose, B.neck, 0.4 * Math.sin(this.breath - 0.7) * pose.ch[CH.breath], 0, 0);
    if (purring > 0.01) turn(pose, B.head, 0.3 * purring * Math.sin(now * TAU * 21), 0, 0.25 * purring * Math.sin(now * TAU * 17 + 2));

    // Ears: pricked or laid back, and now and then one of them flicks.
    const back = Math.max(pose.ch[CH.ears], 0);
    const pricked = Math.max(-pose.ch[CH.ears], 0);
    if (!this.quiet && now > this.twitchAt) {
      this.twitchT = 0;
      this.twitchSide = this.random() < 0.5 ? 1 : -1;
      this.twitchAt = now + 3.5 + this.random() * 7;
    }
    let flickL = 0;
    let flickR = 0;
    if (this.twitchT >= 0) {
      this.twitchT += dt;
      const bump = Math.sin(clamp(this.twitchT / 0.32) * Math.PI) ** 2;
      if (this.twitchSide > 0) flickL = bump;
      else flickR = bump;
      if (this.twitchT >= 0.32) this.twitchT = -1;
      busy = true;
    }
    turn(pose, B.earL, -22 * back + 5 * pricked, 18 * flickL, -16 * back + 7 * pricked - 6 * flickL);
    turn(pose, B.earR, -22 * back + 5 * pricked, -18 * flickR, 16 * back - 7 * pricked + 6 * flickR);

    // Tail: a slow wave that grows toward the tip, and sometimes a flick of the end.
    const lively = this.quiet ? 0 : pose.ch[CH.tail];
    if (!this.quiet && now > this.flickAt) {
      this.flickT = 0;
      this.flickWay = this.random() < 0.5 ? 1 : -1;
      this.flickAt = now + (1.2 + this.random() * 5) / Math.max(0.15, lively);
    }
    let flick = 0;
    if (this.flickT >= 0) {
      this.flickT += dt;
      flick = Math.sin(clamp(this.flickT / 0.5) * Math.PI) ** 2 * this.flickWay;
      if (this.flickT >= 0.5) this.flickT = -1;
      busy = true;
    }
    for (let k = 0; k < TAIL_BONES; k++) {
      const tip = Math.max(0, k - (TAIL_BONES - 4)) / 3;
      const wave = lively * (0.6 + 1.5 * k) * Math.sin(now * 1.2 - k * 0.62);
      turn(pose, B.tail1 + k, -5 * tip * Math.abs(flick) * lively, wave + 13 * tip * flick * (0.4 + lively), 0);
    }

    // Blinking.
    if (now > this.blinkAt) {
      this.blinkT = 0;
      this.blinkAt = now + 2.6 + this.random() * 4.5;
    }
    const staring = clip.stare?.(this.t) ?? 0;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const shut = Math.sin(clamp(this.blinkT / 0.26) * Math.PI) ** 1.5;
      // A cat that is staring does not blink.
      pose.ch[CH.eye] *= 1 - shut * (1 - staring);
      if (this.blinkT >= 0.26) this.blinkT = -1;
      busy = true;
    }

    settle(pose, this.world);

    // What it is looking at: the viewer when staring, the pointer while that is interesting,
    // otherwise nothing much: its gaze wanders a little ahead of it.
    const w = this.world;
    const hx = w.p[B.head * 3];
    const hy = w.p[B.head * 3 + 1];
    const hz = w.p[B.head * 3 + 2];
    const yaw = this.quiet ? 0 : 0.5 * wander(now * 0.14, 1) + 0.12 * wander(now * 0.5, 4);
    const pitch = this.quiet ? 0 : 0.14 * wander(now * 0.11, 2);
    let tx = hx + Math.sin(yaw) * 0.6;
    let ty = hy + Math.sin(pitch) * 0.6 + 0.02;
    let tz = hz + Math.cos(yaw) * 0.6;
    let speed = 1.6;
    const interest = input.pointer && !this.quiet ? clamp(input.attention) * (1 - staring) : 0;
    if (input.pointer && interest > 0) {
      tx = lerp(tx, input.pointer[0], interest);
      ty = lerp(ty, input.pointer[1], interest);
      tz = lerp(tz, input.pointer[2], interest);
      speed = lerp(speed, 6.5, interest);
    }
    if (staring > 0) {
      tx = lerp(tx, input.camera[0], staring);
      ty = lerp(ty, input.camera[1], staring);
      tz = lerp(tz, input.camera[2], staring);
      speed = lerp(speed, 7, staring);
    }
    const follow = 1 - Math.exp(-dt * speed);
    const before = this.look[0] + this.look[1] + this.look[2];
    this.look[0] += (tx - this.look[0]) * follow;
    this.look[1] += (ty - this.look[1]) * follow;
    this.look[2] += (tz - this.look[2]) * follow;
    // Following something is quick and wants every frame; the idle wander is slow and does not.
    if ((interest > 0.02 || staring > 0.02) && Math.abs(this.look[0] + this.look[1] + this.look[2] - before) > 0.0006) busy = true;

    // Quiet, the head and eyes stay as the pose has them (unless an emote is played by hand).
    const held = this.quiet && staring < 0.01 && !clip.busy;
    const gaze = held ? 0 : pose.ch[CH.gaze];
    if (gaze > 0.001) {
      this.aim(B.neck, 0.4 * gaze, 0.6, this.look[0], this.look[1], this.look[2]);
      this.aim(B.head, gaze, 0.75, this.look[0], this.look[1], this.look[2]);
    } else this.aim(B.head, 0, 0, this.look[0], this.look[1], this.look[2]);
    // The eyes make up what the head did not turn, and they get there first.
    const lx = this.look[0] - w.p[B.head * 3];
    const ly = this.look[1] - w.p[B.head * 3 + 1];
    const lz = this.look[2] - w.p[B.head * 3 + 2];
    const ll = Math.hypot(lx, ly, lz) || 1;
    // Into the head's own frame: the inverse turn is the same quaternion with its axis flipped.
    const hq = [-w.q[B.head * 4], -w.q[B.head * 4 + 1], -w.q[B.head * 4 + 2], w.q[B.head * 4 + 3]];
    qRotate(local, 0, hq, 0, lx / ll, ly / ll, lz / ll);
    const eyes = held ? 0 : Math.max(gaze, 0.25);
    const eyeYaw = clamp(Math.atan2(local[0], Math.max(0.05, local[2])), -0.42, 0.42) * 0.9 * eyes;
    const eyePitch = clamp(-Math.asin(clamp(local[1], -1, 1)), -0.3, 0.3) * 0.9 * eyes;
    const quick = 1 - Math.exp(-dt * 16);
    this.eyeYaw += (eyeYaw - this.eyeYaw) * quick;
    this.eyePitch += (eyePitch - this.eyePitch) * quick;
    this.converge = lerp(0.4, 1, staring);

    layTail(pose, this.world);
    return busy;
  }
}
