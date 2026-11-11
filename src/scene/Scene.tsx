"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import type { PerspectiveCamera } from "three";
import Blockout from "./Blockout";
import { homePose } from "./camera";

declare global {
  interface Window {
    /** Dev-only numbers for the checkpoint reports. */
    __scene?: { readonly frames: number; readonly triangles: number; readonly calls: number; tick: () => void };
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
      tick: () => void frames++,
    };
    window.__scene = stats;
    return () => {
      delete window.__scene;
    };
  }, [gl]);

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
        flat
        dpr={[1, phone ? 1.5 : 2]}
        camera={{ fov: 35, near: 0.1, far: 30 }}
      >
        <color attach="background" args={["#1c1c1e"]} />
        <hemisphereLight args={["#ffffff", "#3a3a3a", 1.1]} />
        <directionalLight position={[1.5, 2.5, 2]} intensity={1.6} />
        <CameraRig />
        <Blockout />
        {process.env.NODE_ENV === "development" && <Stats />}
      </Canvas>
    </div>
  );
}
