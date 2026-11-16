"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, ShapeGeometry, type Mesh, type MeshBasicMaterial } from "three";
import { roundedRect } from "./geometry";
import { light } from "./materials";
import { selectActive, useScene } from "./store";

/** How long an outline takes to fade in or out, in seconds. */
const FADE = 0.14;

/** True while this object is the one hovered or focused on the desk. */
export function useActive(id: string): boolean {
  return useScene((s) => selectActive(s) === id);
}

/**
 * Drives one outline: it fades in when its object is hovered or focused,
 * fades out afterwards, and follows the first-load pulse. It draws frames
 * only while its strength is changing, and React is not involved per frame.
 */
function useOutline(id: string) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshBasicMaterial>(null);
  const active = useActive(id);
  const invalidate = useThree((s) => s.invalidate);
  const shown = useRef(0);

  useEffect(() => {
    invalidate();
  }, [active, invalidate]);

  useFrame((state, delta) => {
    const { pulse, reducedMotion } = useScene.getState();
    const target = active ? 1 : 0;
    if (shown.current !== target) {
      // After an idle stretch the first delta is huge; treat it as one frame.
      const step = reducedMotion ? 1 : Math.min(delta, 1 / 30) / FADE;
      shown.current = target > shown.current ? Math.min(target, shown.current + step) : Math.max(target, shown.current - step);
      if (shown.current !== target) state.invalidate();
    }
    const strength = Math.max(shown.current, pulse);
    if (mesh.current) mesh.current.visible = strength > 0.01;
    if (material.current) material.current.opacity = strength;
  });

  return { mesh, material };
}

/**
 * The thin outline on a hovered or focused object: a flat rounded frame just
 * outside a `width` x `height` face. It lies in the local XY plane; rotate
 * it to lie on a key.
 */
export function OutlineFrame({
  id,
  width,
  height,
  radius,
  thickness,
  ...props
}: {
  id: string;
  width: number;
  height: number;
  radius: number;
  thickness: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { mesh, material } = useOutline(id);
  const geometry = useMemo(() => {
    const shape = roundedRect(width + thickness * 2, height + thickness * 2, radius + thickness);
    shape.holes.push(roundedRect(width, height, radius));
    return new ShapeGeometry(shape, 6);
  }, [width, height, radius, thickness]);

  return (
    <mesh ref={mesh} geometry={geometry} visible={false} {...props}>
      <meshBasicMaterial ref={material} color={light.outline} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/**
 * The same outline for a solid shape: wrap a slightly larger copy of the
 * shape's geometry in this and only its rim shows.
 */
export function OutlineHull({ id, children, ...props }: { id: string; children: React.ReactNode; position?: [number, number, number] }) {
  const { mesh, material } = useOutline(id);
  return (
    <mesh ref={mesh} visible={false} {...props}>
      {children}
      <meshBasicMaterial ref={material} color={light.outline} transparent opacity={0} toneMapped={false} depthWrite={false} side={BackSide} />
    </mesh>
  );
}

/**
 * Pointer handlers that make a mesh hoverable and clickable.
 *
 * Put these on meshes, never on a group. R3F books a hover against the mesh
 * that was hit; on a group, moving from one child to a nearer one (a
 * monitor's bezel to its screen) reports "out" on one pointer move and "over"
 * only on the next, so the outline, label and cursor blink. When an object is
 * several meshes, give the handlers to one mesh that covers it, or to each.
 */
export function pointerHandlers(id: string) {
  return {
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      useScene.getState().setHovered(id);
    },
    onPointerOut: () => {
      const state = useScene.getState();
      if (state.hovered === id) state.setHovered(null);
    },
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      useScene.getState().activate(id);
    },
  };
}
