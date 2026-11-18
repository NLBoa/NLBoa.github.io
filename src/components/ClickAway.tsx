"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { contentBox, isAway, type Box } from "@/lib/click-away";

/** Things that are pressed for their own sake: a click on one is never a click away. */
const PRESSABLE = "a, button, input, textarea, select, label, summary, [role='button'], [contenteditable='true']";

/** The box around the open page's content, in window coordinates; null when no page is open. */
function pageContent(): Box | null {
  const main = document.querySelector("main.page");
  if (!main) return null;
  const blocks: Box[] = [];
  for (const child of main.children) {
    // Out-of-flow pieces (the Close button, text for screen readers) are not the page's body.
    const position = getComputedStyle(child).position;
    if (position === "fixed" || position === "absolute") continue;
    blocks.push(child.getBoundingClientRect());
  }
  return contentBox(blocks);
}

/** True when a press at this point, on this target, is a press away from the open page. */
function away(event: MouseEvent): boolean {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return false;
  // The header is how you get around; its empty stretches are not "away".
  if (target.closest(`${PRESSABLE}, .site-header`)) return false;
  // On the window's scrollbar.
  if (event.clientX >= document.documentElement.clientWidth) return false;
  return isAway(event.clientX, event.clientY, pageContent());
}

/** Any field with something typed in it. No page has one today; this is here for the day one does. */
function hasDraft(): boolean {
  return [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("main.page input, main.page textarea")].some((field) => field.value.trim() !== "");
}

/**
 * Closes the open page on a click away from it, the same as Close and Esc:
 * beside its column, above it or below it. The cursor turns to the zoom-out
 * one there, so it is clear a click will leave the page.
 *
 * It is careful about what counts. Not a click on anything pressable, in the
 * header, or in the gaps inside the content. Not the end of a drag (selecting
 * text out past the column), and not a click that only clears a selection or
 * leaves a field. Never while something is typed into a form: a stray click
 * must not throw it away. A mouse or pen only: on a phone the page fills
 * the screen, and a tap near its edge should do nothing.
 */
export default function ClickAway() {
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    // What the press that started this click looked like.
    let press: { x: number; y: number; away: boolean; field: HTMLElement | null; selecting: boolean } | null = null;

    const onDown = (event: PointerEvent) => {
      const active = document.activeElement;
      press = {
        x: event.clientX,
        y: event.clientY,
        away: event.pointerType !== "touch" && event.button === 0 && away(event),
        field: active instanceof HTMLElement && active.matches("input, textarea, select, [contenteditable='true']") ? active : null,
        selecting: !(getSelection()?.isCollapsed ?? true),
      };
    };

    const onClick = (event: MouseEvent) => {
      const started = press;
      press = null;
      if (!started?.away || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // A drag that ended out here, not a click.
      if (Math.hypot(event.clientX - started.x, event.clientY - started.y) > 6) return;
      if (!away(event)) return;
      // The first click away from a field or a selection only lets go of it, as a click on
      // empty space does anywhere. (Out here the browser does neither by itself.)
      if (started.field || started.selecting) {
        started.field?.blur();
        getSelection()?.removeAllRanges();
        return;
      }
      if (hasDraft()) return;
      router.push("/");
    };

    // The cursor shows where a click would leave the page.
    const onMove = (event: PointerEvent) => {
      const here = event.pointerType !== "touch" && away(event) && !hasDraft();
      if (here !== root.hasAttribute("data-away")) root.toggleAttribute("data-away", here);
    };
    const clear = () => root.removeAttribute("data-away");

    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onClick);
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", clear);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", clear);
      clear();
    };
  }, [router]);

  return null;
}
