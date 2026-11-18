/**
 * When the weather outside the window rests behind an open page (it dims and its animations
 * pause: rain.css, keyed on `html[data-resting]`, which <RouteSync> sets).
 *
 * Opening a page from the desk, it rests only once the page has arrived. Dimming and pausing
 * in the same instant the page mounts cost Safari's engine one or two late frames in the middle
 * of the hand-off (measured 2026-11-18: about 60 ms instead of 33); a little later nothing on
 * screen is moving, and by then the scrim hides the weather anyway.
 */
export const REST_AFTER_MS = 700;

/**
 * How long to wait before the weather rests, going from one path to another:
 * `null` on the desk (it does not rest), 0 for at once.
 * `from` is null on the first page of a visit.
 */
export function restDelay(from: string | null, to: string): number | null {
  if (to === "/") return null;
  // A page opened from the desk: the camera and the page's fade-in come first.
  if (from === "/") return REST_AFTER_MS;
  // A page loaded directly, or reached from another page: there is no hand-off to protect.
  return 0;
}
