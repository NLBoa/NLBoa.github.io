/**
 * The Argus miniature as pure functions: a queue of coursework ranked by
 * when it is due, and tonight's work window filled from the top of it.
 * A schematic with made-up coursework, not Argus's real planner.
 */

export type Source = "canvas" | "gradescope" | "piazza";

export type Task = {
  id: string;
  /** Where the due date came from. */
  source: Source;
  /** Days from today. */
  due: number;
  /** Estimated effort. */
  minutes: number;
};

/** What has happened so far: collected, then a post moves a date, then a task is finished. */
export type Step = "synced" | "moved" | "finished";
export type State = { step: Step; tasks: Task[]; done: string[] };

/** Tonight's work window, in minutes. */
export const WINDOW_MINUTES = 120;

export const SAMPLE: Task[] = [
  { id: "homework", source: "gradescope", due: 0, minutes: 90 },
  { id: "problem-set", source: "gradescope", due: 0, minutes: 60 },
  { id: "quiz", source: "canvas", due: 1, minutes: 30 },
  { id: "essay", source: "canvas", due: 2, minutes: 45 },
  { id: "exam", source: "canvas", due: 6, minutes: 120 },
];

/** The date a post on Piazza announces. */
export const MOVED = { id: "exam", due: 1, source: "piazza" as Source };

export const initial: State = { step: "synced", tasks: SAMPLE, done: [] };

/** Work still to do, soonest first; on the same day, the bigger job first. */
export function queue({ tasks, done }: State): Task[] {
  return tasks
    .filter((t) => !done.includes(t.id))
    .sort((a, b) => a.due - b.due || b.minutes - a.minutes || a.id.localeCompare(b.id));
}

/** The next thing that happens. After the last one it starts over. */
export function next(state: State): State {
  if (state.step === "synced") {
    const tasks = state.tasks.map((t) => (t.id === MOVED.id ? { ...t, due: MOVED.due, source: MOVED.source } : t));
    return { ...state, step: "moved", tasks };
  }
  if (state.step === "moved") {
    const first = queue(state)[0];
    return { ...state, step: "finished", done: first ? [...state.done, first.id] : state.done };
  }
  return initial;
}

export type Slice = { id: string; minutes: number };

/** Fills a work window from the top of the queue. The last task may only partly fit. */
export function fillWindow(tasks: Task[], minutes = WINDOW_MINUTES): Slice[] {
  const slices: Slice[] = [];
  let left = minutes;
  for (const task of tasks) {
    if (left <= 0) break;
    const take = Math.min(task.minutes, left);
    slices.push({ id: task.id, minutes: take });
    left -= take;
  }
  return slices;
}
