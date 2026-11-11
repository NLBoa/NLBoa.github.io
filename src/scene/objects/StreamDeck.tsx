"use client";

import { useMemo } from "react";
import { slab } from "../geometry";
import { STREAM_DECK, streamDeckBodyY } from "../layout";
import { materials } from "../materials";

/** Body, stand and 15 separate key meshes (each gets its own texture in Phase 2). */
export function StreamDeck() {
  const [x, , z] = STREAM_DECK.position;
  const [width, thickness, length] = STREAM_DECK.body;
  const k = STREAM_DECK.key;

  const geometry = useMemo(
    () => ({
      body: slab({ width, thickness, length, radius: 0.009, bevel: 0.003, orientation: "flat" }),
      key: slab({ width: k.size, thickness: 0.0024, length: k.size, radius: 0.003, bevel: 0.0008, orientation: "flat", curveSegments: 3 }),
      stand: slab({
        width: STREAM_DECK.stand.size[0],
        thickness: STREAM_DECK.stand.size[1],
        length: STREAM_DECK.stand.size[2],
        radius: 0.008,
        bevel: 0.002,
        orientation: "flat",
      }),
    }),
    [width, thickness, length, k.size],
  );

  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geometry.stand} material={materials.blackMatte} />
      {/* The prop behind the body. */}
      <mesh position={[0, 0.03, -0.024]} material={materials.blackMatte}>
        <boxGeometry args={[0.085, 0.05, 0.018]} />
      </mesh>
      <group position={[0, streamDeckBodyY(), 0]} rotation={[STREAM_DECK.tilt, 0, 0]}>
        <mesh geometry={geometry.body} position={[0, -thickness / 2, 0]} material={materials.blackMatte} />
        {STREAM_DECK.keys.map((key) => (
          <mesh
            key={key.index}
            geometry={geometry.key}
            position={[key.local[0], key.local[1] - 0.0006, key.local[2]]}
            material={materials.keyDark}
          />
        ))}
      </group>
    </group>
  );
}
