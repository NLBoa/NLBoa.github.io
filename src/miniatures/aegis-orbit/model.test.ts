import { describe, expect, it } from "vitest";
import {
  EARTH,
  LIFT,
  PASS,
  T,
  VIEW,
  advance,
  atDecision,
  burnedPosition,
  clockRate,
  debrisPosition,
  decide,
  initial,
  picture,
  plannedPosition,
  settle,
  type State,
} from "./model";

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** Runs the clock in small steps until it stops or `limit` seconds pass. */
function run(state: State, limit = 120): State {
  let s = state;
  for (let i = 0; i < limit * 60; i++) {
    const next = advance(s, 1 / 60);
    if (next === s) return s;
    s = next;
  }
  return s;
}

describe("the clock", () => {
  it("stops at the decision and waits", () => {
    const s = run(initial);
    expect(s).toEqual(atDecision);
    expect(advance(s, 5)).toBe(s);
  });

  it("runs to the end once a choice is made, then stops", () => {
    for (const choice of ["burn", "stay"] as const) {
      const s = run(decide(run(initial), choice));
      expect(s.phase).toBe("done");
      expect(s.t).toBe(T.end);
      expect(s.choice).toBe(choice);
      expect(advance(s, 5)).toBe(s);
    }
  });

  it("is slowest at the pass and full speed away from it", () => {
    expect(clockRate(T.pass)).toBeLessThan(0.3);
    expect(clockRate(0.1)).toBe(1);
    expect(clockRate(T.end)).toBe(1);
  });

  it("takes between 8 and 20 seconds from start to finish", () => {
    let s = decide(run(initial), "burn");
    let seconds = (T.decision * 11) / 1;
    while (s.phase !== "done") {
      s = advance(s, 1 / 60);
      seconds += 1 / 60;
    }
    expect(seconds).toBeGreaterThan(8);
    expect(seconds).toBeLessThan(20);
  });
});

describe("the choice", () => {
  it("can be made early, before the clock stops", () => {
    const early = advance(initial, 1);
    expect(decide(early, "burn")).toEqual({ phase: "burned", t: early.t, choice: "burn" });
  });

  it("cannot be changed afterwards", () => {
    const burned = decide(atDecision, "burn");
    expect(decide(burned, "stay")).toBe(burned);
    const done = run(burned);
    expect(decide(done, "stay")).toBe(done);
  });

  it("settles straight to the outcome for reduced motion", () => {
    expect(settle("burn")).toEqual({ phase: "done", t: T.pass, choice: "burn" });
  });
});

describe("the geometry", () => {
  it("puts the debris on the planned course exactly at the pass", () => {
    expect(distance(debrisPosition(T.pass), PASS)).toBeLessThan(0.2);
    expect(distance(plannedPosition(T.pass), PASS)).toBe(0);
  });

  it("leaves the planned course smoothly at the burn", () => {
    expect(distance(burnedPosition(T.burn), plannedPosition(T.burn))).toBe(0);
    expect(distance(burnedPosition(T.burn + 0.01), plannedPosition(T.burn + 0.01))).toBeLessThan(1);
  });

  it("clears the pass by the full lift", () => {
    expect(distance(burnedPosition(T.pass), PASS)).toBeCloseTo(LIFT, 0);
  });

  it("shows the debris by the time the clock stops", () => {
    expect(debrisPosition(T.decision).y).toBeGreaterThan(VIEW.top + 10);
  });

  it("keeps everything that moves inside the picture and above the Earth", () => {
    for (let t = 0; t <= T.end; t += 0.02) {
      for (const p of [plannedPosition(t), burnedPosition(t)]) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(VIEW.width);
        expect(p.y).toBeGreaterThan(VIEW.top);
        expect(p.y).toBeLessThan(VIEW.top + VIEW.height);
        expect(Math.hypot(p.x - EARTH.cx, p.y - EARTH.cy)).toBeGreaterThan(EARTH.r + 100);
      }
    }
  });
});

describe("the picture", () => {
  it("shows only the spacecraft and the debris before a choice", () => {
    const p = picture(atDecision);
    expect(p.craft).not.toBeNull();
    expect(p.debris).not.toBeNull();
    expect(p.ghost).toBeNull();
    expect(p.bent).toBe(false);
    expect(p.hit).toBe(false);
    expect(p.flash).toBe(0);
  });

  it("with a burn, flies a ghost on the old course from the burn to the pass", () => {
    const before = picture({ phase: "burned", t: T.burn - 0.01, choice: "burn" });
    expect(before.ghost).toBeNull();

    const during = picture({ phase: "burned", t: 0.5, choice: "burn" });
    expect(during.bent).toBe(true);
    expect(during.ghost).toMatchObject(plannedPosition(0.5));
    expect(during.craft).toMatchObject(burnedPosition(0.5));

    const after = picture({ phase: "burned", t: T.pass + 0.01, choice: "burn" });
    expect(after.ghost).toBeNull();
    expect(after.craft).not.toBeNull();
    expect(after.debris).not.toBeNull();
    expect(after.clearance).toEqual(burnedPosition(T.pass));
    expect(after.flash).toBeGreaterThan(0);
  });

  it("fires the thruster only just after the burn", () => {
    expect(picture({ phase: "burned", t: T.burn, choice: "burn" }).plume).toBe(1);
    expect(picture({ phase: "burned", t: T.burn + 0.2, choice: "burn" }).plume).toBe(0);
    expect(picture({ phase: "rejected", t: T.burn, choice: "stay" }).plume).toBe(0);
  });

  it("without a burn, the spacecraft and debris are gone after the pass", () => {
    const before = picture({ phase: "rejected", t: T.pass - 0.01, choice: "stay" });
    expect(before.craft).not.toBeNull();
    expect(before.ghost).toBeNull();

    const after = picture({ phase: "rejected", t: T.pass, choice: "stay" });
    expect(after.craft).toBeNull();
    expect(after.debris).toBeNull();
    expect(after.flash).toBe(1);
    expect(after.hit).toBe(true);
    expect(after.clearance).toBeNull();
  });
});
