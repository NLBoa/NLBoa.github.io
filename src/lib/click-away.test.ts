import { describe, expect, it } from "vitest";
import { AWAY_MARGIN, contentBox, isAway } from "./click-away";

const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });

describe("where a page's content is", () => {
  it("is the box around all of its blocks, with a little room to spare", () => {
    const content = contentBox([box(100, 90, 1060, 190), box(100, 220, 1060, 700), box(100, 800, 900, 1200)]);
    expect(content).toEqual(box(100 - AWAY_MARGIN, 90 - AWAY_MARGIN, 1060 + AWAY_MARGIN, 1200 + AWAY_MARGIN));
  });

  it("ignores blocks that take no room", () => {
    // A bar that spans the window but is empty (no height) must not widen the content.
    const content = contentBox([box(100, 88, 1340, 88), box(288, 124, 1152, 1374)]);
    expect(content?.left).toBe(288 - AWAY_MARGIN);
    expect(content?.right).toBe(1152 + AWAY_MARGIN);
  });

  it("is nothing when the page has no blocks", () => {
    expect(contentBox([])).toBeNull();
    expect(contentBox([box(0, 0, 0, 0)])).toBeNull();
  });
});

describe("a click away from the page", () => {
  const content = contentBox([box(288, 124, 1152, 1374)]);

  it("is one beside, above or below the content", () => {
    expect(isAway(100, 500, content)).toBe(true);
    expect(isAway(1300, 500, content)).toBe(true);
    expect(isAway(700, 80, content)).toBe(true);
    expect(isAway(700, 1420, content)).toBe(true);
  });

  it("is not one on the content, in the gaps inside it, or just off its edge", () => {
    expect(isAway(700, 500, content)).toBe(false);
    expect(isAway(288, 124, content)).toBe(false);
    expect(isAway(288 - AWAY_MARGIN + 1, 500, content)).toBe(false);
    expect(isAway(1152 + AWAY_MARGIN - 1, 500, content)).toBe(false);
  });

  it("never counts when the content could not be measured", () => {
    expect(isAway(5, 5, null)).toBe(false);
  });
});
