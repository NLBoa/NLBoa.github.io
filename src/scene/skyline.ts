/**
 * The city outside the window: towers, their lit windows, neon signs and
 * flying cars. This file only decides where everything is; City.tsx draws it.
 *
 * The city is laid out on a square of 2000 x 2000 units that always covers the
 * whole view (its side is the longer side of the browser window), so a wide
 * window sees the middle band of it and a phone sees the middle column. The
 * towers run off the bottom, and some off the top, so whatever part shows
 * through the room's window is full of buildings.
 *
 * Everything comes from one seeded sequence, so the city is the same on every
 * visit and can be tested.
 */

export const CITY_SIZE = 2000;

/** The band of the city, top to bottom, that most windows look out on. Signs hang here. */
export const SIGN_BAND = [0.2 * CITY_SIZE, 0.76 * CITY_SIZE] as const;

export type Neon = "magenta" | "cyan" | "amber" | "violet";

export const NEON: Record<Neon, { glow: string; core: string }> = {
  magenta: { glow: "#ff2fa8", core: "#ffc2e6" },
  cyan: { glow: "#22dcff", core: "#c9f6ff" },
  amber: { glow: "#ff8a2b", core: "#ffe0bd" },
  violet: { glow: "#8f5bff", core: "#ddd0ff" },
};

export type Tower = {
  x: number;
  width: number;
  /** y of the roof. Negative when the tower runs off the top of the city. */
  top: number;
  /** Which of the body colors it uses. */
  tone: number;
  /** Which window pattern covers its face. */
  windows: number;
  /** A narrower block standing on the roof. */
  cap: { inset: number; height: number } | null;
  /** A mast on the roof, with a blinking light at its tip or without. */
  mast: { x: number; height: number; beacon: boolean } | null;
  /** A neon line down one edge. */
  edge: Neon | null;
};

export type Glyph = "bars" | "ring" | "chevrons" | "blocks";

export type Sign = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: Neon;
  glyph: Glyph;
  flicker: boolean;
};

/** A large glowing advert on a tower's face. */
export type Board = { x: number; y: number; width: number; height: number; from: Neon; to: Neon };

export type Car = {
  /** Far cars fly behind the near towers; near cars fly in front of them. */
  lane: "far" | "near";
  /** Height in the city, 0 to 100. */
  top: number;
  /** Length, as a share of the city's side (0 to 100). */
  length: number;
  /** Seconds to cross the city. */
  seconds: number;
  /** Seconds into its crossing when the page loads. */
  offset: number;
  /** Flies right to left. */
  reverse: boolean;
  color: Neon;
  /** Where it sits when motion is reduced, 0 to 100 across the city. */
  park: number;
};

export type WindowCell = { x: number; y: number; width: number; height: number; color: string; opacity: number };
export type WindowTile = { width: number; height: number; pitch: [number, number]; cell: [number, number]; cells: WindowCell[] };

export type City = {
  far: Tower[];
  near: Tower[];
  signs: Sign[];
  boards: Board[];
  cars: Car[];
  /** Window patterns for the near towers, then one for the far ones. */
  tiles: WindowTile[];
};

/** A small seeded random sequence (mulberry32). */
function sequence(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (v: number) => Math.round(v * 10) / 10;

const WINDOW_COLORS = {
  amber: "#ffc76e",
  cyan: "#7fe9ff",
  magenta: "#ff7fd6",
  white: "#dfe8ff",
};

function tile(
  random: () => number,
  columns: number,
  rows: number,
  pitch: [number, number],
  cell: [number, number],
  lit: number,
  palette: string[],
): WindowTile {
  const cells: WindowCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (random() > lit) continue;
      cells.push({
        x: column * pitch[0],
        y: row * pitch[1],
        width: cell[0],
        height: cell[1],
        color: palette[Math.floor(random() * palette.length)],
        opacity: round(0.45 + random() * 0.55),
      });
    }
  }
  return { width: columns * pitch[0], height: rows * pitch[1], pitch, cell, cells };
}

const NEONS: Neon[] = ["magenta", "cyan", "amber", "violet"];
const GLYPHS: Glyph[] = ["bars", "ring", "chevrons", "blocks"];

/** The flying cars: three small ones far off, two larger ones close by. */
const CARS: Car[] = [
  { lane: "far", top: 29, length: 2.4, seconds: 46, offset: 9, reverse: false, color: "cyan", park: 22 },
  { lane: "far", top: 43, length: 2.9, seconds: 58, offset: 31, reverse: true, color: "amber", park: 71 },
  { lane: "far", top: 61, length: 2.6, seconds: 39, offset: 20, reverse: false, color: "magenta", park: 48 },
  { lane: "near", top: 36.5, length: 6.6, seconds: 21, offset: 6, reverse: false, color: "cyan", park: 83 },
  { lane: "near", top: 55, length: 5.8, seconds: 29, offset: 17, reverse: true, color: "magenta", park: 86 },
];

