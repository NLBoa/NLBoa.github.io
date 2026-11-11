import { FRAME_POINTS, type Vec3 } from "./layout";

export type CameraPose = {
  position: Vec3;
  target: Vec3;
  fov: number; // vertical, degrees
  /** Fraction of the viewport height to slide the picture up by. */
  shiftY?: number;
};

type FitInput = {
  target: Vec3;
  /** Degrees the camera looks down from horizontal. */
  pitch: number;
  fov: number;
  aspect: number;
  points: Vec3[];
  /** Fraction of the frame the points may fill (1 = touching the edges). */
  fill?: number;
};

const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Places a camera in front of the desk (no yaw) looking at `target` from
 * `pitch` degrees above, at the smallest distance that keeps every point in
 * frame.
 */
export function fitCamera({ target, pitch, fov, aspect, points, fill = 0.9 }: FitInput): CameraPose {
  const p = rad(pitch);
  const forward: Vec3 = [0, -Math.sin(p), -Math.cos(p)];
  const up: Vec3 = [0, Math.cos(p), -Math.sin(p)];
  const tanV = Math.tan(rad(fov) / 2) * fill;
  const tanH = Math.tan(rad(fov) / 2) * aspect * fill;

  let distance = 0;
  for (const point of points) {
    const r: Vec3 = [point[0] - target[0], point[1] - target[1], point[2] - target[2]];
    const x = r[0];
    const y = r[1] * up[1] + r[2] * up[2];
    const z = r[1] * forward[1] + r[2] * forward[2];
    distance = Math.max(distance, Math.abs(x) / tanH - z, Math.abs(y) / tanV - z);
  }

  return {
    position: [
      target[0] - forward[0] * distance,
      target[1] - forward[1] * distance,
      target[2] - forward[2] * distance,
    ],
    target,
    fov,
  };
}

/** The idle "home" view for a given viewport aspect ratio. */
export function homePose(aspect: number): CameraPose {
  if (aspect < 1) {
    // Phones in portrait: closer on the monitors and Stream Deck. Width is
    // the limit, so the desk sits in the upper part of the screen and the
    // space below is left for page content.
    return {
      ...fitCamera({
        target: [0, 0.3, -0.2],
        pitch: 22,
        fov: 45,
        aspect,
        points: FRAME_POINTS.monitors,
        fill: 0.96,
      }),
      shiftY: 0.16,
    };
  }
  return fitCamera({
    target: [0, 0.2, -0.02],
    pitch: 30,
    fov: 35,
    aspect,
    points: FRAME_POINTS.desk,
  });
}
