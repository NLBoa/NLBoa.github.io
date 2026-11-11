/**
 * The Smart Display miniature as pure functions: widgets on a grid that can
 * be moved and resized, as on the real board. A schematic of the layout
 * only; the widgets' contents are placeholders.
 */

export const COLS = 6;
export const ROWS = 4;

export type Widget = { id: string; x: number; y: number; w: number; h: number };
export type Layout = Widget[];

export const initial: Layout = [
  { id: "clock", x: 0, y: 0, w: 3, h: 2 },
  { id: "spotify", x: 3, y: 0, w: 1, h: 2 },
  { id: "lights", x: 4, y: 0, w: 2, h: 2 },
  { id: "grocery", x: 0, y: 2, w: 2, h: 2 },
];

const overlaps = (a: Widget, b: Widget) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** True when the widget is whole, on the board, and on top of no other widget. */
export function fits(layout: Layout, widget: Widget): boolean {
  if (![widget.x, widget.y, widget.w, widget.h].every(Number.isInteger)) return false;
  if (widget.w < 1 || widget.h < 1) return false;
  if (widget.x < 0 || widget.y < 0 || widget.x + widget.w > COLS || widget.y + widget.h > ROWS) return false;
  return layout.every((other) => other.id === widget.id || !overlaps(other, widget));
}

function change(layout: Layout, id: string, patch: Partial<Widget>): Layout {
  const current = layout.find((w) => w.id === id);
  if (!current) return layout;
  const changed = { ...current, ...patch };
  if (changed.x === current.x && changed.y === current.y && changed.w === current.w && changed.h === current.h) return layout;
  if (!fits(layout, changed)) return layout;
  return layout.map((w) => (w.id === id ? changed : w));
}

/** Moves a widget's top-left corner to a cell. Returns the same layout if it does not fit there. */
export const move = (layout: Layout, id: string, x: number, y: number): Layout => change(layout, id, { x, y });

/** Resizes a widget from its top-left corner. Returns the same layout if it does not fit. */
export const resize = (layout: Layout, id: string, w: number, h: number): Layout => change(layout, id, { w, h });
