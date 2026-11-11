import { describe, expect, it } from "vitest";
import { CATALOG, DAYS, PERIODS, blocks, generatorCourses, initial, toggle } from "./model";

describe("the plan", () => {
  it("adds and removes a course", () => {
    expect(toggle(initial, "c4")).toEqual(["c1", "c2", "c4"]);
    expect(toggle(initial, "c1")).toEqual(["c2"]);
    expect(initial).toEqual(["c1", "c2"]);
  });

  it("keeps the catalog's order however courses are added", () => {
    expect(toggle(toggle([], "c5"), "c2")).toEqual(["c2", "c5"]);
  });

  it("ignores a course that is not in the catalog", () => {
    expect(toggle(initial, "nope")).toBe(initial);
  });
});

describe("the generator", () => {
  it("always lists exactly the planned courses", () => {
    let plan = initial;
    for (const id of ["c3", "c1", "c5", "c3"]) {
      plan = toggle(plan, id);
      expect(generatorCourses(plan)).toEqual(plan);
    }
  });

  it("draws one block per meeting", () => {
    expect(blocks(["c2"])).toEqual([
      { id: "c2", day: 1, period: 0 },
      { id: "c2", day: 3, period: 0 },
    ]);
  });

  it("never puts two sample courses in the same place", () => {
    const all = blocks(Object.keys(CATALOG));
    const places = all.map((b) => `${b.day}:${b.period}`);
    expect(new Set(places).size).toBe(places.length);
    for (const b of all) {
      expect(b.day).toBeLessThan(DAYS);
      expect(b.period).toBeLessThan(PERIODS);
    }
  });
});
