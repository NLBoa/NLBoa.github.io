/**
 * The SKIBUS miniature as pure functions: each rider is still to come,
 * checked in, or aboard. A schematic with made-up riders, not the real
 * system's screens or rules.
 */

export type Status = "waiting" | "checked" | "aboard";
export type Roster = Status[];

export const RIDERS = 10;

export const initial: Roster = Array.from({ length: RIDERS }, () => "waiting" as Status);

const after: Record<Status, Status> = { waiting: "checked", checked: "aboard", aboard: "aboard" };

/** Moves one rider on a stage: still to come, then checked in, then aboard. */
export function advance(roster: Roster, index: number): Roster {
  const current = roster[index];
  if (current === undefined || current === "aboard") return roster;
  return roster.map((status, i) => (i === index ? after[status] : status));
}

/** Checks in the first rider who is still to come. */
export function checkInNext(roster: Roster): Roster {
  return advance(roster, roster.indexOf("waiting"));
}

/** Boards the first rider who has checked in. */
export function boardNext(roster: Roster): Roster {
  return advance(roster, roster.indexOf("checked"));
}

export function counts(roster: Roster): Record<Status, number> {
  const total = { waiting: 0, checked: 0, aboard: 0 };
  for (const status of roster) total[status]++;
  return total;
}

export const everyoneAboard = (roster: Roster): boolean => roster.every((status) => status === "aboard");
