"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { smartDisplayMiniature as copy } from "@/content/miniatures";
import Figure from "../Figure";
import { useHydrated } from "../hooks";
import { COLS, ROWS, initial, move, resize, type Layout, type Widget } from "./model";

/** The widgets Noah built; the rest of the board is drawn plainer. */
const MINE = new Set(["spotify", "lights", "grocery"]);
const LIGHTS = [1, 2, 3];

const subscribeToMinute = (onChange: () => void) => {
  const timer = setInterval(onChange, 15000);
  return () => clearInterval(timer);
};
const timeNow = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

type Drag = { id: string; mode: "move" | "resize"; dx: number; dy: number };

export default function SmartDisplayMiniature() {
  const hydrated = useHydrated();
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [layout, setLayout] = useState<Layout>(initial);
  const [arranging, setArranging] = useState(false);
  const [lightsOn, setLightsOn] = useState([true, false, true]);
  const [message, setMessage] = useState<string | null>(null);
  // The board's clock shows the real time once the page is running.
  const time = useSyncExternalStore(subscribeToMinute, timeNow, () => "");

  /** Tries a change and says what happened. */
  const apply = (id: string, change: (layout: Layout) => Layout, quiet = false) => {
    const changed = change(layout);
    if (changed === layout) {
      if (!quiet) setMessage(copy.status.blocked);
      return;
    }
    const before = layout.find((w) => w.id === id)!;
    const after = changed.find((w) => w.id === id)!;
    const name = copy.widgets[id];
    setMessage(before.w !== after.w || before.h !== after.h ? copy.status.resized(name, after.w, after.h) : copy.status.moved(name));
    setLayout(changed);
  };

  const cellAt = (event: PointerEvent) => {
    const box = board.current!.getBoundingClientRect();
    return {
      x: Math.floor(((event.clientX - box.left) / box.width) * COLS),
      y: Math.floor(((event.clientY - box.top) / box.height) * ROWS),
    };
  };

  const startDrag = (widget: Widget, mode: Drag["mode"]) => (event: PointerEvent<HTMLElement>) => {
    if (!arranging) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const cell = cellAt(event);
    drag.current = { id: widget.id, mode, dx: cell.x - widget.x, dy: cell.y - widget.y };
  };

  const onDrag = (event: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const cell = cellAt(event);
    const widget = layout.find((w) => w.id === d.id)!;
    if (d.mode === "move") apply(d.id, (l) => move(l, d.id, cell.x - d.dx, cell.y - d.dy), true);
    else apply(d.id, (l) => resize(l, d.id, cell.x - widget.x + 1, cell.y - widget.y + 1), true);
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onKey = (widget: Widget) => (event: KeyboardEvent) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!arranging || !step) return;
    event.preventDefault();
    const [dx, dy] = step;
    if (event.shiftKey) apply(widget.id, (l) => resize(l, widget.id, widget.w + dx, widget.h + dy));
    else apply(widget.id, (l) => move(l, widget.id, widget.x + dx, widget.y + dy));
  };

  const status = message ?? (arranging ? copy.status.arranging : copy.status.idle);

  return (
    <Figure
      interactive
      label={copy.label}
      description={copy.description}
      status={status}
      caption={copy.caption}
      legend={
        <ul className="miniature-legend">
          <li className="key-accent">{copy.legend.mine}</li>
          <li className="key-plain">{copy.legend.other}</li>
        </ul>
      }
      actions={
        hydrated && (
          <>
            <button
              type="button"
              className={arranging ? undefined : "primary"}
              aria-pressed={arranging}
              onClick={() => {
                setArranging(!arranging);
                setMessage(null);
              }}
            >
              {arranging ? copy.actions.done : copy.actions.arrange}
            </button>
            <button
              type="button"
              onClick={() => {
                setLayout(initial);
                setMessage(null);
              }}
            >
              {copy.actions.reset}
            </button>
          </>
        )
      }
    >
      <div className="mini-board" data-arranging={arranging} ref={board} style={{ "--cols": COLS, "--rows": ROWS } as CSSProperties}>
        {layout.map((widget) => {
          const name = copy.widgets[widget.id];
          return (
            <div
              key={widget.id}
              className="mini-widget"
              data-widget={widget.id}
              data-mine={MINE.has(widget.id)}
              data-wide={widget.w >= 2}
              data-tall={widget.h >= 2}
              style={{ "--x": widget.x, "--y": widget.y, "--w": widget.w, "--h": widget.h } as CSSProperties}
              tabIndex={arranging ? 0 : undefined}
              role={arranging ? "group" : undefined}
              aria-label={arranging ? copy.widgetHelp(name) : undefined}
              onPointerDown={startDrag(widget, "move")}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKey(widget)}
            >
              <span className="mini-widget-name">{name}</span>

              {widget.id === "clock" && <span className="mini-clock">{time}</span>}

              {widget.id === "lights" && (
                <span className="mini-lights">
                  {LIGHTS.slice(0, Math.max(1, Math.min(3, widget.w * widget.h - 1))).map((n, i) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={copy.light(n)}
                      aria-pressed={lightsOn[i]}
                      disabled={!hydrated || arranging}
                      onClick={() => setLightsOn(lightsOn.map((on, j) => (j === i ? !on : on)))}
                    />
                  ))}
                </span>
              )}

              {widget.id === "spotify" && (
                <span className="mini-spotify" aria-hidden="true">
                  <i className="mini-cover" />
                  <i className="mini-line" />
                  {widget.w >= 2 && (
                    <>
                      <i className="mini-line mini-line-short" />
                      <i className="mini-progress" />
                    </>
                  )}
                </span>
              )}

              {widget.id === "grocery" && (
                <span className="mini-grocery" aria-hidden="true">
                  {Array.from({ length: Math.max(1, Math.min(4, widget.h * 2 - 1)) }, (_, i) => (
                    <i key={i} className="mini-line" />
                  ))}
                </span>
              )}

              {arranging && (
                <span
                  className="mini-handle"
                  role="presentation"
                  onPointerDown={startDrag(widget, "resize")}
                  onPointerMove={onDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                />
              )}
            </div>
          );
        })}
      </div>
    </Figure>
  );
}
