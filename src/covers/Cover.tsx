import { COVER, INKS, covers, type Ink } from "./shapes";

const color = (ink: Ink | undefined) => (ink === undefined ? "none" : ink === "accent" ? "var(--accent)" : INKS[ink]);

/** A project's cover as SVG. It is decoration: the tile's text says what the project is. */
export default function Cover({ slug }: { slug: string }) {
  const shapes = covers[slug];
  if (!shapes) return null;
  return (
    <svg className="cover" viewBox={`0 0 ${COVER.width} ${COVER.height}`} aria-hidden="true">
      {shapes.map((shape, i) => (
        <path
          key={i}
          d={shape.d}
          fill={color(shape.fill)}
          stroke={color(shape.stroke)}
          strokeWidth={shape.width}
          strokeDasharray={shape.dash?.join(" ")}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={shape.opacity}
        />
      ))}
    </svg>
  );
}
