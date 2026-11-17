import { describe, expect, it } from "vitest";
import { MAX_TILT, approach, tiltFor } from "./tilt";

const box = { left: 100, top: 200, width: 800, height: 1000 };

describe("the tilt of the résumé sheet", () => {
  it("lies flat with the pointer in the middle", () => {
    const tilt = tiltFor(500, 700, box);
    expect(tilt.x).toBeCloseTo(0);
    expect(tilt.y).toBeCloseTo(0);
    expect(tilt.px).toBeCloseTo(50);
    expect(tilt.py).toBeCloseTo(50);
  });

  it("tips the side under the pointer away", () => {
    // Right edge: turns about the vertical axis, right side away.
    expect(tiltFor(900, 700, box).y).toBeCloseTo(MAX_TILT.y);
    expect(tiltFor(100, 700, box).y).toBeCloseTo(-MAX_TILT.y);
    // Top edge: turns about the horizontal axis, top away.
    expect(tiltFor(500, 200, box).x).toBeCloseTo(MAX_TILT.x);
    expect(tiltFor(500, 1200, box).x).toBeCloseTo(-MAX_TILT.x);
  });

  it("never turns further than the limit, even with the pointer outside the sheet", () => {
    const far = tiltFor(5000, -5000, box);
    expect(far.y).toBeCloseTo(MAX_TILT.y);
    expect(far.x).toBeCloseTo(MAX_TILT.x);
    expect(far.px).toBe(100);
    expect(far.py).toBe(0);
  });

  it("survives a box with no size", () => {
    const tilt = tiltFor(10, 10, { left: 0, top: 0, width: 0, height: 0 });
    expect(tilt.x).toBeCloseTo(0);
    expect(tilt.y).toBeCloseTo(0);
  });
});

describe("easing toward a target", () => {
  it("closes the same share of the gap in the same time, however many frames that takes", () => {
    const oneStep = approach(0, 10, 0.1, 8);
    let twoSteps = approach(0, 10, 0.05, 8);
    twoSteps = approach(twoSteps, 10, 0.05, 8);
    expect(twoSteps).toBeCloseTo(oneStep, 6);
    expect(oneStep).toBeGreaterThan(0);
    expect(oneStep).toBeLessThan(10);
  });
});
