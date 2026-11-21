import { describe, expect, test } from "vitest";
import { CatBrain, ONLY_BREATHING, REPERTOIRE, TRICK_ORDER } from "./brain";
import { CatMotion, EMOTES, plan, route } from "./motion";
import { CH, buildPose, layTail, lowest, makeWorld, settle, solve } from "./pose";
import { BONE_COUNT, TAIL_BONES, bone } from "./rig";
import { SPECS, STANCES } from "./stances";

/** A repeatable stand-in for chance. */
function dice(seed = 1) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

const input = { pointer: null, attention: 0, camera: [0.3, 0.7, 1.4] as [number, number, number] };

describe("poses", () => {
  test("every stance is a set of unit rotations", () => {
    for (const pose of Object.values(STANCES))
      for (let i = 0; i < BONE_COUNT; i++) {
        const l = Math.hypot(pose.q[i * 4], pose.q[i * 4 + 1], pose.q[i * 4 + 2], pose.q[i * 4 + 3]);
        expect(l).toBeCloseTo(1, 4);
      }
  });

  test("sitting, the front paws and the haunches both rest on the ground", () => {
    const world = makeWorld();
    solve(STANCES.sit, world);
    expect(Math.abs(lowest(world, ["paw"]) - lowest(world, ["hips", "hock", "foot"]))).toBeLessThan(0.001);
  });

  test("a pose set down rests on the desk: nothing below it, something on it", () => {
    for (const pose of Object.values(STANCES)) {
      const world = makeWorld();
      settle(pose, world);
      const low = lowest(world, ["hips", "spine", "chest", "head"]);
      expect(low).toBeGreaterThan(-0.004);
      expect(low).toBeLessThan(0.06);
    }
  });

  test("in the loaf the folded legs do not hold the body up", () => {
    const world = makeWorld();
    settle(STANCES.loaf, world);
    expect(STANCES.loaf.ch[CH.tucked]).toBe(1);
    // The belly is on the desk even though the folded legs reach below it.
    expect(lowest(world, ["chest", "spine", "hips"])).toBeLessThan(0.01);
  });

  test("the tail is laid on the desk: never through it, never hovering over it", () => {
    for (const pose of Object.values(STANCES)) {
      const copy = buildPose({});
      copy.q.set(pose.q);
      copy.at.set(pose.at);
      copy.ch.set(pose.ch);
      const world = makeWorld();
      settle(copy, world);
      layTail(copy, world);
      const first = bone("tail1");
      for (let k = 1; k < TAIL_BONES; k++) expect(world.p[(first + k) * 3 + 1]).toBeGreaterThan(0.012);
      // Not hovering either: by its last joints it is down on the desk.
      for (let k = TAIL_BONES - 3; k < TAIL_BONES; k++) expect(world.p[(first + k) * 3 + 1]).toBeLessThan(0.035);
    }
  });

  test("a reaching paw arrives where it is sent", () => {
    const at: [number, number, number] = [-0.012, 0.212, 0.268];
    const pose = buildPose({ ...SPECS.sit, reach: { side: "R", on: "head", at, pole: [-1, -0.5, 0.2] } });
    const world = makeWorld();
    solve(pose, world);
    const wrist = bone("pawR");
    const head = bone("head");
    // Where the target is now: it rides on the head, which has not turned from the sit.
    const sit = makeWorld();
    solve(STANCES.sit, sit);
    for (let a = 0; a < 3; a++) expect(world.p[head * 3 + a]).toBeCloseTo(sit.p[head * 3 + a], 5);
    const d = Math.hypot(world.p[wrist * 3] - world.p[head * 3], world.p[wrist * 3 + 1] - world.p[head * 3 + 1], world.p[wrist * 3 + 2] - world.p[head * 3 + 2]);
    // The target is about 8.5 cm from the head joint in the bind pose; the wrist is that far from it now.
    expect(d).toBeGreaterThan(0.06);
    expect(d).toBeLessThan(0.11);
  });
});

