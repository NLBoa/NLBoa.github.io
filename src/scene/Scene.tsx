"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Vector3, setConsoleFunction, type Camera } from "three";
import CameraRig from "./CameraRig";
import { byId } from "./interactive";
import { DESK } from "./layout";
import Lights from "./Lights";
import { Keyboard, Trackpad } from "./objects/Keyboard";
import { Orb } from "./objects/Orb";
import { Monitors } from "./objects/Monitors";
import { PenCup } from "./objects/PenCup";
import { Desk, Room } from "./objects/Room";
import Rain from "./Rain";
import { StreamDeck } from "./objects/StreamDeck";
import { Hotspots, SceneLabel, labelFor } from "./SceneUI";
import { rootRem, sideBand } from "./band";
import { selectActive, useScene } from "./store";

// The cat arrives after the desk: its own chunk and model, and never part of the baked shadows.
const Cat = lazy(() => import("./objects/Cat"));

declare global {
  interface Window {
    /** Numbers for the checkpoint and flow scripts (see STATS). */
    __scene?: {
      readonly frames: number;
      readonly triangles: number;
      readonly calls: number;
      readonly renderer: string;
      tick: () => void;
      invalidate: () => void;
      /** The strip beside a project page's column at this window size, if there is one (see band.ts). */
      readonly band: { left: number; width: number } | null;
      /** How bright the monitor screens are: 1 lit, about 0.05 with a page open (written by Monitors). */
      screens: number;
      /** Where an interactive object's label anchor is on screen (for the flow tests). */
      locate: (id: string) => { x: number; y: number } | null;
    };
  }
}

// React Three Fiber 9 times its frame loop with THREE.Clock, which three now marks as deprecated
// with a console warning on every page load. There is nothing here to change until R3F moves to
// THREE.Timer, so that one notice is left out; everything else three reports goes through as usual.
setConsoleFunction((type, message, ...rest) => {
  if (type === "warn" && typeof message === "string" && message.startsWith("THREE.Clock:")) return;
  console[type](message, ...rest);
});

/** Scene numbers for the scripts: always in development, in a build only when asked for. */
const STATS = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SCENE_STATS === "1";

/** Counts drawn frames so "nothing moving means no frames" can be checked. */
function Stats() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const get = useThree((s) => s.get);

  useLayoutEffect(() => {
    let frames = 0;
    const stats = {
      get frames() {
        return frames;
      },
      // renderer.info keeps the last drawn frame's numbers until the next one.
      get triangles() {
        return gl.info.render.triangles;
      },
      get calls() {
        return gl.info.render.calls;
      },
      get renderer() {
        const context = gl.getContext();
        const info = context.getExtension("WEBGL_debug_renderer_info");
        return info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "unknown";
      },
      get band() {
        const { size } = get();
        return sideBand(size.width, size.height, rootRem());
      },
      screens: 1,
      tick: () => void frames++,
      invalidate: () => invalidate(),
      locate: (id: string) => {
        const item = byId.get(id);
        if (!item) return null;
        const { camera, size } = get();
        const p = new Vector3(...item.anchor).project(camera);
        return { x: (p.x * 0.5 + 0.5) * size.width, y: (-p.y * 0.5 + 0.5) * size.height };
      },
    };
    window.__scene = stats;
    return () => {
      delete window.__scene;
    };
  }, [gl, invalidate, get]);

  // No render priority here: a priority would switch off R3F's own rendering.
  useFrame(() => window.__scene?.tick());
  return null;
}

/** Keeps the active object's DOM label pinned beside it. Mount after CameraRig. */
function LabelAnchor() {
  const active = useScene(selectActive);
  const get = useThree((s) => s.get);
  const point = useRef(new Vector3());

  const place = useCallback(
    (camera: Camera, size: { width: number; height: number }) => {
      const item = active ? byId.get(active) : undefined;
      const label = active ? labelFor(active) : null;
      if (!item || !label) return;
      const p = point.current.set(...item.anchor).project(camera);
      const x = (p.x * 0.5 + 0.5) * size.width;
      const y = (-p.y * 0.5 + 0.5) * size.height;
      label.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    },
    [active],
  );

  // Before the browser paints the new label, so it never shows where the last one was.
  useLayoutEffect(() => {
    const { camera, size } = get();
    place(camera, size);
  }, [get, place]);

  // And it follows its object while the camera moves.
  useFrame(({ camera, size }) => place(camera, size));

  return null;
}

/** Marks the scene ready once everything under the Suspense boundary has loaded. */
function Ready() {
  useEffect(() => {
    useScene.setState({ ready: true });
  }, []);
  return null;
}

let pulsed = false;

/**
 * The first time the desk is shown, every interactive object's outline
 * pulses once so it is obvious what can be clicked. Skipped under reduced
 * motion.
 */
function Pulse() {
  // On the desk itself: a page such as Credits keeps the desk view behind it, and a pulse
  // there would be spent unseen.
  const onDesk = useScene((s) => s.path === "/" && !s.flight);
  const reducedMotion = useScene((s) => s.reducedMotion);
  const invalidate = useThree((s) => s.invalidate);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (pulsed || reducedMotion || !onDesk) return;
    const timer = setTimeout(() => {
      pulsed = true;
      start.current = performance.now();
      invalidate();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onDesk, reducedMotion, invalidate]);

  useFrame((state) => {
    if (start.current === null) return;
    const t = (performance.now() - start.current) / 1600;
    if (t >= 1) {
      start.current = null;
      useScene.setState({ pulse: 0 });
      // One more frame, so the outlines are drawn at rest.
      state.invalidate();
      return;
    }
    useScene.setState({ pulse: Math.sin(Math.PI * t) });
    state.invalidate();
  });

  return null;
}

export default function Scene() {
  const ready = useScene((s) => s.ready);
  const onHome = useScene((s) => s.path === "/");
  const phone = window.matchMedia("(max-width: 640px)").matches;

  return (
    <>
      <div className="scene" data-ready={ready} aria-hidden="true">
        {/* The weather, seen through the window: the canvas is transparent where the glass is. */}
        <Rain />
        <Canvas
          frameloop="demand"
          dpr={[1, phone ? 1.5 : 2]}
          camera={{ fov: 35, near: 0.05, far: 30 }}
          gl={{ toneMappingExposure: 1.25 }}
        >
          <CameraRig />
          <LabelAnchor />
          <Lights />
          <Room />
          {/* Everything on the desk appears together, so the shadows are baked once with all of it. */}
          <Suspense fallback={null}>
            <Desk />
            <Monitors screenLight={7} />
            <StreamDeck />
            <PenCup />
            <Keyboard />
            <Trackpad />
            <Orb />
            <ContactShadows
              position={[0, 0.0008, 0]}
              scale={[DESK.width, DESK.depth]}
              far={0.12}
              blur={1}
              opacity={0.85}
              resolution={phone ? 256 : 512}
              frames={1}
            />
            <Ready />
            <Pulse />
          </Suspense>
          {ready && (
            <Suspense fallback={null}>
              <Cat />
            </Suspense>
          )}
          {STATS && <Stats />}
        </Canvas>
      </div>
      {onHome && (
        <>
          <SceneLabel />
          <Hotspots />
        </>
      )}
    </>
  );
}
