/** The most the sheet turns, in degrees: about its horizontal axis (x) and its vertical one (y). */
export const MAX_TILT = { x: 3, y: 4.5 };

export type Tilt = {
  /** Degrees about the horizontal axis: positive tips the top edge away. */
  x: number;
  /** Degrees about the vertical axis: positive tips the right edge away. */
  y: number;
  /** Where the pointer is on the sheet, in percent from its left and top. */
  px: number;
  py: number;
};

/**
 * How a sheet should tilt for a pointer at (clientX, clientY) over a box.
 * The side under the pointer tips away, as if a finger pressed there on a
 * card floating above the desk; in the middle it lies flat.
 */
export function tiltFor(clientX: number, clientY: number, box: { left: number; top: number; width: number; height: number }): Tilt {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const u = box.width > 0 ? clamp((clientX - box.left) / box.width) : 0.5;
  const v = box.height > 0 ? clamp((clientY - box.top) / box.height) : 0.5;
  return {
    x: (0.5 - v) * 2 * MAX_TILT.x,
    y: (u - 0.5) * 2 * MAX_TILT.y,
    px: u * 100,
    py: v * 100,
  };
}

/** One step of easing toward a target that looks the same at any frame rate. */
export function approach(current: number, target: number, seconds: number, rate: number): number {
  return current + (target - current) * (1 - Math.exp(-seconds * rate));
}
