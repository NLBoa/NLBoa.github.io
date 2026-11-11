/**
 * A small drawing for each project: its cover. A cover is a list of plain
 * vector shapes, so the same art can be drawn as SVG on the Projects page
 * and painted onto the left monitor's screen in the 3D scene.
 *
 * Covers echo each project's miniature. They carry no text.
 */

export const COVER = { width: 320, height: 180 } as const;

/** Colors by role. `accent` is the project's own color. */
export type Ink = "accent" | "ink" | "dim" | "faint" | "panel" | "warn";

export const INKS: Record<Exclude<Ink, "accent">, string> = {
  ink: "#e3ebf7",
  dim: "#5d6f8c",
  faint: "#26334a",
  panel: "#131d2e",
  warn: "#ef6a5b",
};

export type Shape = {
  /** An SVG path. */
  d: string;
  fill?: Ink;
  stroke?: Ink;
  width?: number;
  dash?: [number, number];
  opacity?: number;
};

const n = (v: number) => Math.round(v * 10) / 10;

/** A rectangle with rounded corners. */
function box(x: number, y: number, w: number, h: number, r = 3): string {
  const q = Math.min(r, w / 2, h / 2);
  return `M${n(x + q)} ${n(y)}h${n(w - 2 * q)}a${q} ${q} 0 0 1 ${q} ${q}v${n(h - 2 * q)}a${q} ${q} 0 0 1 -${q} ${q}h-${n(w - 2 * q)}a${q} ${q} 0 0 1 -${q} -${q}v-${n(h - 2 * q)}a${q} ${q} 0 0 1 ${q} -${q}z`;
}