describe("motion", () => {
  test("stances are reached through the loaf", () => {
    expect(route("sit", "side").map((c) => c.name)).toEqual(["sit>loaf", "loaf>side"]);
    expect(route("loaf", "loaf")).toEqual([]);
    expect(plan("clean", "side").map((c) => c.name)).toEqual(["side>loaf", "loaf>sit", "clean"]);
  });

  test("every emote plays through and leaves the cat at rest", () => {
    for (const emote of EMOTES) {
      const motion = new CatMotion("loaf", dice(3));
      motion.play(emote);
      const seen = new Set<string>();
      for (let i = 0; i < 60 * 25 && !(motion.resting && seen.has(emote)); i++) {
        motion.update(1 / 60, input);
        seen.add(motion.doing);
      }
      expect(seen.has(emote)).toBe(true);
      expect(motion.resting).toBe(true);
    }
  });

  test("nothing snaps: from one frame to the next no joint turns far and the body does not jump", () => {
    const motion = new CatMotion("loaf", dice(7));
    const script: [number, (typeof EMOTES)[number]][] = [
      [1, "stare"],
      [6, "clean"],
      [9, "roll"], // cut in while it is still cleaning
      [20, "purr"],
      [24, "loaf"],
      [26, "clean"], // and while it is still changing stance
      [40, "roll"],
      [52, "stare"],
    ];
    const last = new Float32Array(BONE_COUNT * 4);
    let lastLift = 0;
    let worstTurn = 0;
    let worstLift = 0;
    const dt = 1 / 60;
    for (let frame = 0; frame < 60 * 64; frame++) {
      const now = frame * dt;
      for (const [at, emote] of script) if (Math.abs(now - at) < dt / 2) motion.play(emote);
      motion.update(dt, input);
      if (frame > 0) {
        for (let i = 0; i < BONE_COUNT; i++) {
          const dot = Math.abs(
            last[i * 4] * motion.pose.q[i * 4] + last[i * 4 + 1] * motion.pose.q[i * 4 + 1] + last[i * 4 + 2] * motion.pose.q[i * 4 + 2] + last[i * 4 + 3] * motion.pose.q[i * 4 + 3],
          );
          worstTurn = Math.max(worstTurn, 2 * Math.acos(Math.min(1, dot)));
        }
        worstLift = Math.max(worstLift, Math.abs(motion.world.lift - lastLift));
      }
      last.set(motion.pose.q);
      lastLift = motion.world.lift;
    }
    // Under 8 degrees a frame for the fastest joint (the paw in a face-wipe, the tail's tip), and
    // the body's height never moves more than 7 mm in a frame (it is quickest rolling on to its back).
    expect((worstTurn * 180) / Math.PI).toBeLessThan(8);
    expect(worstLift).toBeLessThan(0.007);
  });

  test("a stare fixes the viewer: the head turns to the camera", () => {
    const motion = new CatMotion("loaf", dice(5));
    const camera: [number, number, number] = [0.5, 0.6, 0.9];
    motion.play("stare");
    for (let i = 0; i < 60 * 3; i++) motion.update(1 / 60, { pointer: null, attention: 0, camera });
    const head = bone("head");
    const q = motion.world.q.subarray(head * 4, head * 4 + 4);
    // The head's forward axis, in cat space.
    const fx = 2 * (q[0] * q[2] + q[3] * q[1]);
    const fy = 2 * (q[1] * q[2] - q[3] * q[0]);
    const fz = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    const to = [camera[0] - motion.world.p[head * 3], camera[1] - motion.world.p[head * 3 + 1], camera[2] - motion.world.p[head * 3 + 2]];
    const l = Math.hypot(to[0], to[1], to[2]);
    const cos = (fx * to[0] + fy * to[1] + fz * to[2]) / l;
    // The head covers most of the turn; the eyes do the rest.
    expect(cos).toBeGreaterThan(0.85);
    expect(motion.converge).toBeGreaterThan(0.95);
    expect(motion.pose.ch[CH.pupil]).toBeGreaterThan(0.8);
  });

  test("a purr can be kept going while the stroking lasts", () => {
    const motion = new CatMotion("loaf", dice(2));
    motion.play("purr");
    for (let i = 0; i < 60 * 30; i++) {
      motion.sustain();
      motion.update(1 / 60, input);
    }
    expect(motion.doing).toBe("purr");
    expect(motion.pose.ch[CH.purr]).toBeGreaterThan(0.95);
    for (let i = 0; i < 60 * 6; i++) motion.update(1 / 60, input);
    expect(motion.doing).toBe("loaf");
  });
});

