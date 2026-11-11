"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { BackSide, ShapeGeometry } from "three";
import { roundedRect } from "./geometry";
import { light } from "./materials";
import { selectActive, useScene } from "./store";

/** 0..1: how strongly an object's outline shows (hover, focus, or the first-load pulse). */
export function useHighlight(id: string): number {
  return useScene((s) => Math.max(selectActive(s) === id && s.path === "/" ? 1 : 0, s.pulse));
}

function OutlineMaterial({ strength, hull = false }: { strength: number; hull?: boolean }) {
  return (
    <meshBasicMaterial
      color={light.outline}
      transparent
      opacity={strength}
      toneMapped={false}
      depthWrite={false}
      side={hull ? BackSide : undefined}
    />
  );
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
  const strength = useHighlight(id);
  const geometry = useMemo(() => {
    const shape = roundedRect(width + thickness * 2, height + thickness * 2, radius + thickness);
    shape.holes.push(roundedRect(width, height, radius));
    return new ShapeGeometry(shape, 6);
  }, [width, height, radius, thickness]);

  if (strength <= 0.01) return null;
  return (
    <mesh geometry={geometry} {...props}>
      <OutlineMaterial strength={strength} />
    </mesh>
  );
}

/**
 * The same outline for a solid shape: wrap a slightly larger copy of the
 * shape's geometry in this and only its rim shows.
 */
export function OutlineHull({ id, children, ...props }: { id: string; children: React.ReactNode; position?: [number, number, number] }) {
  const strength = useHighlight(id);
  if (strength <= 0.01) return null;
  return (
    <mesh {...props}>
      {children}
      <OutlineMaterial strength={strength} hull />
    </mesh>
  );
}

/** Pointer handlers that make an object hoverable and clickable. */
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
