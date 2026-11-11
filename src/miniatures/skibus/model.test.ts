import { describe, expect, it } from "vitest";
import { RIDERS, advance, boardNext, checkInNext, counts, everyoneAboard, initial } from "./model";

describe("a rider", () => {
  it("checks in, then boards, then stays aboard", () => {
    const checked = advance(initial, 3);
    expect(checked[3]).toBe("checked");
    const aboard = advance(checked, 3);
    expect(aboard[3]).toBe("aboard");
    expect(advance(aboard, 3)).toBe(aboard);
    expect(initial[3]).toBe("waiting");
  });

  it("who is not on the list changes nothing", () => {
    expect(advance(initial, 99)).toBe(initial);
    expect(advance(initial, -1)).toBe(initial);
  });
});

describe("the buttons", () => {
  it("check in the first rider still to come", () => {
    const roster = checkInNext(checkInNext(initial));
    expect(roster.slice(0, 3)).toEqual(["checked", "checked", "waiting"]);
  });

  it("board only riders who have checked in", () => {
    expect(boardNext(initial)).toBe(initial);
    const roster = boardNext(checkInNext(checkInNext(initial)));
    expect(roster.slice(0, 2)).toEqual(["aboard", "checked"]);
  });

  it("fill the bus", () => {
    let roster = initial;
    for (let i = 0; i < RIDERS; i++) roster = checkInNext(roster);
    expect(counts(roster)).toEqual({ waiting: 0, checked: RIDERS, aboard: 0 });
    expect(checkInNext(roster)).toBe(roster);
    for (let i = 0; i < RIDERS; i++) roster = boardNext(roster);
    expect(everyoneAboard(roster)).toBe(true);
    expect(counts(roster)).toEqual({ waiting: 0, checked: 0, aboard: RIDERS });
  });
});
