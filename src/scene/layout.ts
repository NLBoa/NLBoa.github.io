/**
 * Single source of truth for where everything sits on the desk.
 *
 * Units are meters at real-world scale. The world origin is the center of the
 * desk's top surface: +x is right, +y is up, +z is toward the viewer.
 * Desk coordinates (u, v) are the normalized ones from the build prompt:
 * u 0 = left edge, 1 = right edge; v 0 = back edge, 1 = front edge.
 */

export type Vec3 = [number, number, number];

const deg = (d: number) => (d * Math.PI) / 180;

export const DESK = { width: 1.4, depth: 0.7, thickness: 0.03 } as const;

/** Desk (u, v) to world position on the desk surface. */
export function onDesk(u: number, v: number, y = 0): Vec3 {
  return [(u - 0.5) * DESK.width, y, (v - 0.5) * DESK.depth];
}

/** The wall sits a little behind the back edge so the arm clamp has room. */
export const WALL_Z = -DESK.depth / 2 - 0.05;

// Monitors: 27-inch 16:9 -------------------------------------------------

const DIAGONAL = 27 * 0.0254;
const SCREEN_W = (DIAGONAL * 16) / Math.hypot(16, 9); // 0.598
const SCREEN_H = (DIAGONAL * 9) / Math.hypot(16, 9); // 0.336
const BEZEL = { side: 0.006, top: 0.006, bottom: 0.016 };

export const MONITOR = {
  screen: { width: SCREEN_W, height: SCREEN_H },
  body: {
    width: SCREEN_W + BEZEL.side * 2,
    height: SCREEN_H + BEZEL.top + BEZEL.bottom,
    depth: 0.02,
  },
  /** Screen center relative to body center (the bottom bezel is taller). */
  screenOffsetY: (BEZEL.bottom - BEZEL.top) / 2,
  /** Height of the bottom edge above the desk; pens must clear it. */
  bottomY: 0.21,
  /** z of the left monitor's body center. */
  z: -0.29,
  /** Gap between the two inner edges. */
  gap: 0.01,
  /** Right monitor is turned inward by this much. */
  rightYaw: deg(-20),
} as const;

export const ARM_BASE = {
  position: onDesk(0.52, 0.04),
  size: [0.12, 0.012, 0.09] as Vec3,
  pole: { size: [0.045, 0.3, 0.045] as Vec3 },
  armThickness: 0.035,
};

const monitorCenterY = MONITOR.bottomY + MONITOR.body.height / 2;
const baseX = ARM_BASE.position[0];
const half = MONITOR.body.width / 2;
const hingeX = baseX + MONITOR.gap / 2;

export type MonitorPlacement = {
  id: "monitor-left" | "monitor-right";
  position: Vec3; // body center
  yaw: number;
};

export const MONITORS: MonitorPlacement[] = [
  {
    id: "monitor-left",
    position: [baseX - MONITOR.gap / 2 - half, monitorCenterY, MONITOR.z],
    yaw: 0,
  },
  {
    id: "monitor-right",
    // Pivot on the inner edge so the two panels stay nearly touching.
    position: [
      hingeX + Math.cos(MONITOR.rightYaw) * half,
      monitorCenterY,
      MONITOR.z - Math.sin(MONITOR.rightYaw) * half,
    ],
    yaw: MONITOR.rightYaw,
  },
];

/** World-space corners of a monitor body's front face. */
export function monitorCorners(m: MonitorPlacement): Vec3[] {
  const hw = MONITOR.body.width / 2;
  const hh = MONITOR.body.height / 2;
  const c = Math.cos(m.yaw);
  const s = Math.sin(m.yaw);
  return [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ].map(([x, y]) => [
    m.position[0] + c * x,
    m.position[1] + y,
    m.position[2] - s * x,
  ]);
}

// Light bar ---------------------------------------------------------------

const leftMonitor = MONITORS[0];
const monitorTopY = MONITOR.bottomY + MONITOR.body.height;

export const LIGHT_BAR = {
  bar: {
    size: [0.45, 0.022, 0.022] as Vec3,
    position: [leftMonitor.position[0], monitorTopY + 0.02, MONITOR.z + 0.035] as Vec3,
  },
  clip: {
    size: [0.035, 0.03, 0.06] as Vec3,
    position: [leftMonitor.position[0], monitorTopY + 0.012, MONITOR.z + 0.005] as Vec3,
  },
};

// Stream Deck (15 keys, on its stand) --------------------------------------

const KEY = { size: 0.016, gap: 0.0055, cols: 5, rows: 3 };

export const STREAM_DECK = {
  position: onDesk(0.36, 0.15),
  /** Lying flat: width (x), thickness (y), height (z). */
  body: [0.118, 0.025, 0.084] as Vec3,
  /** Face tilts toward the viewer by this much from horizontal. */
  tilt: deg(50),
  stand: { size: [0.11, 0.012, 0.08] as Vec3 },
  key: KEY,
  /** Key centers in the body's local frame, row by row from the top-left. */
  keys: Array.from({ length: KEY.cols * KEY.rows }, (_, i) => {
    const col = i % KEY.cols;
    const row = Math.floor(i / KEY.cols);
    const pitch = KEY.size + KEY.gap;
    return {
      index: i,
      local: [
        (col - (KEY.cols - 1) / 2) * pitch,
        0.025 / 2,
        (row - (KEY.rows - 1) / 2) * pitch,
      ] as Vec3,
    };
  }),
};

/** Center height of the tilted body so its lower edge rests on the stand. */
export function streamDeckBodyY(): number {
  const [, t, h] = STREAM_DECK.body;
  const a = STREAM_DECK.tilt;
  return STREAM_DECK.stand.size[1] + (h / 2) * Math.sin(a) + (t / 2) * Math.cos(a);
}

// Pen cup -------------------------------------------------------------------

export const PEN_CUP = {
  position: onDesk(0.7, 0.12),
  radius: 0.04, // hexagon circumradius
  height: 0.105,
  pens: [
    { offset: [-0.012, 0.008], lean: [0.1, -0.06], length: 0.15 },
    { offset: [0.012, 0.004], lean: [-0.08, 0.05], length: 0.145 },
    { offset: [0, -0.012], lean: [0.03, 0.1], length: 0.14 },
  ],
  penRadius: 0.004,
};

// Keyboard and trackpad (decoration) ----------------------------------------

export const KEYBOARD = {
  position: onDesk(0.45, 0.72),
  size: [0.279, 0.008, 0.115] as Vec3, // Magic Keyboard, compact
};

export const TRACKPAD = {
  position: onDesk(0.7, 0.74),
  size: [0.16, 0.008, 0.115] as Vec3, // Magic Trackpad
};

// What the camera has to keep in frame --------------------------------------

const deskCorners: Vec3[] = [
  onDesk(0, 0),
  onDesk(1, 0),
  onDesk(1, 1),
  onDesk(0, 1),
];

const allMonitorCorners = MONITORS.flatMap(monitorCorners);

export const FRAME_POINTS = {
  /** Landscape: both monitors and the whole desk top. */
  desk: [...deskCorners, ...allMonitorCorners],
  /** Portrait: the monitors and the Stream Deck. */
  monitors: [
    ...allMonitorCorners,
    [STREAM_DECK.position[0] - 0.07, 0, STREAM_DECK.position[2] + 0.06] as Vec3,
    [STREAM_DECK.position[0] + 0.07, 0, STREAM_DECK.position[2] + 0.06] as Vec3,
  ],
};
