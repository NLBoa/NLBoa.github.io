import {
  Bone,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  type Matrix4,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  type WebGLRenderer,
} from "three";
import { catGeometry, furMaterial, furNoise, hullGeometry, hullMaterial, type FurUniforms } from "./fur";
import { CH, type Pose, type World } from "./pose";
import { BONE_COUNT, BONE_HEAD, BONE_NAMES, BONE_PARENT, FACE, bone, type Vec3 } from "./rig";

const HEAD = bone("head");
const HIPS = bone("hips");
const RIBS = bone("ribs");
const fromHead = (p: Vec3): Vec3 => [p[0] - BONE_HEAD[HEAD][0], p[1] - BONE_HEAD[HEAD][1], p[2] - BONE_HEAD[HEAD][2]];
const deg = (d: number) => (d * Math.PI) / 180;

/** The iris, pupil and catch-light, drawn on a ball. The ball's +z is where the eye looks. */
function eyeMaterial() {
  return new ShaderMaterial({
    uniforms: { uPupil: { value: 0.5 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vDir = normalize( position );
        vNormalW = normalize( mat3( modelMatrix ) * normal );
        vec4 world = modelMatrix * vec4( position, 1.0 );
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uPupil;
      varying vec3 vDir;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vec3 d = normalize( vDir );
        float r = d.z > 0.0 ? length( d.xy ) : 2.0;
        // The pupil: a slit that opens to a full round.
        float wide = mix( 0.14, 0.58, uPupil );
        float tall = mix( 0.6, 0.6, uPupil );
        float pupil = 1.0 - smoothstep( 0.9, 1.06, length( vec2( d.x / wide, d.y / tall ) ) );
        // The iris: gold-green round the pupil, greener toward the rim, with fine rays.
        float angle = atan( d.y, d.x );
        float rays = 0.5 + 0.5 * sin( angle * 37.0 + sin( angle * 9.0 ) * 2.0 );
        vec3 iris = mix( vec3( 0.52, 0.47, 0.15 ), vec3( 0.14, 0.27, 0.15 ), smoothstep( 0.2, 0.74, r ) );
        iris *= 0.88 + 0.16 * rays;
        iris *= 1.0 - 0.8 * smoothstep( 0.7, 0.84, r );
        vec3 color = mix( iris, vec3( 0.006 ), pupil );
        color = mix( color, vec3( 0.02, 0.016, 0.014 ), smoothstep( 0.84, 0.9, r ) );
        // Lit softly from above and in front; never fully dark, so the eyes read at night.
        vec3 N = normalize( vNormalW );
        vec3 V = normalize( cameraPosition - vWorld );
        color *= 0.5 + 0.5 * max( dot( N, normalize( vec3( -0.2, 0.75, 0.6 ) ) ), 0.0 );
        // The upper lid shades the top of the eye, which is most of what makes an eye look soft.
        color *= mix( 1.0, 0.45, smoothstep( 0.05, 0.6, d.y ) );
        // Two catch-lights: the room's lamp, sharp; the warm fill, soft.
        vec3 R = reflect( -V, N );
        color += vec3( 0.9, 0.95, 1.0 ) * pow( max( dot( R, normalize( vec3( -0.3, 0.72, 0.62 ) ) ), 0.0 ), 150.0 ) * 2.4;
        color += vec3( 1.0, 0.78, 0.55 ) * pow( max( dot( R, normalize( vec3( 0.75, 0.3, 0.55 ) ) ), 0.0 ), 50.0 ) * 0.18;
        gl_FragColor = vec4( color, 1.0 );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

type Eye = { ball: Mesh; upper: Mesh; lower: Mesh; material: ShaderMaterial; side: number };

function whiskerPoints(): number[] {
  const points: number[] = [];
  let seed = 7;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const strand = (from: Vec3, toward: Vec3, length: number, droop: number) => {
    const l = Math.hypot(...toward);
    const steps = 7;
    let last: Vec3 | null = null;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p: Vec3 = [
        from[0] + (toward[0] / l) * length * t,
        from[1] + (toward[1] / l) * length * t - droop * t * t,
        from[2] + (toward[2] / l) * length * t - 0.012 * t * t,
      ];
      if (last) points.push(...last, ...p);
      last = p;
    }
  };
  for (const s of [1, -1]) {
    const pad = fromHead([s * FACE.whiskerPad[0], FACE.whiskerPad[1], FACE.whiskerPad[2]]);
    for (let row = 0; row < 4; row++)
      for (let k = 0; k < 3; k++) {
        const from: Vec3 = [pad[0] + s * (0.002 + k * 0.0022), pad[1] + 0.0045 - row * 0.003, pad[2] - k * 0.003 + 0.002];
        const toward: Vec3 = [s, 0.3 - row * 0.17 + (random() - 0.5) * 0.12, 0.28 - k * 0.12 + (random() - 0.5) * 0.1];
        strand(from, toward, 0.04 + 0.018 * random() + k * 0.005, 0.005 + 0.007 * random());
      }
    // Brow whiskers, over each eye.
    for (let k = 0; k < 3; k++) {
      const from = fromHead([s * (0.014 + k * 0.004), 0.2895, 0.24 - k * 0.002]);
      strand(from, [s * (0.25 + k * 0.2), 0.85, 0.5], 0.03 + 0.012 * random(), -0.002);
    }
  }
  return points;
}

/** The mouth: a short line down from the nose that parts and curls up to each side. */
function mouthLines(): number[] {
  const points: number[] = [];
  const nose = fromHead(FACE.nose);
  const z = nose[2] + 0.0052;
  let last: Vec3 = [0, nose[1] - 0.0035, z];
  const down: Vec3 = [0, nose[1] - 0.0095, z - 0.0012];
  points.push(...last, ...down);
  for (const s of [1, -1]) {
    last = down;
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      const p: Vec3 = [s * 0.0115 * t, down[1] - 0.0032 * Math.sin(t * Math.PI * 0.85) + 0.0026 * t * t, down[2] - 0.0085 * t * t];
      points.push(...last, ...p);
      last = p;
    }
  }
  return points;
}

function lineSet(points: number[], color: string, opacity: number): LineSegments {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  const lines = new LineSegments(geometry, new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
  lines.raycast = () => {};
  return lines;
}

/**
 * The cat as three.js objects: a skeleton in its bind pose, the furred skin bound to it, and the
 * few things that are not fur (eyes, lids, whiskers, tongue) hung on the head.
 * It knows nothing about how to move; `show` is handed a finished pose.
 */
export class CatBody {
  readonly group = new Group();
  readonly bones: Bone[] = [];
  readonly fur: FurUniforms;
  private readonly eyes: Eye[] = [];
  private readonly tongue: Mesh;
  private readonly disposables: { dispose(): void }[] = [];

  constructor(file: ArrayBuffer, shells: number) {
    for (let i = 0; i < BONE_COUNT; i++) {
      const b = new Bone();
      b.name = BONE_NAMES[i];
      const parent = BONE_PARENT[i];
      const head = BONE_HEAD[i];
      if (parent < 0) {
        b.position.set(...head);
        this.group.add(b);
      } else {
        const from = BONE_HEAD[parent];
        b.position.set(head[0] - from[0], head[1] - from[1], head[2] - from[2]);
        this.bones[parent].add(b);
      }
      this.bones.push(b);
    }
    this.group.updateMatrixWorld(true);

    const noise = furNoise();
    const { material, uniforms } = furMaterial(noise);
    this.fur = uniforms;
    const geometry = catGeometry(file, shells);
    const skeleton = new Skeleton(this.bones);
    // Soft strand edges put fractional alpha in the picture, and the canvas is see-through to the
    // page behind it (the window's weather). The coat must never thin the canvas, so it leaves
    // the alpha channel alone...
    const maskAlpha = (renderer: WebGLRenderer) => renderer.getContext().colorMask(true, true, true, false);
    const unmask = (renderer: WebGLRenderer) => renderer.getContext().colorMask(true, true, true, true);
    let bindMatrix: Matrix4 | undefined;
    for (const part of [geometry.body, geometry.head]) {
      const mesh = new SkinnedMesh(part, material);
      mesh.bind(skeleton, bindMatrix);
      bindMatrix = mesh.bindMatrix;
      // The skin moves with its bones, so its resting bounds mean nothing; and the pointer is
      // caught by a simple stand-in shape, not by thousands of moving triangles.
      mesh.frustumCulled = false;
      mesh.raycast = () => {};
      mesh.onBeforeRender = maskAlpha;
      mesh.onAfterRender = unmask;
      this.group.add(mesh);
    }

    // ...and this fills alpha in under it, for when the cat is in front of the window.
    const hull = new SkinnedMesh(hullGeometry(geometry.body), hullMaterial(uniforms));
    hull.bind(skeleton, bindMatrix);
    hull.frustumCulled = false;
    hull.raycast = () => {};
    hull.onBeforeRender = (renderer: WebGLRenderer) => renderer.getContext().colorMask(false, false, false, true);
    hull.onAfterRender = unmask;
    this.group.add(hull);
    this.disposables.push(geometry.body, geometry.head, hull.geometry, material, hull.material as { dispose(): void }, noise, skeleton);

    // Eyes: a ball each, with an upper and a lower lid that close over it.
    const head = this.bones[HEAD];
    const R = FACE.eyeRadius;
    const ball = new SphereGeometry(R, 28, 20);
    const upperLid = new SphereGeometry(R * 1.06, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const lowerLid = new SphereGeometry(R * 1.06, 24, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    // The lids are the color of the short fur round the eyes.
    const lid = new MeshStandardMaterial({ color: "#5e5851", roughness: 1 });
    this.disposables.push(ball, upperLid, lowerLid, lid);
    for (const s of [1, -1]) {
      const socket = new Group();
      socket.position.set(...fromHead([s * FACE.eye[0], FACE.eye[1], FACE.eye[2]]));
      // Each eye looks a little outward, with the faintest upward slant at its outer corner.
      socket.rotation.set(deg(-4), s * FACE.eyeYaw, s * deg(-5), "YXZ");
      const eyeMat = eyeMaterial();
      const eye: Eye = { ball: new Mesh(ball, eyeMat), upper: new Mesh(upperLid, lid), lower: new Mesh(lowerLid, lid), material: eyeMat, side: s };
      socket.add(eye.ball, eye.upper, eye.lower);
      for (const part of [eye.ball, eye.upper, eye.lower]) part.raycast = () => {};
      head.add(socket);
      this.eyes.push(eye);
      this.disposables.push(eyeMat);
    }

    for (const lines of [lineSet(whiskerPoints(), "#f1ebdd", 0.34), lineSet(mouthLines(), "#1a1513", 0.8)]) {
      head.add(lines);
      this.disposables.push(lines.geometry, lines.material as LineBasicMaterial);
    }

    // The tongue lives inside the muzzle and slides out to lick.
    const tongueShape = new SphereGeometry(1, 12, 8);
    const tongueMaterial = new MeshStandardMaterial({ color: "#c96a72", roughness: 0.6 });
    this.tongue = new Mesh(tongueShape, tongueMaterial);
    this.tongue.scale.set(0.0052, 0.0022, 0.009);
    this.tongue.raycast = () => {};
    head.add(this.tongue);
    this.disposables.push(tongueShape, tongueMaterial);

    // The nose leather: a small soft triangle at the tip of the muzzle.
    const noseShape = new SphereGeometry(1, 14, 10);
    const noseMaterial = new MeshStandardMaterial({ color: "#7f524c", roughness: 0.6 });
    const nose = new Mesh(noseShape, noseMaterial);
    const tip = fromHead(FACE.nose);
    nose.position.set(tip[0], tip[1] + 0.0012, tip[2] + 0.0036);
    nose.scale.set(0.0068, 0.0046, 0.004);
    nose.rotation.x = deg(18);
    nose.raycast = () => {};
    head.add(nose);
    this.disposables.push(noseShape, noseMaterial);

    this.setFace(1, 0.5, 0, 0, 0.4, 0);
  }

  /**
   * Lids (1 open, 0 shut), pupils (0 slit, 1 round), where the eyes look (radians), how far they
   * turn in from their outward rest so both fix one point (0 to 1), tongue (0 in, 1 out).
   */
  private setFace(open: number, pupil: number, eyeYaw: number, eyePitch: number, converge: number, tongue: number) {
    for (const eye of this.eyes) {
      eye.material.uniforms.uPupil.value = pupil;
      eye.ball.rotation.set(eyePitch + deg(4) * converge, eyeYaw - eye.side * FACE.eyeYaw * converge, 0, "YXZ");
      // Turning a lid about x swings its edge across the front of the eye.
      eye.upper.rotation.x = deg(28 - 64 * open);
      eye.lower.rotation.x = deg(26 + 18 * open);
    }
    const mouth = fromHead(FACE.mouth);
    this.tongue.position.set(mouth[0], mouth[1] + 0.002 - 0.004 * tongue, mouth[2] - 0.011 + 0.014 * tongue);
    this.tongue.rotation.x = deg(20 + 35 * tongue);
  }

  /**
   * Shows a finished pose. `world` is where settle() put the bones (only the hips' height is
   * read from it); `ribs` is the ribcage's swell, 1 at rest; `seconds` drives the purr's shiver.
   */
  show(pose: Pose, world: World, ribs: number, eyeYaw = 0, eyePitch = 0, converge = 0.4, seconds = 0) {
    for (let i = 0; i < BONE_COUNT; i++) this.bones[i].quaternion.set(pose.q[i * 4], pose.q[i * 4 + 1], pose.q[i * 4 + 2], pose.q[i * 4 + 3]);
    const rest = BONE_HEAD[HIPS];
    this.bones[HIPS].position.set(rest[0] + pose.at[0], rest[1] + pose.at[1] + world.lift, rest[2] + pose.at[2]);
    this.bones[RIBS].scale.set(ribs, ribs, 1);
    this.fur.uPurr.value = pose.ch[CH.purr];
    this.fur.uTime.value = seconds;
    this.setFace(pose.ch[CH.eye], pose.ch[CH.pupil], eyeYaw, eyePitch, converge, pose.ch[CH.tongue]);
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}
