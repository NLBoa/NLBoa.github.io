import { describe, expect, it } from "vitest";
import { COLS, ROWS, fits, initial, move, resize } from "./model";

const find = (layout: typeof initial, id: string) => layout.find((w) => w.id === id)!;

describe("the starting layout", () => {
  it("has every widget on the board and none overlapping", () => {
    for (const widget of initial) expect(fits(initial, widget)).toBe(true);
  });

  it("leaves room to move things", () => {
    const used = initial.reduce((sum, w) => sum + w.w * w.h, 0);
    expect(COLS * ROWS - used).toBeGreaterThanOrEqual(6);
  });
});

describe("moving", () => {
  it("moves a widget into free space", () => {
    const moved = move(initial, "spotify", 3, 2);
    expect(find(moved, "spotify")).toMatchObject({ x: 3, y: 2, w: 1, h: 2 });
    expect(find(initial, "spotify")).toMatchObject({ x: 3, y: 0 });
  });

  it("refuses to put one widget on another", () => {
    expect(move(initial, "spotify", 0, 0)).toBe(initial);
  });

  it("refuses to leave the board", () => {
    expect(move(initial, "grocery", -1, 2)).toBe(initial);
    expect(move(initial, "grocery", 5, 2)).toBe(initial);
    expect(move(initial, "grocery", 0, 3)).toBe(initial);
  });

  it("returns the same layout when nothing changes or the widget is unknown", () => {
    expect(move(initial, "spotify", 3, 0)).toBe(initial);
    expect(move(initial, "nope", 2, 2)).toBe(initial);
  });
});

describe("resizing", () => {
  it("grows a widget into free space", () => {
    const moved = move(initial, "spotify", 2, 2);
    const grown = resize(moved, "spotify", 3, 2);
    expect(find(grown, "spotify")).toMatchObject({ x: 2, y: 2, w: 3, h: 2 });
  });

  it("refuses to grow over a neighbor or past the edge", () => {
    expect(resize(initial, "spotify", 2, 2)).toBe(initial);
    expect(resize(initial, "lights", 3, 2)).toBe(initial);
  });

  it("shrinks down to one cell and no further", () => {
    expect(find(resize(initial, "clock", 1, 1), "clock")).toMatchObject({ w: 1, h: 1 });
    expect(resize(initial, "clock", 0, 1)).toBe(initial);
  });
});
