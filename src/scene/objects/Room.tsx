"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { woodBox } from "../geometry";
import { DESK, WALL_Z } from "../layout";
import { materials } from "../materials";

/** One tile of the veneer covers this many meters. */
const TILE = 0.7;

function tiling(textures: Texture[]) {
  for (const texture of textures) {
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = 8;
  }
  textures[0].colorSpace = SRGBColorSpace;
}

/** Dark walnut top (Poly Haven "Walnut Veneer", CC0), toned down to the photo. */
export function Desk() {
  const [map, normalMap] = useTexture(["/textures/walnut-diff.webp", "/textures/walnut-normal.webp"], tiling);
  const top = useMemo(() => woodBox(DESK.width, DESK.thickness, DESK.depth, TILE), []);

  return (
    <>
      <mesh geometry={top} position={[0, -DESK.thickness / 2, 0]}>
        <meshStandardMaterial
          map={map}
          normalMap={normalMap}
          color="#948b80"
          roughness={0.82}
        />
      </mesh>
      {/* Legs: part of the desk, kept in the dark. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (DESK.width / 2 - 0.06), -DESK.thickness - 0.36, 0]}
          material={materials.deskLegs}
        >
          <boxGeometry args={[0.04, 0.72, DESK.depth - 0.1]} />
        </mesh>
      ))}
    </>
  );
}

export function Wall() {
  return (
    <mesh position={[0, 0, WALL_Z]} material={materials.wall}>
      <planeGeometry args={[14, 10]} />
    </mesh>
  );
}
