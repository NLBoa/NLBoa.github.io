import type { Vec3 } from "./layout";

/**
 * Where the orb on the desk looks, worked out without three.js so it can be
 * tested. The orb watches the pointer: it looks at the spot where the line
 * from the camera through the pointer crosses a plane that faces the camera
 * and stands `reach` meters in front of the orb. So with the pointer on the
 * orb it looks straight at the viewer, and it turns as the pointer moves away.
 */
export function gazePoint(camera: Vec3, ray: Vec3, orb: Vec3, reach: number): Vec3 {
  const toCamera: Vec3 = [camera[0] - orb[0], camera[1] - orb[1], camera[2] - orb[2]];
  const length = Math.hypot(...toCamera) || 1;
  const normal: Vec3 = [toCamera[0] / length, toCamera[1] / length, toCamera[2] / length];
  const along = ray[0] * normal[0] + ray[1] * normal[1] + ray[2] * normal[2];
  // A ray that never meets the plane (it points away from the orb's side): look at the camera.
  if (along > -1e-6) return camera;
  const distance = (reach - length) / along;
  return [camera[0] + ray[0] * distance, camera[1] + ray[1] * distance, camera[2] + ray[2] * distance];
}

/** How far to move toward a target this frame, so motion eases out the same at any frame rate. */
export function easeStep(seconds: number, rate: number): number {
  return 1 - Math.exp(-seconds * rate);
}

/** A blink, 0 (open) to 1 (shut) and back, over `length` seconds. */
export function blink(elapsed: number, length = 0.22): number {
  if (elapsed <= 0 || elapsed >= length) return 0;
  return Math.sin((elapsed / length) * Math.PI);
}
