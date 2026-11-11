"use client";

import { useGLTF } from "@react-three/drei";
import { Component, useMemo, type ReactNode } from "react";
import type { Mesh, MeshStandardMaterial } from "three";
import { asset } from "@/lib/paths";
import { slab } from "../geometry";
import { KEYBOARD, TRACKPAD } from "../layout";
import { materials } from "../materials";

const KEYS_URL = asset("/models/keyboard-keys.glb");

/**
 * Keycaps with their legends: "Apple Magic Keyboard" by infohack (CC BY),
 * cropped to the compact layout by scripts/optimize-models.mjs.
 */
function Keycaps() {
  // No Draco (it would fetch a decoder from a CDN); meshopt is bundled.
  const { scene, materials: loaded } = useGLTF(KEYS_URL, false, true);
  const keys = useMemo(() => {
    // The legends are baked into a near-white photo texture; pulled down a
    // little so the keys keep their detail under the light bar.
    const material = (loaded.KeyboardKeys as MeshStandardMaterial).clone();
    material.color.set("#c4c4c2");
    material.roughness = 0.6;
    material.metalness = 0;
    // Meshopt stores quantized positions; the node transform restores meters.
    scene.updateMatrixWorld(true);
    const mesh = scene.getObjectByProperty("isMesh", true) as Mesh;
    return { material, geometry: mesh.geometry, matrix: mesh.matrixWorld.clone() };
  }, [scene, loaded]);
  return <mesh geometry={keys.geometry} material={keys.material} matrix={keys.matrix} matrixAutoUpdate={false} />;
}

/** If the model file is missing the body alone stands in, at the right size. */
class Optional extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Magic Keyboard, white, compact. Decoration: it never reacts to the pointer. */
export function Keyboard() {
  const [width, , length] = KEYBOARD.size;
  const body = useMemo(
    () => slab({ width, thickness: KEYBOARD.bodyHeight, length, radius: 0.011, bevel: 0.001, orientation: "flat" }),
    [width, length],
  );
  return (
    <group position={KEYBOARD.position}>
      <mesh geometry={body} material={materials.aluminum} />
      <Optional>
        <Keycaps />
      </Optional>
    </group>
  );
}

/** Magic Trackpad, white. Decoration. */
export function Trackpad() {
  const [width, thickness, length] = TRACKPAD.size;
  const plate = useMemo(
    () => slab({ width, thickness, length, radius: 0.012, bevel: 0.0012, orientation: "flat" }),
    [width, thickness, length],
  );
  return <mesh geometry={plate} position={TRACKPAD.position} material={materials.white} />;
}

useGLTF.preload(KEYS_URL, false, true);
