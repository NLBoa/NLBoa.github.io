"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useScene } from "./store";

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

/** Brings the home page's HTML index back: there will be no desk. */
function showHtmlIndex() {
  delete document.documentElement.dataset.webgl;
}

/** How long the home page waits for the desk before showing its HTML index. */
const SLOW_LOAD_MS = 8000;

const subscribe = () => () => {};

/** If the scene throws, the site carries on as plain pages. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    showHtmlIndex();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Mounted once in the root layout so the canvas persists across routes.
 * Without WebGL nothing mounts and the page's own HTML is what you see.
 */
export default function SceneMount() {
  const supported = useSyncExternalStore(subscribe, hasWebGL, () => false);
  // Wait for the real URL, so the camera starts on the right view.
  const synced = useScene((s) => s.synced);

  const ready = useScene((s) => s.ready);

  useEffect(() => {
    if (!hasWebGL()) showHtmlIndex();
  }, []);

  // On a slow connection the Projects index stands in until the desk arrives.
  useEffect(() => {
    if (!hasWebGL()) return;
    if (ready) {
      document.documentElement.dataset.webgl = "1";
      return;
    }
    const timer = setTimeout(showHtmlIndex, SLOW_LOAD_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  if (!supported || !synced) return null;
  return (
    <SceneBoundary>
      <Scene />
    </SceneBoundary>
  );
}
