"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { Camera, PerspectiveCamera } from "three";
import { poseFor, type CameraPose } from "./camera";
import type { View } from "./interactive";
import type { Vec3 } from "./layout";
import { FLIGHT_MS, selectView, useScene } from "./store";

/** Idle drift: the camera leans this far toward the pointer, in degrees. */
const DRIFT = { yaw: 3, pitch: 1.5 };

type Pose = { position: Vec3; target: Vec3; fov: number; shiftY: number };

const full = (pose: CameraPose): Pose => ({ ...pose, shiftY: pose.shiftY ?? 0 });
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mix3 = (a: Vec3, b: Vec3, k: number): Vec3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function apply(camera: Camera, pose: Pose, drift: { x: number; y: number }, width: number, height: number) {
  const cam = camera as PerspectiveCamera;
  // Swing the camera round its target by the drift angles.
  let x = pose.position[0] - pose.target[0];
  let y = pose.position[1] - pose.target[1];
  let z = pose.position[2] - pose.target[2];
  const yaw = (drift.x * DRIFT.yaw * Math.PI) / 180;
  [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  const length = Math.hypot(x, y, z);
  const flat = Math.hypot(x, z);
  const elevation = Math.atan2(y, flat) - (drift.y * DRIFT.pitch * Math.PI) / 180;
  y = length * Math.sin(elevation);
  const scale = (length * Math.cos(elevation)) / (flat || 1);

  cam.position.set(pose.target[0] + x * scale, pose.target[1] + y, pose.target[2] + z * scale);
  cam.lookAt(...pose.target);
  cam.fov = pose.fov;
  // Lens shift: slides the picture up or down without changing perspective.
  if (Math.abs(pose.shiftY) > 1e-4) cam.setViewOffset(width, height, 0, pose.shiftY * height, width, height);
  else cam.clearViewOffset();
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}

/**
 * Owns the camera. It rests on the pose for the current view, eases to a new
 * one in under a second, and while idle on the desk leans a few degrees
 * toward the pointer. There is no free orbit. Nothing here draws a frame
 * unless something is actually moving.
 */
export default function CameraRig() {
  const get = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const view = useScene(selectView);
  const reducedMotion = useScene((s) => s.reducedMotion);

  const rig = useRef({
    current: null as Pose | null,
    from: null as Pose | null,
    to: null as Pose | null,
    t: 1,
    view: null as View | null,
    drift: { x: 0, y: 0, targetX: 0, targetY: 0 },
  });

  useLayoutEffect(() => {
    const r = rig.current;
    const desired = full(poseFor(view, width / height));
    const sameView = r.view === view;
    if (!r.current || reducedMotion || sameView) {
      // First frame, a resize, or reduced motion: cut, don't fly.
      r.current = r.from = r.to = desired;
      r.t = 1;
    } else {
      r.from = r.current;
      r.to = desired;
      r.t = 0;
    }
    r.view = view;
    const { camera, invalidate } = get();
    apply(camera, r.current, r.drift, width, height);
    invalidate();
  }, [get, view, width, height, reducedMotion]);

  // Pointer drift, for mice and trackpads only.
  useEffect(() => {
    if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const drift = rig.current.drift;
    const onMove = (event: PointerEvent) => {
      drift.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      drift.targetY = (event.clientY / window.innerHeight) * 2 - 1;
      // Only the desk view leans; a close-up behind an open page has nothing to redraw.
      if (rig.current.view === "home") get().invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [get, reducedMotion]);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!r.current || !r.from || !r.to) return;
    // After an idle stretch the first delta is huge; treat it as one frame.
    const dt = Math.min(delta, 1 / 30);
    let moving = false;

    if (r.t < 1) {
      r.t = Math.min(1, r.t + (dt * 1000) / FLIGHT_MS);
      const k = ease(r.t);
      r.current = {
        position: mix3(r.from.position, r.to.position, k),
        target: mix3(r.from.target, r.to.target, k),
        fov: mix(r.from.fov, r.to.fov, k),
        shiftY: mix(r.from.shiftY, r.to.shiftY, k),
      };
      moving = true;
    }

    // Drift only on the desk view; close-ups hold still.
    const d = r.drift;
    const targetX = r.view === "home" ? d.targetX : 0;
    const targetY = r.view === "home" ? d.targetY : 0;
    const follow = 1 - Math.exp(-dt * 5);
    d.x += (targetX - d.x) * follow;
    d.y += (targetY - d.y) * follow;
    if (Math.abs(targetX - d.x) > 0.002 || Math.abs(targetY - d.y) > 0.002) moving = true;

    apply(state.camera, r.current, d, state.size.width, state.size.height);
    if (moving) state.invalidate();
  });

  return null;
}