export function buildCity(seed = 2049): City {
  const random = sequence(seed);
  const between = (low: number, high: number) => low + random() * (high - low);

  const tiles: WindowTile[] = [
    tile(random, 6, 8, [7, 9], [4, 5.5], 0.3, [WINDOW_COLORS.amber, WINDOW_COLORS.amber, WINDOW_COLORS.white]),
    tile(random, 5, 9, [8, 8], [5, 4], 0.24, [WINDOW_COLORS.cyan, WINDOW_COLORS.cyan, WINDOW_COLORS.white]),
    tile(random, 4, 10, [11, 7], [9, 2.4], 0.32, [WINDOW_COLORS.white, WINDOW_COLORS.cyan, WINDOW_COLORS.magenta]),
    tile(random, 7, 7, [6, 10], [3, 6.5], 0.2, [WINDOW_COLORS.magenta, WINDOW_COLORS.amber, WINDOW_COLORS.white]),
    // Far towers: smaller and fewer.
    tile(random, 6, 9, [5, 7], [2.4, 3], 0.16, [WINDOW_COLORS.amber, WINDOW_COLORS.cyan, WINDOW_COLORS.white]),
  ];

  const far: Tower[] = [];
  for (let x = -20; x < CITY_SIZE + 20; ) {
    const width = between(30, 76);
    far.push({
      x: round(x),
      width: round(width),
      top: round(between(0.17, 0.52) * CITY_SIZE),
      tone: Math.floor(random() * 3),
      windows: 4,
      cap: random() < 0.3 ? { inset: round(between(6, 12)), height: round(between(20, 60)) } : null,
      mast: random() < 0.25 ? { x: round(width / 2), height: round(between(30, 80)), beacon: false } : null,
      edge: null,
    });
    x += width + (random() < 0.4 ? 0 : between(4, 24));
  }

  const near: Tower[] = [];
  for (let x = -30; x < CITY_SIZE + 30; ) {
    const width = between(72, 158);
    const tall = random() < 0.14;
    const top = tall ? -40 : between(0.2, 0.64) * CITY_SIZE;
    near.push({
      x: round(x),
      width: round(width),
      top: round(top),
      tone: Math.floor(random() * 3),
      windows: Math.floor(random() * 4),
      cap: !tall && random() < 0.55 ? { inset: round(between(10, 26)), height: round(between(28, 96)) } : null,
      mast: !tall && random() < 0.6 ? { x: round(between(0.25, 0.75) * width), height: round(between(34, 96)), beacon: random() < 0.6 } : null,
      edge: random() < 0.35 ? NEONS[Math.floor(random() * NEONS.length)] : null,
    });
    x += width + (random() < 0.25 ? 0 : between(14, 58));
  }

  // Signs hang on a tower's face, in the band of the city most windows see.
  const signs: Sign[] = [];
  near.forEach((tower, index) => {
    if (tower.width < 84 || tower.top > 0.56 * CITY_SIZE || index % 2 === 1) return;
    const width = round(between(18, 24));
    const height = round(between(100, 190));
    const left = random() < 0.5;
    signs.push({
      x: round(tower.x + (left ? 7 : tower.width - width - 7)),
      y: round(Math.min(Math.max(tower.top + between(26, 320), SIGN_BAND[0]), SIGN_BAND[1] - height)),
      width,
      height,
      color: NEONS[signs.length % NEONS.length],
      glyph: GLYPHS[signs.length % GLYPHS.length],
      flicker: signs.length === 2 || signs.length === 5,
    });
  });

  // A few adverts, on wide towers that carry no sign.
  const boards: Board[] = [];
  near.forEach((tower, index) => {
    if (boards.length === 4 || index % 2 === 0 || tower.width < 104 || tower.top > 0.5 * CITY_SIZE) return;
    const width = round(tower.width - 26);
    boards.push({
      x: round(tower.x + 13),
      y: round(Math.max(tower.top + 34, (0.24 + (boards.length % 3) * 0.13) * CITY_SIZE)),
      width,
      height: round(width * 0.62),
      from: boards.length % 2 === 0 ? "cyan" : "magenta",
      to: boards.length % 2 === 0 ? "violet" : "amber",
    });
  });

  return { far, near, signs, boards, cars: CARS, tiles };
}
