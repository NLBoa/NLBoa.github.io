import { describe, expect, it } from "vitest";
import { advance, isLast, isTyping, length, lines, run, start, type Script } from "./model";

const script: Script = [
  { id: "one", entries: [{ command: "echo hi", output: ["hi"] }] },
  {
    id: "two",
    entries: [
      { command: "echo a > f", output: [] },
      { command: "cat f", output: ["a"] },
    ],
  },
];

const texts = (state: Parameters<typeof lines>[0]) => lines(state, script).map((l) => `${l.kind === "command" ? "$ " : ""}${l.text}`);

describe("the session", () => {
  it("starts with the first group typed", () => {
    const s = start(script);
    expect(isTyping(s, script)).toBe(false);
    expect(texts(s)).toEqual(["$ echo hi", "hi"]);
  });

  it("begins the next group with an empty prompt", () => {
    const s = run(start(script), script);
    expect(s).toEqual({ group: 1, typed: 0 });
    expect(isTyping(s, script)).toBe(true);
    expect(texts(s)).toEqual(["$ echo hi", "hi", "$ "]);
  });

  it("types a command, shows its output only when it is whole, then types the next", () => {
    let s = run(start(script), script);
    s = { ...s, typed: 4 };
    expect(texts(s)).toEqual(["$ echo hi", "hi", "$ echo"]);
    s = { ...s, typed: "echo a > f".length };
    expect(texts(s)).toEqual(["$ echo hi", "hi", "$ echo a > f", "$ "]);
    s = { ...s, typed: "echo a > f".length + 2 };
    expect(texts(s)).toEqual(["$ echo hi", "hi", "$ echo a > f", "$ ca"]);
    s = { ...s, typed: length(script[1]) };
    expect(texts(s)).toEqual(["$ echo hi", "hi", "$ echo a > f", "$ cat f", "a"]);
    expect(isTyping(s, script)).toBe(false);
  });

  it("types at a steady speed and stops at the end of the group", () => {
    let s = run(start(script), script);
    s = advance(s, 0.1, script);
    expect(s.typed).toBeGreaterThan(0);
    expect(s.typed).toBeLessThan(length(script[1]));
    s = advance(s, 60, script);
    expect(s.typed).toBe(length(script[1]));
    expect(advance(s, 1, script)).toBe(s);
  });

  it("the button finishes a group that is still being typed", () => {
    const s = run({ group: 1, typed: 3 }, script);
    expect(s).toEqual({ group: 1, typed: length(script[1]) });
  });

  it("after the last group the button starts again", () => {
    const end = { group: 1, typed: length(script[1]) };
    expect(isLast(end, script)).toBe(true);
    expect(run(end, script)).toEqual({ group: 0, typed: 0 });
  });

  it("with instant, nothing is typed out", () => {
    expect(run(start(script), script, true)).toEqual({ group: 1, typed: length(script[1]) });
    expect(run({ group: 1, typed: length(script[1]) }, script, true)).toEqual(start(script));
  });
});
