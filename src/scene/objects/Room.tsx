"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { PlaneGeometry, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { asset } from "@/lib/paths";
import { woodBox } from "../geometry";
import { CURTAIN, DESK, FLOOR_Y, WALL_Z, WINDOW } from "../layout";
import { light, materials } from "../materials";

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
  const [map, normalMap] = useTexture([asset("/textures/walnut-diff.webp"), asset("/textures/walnut-normal.webp")], tiling);
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

const FAR = 7;

/** A flat panel of wall between two x and two y, facing the room. */
function WallPanel({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, WALL_Z]} material={materials.wall}>
      <planeGeometry args={[x1 - x0, y1 - y0]} />
    </mesh>
  );
}

/** A curtain: one sheet, folded into pleats. */
function Curtain() {
  const geometry = useMemo(() => {
    const width = CURTAIN.right - CURTAIN.left;
    const sheet = new PlaneGeometry(width, CURTAIN.top - FLOOR_Y, CURTAIN.folds * 8, 1);
    const position = sheet.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const along = (position.getX(i) / width + 0.5) * CURTAIN.folds * Math.PI * 2;
      position.setZ(i, Math.sin(along) * CURTAIN.depth);
    }
    sheet.computeVertexNormals();
    return sheet;
  }, []);

  const x = (CURTAIN.left + CURTAIN.right) / 2;
  const z = WALL_Z + WINDOW.depth + CURTAIN.depth + 0.004;
  return (
    <>
      <mesh geometry={geometry} position={[x, (CURTAIN.top + FLOOR_Y) / 2, z]} material={materials.curtain} />
      {/* A weighted hem, so the curtain ends in a straight edge at the floor. */}
      <mesh position={[x, FLOOR_Y + 0.04, z + CURTAIN.depth]} material={materials.curtain}>
        <boxGeometry args={[CURTAIN.right - CURTAIN.left, 0.08, 0.006]} />
      </mesh>
    </>
  );
}

/**
 * The room behind the desk: a back wall with a window in it, the window's
 * trim, sill and frame, a curtain drawn back beside it, and the floor.
 *
 * Nothing is drawn where the glass is. The canvas is transparent there, and
 * the rain behind it (Rain.tsx) is an ordinary page layer. So the weather
 * moves without the 3D scene drawing a single frame.
 */
export function Room() {
  const { left, right, bottom, top, bar, depth, sill, trim } = WINDOW;
  const width = right - left;
  const height = top - bottom;
  const middleX = (left + right) / 2;
  const middleY = (top + bottom) / 2;
  const frameZ = WALL_Z + depth / 2;
  const trimZ = WALL_Z + 0.006;

  return (
    <>
      {/* The wall, in four panels around the opening. */}
      <WallPanel x0={-FAR} x1={left} y0={FLOOR_Y} y1={FAR} />
      <WallPanel x0={right} x1={FAR} y0={FLOOR_Y} y1={FAR} />
      <WallPanel x0={left} x1={right} y0={top} y1={FAR} />
      <WallPanel x0={left} x1={right} y0={FLOOR_Y} y1={bottom} />

      {/* Painted trim around the opening: the two sides and the head. */}
      {[left - trim / 2, right + trim / 2].map((x) => (
        <mesh key={x} position={[x, middleY + trim / 2, trimZ]} material={materials.trim}>
          <boxGeometry args={[trim, height + trim, 0.012]} />
        </mesh>
      ))}
      <mesh position={[middleX, top + trim / 2, trimZ]} material={materials.trim}>
        <boxGeometry args={[width, trim, 0.012]} />
      </mesh>

      {/* The sill: a board that juts out under the window. It reaches past the
          trim on the left and stops at the curtain on the right. */}
      <mesh position={[middleX - (trim + sill.overhang) / 2, bottom - sill.thickness / 2, WALL_Z + sill.depth / 2]} material={materials.trim}>
        <boxGeometry args={[width + trim + sill.overhang, sill.thickness, sill.depth]} />
      </mesh>

      {/* The frame: its four sides, then the bars between the panes. */}
      {[left + bar / 2, right - bar / 2, ...WINDOW.uprights].map((x) => (
        <mesh key={x} position={[x, middleY, frameZ]} material={materials.windowFrame}>
          <boxGeometry args={[bar, height, depth]} />
        </mesh>
      ))}
      {[top - bar / 2, bottom + bar / 2, ...WINDOW.rails].map((y) => (
        <mesh key={y} position={[middleX, y, frameZ]} material={materials.windowFrame}>
          <boxGeometry args={[width, bar, depth]} />
        </mesh>
      ))}

      {/* The glass: a faint cool sheen over the weather outside. */}
      <mesh position={[middleX, middleY, WALL_Z - 0.005]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#9db4dc" transparent opacity={0.045} depthWrite={false} toneMapped={false} />
      </mesh>

      <Curtain />

      {/* Skirting board along the foot of the wall. */}
      <mesh position={[0, FLOOR_Y + 0.045, WALL_Z + 0.008]} material={materials.windowFrame}>
        <boxGeometry args={[FAR * 2, 0.09, 0.016]} />
      </mesh>

      <mesh position={[0, FLOOR_Y, WALL_Z + FAR / 2]} rotation={[-Math.PI / 2, 0, 0]} material={materials.floor}>
        <planeGeometry args={[FAR * 2, FAR]} />
      </mesh>

      {/* Night light from the window, on the desk's left side. */}
      <pointLight position={[-0.5, 0.75, WALL_Z + 0.32]} color={light.window} intensity={0.4} decay={2} />
    </>
  );
}
