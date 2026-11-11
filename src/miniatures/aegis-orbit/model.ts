/**
 * The Aegis Orbit miniature as pure functions: a spacecraft on its orbit, a
 * piece of debris crossing ahead, and the choice to burn or stay on course.
 * A schematic. Nothing here is a real distance, speed or probability.
 */

/** The part of the drawing that is shown: `top` crops empty sky. */
export const VIEW = { top: 56, width: 960, height: 464 } as const;

export type Point = { x: number; y: number };
export type Choice = "burn" | "stay";
export type Phase = "approach" | "decision" | "burned" | "rejected" | "done";
export type State = { phase: Phase; t: number; choice: Choice | null };

/** Moments along the pass, as fractions of the sweep across the picture. */
export const T = { decision: 0.3, burn: 0.34, pass: 0.72, end: 0.9 } as const;

export const EARTH = { cx: 480, cy: 1000, r: 600 } as const;
const ORBIT_RADIUS = 760;
/** Half the angle the orbit sweeps across the picture, in radians. */
const SWEEP = 0.68;
/** How far the burn has raised the path by the time of the pass. */
export const LIFT = 56;

/** Seconds for the whole sweep at full speed. */
const DURATION = 11;
/** The clock runs this much slower at the pass itself. */
const SLOWEST = 0.28;
const SLOW_ZONE = 0.1;
const FLASH_LENGTH = 0.06;
const PLUME_LENGTH = 0.05;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const u = clamp01(v);
  return u * u * (3 - 2 * u);
};
const round = (v: number) => Math.round(v * 10) / 10;

function onOrbit(t: number, lift: number): Point {
  const angle = -SWEEP + 2 * SWEEP * t;
  const r = ORBIT_RADIUS + lift;
  return { x: round(EARTH.cx + r * Math.sin(angle)), y: round(EARTH.cy - r * Math.cos(angle)) };
}

/** Where the spacecraft would be on the course it started on. */
export const plannedPosition = (t: number): Point => onOrbit(t, 0);

/** Where the spacecraft is on the course it flies after the burn. */
export const burnedPosition = (t: number): Point =>
  onOrbit(t, LIFT * smooth((t - T.burn) / (T.pass - T.burn)));

/** The point where the planned course and the debris meet. */
export const PASS: Point = plannedPosition(T.pass);

// The debris flies a circle about a far-off center, placed so that it cuts
// the orbit steeply and reaches PASS exactly at T.pass.
const DEBRIS_CENTER = { x: 1500, y: 700 };
const DEBRIS_RADIUS = Math.hypot(PASS.x - DEBRIS_CENTER.x, PASS.y - DEBRIS_CENTER.y);
const DEBRIS_ANGLE_AT_PASS = Math.atan2(PASS.y - DEBRIS_CENTER.y, PASS.x - DEBRIS_CENTER.x);
const DEBRIS_RATE = 0.624;

export function debrisPosition(t: number): Point {
  const angle = DEBRIS_ANGLE_AT_PASS - DEBRIS_RATE * (t - T.pass);
  return {
    x: round(DEBRIS_CENTER.x + DEBRIS_RADIUS * Math.cos(angle)),
    y: round(DEBRIS_CENTER.y + DEBRIS_RADIUS * Math.sin(angle)),
  };
}

/** Which way a moving thing points, in degrees, from two nearby positions. */
function heading(at: (t: number) => Point, t: number): number {
  const a = at(t - 0.004);
  const b = at(t + 0.004);
  return round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
}

/** An SVG path through `at(t)` for t from `from` to `to`. */
export function pathOf(at: (t: number) => Point, from: number, to: number, steps = 48): string {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = at(from + ((to - from) * i) / steps);
    d += `${i === 0 ? "M" : "L"}${p.x} ${p.y}`;
  }
  return d;
}

export const initial: State = { phase: "approach", t: 0, choice: null };

/** The picture with the clock stopped at the decision. */
export const atDecision: State = { phase: "decision", t: T.decision, choice: null };

/** How fast the clock runs at `t`: slower around the pass. */
export function clockRate(t: number): number {
  return SLOWEST + (1 - SLOWEST) * smooth(Math.abs(t - T.pass) / SLOW_ZONE);
}

/** Moves the clock on by `seconds`. The clock stops at the decision and at the end. */
export function advance(state: State, seconds: number): State {
  if (state.phase === "decision" || state.phase === "done") return state;
  const t = state.t + (seconds / DURATION) * clockRate(state.t);
  if (state.phase === "approach") {
    return t >= T.decision ? atDecision : { ...state, t };
  }
  return t >= T.end ? { ...state, phase: "done", t: T.end } : { ...state, t };
}

/** Approve the burn or stay on course. Possible until the clock leaves the decision. */
export function decide(state: State, choice: Choice): State {
  if (state.phase !== "approach" && state.phase !== "decision") return state;
  return { phase: choice === "burn" ? "burned" : "rejected", t: state.t, choice };
}

/** The outcome as a still, for people who asked for less motion. */
export function settle(choice: Choice): State {
  return { phase: "done", t: T.pass, choice };
}

export type Picture = {
  /** The spacecraft, or null once it has flown into the pass. */
  craft: (Point & { heading: number }) | null;
  /** The copy that keeps flying the course not taken, until the pass. */
  ghost: (Point & { heading: number }) | null;
  debris: Point | null;
  /** True once the path has bent at the burn. */
  bent: boolean;
  /** 0 to 1: the thruster firing just after the burn. */
  plume: number;
  /** 0 to 1: the flash at the pass. */
  flash: number;
  /** Where the spacecraft was when the ghost reached the pass. */
  clearance: Point | null;
  /** True once the spacecraft has flown into the pass. */
  hit: boolean;
};

export function picture({ t, choice }: State): Picture {
  const burned = choice === "burn";
  const bent = burned && t >= T.burn;
  const passed = t >= T.pass;
  const at = bent ? burnedPosition : plannedPosition;
  const hit = choice === "stay" && passed;

  return {
    craft: hit ? null : { ...at(t), heading: heading(at, t) },
    ghost: bent && !passed ? { ...plannedPosition(t), heading: heading(plannedPosition, t) } : null,
    debris: hit ? null : debrisPosition(t),
    bent,
    plume: bent ? clamp01(1 - (t - T.burn) / PLUME_LENGTH) : 0,
    flash: choice && passed ? clamp01(1 - (t - T.pass) / FLASH_LENGTH) : 0,
    clearance: burned && passed ? burnedPosition(T.pass) : null,
    hit,
  };
}

/** The fixed lines of the picture. */
export const PATHS = {
  planned: pathOf(plannedPosition, 0, 1),
  beforeBurn: pathOf(plannedPosition, 0, T.burn, 24),
  afterBurn: pathOf(burnedPosition, T.burn, 1),
  notTaken: pathOf(plannedPosition, T.burn, T.pass, 24),
  debris: pathOf(debrisPosition, -0.05, 1.05),
};
