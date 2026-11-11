"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect } from "react";
import type { PerspectiveCamera } from "three";
import { homePose } from "./camera";
import { DESK } from "./layout";
import Lights from "./Lights";
import { Keyboard, Trackpad } from "./objects/Keyboard";
import { Monitors } from "./objects/Monitors";
import { PenCup } from "./objects/PenCup";
import { Desk, Wall } from "./objects/Room";
import { StreamDeck } from "./objects/StreamDeck";

declare global {
  interface Window {
    /** Dev-only numbers for the checkpoint reports. */
    __scene?: {
      readonly frames: number;
      readonly triangles: number;
      readonly calls: number;
      readonly renderer: string;
      tick: () => void;
      invalidate: () => void;
    };
  }
}

function CameraRig() {
  const get = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useLayoutEffect(() => {
    const { camera, invalidate } = get();
    const pose = homePose(width / height);
    const cam = camera as PerspectiveCamera;
    cam.fov = pose.fov;
    cam.position.set(...pose.position);
    cam.lookAt(...pose.target);
    // Lens shift: slides the picture up or down without changing perspective.
    if (pose.shiftY) cam.setViewOffset(width, height, 0, pose.shiftY * height, width, height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    invalidate();
  }, [get, width, height]);

  return null;
}

/** Counts drawn frames so "nothing moving means no frames" can be checked. */
function Stats() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

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
      tick: () => void frames++,
      invalidate: () => invalidate(),
    };
    window.__scene = stats;
    return () => {
      delete window.__scene;
    };
  }, [gl, invalidate]);

  // No render priority here: a priority would switch off R3F's own rendering.
  useFrame(() => window.__scene?.tick());
  return null;
}

export default function Scene() {
  const phone =
    typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, phone ? 1.5 : 2]}
        camera={{ fov: 35, near: 0.1, far: 30 }}
        gl={{ toneMappingExposure: 1.25 }}
      >
        <color attach="background" args={["#0d0c0c"]} />
        <CameraRig />
        <Lights />
        <Wall />
        {/* Everything on the desk appears together, so the shadows are baked once with all of it. */}
        <Suspense fallback={null}>
          <Desk />
          <Monitors screenLight={7} />
          <StreamDeck />
          <PenCup />
          <Keyboard />
          <Trackpad />
          <ContactShadows
            position={[0, 0.0008, 0]}
            scale={[DESK.width, DESK.depth]}
            far={0.12}
            blur={1}
            opacity={0.85}
            resolution={phone ? 256 : 512}
            frames={1}
          />
        </Suspense>
        {process.env.NODE_ENV === "development" && <Stats />}
      </Canvas>
    </div>
  );
}
