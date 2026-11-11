"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const subscribeNever = () => () => {};

/** False in the server's HTML and on the first client render, true after. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/** True while any part of the element is in the viewport. */
export function useOnScreen(ref: RefObject<Element | null>): boolean {
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return onScreen;
}

/**
 * Calls `tick(seconds)` once per frame while `running`. A long gap (a hidden
 * tab, a dropped frame) counts as one short step, so nothing jumps.
 */
export function useFrames(running: boolean, tick: (seconds: number) => void) {
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      tick(Math.min((now - last) / 1000, 0.05));
      last = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, tick]);
}
