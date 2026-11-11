import { describe, expect, it } from "vitest";
import { fitCamera, homePose, poseFor } from "./camera";
import { INTERACTIVES, viewForPath } from "./interactive";
import { FRAME_POINTS, KEYBOARD, MONITOR, MONITORS, PEN_CUP, onDesk, type Vec3 } from "./layout";

/** Projects a point into normalized device coordinates for a pose. */
function project(pose: ReturnType<typeof homePose>, aspect: number, point: Vec3) {
  const f = [0, 1, 2].map((i) => pose.target[i] - pose.position[i]);
  const len = Math.hypot(f[0], f[1], f[2]);
  const forward = f.map((v) => v / len);
  // No yaw, so right is +x and up follows from the pitch.
  const up = [0, -forward[2], forward[1]];
  const r = [0, 1, 2].map((i) => point[i] - pose.position[i]);
  const depth = r[0] * forward[0] + r[1] * forward[1] + r[2] * forward[2];
  const tan = Math.tan((pose.fov * Math.PI) / 360);
  return {
    x: r[0] / (depth * tan * aspect),
    y: (r[1] * up[1] + r[2] * up[2]) / (depth * tan),
  };
}

describe("layout", () => {
  it("maps desk coordinates to meters", () => {
    expect(onDesk(0, 0)).toEqual([-0.7, 0, -0.35]);
    expect(onDesk(1, 1)).toEqual([0.7, 0, 0.35]);
  });

  it("uses real sizes", () => {
    expect(KEYBOARD.size[0]).toBeCloseTo(0.279, 3);
    expect(MONITOR.screen.width).toBeCloseTo(0.5977, 3);
    expect(MONITOR.screen.height).toBeCloseTo(0.3362, 3);
  });

  it("keeps both monitors over the desk", () => {
    for (const m of MONITORS) expect(Math.abs(m.position[0]) + MONITOR.body.width / 2).toBeLessThan(0.75);
  });

  it("leaves room for the pens under the monitors", () => {
    const tallest = Math.max(...PEN_CUP.pens.map((p) => 0.03 + p.length));
    expect(tallest).toBeLessThan(MONITOR.bottomY);
  });
});

describe("homePose", () => {
  it.each([1440 / 900, 16 / 9, 4 / 3])("keeps the desk and monitors in frame at aspect %f", (aspect) => {
    const pose = homePose(aspect);
    for (const point of FRAME_POINTS.desk) {
      const p = project(pose, aspect, point);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1);
    }
  });

  it("keeps both monitors in frame on a phone in portrait", () => {
    const aspect = 390 / 844;
    const pose = homePose(aspect);
    for (const point of FRAME_POINTS.monitors) {
      const p = project(pose, aspect, point);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1);
    }
  });

  it("looks down at about 30 degrees on a laptop", () => {
    const pose = homePose(1.6);
    const dy = pose.position[1] - pose.target[1];
    const dz = pose.position[2] - pose.target[2];
    expect((Math.atan2(dy, dz) * 180) / Math.PI).toBeCloseTo(30, 5);
  });

  it("fills the frame: some point touches the fill margin", () => {
    const pose = fitCamera({ target: [0, 0, 0], pitch: 30, fov: 35, aspect: 1.6, points: FRAME_POINTS.desk, fill: 1 });
    const extents = FRAME_POINTS.desk.map((pt) => project(pose, 1.6, pt));
    const max = Math.max(...extents.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]));
    expect(max).toBeCloseTo(1, 5);
  });
});

describe("poseFor", () => {
  it("stands straight in front of the left monitor and square to the angled right one", () => {
    const left = poseFor("projects", 1.6);
    expect(left.position[0]).toBeCloseTo(left.target[0], 5);
    const right = poseFor("about", 1.6);
    // The right monitor is turned 20 degrees inward, so the camera stands to its left.
    expect(right.position[0]).toBeLessThan(right.target[0]);
    const dx = right.position[0] - right.target[0];
    const dz = right.position[2] - right.target[2];
    expect((Math.atan2(dx, dz) * 180) / Math.PI).toBeCloseTo(-20, 3);
  });

  it("gets closer than the home view for every close-up", () => {
    const home = poseFor("home", 1.6);
    const distance = (p: typeof home) => Math.hypot(...[0, 1, 2].map((i) => p.position[i] - p.target[i]));
    for (const view of ["projects", "about", "contact", "deck"] as const) {
      expect(distance(poseFor(view, 1.6))).toBeLessThan(distance(home));
    }
  });
});

describe("interactive objects", () => {
  it("tabs through monitors, then the lit keys, then the pen cup", () => {
    const ids = INTERACTIVES.map((item) => item.id);
    expect(ids.slice(0, 2)).toEqual(["monitor-left", "monitor-right"]);
    expect(ids.at(-1)).toBe("pen-cup");
    expect(ids.slice(2, -1).every((id) => id.startsWith("key-"))).toBe(true);
  });

  it("maps URLs to camera views", () => {
    expect(viewForPath("/")).toBe("home");
    expect(viewForPath("/projects")).toBe("projects");
    expect(viewForPath("/projects/argus")).toBe("projects");
    expect(viewForPath("/about")).toBe("about");
    expect(viewForPath("/contact")).toBe("contact");
    expect(viewForPath("/credits")).toBe("home");
  });
});
