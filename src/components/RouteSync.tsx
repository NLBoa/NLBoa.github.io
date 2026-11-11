"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useScene } from "@/scene/store";

/**
 * Keeps the 3D layer in step with the URL: tells it the current path, lets
 * it change routes, tracks reduced motion, and makes Esc return to the desk.
 */
export default function RouteSync() {
  const pathname = usePathname();
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

  useEffect(() => {
    if (pathname === "/") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  return null;
}
