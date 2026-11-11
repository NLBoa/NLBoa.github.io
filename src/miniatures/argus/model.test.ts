import { describe, expect, it } from "vitest";
import { MOVED, SAMPLE, WINDOW_MINUTES, fillWindow, initial, next, queue } from "./model";

const ids = (tasks: { id: string }[]) => tasks.map((t) => t.id);

describe("the queue", () => {
  it("ranks the soonest work first, and the bigger job first on the same day", () => {
    expect(ids(queue(initial))).toEqual(["homework", "problem-set", "quiz", "essay", "exam"]);
  });

  it("does not change the list it is given", () => {
    const before = ids(SAMPLE);
    queue(initial);
    expect(ids(SAMPLE)).toEqual(before);
  });
});

describe("the steps", () => {
  it("a post moves the exam, which climbs the queue and names the post as its source", () => {
    const moved = next(initial);
    expect(moved.step).toBe("moved");
    expect(ids(queue(moved))).toEqual(["homework", "problem-set", "exam", "quiz", "essay"]);
    expect(moved.tasks.find((t) => t.id === MOVED.id)).toMatchObject({ due: 1, source: "piazza" });
  });

  it("finishing takes the first task off the queue", () => {
    const finished = next(next(initial));
    expect(finished.step).toBe("finished");
    expect(finished.done).toEqual(["homework"]);
    expect(ids(queue(finished))).toEqual(["problem-set", "exam", "quiz", "essay"]);
  });

  it("then starts over", () => {
    expect(next(next(next(initial)))).toBe(initial);
  });
});

describe("the work window", () => {
  it("is filled from the top of the queue and never overfilled", () => {
    for (const state of [initial, next(initial), next(next(initial))]) {
      const slices = fillWindow(queue(state));
      expect(slices.reduce((sum, s) => sum + s.minutes, 0)).toBe(WINDOW_MINUTES);
      expect(ids(slices)).toEqual(ids(queue(state)).slice(0, slices.length));
    }
  });

  it("gives the last task only the time that is left", () => {
    expect(fillWindow(queue(initial))).toEqual([
      { id: "homework", minutes: 90 },
      { id: "problem-set", minutes: 30 },
    ]);
  });

  it("stops when the work runs out", () => {
    expect(fillWindow([{ id: "a", source: "canvas", due: 0, minutes: 20 }], 60)).toEqual([{ id: "a", minutes: 20 }]);
  });
});