/** The things a cat can do without leaving the loaf. */
const LOAFING = ["loaf", "purr", "stare"] as const;

describe("as it is now: only breathing", () => {
  test("it decides nothing: no greeting, nothing unasked, nothing for a stroke or a click", () => {
    expect(ONLY_BREATHING).toBe(true);
    expect(REPERTOIRE).toEqual([]);
    const brain = new CatBrain(dice(1));
    for (let t = 0; t < 300; t += 0.25) expect(brain.think(t, true, "loaf", "loaf")).toBeNull();
    brain.over(10, true);
    expect(brain.stroked(20)).toBe(false);
    expect(brain.poke()).toBeNull();
    expect(brain.moved(400, true)).toBeNull();
  });

  test("the quiet cat breathes and blinks, and nothing else moves", () => {
    const motion = new CatMotion("loaf", dice(6), true);
    const pointer: [number, number, number] = [0.6, 0.2, 0.3];
    const still = ["head", "earL", "earR", "tail1", "tail4", "tail7", "hips", "chest"].map(bone);
    const first = new Float32Array(BONE_COUNT * 4);
    let ribsLow = 1;
    let ribsHigh = 1;
    let eyeLow = 1;
    let worst = 0;
    for (let i = 0; i < 60 * 40; i++) {
      // A pointer waving about beside it: it takes no notice.
      motion.update(1 / 60, { pointer, attention: 0.9, camera: [0.3, 0.7, 1.4] });
      if (i === 0) first.set(motion.pose.q);
      for (const b of still) {
        const dot = Math.abs(first[b * 4] * motion.pose.q[b * 4] + first[b * 4 + 1] * motion.pose.q[b * 4 + 1] + first[b * 4 + 2] * motion.pose.q[b * 4 + 2] + first[b * 4 + 3] * motion.pose.q[b * 4 + 3]);
        worst = Math.max(worst, (2 * Math.acos(Math.min(1, dot)) * 180) / Math.PI);
      }
      ribsLow = Math.min(ribsLow, motion.ribs);
      ribsHigh = Math.max(ribsHigh, motion.ribs);
      eyeLow = Math.min(eyeLow, motion.pose.ch[CH.eye]);
      expect(motion.doing).toBe("loaf");
    }
    // Head, ears, tail and body hold their pose to within a small fraction of a degree.
    expect(worst).toBeLessThan(0.2);
    // The ribs swell and sink by about two percent, and it blinked at least once.
    expect(ribsHigh - ribsLow).toBeGreaterThan(0.03);
    expect(eyeLow).toBeLessThan(0.2);
  });
});

