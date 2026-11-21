"use client";

import Link from "next/link";
import { useEffect, type MouseEvent } from "react";
import { asset } from "@/lib/paths";
import { INTERACTIVES } from "./interactive";
import { selectActive, useScene } from "./store";

/** Finds an object's label in the page. */
export const labelFor = (id: string) => document.querySelector<HTMLElement>(`.scene-label[data-for="${id}"]`);

/**
 * The small text labels beside the hovered or focused object: one per object,
 * and only the active one shows. The scene positions it.
 *
 * Each object has a label of its own, laid out when the desk loads, so no
 * label's words ever change. With a single label whose words were swapped,
 * the browser's first repaint of it stalled the desk for two or three frames
 * on a first hover, and the label faded out as an empty box.
 */
export function SceneLabel() {
  const active = useScene(selectActive);
  // The hand cursor is for the pointer only: keyboard focus does not change it.
  const hovering = useScene((s) => s.hovered !== null && selectActive(s) === s.hovered);

  // The cursor goes on the canvas, which is what the pointer is over. On <body> it is inherited
  // by every element on the page, and Safari's engine then repaints all of them, the city
  // behind the window included, on every hover: a stalled frame each time.
  useEffect(() => {
    const canvas = document.querySelector<HTMLElement>(".scene canvas");
    if (!canvas) return;
    canvas.style.cursor = hovering ? "pointer" : "";
    return () => {
      canvas.style.cursor = "";
    };
  }, [hovering]);

  return (
    <div className="scene-labels" aria-hidden="true">
      {INTERACTIVES.map((item) => (
        <div key={item.id} className="scene-label" data-for={item.id} data-visible={item.id === active}>
          {item.label}
        </div>
      ))}
    </div>
  );
}

/**
 * A real link for every object on the desk, in Tab order, so the scene works
 * from the keyboard and with a screen reader. Focusing one outlines and
 * labels its object; Enter activates it like a click.
 */
export function Hotspots() {
  const setFocused = useScene((s) => s.setFocused);
  const activate = useScene((s) => s.activate);

  const fly = (id: string) => (event: MouseEvent) => {
    // Leave modified clicks (new tab, new window) to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    activate(id);
  };

  return (
    <nav className="hotspots" aria-label="On the desk">
      {INTERACTIVES.map((item) =>
        item.external ? (
          <a
            key={item.id}
            href={asset(item.href)}
            target="_blank"
            rel="noopener noreferrer"
            onFocus={() => setFocused(item.id)}
            onBlur={() => setFocused(null)}
          >
            {item.label} (opens in a new tab)
          </a>
        ) : (
          <Link
            key={item.id}
            href={item.href}
            onFocus={() => setFocused(item.id)}
            onBlur={() => setFocused(null)}
            onClick={fly(item.id)}
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
