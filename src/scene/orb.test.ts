import { describe, expect, it } from "vitest";
import { blink, easeStep, gazePoint } from "./orb";
import type { Vec3 } from "./layout";

const camera: Vec3 = [0, 1, 2];
const orb: Vec3 = [0.5, 0.05, 0];
const toward = (point: Vec3): Vec3 => {
  const d = [point[0] - camera[0], point[1] - camera[1], point[2] - camera[2]];
  const length = Math.hypot(d[0], d[1], d[2]);
  return [d[0] / length, d[1] / length, d[2] / length];
};

describe("the orb's gaze", () => {
  it("looks straight at the viewer when the pointer is on the orb", () => {
    const point = gazePoint(camera, toward(orb), orb, 0.5);
    // The point lies on the line between the orb and the camera, half a meter out.
    const fromOrb = Math.hypot(point[0] - orb[0], point[1] - orb[1], point[2] - orb[2]);
    expect(fromOrb).toBeCloseTo(0.5, 6);
    const total = Math.hypot(camera[0] - orb[0], camera[1] - orb[1], camera[2] - orb[2]);
    const toCamera = Math.hypot(point[0] - camera[0], point[1] - camera[1], point[2] - camera[2]);
    expect(fromOrb + toCamera).toBeCloseTo(total, 6);
  });

  it("turns left when the pointer is to the left, and right when it is to the right", () => {
    const left = gazePoint(camera, toward([-0.6, 0.05, 0]), orb, 0.5);
    const right = gazePoint(camera, toward([1.2, 0.05, 0]), orb, 0.5);
    const center = gazePoint(camera, toward(orb), orb, 0.5);
    expect(left[0]).toBeLessThan(center[0]);
    expect(right[0]).toBeGreaterThan(center[0]);
  });

  it("looks up when the pointer is above it", () => {
    const up = gazePoint(camera, toward([0.5, 0.6, 0]), orb, 0.5);
    expect(up[1]).toBeGreaterThan(gazePoint(camera, toward(orb), orb, 0.5)[1]);
  });

  it("falls back to the viewer for a ray that never reaches its side", () => {
    expect(gazePoint(camera, [0, 0, 1], orb, 0.5)).toEqual(camera);
  });
});

describe("easing and blinking", () => {
  it("covers the same ground in one long frame as in two short ones", () => {
    const once = easeStep(0.1, 8);
    const half = easeStep(0.05, 8);
    expect(1 - (1 - half) * (1 - half)).toBeCloseTo(once, 9);
  });

  it("shuts halfway through a blink and is open before and after", () => {
    expect(blink(0)).toBe(0);
    expect(blink(0.11)).toBeCloseTo(1, 6);
    expect(blink(0.22)).toBe(0);
    expect(blink(1)).toBe(0);
  });
});
