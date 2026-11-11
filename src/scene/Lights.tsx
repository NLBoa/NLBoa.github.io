"use client";

import { useState } from "react";
import { Object3D } from "three";
import { LIGHT_BAR } from "./layout";
import { light } from "./materials";

/**
 * Night: the two screens (their area lights live with the monitors), the
 * light bar washing the desk, a soft warm fill from the right, and just
 * enough ambient that shadows are not pure black.
 */
export default function Lights() {
  const [target] = useState(() => new Object3D());
  const bar = LIGHT_BAR.bar.position;

  return (
    <>
      <hemisphereLight args={[light.skyTint, light.groundTint, 5]} />

      {/* Light bar: down and toward the viewer, across the desk. */}
      <primitive object={target} position={[bar[0] + 0.25, 0, 0.08]} />
      <spotLight
        position={[bar[0], bar[1] - 0.01, bar[2] + 0.01]}
        target={target}
        color={light.bar}
        intensity={0.8}
        angle={1.35}
        penumbra={1}
        decay={1}
      />

      {/* The room itself: a faint warm bounce from above so the desk reads evenly. */}
      <directionalLight position={[0.4, 2, 1.2]} color={light.room} intensity={0.55} />

      {/* Warm fill from the right. */}
      <pointLight position={[1.3, 0.55, 0.45]} color={light.fill} intensity={1.6} decay={2} />
    </>
  );
}
