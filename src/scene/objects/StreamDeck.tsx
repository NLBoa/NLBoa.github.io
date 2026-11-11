"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, SRGBColorSpace, type BufferGeometry } from "three";
import type { DeckKey } from "@/lib/deck";
import { slab } from "../geometry";
import { OutlineFrame, pointerHandlers, useHighlight } from "../Highlight";
import { DECK } from "../interactive";
import { STREAM_DECK, streamDeckBodyY, type Vec3 } from "../layout";
import { materials } from "../materials";
import { useScene } from "../store";
import { KEY_ICON_SIZE, drawKeyIcon } from "../textures/keyIcons";

/** How far a key travels when pressed. */
const PRESS = 0.0014;

/** A key's face: its icon drawn to a canvas of its own. */
class KeyFace {
  readonly canvas = document.createElement("canvas");
  readonly texture: CanvasTexture;

  constructor(private icon: DeckKey["icon"]) {
    this.canvas.width = this.canvas.height = KEY_ICON_SIZE;
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.anisotropy = 4;
  }

  paint() {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim();
    drawKeyIcon(ctx, this.icon, mono ? `${mono}, monospace` : "monospace");
    this.texture.needsUpdate = true;
  }
}

function LitKey({ index, deckKey, local, geometry }: { index: number; deckKey: DeckKey; local: Vec3; geometry: BufferGeometry }) {
  const id = `key-${index}`;
  const [face] = useState(() => new KeyFace(deckKey.icon));
  const invalidate = useThree((s) => s.invalidate);
  const pressed = useScene((s) => s.pressed === id);
  const lit = useHighlight(id) > 0.5;
  const size = STREAM_DECK.key.size;

  useEffect(() => {
    const paint = () => {
      face.paint();
      invalidate();
    };
    paint();
    // Letter keys use the site's monospace face; redraw once it has loaded.
    document.fonts.ready.then(paint, () => {});
    return () => face.texture.dispose();
  }, [face, invalidate]);

  return (
    <group position={[local[0], local[1] - 0.0006 - (pressed ? PRESS : 0), local[2]]} {...pointerHandlers(id)}>
      <mesh geometry={geometry} material={materials.keyDark} />
      <OutlineFrame
        id={id}
        width={size}
        height={size}
        radius={0.003}
        thickness={0.0013}
        position={[0, 0.0027, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh position={[0, 0.0026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 0.9, size * 0.9]} />
        <meshBasicMaterial map={face.texture} color={lit ? "#ffffff" : "#aeb9cc"} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Body, stand and 15 separate key meshes. Keys come from the content files
 * (see src/lib/deck.ts); each lit key has its own texture, hover state and
 * press animation, and unused keys stay dark.
 */
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
        {STREAM_DECK.keys.map((key) => {
          const deckKey = DECK[key.index];
          return deckKey ? (
            <LitKey key={key.index} index={key.index} deckKey={deckKey} local={key.local} geometry={geometry.key} />
          ) : (
            <mesh
              key={key.index}
              geometry={geometry.key}
              position={[key.local[0], key.local[1] - 0.0006, key.local[2]]}
              material={materials.keyDark}
            />
          );
        })}
      </group>
    </group>
  );
}