function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0z`;
}

/** A rectangle centered on (cx, cy), turned by `degrees`. */
function turned(cx: number, cy: number, w: number, h: number, degrees: number, dx = 0): string {
  const a = (degrees * Math.PI) / 180;
  const corners = [
    [dx - w / 2, -h / 2],
    [dx + w / 2, -h / 2],
    [dx + w / 2, h / 2],
    [dx - w / 2, h / 2],
  ].map(([x, y]) => `${n(cx + x * Math.cos(a) - y * Math.sin(a))} ${n(cy + x * Math.sin(a) + y * Math.cos(a))}`);
  return `M${corners.join("L")}z`;
}

// Argus: a week with classes on it and the work fitted around them.
const week = { x: 30, y: 30, column: 52, row: 20, width: 46 };
const slot = (day: number, start: number, length: number) =>
  box(week.x + day * week.column, week.y + start * week.row + 1, week.width, length * week.row - 2, 4);

const argus: Shape[] = [
  ...[
    [0, 0, 2],
    [1, 0, 1],
    [2, 0, 2],
    [3, 0, 1],
    [3, 3, 2],
    [4, 0, 2],
  ].map(([day, start, length]) => ({ d: slot(day, start, length), fill: "faint" as Ink })),
  ...[
    [0, 2, 2],
    [0, 4, 2],
    [1, 1, 1],
    [1, 2, 2],
    [2, 2, 3],
  ].map(([day, start, length]) => ({ d: slot(day, start, length), fill: "accent" as Ink })),
];

// Smart Display: widgets on the board, two lights on.
const smartDisplay: Shape[] = [
  { d: box(28, 22, 126, 62, 10), fill: "panel", stroke: "dim", width: 1.5 },
  ...[42, 62, 96, 116].map((x) => ({ d: box(x, 42, 14, 24, 3), fill: "ink" as Ink })),
  { d: circle(86, 49, 2.2), fill: "ink" },
  { d: circle(86, 59, 2.2), fill: "ink" },
  { d: box(160, 22, 38, 62, 10), fill: "panel", stroke: "accent", width: 1.5 },
  { d: circle(179, 46, 9), fill: "accent", opacity: 0.55 },
  { d: box(168, 64, 22, 3, 1.5), fill: "dim" },
  { d: box(204, 22, 88, 62, 10), fill: "panel", stroke: "accent", width: 1.5 },
  { d: circle(226, 53, 9), fill: "accent" },
  { d: circle(248, 53, 9), stroke: "dim", width: 1.5 },
  { d: circle(270, 53, 9), fill: "accent" },
  { d: box(28, 90, 82, 62, 10), fill: "panel", stroke: "accent", width: 1.5 },
  { d: box(40, 112, 58, 3, 1.5), fill: "dim" },
  { d: box(40, 122, 36, 3, 1.5), fill: "dim" },
  { d: box(40, 132, 58, 3, 1.5), fill: "dim" },
];

// Jupiterp: the plan on the left, the generator's week following it on the right.
const jupiterp: Shape[] = [
  { d: box(24, 24, 112, 132, 8), fill: "panel", stroke: "faint", width: 1.5 },
  ...[0, 1, 2, 3, 4].flatMap((i): Shape[] => {
    const y = 40 + i * 22;
    const planned = i < 2;
    return [
      planned ? { d: box(36, y, 10, 10, 2), fill: i === 0 ? "accent" : "ink" } : { d: box(36, y, 10, 10, 2), stroke: "dim", width: 1.5 },
      { d: box(54, y + 3, 62, 4, 2), fill: planned ? "ink" : "dim", opacity: planned ? 0.9 : 0.6 },
    ];
  }),
  { d: "M146 90H170", stroke: "accent", width: 2 },
  { d: "M169 84.5l9 5.5l-9 5.5z", fill: "accent" },
  { d: box(184, 24, 112, 132, 8), fill: "panel", stroke: "faint", width: 1.5 },
  ...[0, 1, 2, 3, 4].flatMap((day): Shape[] => [
    { d: box(194 + day * 19, 44, 15, 16, 2), fill: day % 2 === 0 ? "accent" : "ink", opacity: day % 2 === 0 ? 1 : 0.85 },
    ...[66, 88, 110].map((y) => ({ d: box(194 + day * 19, y, 15, 16, 2), fill: "faint" as Ink })),
  ]),
];

// Aegis Orbit: an orbit above the Earth, and debris crossing it.
const aegisOrbit: Shape[] = [
  { d: circle(160, 330, 200), fill: "panel", stroke: "faint", width: 1.5 },
  { d: "M11.8 122.4A255 255 0 0 1 308.2 122.4", stroke: "accent", width: 5, opacity: 0.6 },
  { d: "M290 10L204.2 130", stroke: "warn", width: 1.5, dash: [5, 5], opacity: 0.8 },
  { d: circle(235.4, 86.4, 13), stroke: "warn", width: 1.5, dash: [3, 4] },
  { d: circle(267, 42, 5), fill: "warn" },
  { d: turned(96.9, 82.9, 10, 7, -14.3, -13), fill: "ink" },
  { d: turned(96.9, 82.9, 10, 7, -14.3, 13), fill: "ink" },
  { d: turned(96.9, 82.9, 11, 11, -14.3), fill: "ink" },
];

// Shell: a prompt, commands and their output, and a cursor.
const shell: Shape[] = [
  ...[
    { row: 0, command: 150 },
    { row: 1, output: 104 },
    { row: 2, command: 72 },
    { row: 3, output: 132 },
    { row: 4, command: 0 },
  ].flatMap(({ row, command, output }): Shape[] => {
    const y = 36 + row * 24;
    if (output !== undefined) return [{ d: box(30, y + 2, output, 8, 4), fill: "dim", opacity: 0.8 }];
    const prompt: Shape = { d: `M30 ${y}l8 6l-8 6`, stroke: "accent", width: 2.5 };
    return command ? [prompt, { d: box(50, y + 2, command, 8, 4), fill: "ink" }] : [prompt, { d: box(50, y - 1, 9, 14, 1.5), fill: "accent" }];
  }),
];

// MID: a palette with most of its swatches still to be filled.
const mid: Shape[] = [0, 1, 2, 3, 4, 5].map((i): Shape => {
  const d = box(60 + (i % 3) * 72, 26 + Math.floor(i / 3) * 72, 56, 56, 10);
  if (i === 0) return { d, fill: "accent" };
  if (i === 1) return { d, fill: "accent", opacity: 0.45 };
  return { d, stroke: "dim", width: 1.5, dash: [4, 4] };
});

export const covers: Record<string, Shape[]> = {
  argus,
  "smart-display": smartDisplay,
  jupiterp,
  "aegis-orbit": aegisOrbit,
  shell,
  mid,
};
