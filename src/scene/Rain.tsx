import "./rain.css";

/** Drops that run down the glass: where each starts, how long it takes, and when. */
const DROPS = [
  { left: 4, top: 18, seconds: 7, delay: -1 },
  { left: 11, top: 42, seconds: 10, delay: -6 },
  { left: 17, top: 8, seconds: 8, delay: -3 },
  { left: 24, top: 55, seconds: 11, delay: -9 },
  { left: 31, top: 30, seconds: 9, delay: -4 },
  { left: 39, top: 12, seconds: 12, delay: -7 },
  { left: 46, top: 48, seconds: 8, delay: -2 },
  { left: 8, top: 66, seconds: 9, delay: -5 },
  { left: 21, top: 74, seconds: 10, delay: -8 },
  { left: 35, top: 62, seconds: 7, delay: -1.5 },
  { left: 58, top: 26, seconds: 11, delay: -6.5 },
  { left: 72, top: 50, seconds: 9, delay: -3.5 },
];

/**
 * A rainy night outside the window. It is a plain page layer behind the 3D
 * canvas, animated by CSS alone, so the scene still draws no frames while
 * idle. Every layer fills the whole view; the window in the scene decides
 * how much of it shows.
 */
export default function Rain() {
  return (
    <div className="rain">
      <div className="rain-lights" />
      <div className="rain-car" />
      <div className="rain-far" />
      <div className="rain-near" />
      <div className="rain-mist" />
      {DROPS.map((drop) => (
        <i
          key={`${drop.left}-${drop.top}`}
          className="rain-drop"
          style={{ left: `${drop.left}%`, top: `${drop.top}%`, animationDuration: `${drop.seconds}s`, animationDelay: `${drop.delay}s` }}
        />
      ))}
    </div>
  );
}
