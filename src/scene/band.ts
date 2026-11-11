/**
 * The band: the free strip of the window to the right of a project page's
 * column, where the room shows through beside the text.
 *
 * The numbers mirror the page's CSS (globals.css: --gutter, and the story
 * column's 60rem) and the media query in app/projects/[slug]/room.css. A
 * browser check compares this with the column as the browser lays it out.
 */
const COLUMN = 60;
/** Space between the column and the band, where the scrim fades out. */
const GAP = 2;
/** Narrower than this and the room is not worth showing. */
const MIN = 16;

export type Band = { left: number; width: number };

/** The band in pixels for a window of this size, or null when there is none. */
export function sideBand(width: number, height: number, rem = 16): Band | null {
  if (width <= height) return null;
  const gutter = Math.min(Math.max(1.25 * rem, 0.07 * width), 8 * rem);
  const left = gutter + (COLUMN + GAP) * rem;
  const free = width - left;
  return free >= MIN * rem ? { left, width: free } : null;
}

/** True for a single project's page, the only kind of page with a band. */
export function isStoryPath(path: string): boolean {
  return /^\/projects\/[^/]+$/.test(path);
}

/** The size of 1rem in pixels, as the visitor's browser has it. */
export function rootRem(): number {
  if (typeof document === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}
