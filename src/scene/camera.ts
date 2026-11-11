import type { Band } from "./band";
import type { View } from "./interactive";
import { FRAME_POINTS, MONITORS, PEN_CUP, STREAM_DECK, WALL_Z, WINDOW, monitorCorners, type Vec3 } from "./layout";

export type CameraPose = {
  position: Vec3;
  target: Vec3;
  fov: number; // vertical, degrees
  /** Fraction of the viewport height to slide the picture up by. */
  shiftY?: number;
  /** Fraction of the viewport width to slide the picture right by. */
  shiftX?: number;
};

/** The window a pose is for: its size in pixels and the band beside the page, if any. */
export type Viewport = { width: number; height: number; band: Band | null };

type FitInput = {
  target: Vec3;
  /** Degrees the camera looks down from horizontal. */
  pitch: number;
  /** Degrees the camera stands round to the right of straight-on. */
  yaw?: number;
  fov: number;
  aspect: number;
  points: Vec3[];
  /** Fraction of the frame the points may fill (1 = touching the edges). */
  fill?: number;
};

const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Places a camera looking at `target` from `pitch` degrees above and `yaw`
 * degrees round, at the smallest distance that keeps every point in frame.
 */
export function fitCamera({ target, pitch, yaw = 0, fov, aspect, points, fill = 0.9 }: FitInput): CameraPose {
  const p = rad(pitch);
  const y = rad(yaw);
  const forward: Vec3 = [-Math.sin(y) * Math.cos(p), -Math.sin(p), -Math.cos(y) * Math.cos(p)];
  const right: Vec3 = [Math.cos(y), 0, -Math.sin(y)];
  const up: Vec3 = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];
  const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const tanV = Math.tan(rad(fov) / 2) * fill;
  const tanH = Math.tan(rad(fov) / 2) * aspect * fill;

  let distance = 0;
  for (const point of points) {
    const r: Vec3 = [point[0] - target[0], point[1] - target[1], point[2] - target[2]];
    const z = dot(r, forward);
    distance = Math.max(distance, Math.abs(dot(r, right)) / tanH - z, Math.abs(dot(r, up)) / tanV - z);
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

const center = (points: Vec3[]): Vec3 => {
  const sum = points.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]);
  return [sum[0] / points.length, sum[1] / points.length, sum[2] / points.length];
};

const deg = (r: number) => (r * 180) / Math.PI;

/**
 * The room beside an open project page. The picture is a tall slice that runs
 * from the desk top to above the window's head, and it starts at the wall just
 * left of the window: a narrow band shows one pane and the edge of the left
 * monitor, a wider one shows the whole window, then the curtain and the desk.
 */
const STORY = {
  left: WINDOW.left - WINDOW.trim - 0.12,
  top: WINDOW.top + WINDOW.trim + 0.07,
  /** The lowest point kept in frame: the desk top, part-way to its front edge. */
  foot: [0, 0, 0.05] as Vec3,
  pitch: 7,
  fov: 30,
};

function storyPose({ width, height, band }: Viewport & { band: Band }): CameraPose {
  const aspect = band.width / height;
  const fit = fitCamera({
    target: [0, STORY.top / 2, WALL_Z],
    pitch: STORY.pitch,
    fov: STORY.fov,
    aspect,
    points: [[0, STORY.top, WALL_Z], STORY.foot],
    fill: 0.94,
  });
  // The two points only set the distance. Now slide the camera sideways until
  // the band's left edge meets the wall beside the window.
  const distance = Math.hypot(...fit.position.map((v, i) => v - fit.target[i]));
  const x = STORY.left + distance * Math.tan(rad(STORY.fov) / 2) * aspect;
  return {
    position: [x, fit.position[1], fit.position[2]],
    target: [x, fit.target[1], fit.target[2]],
    fov: STORY.fov,
    shiftX: (band.left + band.width / 2) / width - 0.5,
  };
}

/** Where the camera sits for each view. Close-ups face their object. */
export function poseFor(view: View, aspect: number, viewport?: Viewport): CameraPose {
  switch (view) {
    case "story":
      // Without a band there is nothing to show beside the page: stay on the monitor.
      return viewport?.band ? storyPose({ ...viewport, band: viewport.band }) : poseFor("projects", aspect);
    case "projects":
    case "about": {
      const monitor = MONITORS[view === "projects" ? 0 : 1];
      const points = monitorCorners(monitor);
      return fitCamera({ target: center(points), pitch: 5, yaw: deg(monitor.yaw), fov: 35, aspect, points, fill: 0.82 });
    }
    case "contact": {
      const [x, , z] = PEN_CUP.position;
      const r = PEN_CUP.radius;
      const points: Vec3[] = [
        [x - r, 0, z],
        [x + r, 0, z],
        [x - r, 0.18, z],
        [x + r, 0.18, z],
      ];
      return fitCamera({ target: [x, 0.08, z], pitch: 20, yaw: -12, fov: 35, aspect, points, fill: 0.5 });
    }
    case "deck": {
      const [x, , z] = STREAM_DECK.position;
      const points: Vec3[] = [
        [x - 0.06, 0, z + 0.04],
        [x + 0.06, 0, z + 0.04],
        [x - 0.06, 0.09, z - 0.03],
        [x + 0.06, 0.09, z - 0.03],
      ];
      return fitCamera({ target: [x, 0.045, z], pitch: 32, fov: 35, aspect, points, fill: 0.5 });
    }
    default:
      return homePose(aspect);
  }
}