describe("what it decides, when it is given things to do", () => {
  test("it greets the visitor first, then leaves quiet spells between the things it does", () => {
    const brain = new CatBrain(dice(4), EMOTES);
    expect(brain.think(1, true, "loaf", "loaf")).toBeNull();
    expect(brain.think(2.5, true, "loaf", "loaf")).toBe("stare");
    // While that plays, nothing new.
    expect(brain.think(5, false, "loaf", "stare")).toBeNull();
    // It ends at 11 s: nothing for at least 11 more.
    expect(brain.think(11, true, "loaf", "loaf")).toBeNull();
    expect(brain.think(21.9, true, "loaf", "loaf")).toBeNull();
    let next: string | null = null;
    for (let t = 22; t < 36 && !next; t += 0.1) next = brain.think(t, true, "loaf", "loaf");
    expect(next).not.toBeNull();
    expect(next).not.toBe("stare");
  });

  test("it never does the same thing twice running", () => {
    const brain = new CatBrain(dice(9), EMOTES);
    let t = 0;
    let last: string | null = null;
    for (let n = 0; n < 60; n++) {
      let next: string | null = null;
      while (!next) next = brain.think((t += 0.25), true, "sit", "sit");
      expect(next).not.toBe(last);
      last = next;
      brain.think((t += 0.25), false, "sit", next);
    }
  });

  test("on its side it never rolls again, and before long it gets up into the loaf", () => {
    const brain = new CatBrain(dice(9), EMOTES);
    brain.think(2.5, true, "side", "side");
    brain.think(3, false, "side", "stare");
    const did: string[] = [];
    for (let t = 4; t < 40 && did.length < 2; t += 0.25) {
      const next = brain.think(t, true, "side", "side");
      if (next) {
        did.push(next);
        brain.think((t += 0.25), false, "side", next);
      }
    }
    expect(did).not.toContain("roll");
    expect(did).toContain("loaf");
  });

  test("told to stay in the loaf, it never chooses to clean or roll over, by itself or when clicked", () => {
    const brain = new CatBrain(dice(11), LOAFING);
    const did = new Set<string>();
    let t = 0;
    for (let n = 0; n < 80; n++) {
      let next: string | null = null;
      while (!next) next = brain.think((t += 0.25), true, "loaf", "loaf");
      did.add(next);
      brain.think((t += 0.25), false, "loaf", next);
    }
    for (let n = 0; n < 6; n++) did.add(brain.poke() ?? "nothing");
    expect([...did].sort()).toEqual(["loaf", "purr", "stare"]);
    // And none of those leaves the loaf.
    for (const emote of LOAFING) expect(plan(emote, "loaf").every((clip) => clip.stance === "loaf")).toBe(true);
  });

  test("a stroke is the pointer resting on it; it answers with a purr", () => {
    const brain = new CatBrain(dice(1), EMOTES);
    brain.think(2.5, true, "loaf", "loaf");
    brain.think(10, true, "loaf", "loaf");
    brain.over(12, true);
    expect(brain.think(12.1, true, "loaf", "loaf")).toBeNull();
    expect(brain.think(12.4, true, "loaf", "loaf")).toBe("purr");
    expect(brain.think(12.5, false, "loaf", "purr")).toBeNull();
    brain.over(13, false);
    expect(brain.stroked(13.5)).toBe(false);
  });

  test("a click is not a stroke: the pointer has to leave and come back", () => {
    const brain = new CatBrain(dice(1), EMOTES);
    brain.think(2.5, true, "loaf", "loaf");
    brain.over(10, true);
    expect(brain.poke()).toBe("stare");
    brain.over(10.1, true);
    expect(brain.stroked(12)).toBe(false);
    expect(brain.think(12, false, "loaf", "stare")).toBeNull();
    brain.over(13, false);
    brain.over(14, true);
    expect(brain.stroked(14.5)).toBe(true);
  });

  test("clicks go through its tricks in turn", () => {
    const brain = new CatBrain(dice(1), EMOTES);
    expect([brain.poke(), brain.poke(), brain.poke(), brain.poke(), brain.poke()]).toEqual(Array.from({ length: 5 }, (_, i) => TRICK_ORDER[i % TRICK_ORDER.length]));
  });

  test("a pointer that comes back after a long quiet gets a look", () => {
    const brain = new CatBrain(dice(1), EMOTES);
    brain.think(2.5, true, "loaf", "loaf");
    expect(brain.moved(3, true)).toBeNull();
    expect(brain.moved(20, true)).toBeNull();
    expect(brain.moved(60, true)).toBe("stare");
  });
});
