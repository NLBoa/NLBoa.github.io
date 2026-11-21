"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Raycaster, ShaderMaterial, Vector2, Vector3, type Mesh } from "three";
import { asset } from "@/lib/paths";
import { inspect } from "../CameraRig";
import { CatBody } from "../cat/body";
import { CatBrain, ONLY_BREATHING } from "../cat/brain";
import type { V3 } from "../cat/math";
import { CatMotion, EMOTES, type EmoteName } from "../cat/motion";
import { buildPose, layTail, makeWorld, settle, type PoseSpec } from "../cat/pose";
import { bone } from "../cat/rig";
import { SPECS, type StanceName } from "../cat/stances";
import { CAT } from "../layout";
import { useScene } from "../store";

const MODEL_URL = asset("/models/cat.bin");

declare global {
  interface Window {
    /** For looking closely at the cat while building it, and for the check scripts (never in a normal build). */
    __cat?: {
      /** Puts the camera somewhere else: position, target, field of view. No arguments lets go. */
      look: (position?: [number, number, number], target?: [number, number, number], fov?: number) => void;
      /** Holds a pose: one of the stances by name, or a description to try out. */
      pose: (spec: PoseSpec | StanceName) => void;
      /** Holds one moment of an emote. */
      preview: (name: EmoteName, t: number, stance?: StanceName) => void;
      /** Starts an emote, as a click or the cat itself would. */
      play: (name: EmoteName) => void;
      /** Lets the cat go on living after pose() or preview(). */
      release: () => void;
      /** What it is doing now. */
      readonly doing: string;
      /** Where the middle of the cat is on screen, in CSS pixels. */
      locate: () => { x: number; y: number };
      readonly emotes: readonly string[];
    };
    /** Set before the page loads to keep the cat still (the checks that count idle frames). */
    __catHold?: boolean;
  }
}

const STATS = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SCENE_STATS === "1";

/** How many layers the coat is drawn in: more is softer, and costs more. */
const SHELLS = { desktop: 22, phone: 13 };

/** While it only breathes, the cat waits this long (milliseconds) before asking for its next frame: about 30 a second, not 60 or 120. */
const CALM_FRAME_MS = 16;

/** Soft dark patches under the cat: the desk's own shadows are baked once and do not move. */
const SHADOWS: { bone: number; radius: number; strength: number }[] = [
  { bone: bone("hips"), radius: 0.17, strength: 0.62 },
  { bone: bone("chest"), radius: 0.16, strength: 0.58 },
  { bone: bone("head"), radius: 0.1, strength: 0.34 },
];

function shadowMaterial(strength: number) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uStrength: { value: strength } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
    fragmentShader: /* glsl */ `uniform float uStrength; varying vec2 vUv;
      void main() { float r = length( vUv - 0.5 ) * 2.0; float a = smoothstep( 1.0, 0.0, r ); gl_FragColor = vec4( 0.0, 0.0, 0.0, a * a * uStrength ); }`,
  });
}

/**
 * It lives only while the desk itself is on show, and not under reduced motion. Read from the
 * store when needed, never subscribed to: opening a page must cost this component nothing, in
 * the very frame the page mounts.
 */
function alive(): boolean {
  const scene = useScene.getState();
  return scene.path === "/" && !scene.reducedMotion;
}

const COS = Math.cos(CAT.yaw);
const SIN = Math.sin(CAT.yaw);

/** A point in the room, in the space of a cat that sits at `place`. */
function toCat(place: readonly number[], x: number, y: number, z: number, out: V3) {
  const dx = x - place[0];
  const dz = z - place[2];
  out[0] = dx * COS - dz * SIN;
  out[1] = y - place[1];
  out[2] = dx * SIN + dz * COS;
}

/**
 * The cat on the desk. It is decoration: it opens nothing, has no label and takes no part in the
 * Tab order. For now it only lies in the loaf, breathes and watches the pointer (see ONLY_BREATHING in cat/brain.ts);
 * everything else it can do is still here. It moves only while the desk itself is on show.
 */
