/**
 * The Jupiterp miniature as pure functions: a plan of courses, and the
 * schedule generator's list that follows it. A schematic with sample
 * courses; the week's blocks carry no real meeting times.
 */

export const DAYS = 5;
export const PERIODS = 4;

/** When a sample course meets: which weekdays (0 = Monday) and which period of the day. */
export type Slot = { days: number[]; period: number };

export const CATALOG: Record<string, Slot> = {
  c1: { days: [0, 2, 4], period: 0 },
  c2: { days: [1, 3], period: 0 },
  c3: { days: [0, 2, 4], period: 1 },
  c4: { days: [1, 3], period: 2 },
  c5: { days: [0, 2], period: 3 },
};

const order = Object.keys(CATALOG);

export const initial: string[] = ["c1", "c2"];

/** Adds a course to the plan, or takes it out. The plan keeps the catalog's order. */
export function toggle(plan: string[], id: string): string[] {
  if (!(id in CATALOG)) return plan;
  const next = plan.includes(id) ? plan.filter((c) => c !== id) : [...plan, id];
  return next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** The generator's course list: always exactly the plan. */
export const generatorCourses = (plan: string[]): string[] => plan;

export type Block = { id: string; day: number; period: number };

/** One block per meeting of each planned course. */
export function blocks(plan: string[]): Block[] {
  return plan.flatMap((id) => CATALOG[id].days.map((day) => ({ id, day, period: CATALOG[id].period })));
}
