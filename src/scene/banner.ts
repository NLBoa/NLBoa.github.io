/**
 * The banner: on an upright window (a phone) the desk is drawn across the top
 * of the screen only, with the project tiles under it. Its size is set in CSS
 * (app/home.css); this file is the little the camera needs to know about it.
 */

/** Fractions of the banner's height, at its top and bottom, that the desk keeps out of. */
export type Clear = { top: number; bottom: number };

/**
 * In rem. Top: the site's name and links end about 2.7rem down the window, and
 * they should sit over the wall and the window, not over the monitors. Bottom:
 * the banner's lower edge fades into the wall over 1.5rem (home.css), and the
 * desk's front edge should not fade with it.
 */
const KEEP_OUT = { top: 3, bottom: 1 };

const NONE: Clear = { top: 0, bottom: 0 };

/**
 * What the home view keeps clear in a banner of this height. Nothing on a wide
 * window, where the desk fills the window and its framing is left as it is.
 *
 * "Upright" is the same test as the stylesheet's `(max-aspect-ratio: 1/1)`.
 */
export function bannerClear(windowWidth: number, windowHeight: number, bannerHeight: number, rem = 16): Clear {
  if (windowWidth > windowHeight || bannerHeight <= 0) return NONE;
  // The limits only matter in a banner too short to be useful; they keep the fit sane there.
  return {
    top: Math.min(0.3, (KEEP_OUT.top * rem) / bannerHeight),
    bottom: Math.min(0.1, (KEEP_OUT.bottom * rem) / bannerHeight),
  };
}