export default function Cat() {
  const [body, setBody] = useState<CatBody | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const get = useThree((s) => s.get);
  const phone = useThree((s) => s.size.width <= 640);
  const place = phone ? CAT.phonePosition : CAT.position;

  const motion = useMemo(() => new CatMotion("loaf", Math.random, ONLY_BREATHING), []);
  const brain = useMemo(() => new CatBrain(), []);
  const shadows = useRef<(Mesh | null)[]>([]);
  const shadowMaterials = useMemo(() => SHADOWS.map((s) => shadowMaterial(s.strength)), []);
  const state = useRef({
    last: 0,
    seconds: 0,
    pointer: new Vector2(),
    seen: false,
    movedAt: -1e9,
    ray: new Raycaster(),
    look: [0, 0.3, 1] as V3,
    camera: [0, 0.6, 1.5] as V3,
    timer: null as ReturnType<typeof setTimeout> | null,
    /** Set by the lab: the cat holds whatever pose it was given. */
    frozen: false,
  });

  useEffect(() => {
    let cancelled = false;
    let made: CatBody | null = null;
    fetch(MODEL_URL)
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(`cat model: ${response.status}`))))
      .then((file) => {
        if (cancelled) return;
        made = new CatBody(file, phone ? SHELLS.phone : SHELLS.desktop);
        setBody(made);
      })
      // No cat is not worth breaking the desk over.
      .catch(() => {});
    return () => {
      cancelled = true;
      made?.dispose();
    };
  }, [phone]);

  useEffect(() => () => shadowMaterials.forEach((m) => m.dispose()), [shadowMaterials]);

  // The pointer: something to watch.
  useEffect(() => {
    const s = state.current;
    const onMove = (event: PointerEvent) => {
      if (!alive()) return;
      s.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      s.seen = true;
      s.movedAt = performance.now();
      const emote = brain.moved(s.seconds, motion.resting);
      if (emote) motion.play(emote);
      get().invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, [brain, motion, get]);

  // The first picture.
  useEffect(() => {
    if (!body) return;
    body.show(motion.pose, motion.world, motion.ribs, motion.eyeYaw, motion.eyePitch, motion.converge);
    state.current.last = 0;
    invalidate();
    const s = state.current;
    return () => {
      if (s.timer) clearTimeout(s.timer);
      s.timer = null;
    };
  }, [body, motion, invalidate]);

  useEffect(() => {
    if (!body || !STATS) return;
    const world = makeWorld();
    const s = state.current;
    window.__cat = {
      pose: (spec) => {
        const pose = buildPose(typeof spec === "string" ? SPECS[spec] : spec);
        settle(pose, world);
        layTail(pose, world);
        s.frozen = true;
        body.show(pose, world, 1);
        invalidate();
      },
      preview: (name, t, stance) => {
        s.frozen = true;
        motion.preview(name, t, stance);
        body.show(motion.pose, motion.world, 1);
        invalidate();
      },
      play: (name) => {
        s.frozen = false;
        motion.play(name);
        invalidate();
      },
      release: () => {
        s.frozen = false;
        invalidate();
      },
      look: (position, target, fov = 30) => {
        inspect.pose = position && target ? { position, target, fov, shiftX: 0, shiftY: 0 } : null;
        invalidate();
      },
      get doing() {
        return motion.doing;
      },
      locate: () => {
        const { camera, size } = get();
        const p = new Vector3(place[0], place[1] + 0.1, place[2]).project(camera);
        return { x: (p.x * 0.5 + 0.5) * size.width, y: (-p.y * 0.5 + 0.5) * size.height };
      },
      emotes: EMOTES,
    };
    return () => {
      delete window.__cat;
      inspect.pose = null;
    };
  }, [body, motion, invalidate, get, place]);

  useFrame((three) => {
    const s = state.current;
    if (!body) return;
    // Shadows follow whatever pose is showing, living or held.
    for (let i = 0; i < SHADOWS.length; i++) {
      const mesh = shadows.current[i];
      if (mesh) mesh.position.set(motion.world.p[SHADOWS[i].bone * 3], 0.0016 + i * 0.0002, motion.world.p[SHADOWS[i].bone * 3 + 2]);
    }
    if (!alive() || s.frozen || document.hidden || (STATS && window.__catHold)) {
      s.last = 0;
      return;
    }
    const now = performance.now();
    // After a pause (a page was open, the tab was hidden) time picks up where it left off.
    const dt = s.last ? Math.min((now - s.last) / 1000, 0.05) : 1 / 60;
    s.last = now;
    s.seconds += dt;

    // The viewer's eye and the pointer, in the cat's own space.
    const eye = three.camera.position;
    toCat(place, eye.x, eye.y, eye.z, s.camera);
    let attention = 0;
    if (s.seen) {
      // Where the pointer is, at the cat's own distance, brought a little toward the viewer.
      s.ray.setFromCamera(s.pointer, three.camera);
      const { origin, direction } = s.ray.ray;
      const reach = (place[0] - origin.x) * direction.x + (place[1] + 0.2 - origin.y) * direction.y + (place[2] - origin.z) * direction.z - 0.22;
      toCat(place, origin.x + direction.x * reach, origin.y + direction.y * reach, origin.z + direction.z * reach, s.look);
      // Interest in a pointer that has stopped fades after a couple of seconds.
      const still = (now - s.movedAt) / 1000;
      attention = 0.9 * (1 - Math.min(1, Math.max(0, (still - 2) / 2.5)));
    }

    const emote = brain.think(s.seconds, motion.resting, motion.stance, motion.doing);
    if (emote) motion.play(emote);
    if (brain.stroked(s.seconds)) motion.sustain();

    const busy = motion.update(dt, { pointer: s.seen ? s.look : null, attention, camera: s.camera });
    body.show(motion.pose, motion.world, motion.ribs, motion.eyeYaw, motion.eyePitch, motion.converge, s.seconds);

    // Something is moving: draw the next frame. Only breathing: a gentler pace will do.
    if (busy || attention > 0.02) three.invalidate();
    else if (!s.timer)
      s.timer = setTimeout(() => {
        s.timer = null;
        invalidate();
      }, CALM_FRAME_MS);
  });

  // The cat is in front: whatever is behind it is not being pointed at.
  const onOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!alive()) return;
      event.stopPropagation();
      brain.over(state.current.seconds, true);
      invalidate();
    },
    [brain, invalidate],
  );
  const onOut = useCallback(
    () => {
      brain.over(state.current.seconds, false);
      invalidate();
    },
    [brain, invalidate],
  );
  const onClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!alive()) return;
      event.stopPropagation();
      const trick = brain.poke();
      if (trick) motion.play(trick);
      invalidate();
    },
    [brain, motion, invalidate],
  );

  if (!body) return null;

  return (
    <group position={place} rotation={[0, CAT.yaw, 0]}>
      <primitive object={body.group} />
      {SHADOWS.map((shadow, i) => (
        <mesh
          key={i}
          ref={(mesh) => void (shadows.current[i] = mesh)}
          rotation={[-Math.PI / 2, 0, 0]}
          material={shadowMaterials[i]}
          renderOrder={2}
          raycast={() => null}
        >
          <circleGeometry args={[shadow.radius, 24]} />
        </mesh>
      ))}
      {/* What the pointer touches: a plain rounded shape about the size of the cat, never drawn. */}
      {
        <mesh
          position={[0, 0.11, 0.03]}
          scale={[0.14, 0.13, 0.25]}
          visible={false}
          onPointerOver={onOver}
          onPointerOut={onOut}
          onClick={onClick}
        >
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      }
    </group>
  );
}
