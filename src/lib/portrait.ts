/**
 * The order the portrait's frames play in: the head turns one way, rests,
 * turns back, and rests again. `hold` is how many extra frames each rest lasts.
 */
export function turnSequence(count: number, hold: number): number[] {
  if (count <= 1) return [0];
  const forward = Array.from({ length: count }, (_, i) => i);
  const back = forward.slice(1, -1).reverse();
  const rest = (frame: number) => Array.from({ length: hold }, () => frame);
  return [...forward, ...rest(count - 1), ...back, ...rest(0)];
}

/** The frame showing after `seconds`, starting from the `front` frame. */
export function frameAt(seconds: number, count: number, front: number, fps = 12, hold = 3): number {
  const sequence = turnSequence(count, hold);
  const start = Math.max(0, sequence.indexOf(front));
  return sequence[(start + Math.floor(Math.max(0, seconds) * fps)) % sequence.length];
}
