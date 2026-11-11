import { describe, expect, it } from "vitest";
import { isStoryPath, sideBand } from "./band";

describe("sideBand", () => {
  it("starts just past the story column on a laptop", () => {
    // Gutter 7vw = 100.8, column 960, gap 32.
    const band = sideBand(1440, 900);
    expect(band?.left).toBeCloseTo(1092.8, 5);
    expect(band?.width).toBeCloseTo(347.2, 5);
  });

  it("caps the gutter at 8rem on a wide screen", () => {
    expect(sideBand(1920, 1080)).toEqual({ left: 128 + 992, width: 1920 - 1120 });
  });

  it("is absent when less than 16rem would be free", () => {
    expect(sideBand(1340, 800)).toBeNull();
    expect(sideBand(1343, 800)).not.toBeNull();
    expect(sideBand(1100, 800)).toBeNull();
  });

  it("is absent in portrait, however wide", () => {
    expect(sideBand(390, 844)).toBeNull();
    expect(sideBand(1600, 1600)).toBeNull();
  });

  it("follows the visitor's font size", () => {
    expect(sideBand(1440, 900, 20)).toBeNull();
    expect(sideBand(2000, 900, 20)?.left).toBe(140 + 62 * 20);
  });
});

describe("isStoryPath", () => {
  it("is true only for a single project's page", () => {
    expect(isStoryPath("/projects/argus")).toBe(true);
    expect(isStoryPath("/projects")).toBe(false);
    expect(isStoryPath("/")).toBe(false);
    expect(isStoryPath("/about")).toBe(false);
  });
});
