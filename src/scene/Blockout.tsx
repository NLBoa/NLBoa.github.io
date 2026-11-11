"use client";

import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import {
  ARM_BASE,
  DESK,
  KEYBOARD,
  LIGHT_BAR,
  MONITOR,
  MONITORS,
  PEN_CUP,
  STREAM_DECK,
  TRACKPAD,
  WALL_Z,
  streamDeckBodyY,
  type Vec3,
} from "./layout";

/** Phase 0: every object as a gray box at true scale. */

const GRAY = "#9b9b9b";
const DARK = "#555557";

function Box({
  size,
  position,
  color = GRAY,
  onGround = false,
}: {
  size: Vec3;
  position: Vec3;
  color?: string;
  /** Treat `position` as the bottom-center instead of the center. */
  onGround?: boolean;
}) {
  const p: Vec3 = onGround ? [position[0], position[1] + size[1] / 2, position[2]] : position;
  return (
    <mesh position={p}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

/** A square bar running between two points. */
function Segment({ from, to, thickness }: { from: Vec3; to: Vec3; thickness: number }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize()),
      length: dir.length(),
    };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion}>
      <boxGeometry args={[thickness, length, thickness]} />
      <meshStandardMaterial color={GRAY} roughness={0.9} />
    </mesh>
  );
}

function Monitors() {
  const poleTop: Vec3 = [
    ARM_BASE.position[0],
    ARM_BASE.pole.size[1],
    ARM_BASE.position[2],
  ];
  return (
    <>
      <Box size={ARM_BASE.size} position={ARM_BASE.position} onGround />
      <Box size={ARM_BASE.pole.size} position={ARM_BASE.position} onGround />
      {MONITORS.map((m) => (
        <group key={m.id}>
          <group position={m.position} rotation={[0, m.yaw, 0]}>
            <mesh>
              <boxGeometry args={[MONITOR.body.width, MONITOR.body.height, MONITOR.body.depth]} />
              <meshStandardMaterial color={GRAY} roughness={0.9} />
            </mesh>
            {/* The screen rectangle, exactly 27-inch 16:9. */}
            <mesh position={[0, MONITOR.screenOffsetY, MONITOR.body.depth / 2 + 0.0005]}>
              <planeGeometry args={[MONITOR.screen.width, MONITOR.screen.height]} />
              <meshStandardMaterial color={DARK} roughness={0.9} />
            </mesh>
          </group>
          <Segment
            from={poleTop}
            to={[m.position[0], m.position[1], m.position[2] - MONITOR.body.depth]}
            thickness={ARM_BASE.armThickness}
          />
        </group>
      ))}
      <Box size={LIGHT_BAR.bar.size} position={LIGHT_BAR.bar.position} />
      <Box size={LIGHT_BAR.clip.size} position={LIGHT_BAR.clip.position} />
    </>
  );
}

function StreamDeck() {
  const [x, , z] = STREAM_DECK.position;
  const k = STREAM_DECK.key;
  return (
    <group position={[x, 0, z]}>
      <Box size={STREAM_DECK.stand.size} position={[0, 0, 0]} onGround />
      <group position={[0, streamDeckBodyY(), 0]} rotation={[STREAM_DECK.tilt, 0, 0]}>
        <Box size={STREAM_DECK.body} position={[0, 0, 0]} />
        {STREAM_DECK.keys.map((key) => (
          <Box key={key.index} size={[k.size, 0.003, k.size]} position={key.local} color={DARK} />
        ))}
      </group>
    </group>
  );
}

function PenCup() {
  const [x, , z] = PEN_CUP.position;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, PEN_CUP.height / 2, 0]}>
        <cylinderGeometry args={[PEN_CUP.radius, PEN_CUP.radius, PEN_CUP.height, 6]} />
        <meshStandardMaterial color={GRAY} roughness={0.9} flatShading />
      </mesh>
      {PEN_CUP.pens.map((pen, i) => (
        <mesh
          key={i}
          position={[pen.offset[0], 0.03 + pen.length / 2, pen.offset[1]]}
          rotation={[pen.lean[0], 0, pen.lean[1]]}
        >
          <cylinderGeometry args={[PEN_CUP.penRadius, PEN_CUP.penRadius, pen.length, 8]} />
          <meshStandardMaterial color={DARK} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function Blockout() {
  return (
    <>
      {/* Wall */}
      <mesh position={[0, 0, WALL_Z]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#3a3a3c" roughness={1} />
      </mesh>

      {/* Desk top */}
      <Box
        size={[DESK.width, DESK.thickness, DESK.depth]}
        position={[0, -DESK.thickness / 2, 0]}
        color="#707072"
      />

      <Monitors />
      <StreamDeck />
      <PenCup />
      <Box size={KEYBOARD.size} position={KEYBOARD.position} onGround />
      <Box size={TRACKPAD.size} position={TRACKPAD.position} onGround />
    </>
  );
}
