/**
 * The Argus miniature as pure functions: the deadlines Argus has collected,
 * and a week in a planner where each deadline's work is fitted into free
 * time before it is due. When something changes, the work is fitted again.
 * A schematic with made-up coursework, not Argus's or FlowSavvy's real rules.
 */

export const DAYS = 5;
/** Hours in each day's stretch of the calendar. */
export const SLOTS = 6;

/** Something already on the calendar that work cannot overlap. */
export type Busy = { id: string; kind: "class" | "club" | "meeting"; day: number; start: number; length: number };
/** Work for one deadline: how long it takes, and the last day it can be done (0 = Monday). */
export type Task = { id: string; hours: number; due: number };
export type Block = { id: string; day: number; start: number; length: number };

/** What has happened so far. */
export type Step = "planned" | "posted" | "moved" | "busy";
export type State = { step: Step; tasks: Task[]; busy: Busy[] };

export const CALENDAR: Busy[] = [
  { id: "class-mon", kind: "class", day: 0, start: 0, length: 2 },
  { id: "class-tue", kind: "class", day: 1, start: 0, length: 1 },
  { id: "class-wed", kind: "class", day: 2, start: 0, length: 2 },
  { id: "class-thu", kind: "class", day: 3, start: 0, length: 1 },
  { id: "club-thu", kind: "club", day: 3, start: 3, length: 2 },
  { id: "class-fri", kind: "class", day: 4, start: 0, length: 2 },
];

export const SAMPLE: Task[] = [
  { id: "homework", hours: 2, due: 0 },
  { id: "problem-set", hours: 2, due: 1 },
  { id: "quiz", hours: 1, due: 2 },
  { id: "essay", hours: 2, due: 3 },
  { id: "exam", hours: 3, due: 4 },
];

/** A new assignment that gets posted. */
export const POSTED: Task = { id: "lab", hours: 2, due: 1 };
/** The exam's new date, announced in a post. */
export const MOVED = { id: "exam", due: 1 };
/** A meeting that lands on the calendar. */
export const MEETING: Busy = { id: "meeting", kind: "meeting", day: 2, start: 2, length: 2 };

export const initial: State = { step: "planned", tasks: SAMPLE, busy: CALENDAR };

/** The deadlines in the order they are worked on: soonest first, then the bigger job. */
export function byDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.due - b.due || b.hours - a.hours || a.id.localeCompare(b.id));
}

/**
 * Fits each task into the first free stretch that is long enough, on or
 * before the day it is due, taking the tasks soonest deadline first.
 * `unplaced` lists the tasks that could not be fitted in time.
 */
export function schedule({ tasks, busy }: Pick<State, "tasks" | "busy">): { blocks: Block[]; unplaced: string[] } {
  const taken = Array.from({ length: DAYS }, () => Array.from({ length: SLOTS }, () => false));
  for (const b of busy) for (let s = b.start; s < b.start + b.length; s++) taken[b.day][s] = true;

  const blocks: Block[] = [];
  const unplaced: string[] = [];
  for (const task of byDeadline(tasks)) {
    let placed = false;
    for (let day = 0; day <= Math.min(task.due, DAYS - 1) && !placed; day++) {
      for (let start = 0; start + task.hours <= SLOTS && !placed; start++) {
        const free = taken[day].slice(start, start + task.hours).every((t) => !t);
        if (!free) continue;
        for (let s = start; s < start + task.hours; s++) taken[day][s] = true;
        blocks.push({ id: task.id, day, start, length: task.hours });
        placed = true;
      }
    }
    if (!placed) unplaced.push(task.id);
  }
  return { blocks, unplaced };
}

/** The next thing that happens. After the last one it starts over. */
export function next(state: State): State {
  if (state.step === "planned") return { ...state, step: "posted", tasks: [...state.tasks, POSTED] };
  if (state.step === "posted") {
    return { ...state, step: "moved", tasks: state.tasks.map((t) => (t.id === MOVED.id ? { ...t, due: MOVED.due } : t)) };
  }
  if (state.step === "moved") return { ...state, step: "busy", busy: [...state.busy, MEETING] };
  return initial;
}

/** The tasks whose place on the calendar differs between two states. */
export function moved(before: State, after: State): string[] {
  const was = new Map(schedule(before).blocks.map((b) => [b.id, b]));
  return schedule(after)
    .blocks.filter((b) => {
      const old = was.get(b.id);
      return old !== undefined && (old.day !== b.day || old.start !== b.start);
    })
    .map((b) => b.id);
}
