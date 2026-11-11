"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { PEN_CUP } from "../layout";
import { materials } from "../materials";

/** A hexagonal paper cup in flat cream, holding a few pens. */
export function PenCup() {
  const [x, , z] = PEN_CUP.position;
  const paper = useMemo(() => {
    const material = materials.cream.clone();
    material.side = DoubleSide;
    material.flatShading = true;
    return material;
  }, []);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, PEN_CUP.height / 2, 0]} material={paper}>
        <cylinderGeometry args={[PEN_CUP.radius, PEN_CUP.radius, PEN_CUP.height, 6, 1, true]} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} material={paper}>
        {/* Starts a quarter turn round so its corners meet the walls'. */}
        <circleGeometry args={[PEN_CUP.radius, 6, Math.PI / 2]} />
      </mesh>
      {PEN_CUP.pens.map((pen, i) => (
        <mesh
          key={i}
          position={[pen.offset[0], 0.03 + pen.length / 2, pen.offset[1]]}
          rotation={[pen.lean[0], 0, pen.lean[1]]}
          material={materials.pens[i % materials.pens.length]}
        >
          <cylinderGeometry args={[PEN_CUP.penRadius * 0.7, PEN_CUP.penRadius, pen.length, 8]} />
        </mesh>
      ))}
    </group>
  );
}
