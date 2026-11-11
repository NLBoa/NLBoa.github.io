"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MeshBasicMaterial, Raycaster, Vector2, Vector3, type Group } from "three";
import { ORB } from "../layout";
import { materials } from "../materials";
import { blink, easeStep, gazePoint } from "../orb";
import { useScene } from "../store";

const EYE = "#9fe8ff";

/**
 * A small glass ball on the desk with one glowing eye. It watches the
 * pointer, widens its eye over anything that can be clicked, and blinks when
 * you click. It is decoration: it opens nothing.
 *
 * It only draws frames while the pointer is moving or the eye is still
 * turning, so the idle desk stays at zero frames.
 */
export function Orb() {
  const head = useRef<Group>(null);
  const eye = useRef<Group>(null);
  const get = useThree((s) => s.get);
  // It watches on the desk view only, and holds still under reduced motion.
  const watching = useScene((s) => s.path === "/" && !s.reducedMotion);
  const lit = useMemo(() => new MeshBasicMaterial({ color: EYE, toneMapped: false }), []);

  const gaze = useRef({
    pointer: new Vector2(),
    seen: false,
    ray: new Raycaster(),
    target: new Vector3(),
    current: null as Vector3 | null,
    open: 1,
    blinkAt: -1,
  });

  useEffect(() => {
    if (!watching) return;
    const g = gaze.current;
    const onMove = (event: PointerEvent) => {
      g.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      g.seen = true;
      get().invalidate();
    };
    const onDown = (event: PointerEvent) => {
      onMove(event);
      g.blinkAt = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [get, watching]);

  // Back on a page, or the pointer gone: one more frame to settle.
  useEffect(() => {
    get().invalidate();
  }, [get, watching]);

  const center: [number, number, number] = [ORB.position[0], ORB.base.height + ORB.radius - ORB.sink, ORB.position[2]];

  useFrame(({ camera, invalidate }, delta) => {
    const g = gaze.current;
    if (!head.current || !eye.current) return;
    const dt = Math.min(delta, 1 / 30);
    const eyeAt = camera.position.toArray();

    if (watching && g.seen) {
      g.ray.setFromCamera(g.pointer, camera);
      g.target.fromArray(gazePoint(eyeAt, g.ray.ray.direction.toArray(), center, ORB.reach));
    } else {
      // Nothing to watch: look at the viewer.
      g.target.copy(camera.position);
    }

    let moving = false;
    if (!g.current || !watching) g.current = (g.current ?? new Vector3()).copy(g.target);
    else {
      g.current.lerp(g.target, easeStep(dt, 9));
      if (g.current.distanceTo(g.target) > 0.004) moving = true;
    }
    head.current.lookAt(g.current);

    // The eye opens wider over anything that can be clicked, and shuts for a blink.
    const wide = useScene.getState().hovered ? 1.16 : 1;
    g.open += (wide - g.open) * easeStep(dt, 12);
    if (Math.abs(wide - g.open) > 0.004) moving = true;
    const shut = g.blinkAt < 0 ? 0 : blink((performance.now() - g.blinkAt) / 1000);
    if (g.blinkAt >= 0) {
      if (performance.now() - g.blinkAt > 240) g.blinkAt = -1;
      moving = true;
    }
    eye.current.scale.set(g.open, g.open * (1 - shut * 0.92), 1);

    if (moving) invalidate();
  });

  return (
    <group>
      {/* The dock it sits in, with a thin lit ring. */}
      <mesh position={[ORB.position[0], ORB.base.height / 2, ORB.position[2]]} material={materials.blackMatte}>
        <cylinderGeometry args={[ORB.base.top, ORB.base.bottom, ORB.base.height, 40]} />
      </mesh>
      <mesh position={[ORB.position[0], ORB.base.height + 0.0004, ORB.position[2]]} rotation={[-Math.PI / 2, 0, 0]} material={lit}>
        <ringGeometry args={[ORB.base.top - 0.0022, ORB.base.top - 0.0008, 48]} />
      </mesh>

      <group ref={head} position={center}>
        <mesh>
          <sphereGeometry args={[ORB.radius, 48, 32]} />
          <meshStandardMaterial color="#0b0d12" roughness={0.28} metalness={0} />
        </mesh>
        {/* The eye lies on the ball's surface, facing along the head's +z. */}
        <group ref={eye} rotation={[Math.PI / 2, 0, 0]}>
          {/* Iris: a glowing band. */}
          <mesh material={lit}>
            <sphereGeometry args={[ORB.radius + 0.0005, 48, 6, 0, Math.PI * 2, 0.27, 0.17]} />
          </mesh>
          {/* A faint outer ring and the bright core. */}
          <mesh>
            <sphereGeometry args={[ORB.radius + 0.0004, 48, 2, 0, Math.PI * 2, 0.55, 0.022]} />
            <meshBasicMaterial color={EYE} toneMapped={false} transparent opacity={0.45} />
          </mesh>
          <mesh material={lit}>
            <sphereGeometry args={[ORB.radius + 0.0005, 24, 4, 0, Math.PI * 2, 0, 0.085]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
