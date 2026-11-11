import type { CSSProperties } from "react";
import { CITY_SIZE, NEON, buildCity, type Board, type Car, type Sign, type Tower } from "./skyline";
import "./city.css";

const city = buildCity();

/** Tower bodies, darkest first. Far towers are paler: there is rain and haze in between. */
const BODY = {
  near: ["#090b1a", "#0c0f22", "#0a0c1e"],
  far: ["#151a40", "#181e48", "#13173a"],
};
const RIM = { near: "#232a5c", far: "#252c62" };

/** Far enough below the city's edge that no tower shows its foot. */
const FOOT = CITY_SIZE + 60;

function TowerShape({ tower, layer }: { tower: Tower; layer: "near" | "far" }) {
  const tile = city.tiles[tower.windows];
  const margin = layer === "near" ? 6 : 4;
  const columns = Math.max(1, Math.floor((tower.width - margin * 2 + tile.pitch[0] - tile.cell[0]) / tile.pitch[0]));
  const lit = columns * tile.pitch[0] - (tile.pitch[0] - tile.cell[0]);
  const body = BODY[layer][tower.tone];

  return (
    <g transform={`translate(${tower.x} ${tower.top})`}>
      {tower.mast && (
        <line
          x1={tower.mast.x}
          x2={tower.mast.x}
          y1={-(tower.cap?.height ?? 0) - tower.mast.height}
          y2={0}
          stroke={RIM[layer]}
          strokeWidth={layer === "near" ? 1.6 : 1}
        />
      )}
      {tower.cap && (
        <rect x={tower.cap.inset} y={-tower.cap.height} width={tower.width - tower.cap.inset * 2} height={tower.cap.height + 1} fill={body} />
      )}
      <rect width={tower.width} height={FOOT - tower.top} fill={body} />
      {/* A paler rim on the roof and one side, so each tower reads as a solid. */}
      <rect width={tower.width} height={1.2} fill={RIM[layer]} />
      <rect width={1.2} height={FOOT - tower.top} fill={RIM[layer]} opacity={0.7} />
      <g transform={`translate(${(tower.width - lit) / 2} ${margin + 4})`}>
        <rect width={lit} height={FOOT - tower.top} fill={`url(#city-windows-${tower.windows})`} />
      </g>
      {tower.edge && (
        <rect x={tower.width - 2.2} y={3} width={1.6} height={FOOT - tower.top} fill={NEON[tower.edge].glow} opacity={0.75} />
      )}
      {tower.mast?.beacon && (
        <circle className="city-beacon" cx={tower.mast.x} cy={-(tower.cap?.height ?? 0) - tower.mast.height} r={2.6} fill="#ff4a4a" />
      )}
    </g>
  );
}

/** The marks inside a sign. They are shapes, not writing. */
function Glyph({ sign }: { sign: Sign }) {
  const { x, y, width, height } = sign;
  const inner = { x: x + 3.5, width: width - 7 };
  const rows = Math.max(3, Math.floor((height - 12) / 15));
  const step = (height - 12) / rows;
  const marks = Array.from({ length: rows }, (_, i) => y + 6 + step * (i + 0.5));
  const reach = Math.min(5, step / 3);

  switch (sign.glyph) {
    case "ring":
      return (
        <>
          {marks.map((cy) => (
            <circle key={cy} cx={x + width / 2} cy={cy} r={Math.min(inner.width / 2, step / 2 - 1.5)} />
          ))}
        </>
      );
    case "chevrons":
      return (
        <>
          {marks.map((cy) => (
            <path key={cy} d={`M${inner.x} ${cy - reach}L${x + width / 2} ${cy + reach}L${inner.x + inner.width} ${cy - reach}`} />
          ))}
        </>
      );
    case "blocks":
      return (
        <>
          {marks.map((cy, i) => (
            <rect key={cy} x={inner.x + (i % 2 ? inner.width / 2 : 0)} y={cy - reach} width={inner.width / 2} height={reach * 2} />
          ))}
        </>
      );
    default:
      return (
        <>
          {marks.map((cy, i) => (
            <path key={cy} d={`M${inner.x} ${cy}h${inner.width}${i % 2 ? `M${x + width / 2} ${cy - reach}v${reach * 2}` : ""}`} />
          ))}
        </>
      );
  }
}

function SignShape({ sign, glow }: { sign: Sign; glow: boolean }) {
  const color = NEON[sign.color];
  return (
    <g
      className={sign.flicker ? "city-flicker" : undefined}
      fill="none"
      stroke={glow ? color.glow : color.core}
      strokeWidth={glow ? 3.2 : 1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={sign.x} y={sign.y} width={sign.width} height={sign.height} rx={2.5} />
      <Glyph sign={sign} />
    </g>
  );
}

function BoardShape({ board, index }: { board: Board; index: number }) {
  const { x, y, width, height } = board;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={2} fill={`url(#city-board-${index})`} opacity={0.62} />
      <rect x={x} y={y} width={width} height={height} rx={2} fill="url(#city-scanlines)" opacity={0.5} />
      {/* What it advertises is anyone's guess: a sun over a horizon. */}
      <circle cx={x + width * 0.5} cy={y + height * 0.46} r={height * 0.24} fill="#fff" opacity={0.78} />
      <rect x={x + width * 0.14} y={y + height * 0.66} width={width * 0.72} height={1.6} fill="#fff" opacity={0.8} />
      <rect x={x + width * 0.26} y={y + height * 0.78} width={width * 0.48} height={1.6} fill="#fff" opacity={0.55} />
      <rect x={x} y={y} width={width} height={height} rx={2} fill="none" stroke={NEON[board.from].core} strokeWidth={1} opacity={0.8} />
    </g>
  );
}

