"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// three.js never runs on the server and never blocks the page's HTML.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

let webgl: boolean | undefined;

function hasWebGL(): boolean {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webgl = Boolean(canvas.getContext("webgl2"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

const subscribe = () => () => {};

/**
 * Mounted once in the root layout so the canvas persists across routes.
 * Without WebGL nothing mounts and the page's own HTML is what you see.
 */
export default function SceneMount() {
  const supported = useSyncExternalStore(subscribe, hasWebGL, () => false);
  return supported ? <Scene /> : null;
}
