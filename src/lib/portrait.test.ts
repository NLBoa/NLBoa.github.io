import { describe, expect, it } from "vitest";
import { frameAt, turnSequence } from "./portrait";

describe("turnSequence", () => {
  it("turns one way, rests, turns back, and rests", () => {
    expect(turnSequence(4, 2)).toEqual([0, 1, 2, 3, 3, 3, 2, 1, 0, 0]);
  });

  it("only ever steps to a neighboring frame, including when it repeats", () => {
    const sequence = turnSequence(24, 3);
    for (let i = 0; i < sequence.length; i++) {
      expect(Math.abs(sequence[i] - sequence[(i + 1) % sequence.length])).toBeLessThanOrEqual(1);
    }
  });

  it("copes with a single frame", () => {
    expect(turnSequence(1, 3)).toEqual([0]);
  });
});

describe("frameAt", () => {
  it("starts on the front frame, so the turn begins from the still picture", () => {
    expect(frameAt(0, 24, 12)).toBe(12);
    expect(frameAt(1 / 12, 24, 12)).toBe(13);
  });

  it("advances twelve frames a second and comes round again", () => {
    const length = turnSequence(24, 3).length;
    expect(frameAt(length / 12, 24, 12)).toBe(12);
    expect(frameAt(0.99 / 12, 24, 12)).toBe(12);
  });

  it("always names a real frame", () => {
    for (let t = 0; t < 20; t += 0.07) {
      const frame = frameAt(t, 24, 12);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(24);
    }
  });
});
