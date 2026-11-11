import { COVER, INKS, covers, type Ink } from "./shapes";

/**
 * Paints a project's cover into a 2D canvas, fitted inside the given box and
 * centered in it. Returns false when the project has no cover.
 */
export function paintCover(ctx: CanvasRenderingContext2D, slug: string, accent: string, x: number, y: number, width: number, height: number): boolean {
  const shapes = covers[slug];
  if (!shapes) return false;
  const scale = Math.min(width / COVER.width, height / COVER.height);
  const color = (ink: Ink) => (ink === "accent" ? accent : INKS[ink]);

  ctx.save();
  ctx.translate(x + (width - COVER.width * scale) / 2, y + (height - COVER.height * scale) / 2);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const shape of shapes) {
    const path = new Path2D(shape.d);
    ctx.globalAlpha = shape.opacity ?? 1;
    if (shape.fill) {
      ctx.fillStyle = color(shape.fill);
      ctx.fill(path);
    }
    if (shape.stroke) {
      ctx.strokeStyle = color(shape.stroke);
      ctx.lineWidth = shape.width ?? 1;
      ctx.setLineDash(shape.dash ?? []);
      ctx.stroke(path);
    }
  }
  ctx.restore();
  return true;
}
