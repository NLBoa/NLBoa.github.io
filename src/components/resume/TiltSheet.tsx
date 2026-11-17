"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { approach, tiltFor } from "@/lib/tilt";

/** How quickly the sheet follows the pointer, and how quickly it settles once the pointer leaves. */
const FOLLOW = 11;
const SETTLE = 6;

/**
 * One sheet of the résumé that tips toward the pointer like a card held in
 * the hand, with a shine that follows it.
 *
 * It is for a mouse or trackpad only: a touch does nothing, and under reduced
 * motion the sheet holds still. The tilt is written straight to CSS variables
 * from an animation frame, so React renders nothing while it moves, and the
 * loop stops as soon as the sheet has settled. At rest there is no transform
 * at all, so the type stays as sharp as the picture.
 */
export default function TiltSheet({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const frame = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = frame.current;
    const el = sheet.current;
    if (!outer || !el) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const now = { x: 0, y: 0, px: 50, py: 50, shine: 0 };
    const goal = { x: 0, y: 0, px: 50, py: 50, shine: 0 };
    let raf = 0;
    let last = 0;

    const rest = () => {
      for (const name of ["--tilt-x", "--tilt-y", "--shine-x", "--shine-y", "--shine"]) el.style.removeProperty(name);
      delete el.dataset.tilting;
    };

    const step = (time: number) => {
      // After a pause the first gap is long; treat it as one frame.
      const seconds = Math.min((time - last) / 1000, 1 / 30);
      last = time;
      const rate = goal.shine ? FOLLOW : SETTLE;
      now.x = approach(now.x, goal.x, seconds, rate);
      now.y = approach(now.y, goal.y, seconds, rate);
      now.px = approach(now.px, goal.px, seconds, rate);
      now.py = approach(now.py, goal.py, seconds, rate);
      now.shine = approach(now.shine, goal.shine, seconds, rate);

      const settled = Math.abs(now.x - goal.x) < 0.01 && Math.abs(now.y - goal.y) < 0.01 && Math.abs(now.shine - goal.shine) < 0.005;
      if (settled && goal.shine === 0) {
        now.x = now.y = now.shine = 0;
        rest();
        raf = 0;
        return;
      }
      el.dataset.tilting = "";
      el.style.setProperty("--tilt-x", now.x.toFixed(3));
      el.style.setProperty("--tilt-y", now.y.toFixed(3));
      el.style.setProperty("--shine-x", `${now.px.toFixed(2)}%`);
      el.style.setProperty("--shine-y", `${now.py.toFixed(2)}%`);
      el.style.setProperty("--shine", now.shine.toFixed(3));
      raf = settled ? 0 : requestAnimationFrame(step);
    };

    const run = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !fine.matches || still.matches) return;
      // Measured on the frame, which never turns, so the sheet's own tilt cannot feed back into it.
      const tilt = tiltFor(event.clientX, event.clientY, outer.getBoundingClientRect());
      goal.x = tilt.x;
      goal.y = tilt.y;
      goal.px = tilt.px;
      goal.py = tilt.py;
      goal.shine = 1;
      run();
    };

    const onLeave = () => {
      goal.x = goal.y = goal.shine = 0;
      if (now.x || now.y || now.shine) run();
    };

    outer.addEventListener("pointermove", onMove, { passive: true });
    outer.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      outer.removeEventListener("pointermove", onMove);
      outer.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      rest();
    };
  }, []);

  return (
    <div ref={frame} className="resume-frame" style={style}>
      <div ref={sheet} className="resume-sheet">
        {children}
        <span className="resume-shine" aria-hidden="true" />
      </div>
    </div>
  );
}
