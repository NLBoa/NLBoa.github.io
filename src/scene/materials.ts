import { MeshStandardMaterial } from "three";

/**
 * The one small palette every object draws from: matte and satin only.
 * There is no environment map at night, so nothing is metallic.
 */
const m = (color: string, roughness: number) => new MeshStandardMaterial({ color, roughness, metalness: 0 });

export const materials = {
  /** Monitor shells, arms, light bar. */
  blackSatin: m("#131416", 0.55),
  /** Stream Deck body and stand. */
  blackMatte: m("#17181a", 0.85),
  /** Stream Deck keys while dark. */
  keyDark: m("#0a0b0d", 0.3),
  /** Keyboard body. */
  aluminum: m("#9a9da2", 0.5),
  /** Trackpad surface. */
  white: m("#c9c9c6", 0.45),
  /** Pen cup. */
  cream: m("#e6dcc6", 0.9),
  wall: m("#4a4541", 1),
  deskLegs: m("#0e0e0f", 0.9),
  pens: [m("#1b1c1f", 0.5), m("#2f3a4f", 0.5), m("#d9d6cf", 0.5), m("#6e6a64", 0.5)],
};

/** Light and screen colors, so the mood is set in one place. */
export const light = {
  screen: "#b9cdf5",
  bar: "#ffdfba",
  room: "#ffd9b5",
  fill: "#ffb680",
  skyTint: "#56607a",
  groundTint: "#3a302a",
};