/** A flying car, seen from the side, nose to the right. */
function CarShape({ car }: { car: Car }) {
  const color = NEON[car.color];
  const style = {
    "--top": `${car.top}%`,
    "--length": `${car.length}%`,
    "--park": `${car.park}vmax`,
    animationDuration: `${car.seconds}s`,
    animationDelay: `${-car.offset}s`,
  } as CSSProperties;

  return (
    <i className={`city-car city-car-${car.lane}${car.reverse ? " city-car-reverse" : ""}`} style={style}>
      <svg viewBox="0 0 120 40" aria-hidden="true">
        <g transform={car.reverse ? "translate(120 0) scale(-1 1)" : undefined}>
          {/* The light it leaves behind, and the beam ahead. */}
          <rect x={-230} y={22} width={236} height={4} rx={2} fill={`url(#city-trail-${car.color})`} />
          <path d="M112 23L190 12L190 36Z" fill="url(#city-beam)" />
          {/* Lift: two glowing pads under the body. */}
          <ellipse cx={30} cy={34} rx={20} ry={7} fill={color.glow} opacity={0.5} />
          <ellipse cx={88} cy={34} rx={20} ry={7} fill={color.glow} opacity={0.5} />
          <ellipse cx={30} cy={32} rx={8} ry={1.8} fill={color.core} />
          <ellipse cx={88} cy={32} rx={8} ry={1.8} fill={color.core} />
          {/* Body: a low wedge with a canopy. */}
          <path d="M4 27L16 17L50 10L82 11L110 21L117 26L109 31L11 31Z" fill="#141833" stroke="#6a78c8" strokeWidth={1.4} strokeLinejoin="round" />
          <path d="M42 13L57 11.5L78 13L92 19L46 19Z" fill={color.glow} opacity={0.6} />
          <path d="M14 25.5H106" stroke={color.core} strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={114} cy={25} r={7} fill="#fff" opacity={0.35} />
          <circle cx={114} cy={25} r={3.4} fill="#fff" />
          <rect x={3} y={22} width={5} height={5} rx={1} fill="#ff3b4e" />
        </g>
      </svg>
    </i>
  );
}

/**
 * The city outside the window, at night. It is drawn once as vector art and
 * sits behind the rain; only the cars, two flickering signs and the rooftop
 * lights move, and they move by CSS, so the 3D scene draws nothing for it.
 */
export default function City() {
  const box = `0 0 ${CITY_SIZE} ${CITY_SIZE}`;
  return (
    <div className="city">
      <svg className="city-layer city-far" viewBox={box} aria-hidden="true">
        <defs>
          {city.tiles.map((tile, index) => (
            <pattern key={index} id={`city-windows-${index}`} width={tile.width} height={tile.height} patternUnits="userSpaceOnUse">
              {tile.cells.map((cell) => (
                <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width={cell.width} height={cell.height} fill={cell.color} opacity={cell.opacity} />
              ))}
            </pattern>
          ))}
          <pattern id="city-scanlines" width={4} height={3} patternUnits="userSpaceOnUse">
            <rect width={4} height={1.2} fill="#05060f" />
          </pattern>
          {city.boards.map((board, index) => (
            <linearGradient key={index} id={`city-board-${index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={NEON[board.from].glow} />
              <stop offset="1" stopColor={NEON[board.to].glow} />
            </linearGradient>
          ))}
          {(Object.keys(NEON) as (keyof typeof NEON)[]).map((name) => (
            <linearGradient key={name} id={`city-trail-${name}`} x1="0" x2="1">
              <stop offset="0" stopColor={NEON[name].glow} stopOpacity={0} />
              <stop offset="1" stopColor={NEON[name].glow} stopOpacity={0.7} />
            </linearGradient>
          ))}
          <linearGradient id="city-beam" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <filter id="city-glow" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <linearGradient id="city-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a1a5e" stopOpacity={0} />
            <stop offset="1" stopColor="#3a1a5e" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        {city.far.map((tower) => (
          <TowerShape key={tower.x} tower={tower} layer="far" />
        ))}
        {/* Haze between the far towers and the near ones. */}
        <rect y={CITY_SIZE * 0.38} width={CITY_SIZE} height={CITY_SIZE * 0.62} fill="url(#city-haze)" />
      </svg>

      {city.cars.filter((car) => car.lane === "far").map((car) => (
        <CarShape key={car.top} car={car} />
      ))}

      <svg className="city-layer city-near" viewBox={box} aria-hidden="true">
        {city.near.map((tower) => (
          <TowerShape key={tower.x} tower={tower} layer="near" />
        ))}
        {city.boards.map((board, index) => (
          <BoardShape key={board.x} board={board} index={index} />
        ))}
        <g filter="url(#city-glow)" opacity={0.9}>
          {city.signs.map((sign) => (
            <SignShape key={sign.x} sign={sign} glow />
          ))}
        </g>
        {city.signs.map((sign) => (
          <SignShape key={sign.x} sign={sign} glow={false} />
        ))}
      </svg>

      {city.cars.filter((car) => car.lane === "near").map((car) => (
        <CarShape key={car.top} car={car} />
      ))}
    </div>
  );
}
