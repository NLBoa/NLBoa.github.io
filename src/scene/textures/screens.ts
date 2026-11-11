import type { About, Project } from "@/content/types";

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

/** Left monitor: the project grid. */
export function projectGrid(projects: Project[]): ScreenDrawer {
  return (ctx, fonts) => {
    const { width, height } = SCREEN_SIZE;
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "alphabetic";

    const pad = 56;
    label(ctx, fonts, "Projects", pad, 78);
    ctx.textAlign = "right";
    label(ctx, fonts, `${projects.length} projects`, width - pad, 78);
    ctx.textAlign = "left";

    const cols = 3;
    const rows = Math.ceil(projects.length / cols);
    const gap = 20;
    const top = 112;
    const cardW = (width - pad * 2 - gap * (cols - 1)) / cols;
    const cardH = (height - top - pad - gap * (rows - 1)) / rows;

    projects.forEach((project, i) => {
      const x = pad + (i % cols) * (cardW + gap);
      const y = top + Math.floor(i / cols) * (cardH + gap);
      ctx.fillStyle = ink.panel;
      ctx.strokeStyle = ink.rule;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = `600 30px ${fonts.sans}`;
      ctx.fillStyle = ink.text;
      ctx.fillText(project.title, x + 22, y + 48);

      ctx.font = `400 19px ${fonts.sans}`;
      ctx.fillStyle = ink.dim;
      wrap(ctx, project.summary, cardW - 44, 2).forEach((line, n) => {
        ctx.fillText(line, x + 22, y + 82 + n * 26);
      });

      if (project.stack.length) {
        ctx.font = `400 15px ${fonts.mono}`;
        ctx.fillStyle = ink.faint;
        const stack = wrap(ctx, project.stack.join(", "), cardW - 44, 1)[0];
        ctx.fillText(stack, x + 22, y + cardH - 20);
      }
    });
  };
}

const card = { accent: "#ff6b78", section: "#ffd24a", good: "#5dd68a" };

/**
 * Right monitor: the profile card from the About page. The ASCII portrait is
 * on the left and the facts are on the right, like a terminal's output.
 */
export function profile(about: About, portrait: string[], building: Project[]): ScreenDrawer {
  return (ctx, fonts) => {
    const { width, height } = SCREEN_SIZE;
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    // The portrait: one character every 0.6 em, rows a little closer than a line of text.
    const size = 15.5;
    const row = size * 0.6 * 1.56;
    const top = (height - portrait.length * row) / 2 + row;
    ctx.font = `500 ${size}px ${fonts.mono}`;
    ctx.fillStyle = ink.text;
    portrait.forEach((line, i) => ctx.fillText(line, 64, top + i * row));

    const x = 600;
    const right = width - 64;
    let y = 150;

    ctx.font = `600 60px ${fonts.sans}`;
    ctx.fillStyle = ink.text;
    ctx.fillText(about.name, x, y);

    y += 54;
    ctx.font = `500 22px ${fonts.mono}`;
    ctx.fillStyle = card.accent;
    ctx.fillText(about.handle, x, y);
    ctx.fillStyle = ink.rule;
    ctx.fillRect(x + ctx.measureText(about.handle).width + 14, y - 8, right - x - ctx.measureText(about.handle).width - 14, 2);

    const line = (label: string, value: string, color = ink.text) => {
      y += 36;
      ctx.font = `500 21px ${fonts.mono}`;
      ctx.fillStyle = card.accent;
      ctx.fillText(label, x, y);
      ctx.fillStyle = color;
      ctx.fillText(wrap(ctx, value, right - x - 190, 1)[0] ?? "", x + 190, y);
    };
    const section = (name: string) => {
      y += 46;
      ctx.font = `500 21px ${fonts.mono}`;
      ctx.fillStyle = card.section;
      ctx.fillText(name, x, y);
      ctx.fillStyle = ink.rule;
      ctx.fillRect(x + ctx.measureText(name).width + 14, y - 8, right - x - ctx.measureText(name).width - 14, 2);
    };

    line("School", about.education.school);
    line("Degree", about.education.studies.join(", "));
    line("Class", String(about.education.classOf));
    line("Honors", about.education.honors.join(", "));

    section("Building");
    for (const project of building) line(project.title, project.summary, ink.dim);

    if (about.status) {
      section("Status");
      y += 36;
      ctx.fillStyle = card.good;
      ctx.fillText(about.status, x, y);
    }
  };
}
