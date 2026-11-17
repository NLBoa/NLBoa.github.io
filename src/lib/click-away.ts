/**
 * "A click away from the page": the geometry, kept apart from the DOM so it can be tested.
 *
 * A page's content is the box around all of its blocks. A click outside that box, beside the
 * column, above it or below it, is a click away, and closes the page as Close does. Clicks in
 * the gaps between blocks are inside the box, so they do nothing.
 */
export type Box = { left: number; top: number; right: number; bottom: number };

/** Room left around the content, in pixels, so a click that just misses its edge is not a click away. */
export const AWAY_MARGIN = 24;

/** The box around every block that takes up room, grown by the margin; null if there is none. */
export function contentBox(blocks: Box[], margin = AWAY_MARGIN): Box | null {
  const solid = blocks.filter((b) => b.right - b.left > 0 && b.bottom - b.top > 0);
  if (solid.length === 0) return null;
  return {
    left: Math.min(...solid.map((b) => b.left)) - margin,
    top: Math.min(...solid.map((b) => b.top)) - margin,
    right: Math.max(...solid.map((b) => b.right)) + margin,
    bottom: Math.max(...solid.map((b) => b.bottom)) + margin,
  };
}

/** True when the point lies outside the content. With no content measured, nothing is "away". */
export function isAway(x: number, y: number, content: Box | null): boolean {
  if (!content) return false;
  return x < content.left || x > content.right || y < content.top || y > content.bottom;
}
