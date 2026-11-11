"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { normalizePath, sitePath } from "@/lib/paths";
import { useScene } from "@/scene/store";

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
