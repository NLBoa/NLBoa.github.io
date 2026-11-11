import { describe, expect, it } from "vitest";
import { DAYS, SLOTS, byDeadline, initial, moved, next, schedule, type State } from "./model";

const place = (state: State, id: string) => {
  const b = schedule(state).blocks.find((block) => block.id === id);
  return b ? `${b.day}:${b.start}+${b.length}` : "none";
};

const posted = next(initial);
const exam = next(posted);
const meeting = next(exam);
const every = [initial, posted, exam, meeting];

describe("fitting the work", () => {
  it("takes the soonest deadline first, and the bigger job first on the same day", () => {
    expect(byDeadline(exam.tasks).map((t) => t.id)).toEqual(["homework", "exam", "lab", "problem-set", "quiz", "essay"]);
  });

  it("places every task, in every state", () => {
    for (const state of every) {
      const { blocks, unplaced } = schedule(state);
      expect(unplaced).toEqual([]);
      expect(blocks).toHaveLength(state.tasks.length);
    }
  });

  it("never overlaps the calendar or another task, and stays on the grid", () => {
    for (const state of every) {
      const used = new Set<string>();
      const claim = (day: number, start: number, length: number) => {
        expect(day).toBeLessThan(DAYS);
        expect(start + length).toBeLessThanOrEqual(SLOTS);
        for (let s = start; s < start + length; s++) {
          const key = `${day}:${s}`;
          expect(used.has(key)).toBe(false);
          used.add(key);
        }
      };
      for (const b of state.busy) claim(b.day, b.start, b.length);
      for (const b of schedule(state).blocks) claim(b.day, b.start, b.length);
    }
  });

  it("finishes every task on or before the day it is due", () => {
    for (const state of every) {
      const due = new Map(state.tasks.map((t) => [t.id, t.due]));
      for (const b of schedule(state).blocks) expect(b.day).toBeLessThanOrEqual(due.get(b.id)!);
    }
  });

  it("reports a task that cannot be fitted in time", () => {
    const { unplaced } = schedule({ tasks: [{ id: "big", hours: 5, due: 0 }], busy: initial.busy });
    expect(unplaced).toEqual(["big"]);
  });
});

describe("the steps", () => {
  it("starts with the work fitted around classes", () => {
    expect(place(initial, "homework")).toBe("0:2+2");
    expect(place(initial, "problem-set")).toBe("0:4+2");
    expect(place(initial, "exam")).toBe("2:2+3");
  });

  it("a new assignment takes the first free time, and later work moves back", () => {
    expect(posted.step).toBe("posted");
    expect(place(posted, "lab")).toBe("0:4+2");
    expect(moved(initial, posted).sort()).toEqual(["essay", "problem-set", "quiz"]);
  });

  it("a moved exam jumps ahead of everything due later", () => {
    expect(exam.step).toBe("moved");
    expect(place(exam, "exam")).toBe("1:1+3");
    expect(moved(posted, exam).sort()).toEqual(["essay", "exam", "problem-set", "quiz"]);
  });

  it("a meeting pushes the work around it", () => {
    expect(meeting.step).toBe("busy");
    expect(moved(exam, meeting).sort()).toEqual(["essay", "quiz"]);
    expect(place(meeting, "quiz")).toBe("2:4+1");
    expect(place(meeting, "essay")).toBe("3:1+2");
  });

  it("then starts over", () => {
    expect(next(meeting)).toBe(initial);
  });
});
