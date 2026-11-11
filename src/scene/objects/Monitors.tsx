"use client";

import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { about } from "@/content/about";
import { portraitFront } from "@/content/portrait-front";
import { featuredProjects, moreProjects, projects } from "@/content/projects";
import { slab } from "../geometry";
import { OutlineFrame, pointerHandlers } from "../Highlight";
import { ARM_BASE, LIGHT_BAR, MONITOR, MONITORS, type MonitorPlacement, type Vec3 } from "../layout";
import { light, materials } from "../materials";
import { useScene } from "../store";
import { profile, projectGrid, type ScreenDrawer } from "../textures/screens";
import { useScreenTexture } from "../textures/useScreenTexture";

// Area lights need their lookup tables registered once.
RectAreaLightUniformsLib.init();

const screens: Record<MonitorPlacement["id"], ScreenDrawer> = {
  "monitor-left": projectGrid(projects, moreProjects),
  "monitor-right": profile(about, portraitFront, featuredProjects),
};

/** How far the mount sits behind the panel's center. */
const MOUNT_DEPTH = 0.045;

function Monitor({ placement, screenLight }: { placement: MonitorPlacement; screenLight: number }) {
  const texture = useScreenTexture(screens[placement.id]);
  // With a page open the screens go dark, so their text never shows through behind the page's own.
  const pageOpen = useScene((s) => s.path !== "/");
  const shell = useMemo(
    () =>
      slab({
        width: MONITOR.body.width,
        length: MONITOR.body.height,
        thickness: MONITOR.body.depth,
        radius: 0.006,
        bevel: 0.002,
        orientation: "upright",
        curveSegments: 4,
      }),
    [],
  );
  const front = MONITOR.body.depth / 2;

  return (
    <group position={placement.position} rotation={[0, placement.yaw, 0]} {...pointerHandlers(placement.id)}>
      <mesh geometry={shell} material={materials.blackSatin} />
      <OutlineFrame
        id={placement.id}
        width={MONITOR.body.width}
        height={MONITOR.body.height}
        radius={0.006}
        thickness={0.0028}
        position={[0, 0, front]}
      />
      {/* Electronics bulge and mount on the back. */}
      <mesh position={[0, 0, -front - 0.012]} material={materials.blackSatin}>
        <boxGeometry args={[0.32, 0.2, 0.024]} />
      </mesh>
      {/* The screen: a plane of exactly 27 inches, 16:9. */}
      <mesh position={[0, MONITOR.screenOffsetY, front + 0.0004]}>
        <planeGeometry args={[MONITOR.screen.width, MONITOR.screen.height]} />
        <meshBasicMaterial map={texture} color={pageOpen ? "#0c0c0c" : "#ffffff"} toneMapped={false} />
      </mesh>
      {/* Cool light the screen throws on the desk. */}
      <rectAreaLight
        position={[0, MONITOR.screenOffsetY, front + 0.01]}
        rotation={[0, Math.PI, 0]}
        width={MONITOR.screen.width}
        height={MONITOR.screen.height}
        color={light.screen}
        intensity={screenLight}
      />
    </group>
  );
}

/** A round bar between two points, with a ball joint at each end. */
function Arm({ from, to, radius }: { from: Vec3; to: Vec3; radius: number }) {
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
    <>
      <mesh position={position} quaternion={quaternion} material={materials.blackSatin}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
      </mesh>
      <mesh position={to} material={materials.blackSatin}>
        <sphereGeometry args={[radius * 1.25, 12, 8]} />
      </mesh>
    </>
  );
}

function ArmsAndBase() {
  const [x, , z] = ARM_BASE.position;
  const { radius, height } = ARM_BASE.pole;
  const base = useMemo(
    () =>
      slab({
        width: ARM_BASE.size[0],
        thickness: ARM_BASE.size[1],
        length: ARM_BASE.size[2],
        radius: 0.012,
        bevel: 0.002,
        orientation: "flat",
      }),
    [],
  );
  const poleTop: Vec3 = [x, height, z];

  return (
    <>
      <mesh geometry={base} position={[x, 0, z]} material={materials.blackSatin} />
      <mesh position={[x, height / 2, z]} material={materials.blackSatin}>
        <cylinderGeometry args={[radius, radius, height, 16]} />
      </mesh>
      <mesh position={poleTop} material={materials.blackSatin}>
        <sphereGeometry args={[radius * 1.15, 12, 8]} />
      </mesh>
      {MONITORS.map((m) => {
        const mount: Vec3 = [
          m.position[0] - Math.sin(m.yaw) * MOUNT_DEPTH,
          m.position[1],
          m.position[2] - Math.cos(m.yaw) * MOUNT_DEPTH,
        ];
        return <Arm key={m.id} from={poleTop} to={mount} radius={ARM_BASE.armRadius} />;
      })}
    </>
  );
}

function LightBar() {
  const { bar, clip } = LIGHT_BAR;
  return (
    <>
      <mesh position={bar.position} rotation={[0, 0, Math.PI / 2]} material={materials.blackSatin}>
        <cylinderGeometry args={[bar.size[1] / 2, bar.size[1] / 2, bar.size[0], 16]} />
      </mesh>
      <mesh position={clip.position} material={materials.blackSatin}>
        <boxGeometry args={clip.size} />
      </mesh>
      {/* The lit strip on the underside. */}
      <mesh position={[bar.position[0], bar.position[1] - bar.size[1] / 2 + 0.001, bar.position[2] + 0.002]}>
        <boxGeometry args={[bar.size[0] - 0.03, 0.002, 0.008]} />
        <meshBasicMaterial color={light.bar} toneMapped={false} />
      </mesh>
    </>
  );
}

export function Monitors({ screenLight }: { screenLight: number }) {
  return (
    <>
      <ArmsAndBase />
      {MONITORS.map((m) => (
        <Monitor key={m.id} placement={m} screenLight={screenLight} />
      ))}
      <LightBar />
    </>
  );
}
