"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { normalizePath, sitePath } from "@/lib/paths";
import { useScene } from "@/scene/store";
import { restDelay } from "@/scene/weather";

/**
 * Keeps the 3D layer in step with the URL: tells it the current path, lets
 * it change routes, tracks reduced motion, and makes Esc return to the desk.
 */
export default function RouteSync() {
  const pathname = normalizePath(usePathname());
  const router = useRouter();

  useEffect(() => {
    useScene.getState().setPath(pathname);
    useScene.setState({ synced: true });
  }, [pathname]);

  useEffect(() => {
    useScene.setState({ navigate: (href) => router.push(href) });
  }, [router]);

  // Behind an open page the weather outside the window rests (rain.css). Opened from the desk,
  // it rests a moment after the page has arrived, not while it is arriving (scene/weather.ts).
  const from = useRef<string | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const delay = restDelay(from.current, pathname);
    from.current = pathname;
    if (delay === null) {
      root.removeAttribute("data-resting");
      return;
    }
    if (delay === 0) {
      root.setAttribute("data-resting", "");
      return;
    }
    const timer = setTimeout(() => root.setAttribute("data-resting", ""), delay);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Just before a clicked object's page opens, the scrim and the header come up (globals.css).
  useEffect(() => {
    const mark = (opening: boolean) => document.documentElement.toggleAttribute("data-opening", opening);
    const stop = useScene.subscribe((state, before) => {
      if (state.opening !== before.opening) mark(state.opening);
    });
    return () => {
      stop();
      mark(false);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => useScene.setState({ reducedMotion: query.matches });
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Esc closes the open page. The listener is there from the start and reads
  // the address when the key arrives, so Esc works the instant a page opens.
  // Some hosts (an embedded browser pane, for one) keep the key-down for
  // themselves and pass on only the key-up, so either one closes the page;
  // `handled` stops a normal down-and-up pair from counting twice.
  useEffect(() => {
    let handled = false;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.type === "keyup" && handled) {
        handled = false;
        return;
      }
      if (event.defaultPrevented || sitePath(window.location.pathname) === "/") return;
      handled = event.type === "keydown";
      router.push("/");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKey);
    };
  }, [router]);

  return null;
}
