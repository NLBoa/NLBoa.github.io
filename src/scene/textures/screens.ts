import type { About, Project } from "@/content/types";
import { paintCover } from "@/covers/paint";

/**
 * What the monitors show while idle, drawn to a 2D canvas from the content
 * files. A screen is anything that can draw itself into a canvas, so the
 * right monitor can later be handed a terminal instead.
 */
export type ScreenDrawer = (ctx: CanvasRenderingContext2D, fonts: ScreenFonts) => void;

export type ScreenFonts = { sans: string; mono: string };

export const SCREEN_SIZE = { width: 1280, height: 720 } as const;

const ink = {
  bg: "#0b111c",
  panel: "#111a29",
  rule: "#1e2b40",
  text: "#e3ebf7",
  dim: "#8fa1bd",
  faint: "#5d6f8c",
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (lines.length === maxLines && line) {
    // Out of room: end the last line with an ellipsis.
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

function label(ctx: CanvasRenderingContext2D, fonts: ScreenFonts, text: string, x: number, y: number) {
  ctx.font = `500 22px ${fonts.mono}`;
  ctx.fillStyle = ink.faint;
  ctx.fillText(text, x, y);
}

/**
 * Left monitor: the project grid. Each card is the same button the Projects
 * page shows: the project's cover in its own color, then its name.
 */
export function projectGrid(projects: Project[]): ScreenDrawer {
  return (ctx, fonts) => {
    const { width, height } = SCREEN_SIZE;
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "alphabetic";

    const pad = 48;
    label(ctx, fonts, "Projects", pad, 66);
    ctx.textAlign = "right";
    label(ctx, fonts, `${projects.length} projects`, width - pad, 66);
    ctx.textAlign = "left";

    const cols = 3;
    const rows = Math.ceil(projects.length / cols);
    const gap = 20;
    const top = 92;
    const cardW = (width - pad * 2 - gap * (cols - 1)) / cols;
    const cardH = (height - top - pad + 12 - gap * (rows - 1)) / rows;
    // The cover takes the top of the card; the words need about 100 px.
    const artH = Math.max(60, cardH - 104);

    projects.forEach((project, i) => {
      const x = pad + (i % cols) * (cardW + gap);
      const y = top + Math.floor(i / cols) * (cardH + gap);
      const accent = project.accent ?? ink.text;

      ctx.fillStyle = ink.panel;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 10);
      ctx.fill();

      // The cover, on a band tinted with the project's color.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, artH, [10, 10, 0, 0]);
      ctx.clip();
      ctx.fillStyle = ink.bg;
      ctx.fillRect(x, y, cardW, artH);
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = accent;
      ctx.fillRect(x, y, cardW, artH);
      ctx.globalAlpha = 1;
      paintCover(ctx, project.slug, accent, x, y + 6, cardW, artH - 12);
      ctx.restore();

      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 10);
      ctx.moveTo(x, y + artH);
      ctx.lineTo(x + cardW, y + artH);
      ctx.stroke();

      ctx.font = `600 28px ${fonts.sans}`;
      ctx.fillStyle = ink.text;
      ctx.fillText(project.title, x + 20, y + artH + 38);

      ctx.font = `400 17px ${fonts.sans}`;
      ctx.fillStyle = ink.dim;
      wrap(ctx, project.summary, cardW - 40, 2).forEach((line, n) => {
        ctx.fillText(line, x + 20, y + artH + 66 + n * 23);
      });
    });
  };
}

/** Right monitor: a few lines of intro. */
export function intro(about: About): ScreenDrawer {
  return (ctx, fonts) => {
    const { width, height } = SCREEN_SIZE;
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    const pad = 96;
    label(ctx, fonts, "About", pad, 150);

    ctx.font = `600 84px ${fonts.sans}`;
    ctx.fillStyle = ink.text;
    ctx.fillText(about.name, pad, 270);

    ctx.font = `400 34px ${fonts.sans}`;
    ctx.fillStyle = ink.dim;
    let y = 350;
    for (const line of wrap(ctx, about.intro[0], width - pad * 2, 3)) {
      ctx.fillText(line, pad, y);
      y += 48;
    }

    ctx.fillStyle = ink.rule;
    ctx.fillRect(pad, y + 14, width - pad * 2, 2);

    ctx.font = `400 22px ${fonts.mono}`;
    ctx.fillStyle = ink.faint;
    ctx.fillText(about.education.honors.join(", "), pad, y + 70);
    void height;
  };
}
