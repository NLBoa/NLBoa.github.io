import type { DeckKey } from "@/lib/deck";

export const KEY_ICON_SIZE = 128;

const INK = "#dbe6f7";
const KEY = "#0a0d12";

/** Draws a Stream Deck key face: one simple icon, in one color. */
export function drawKeyIcon(ctx: CanvasRenderingContext2D, icon: DeckKey["icon"], monoFont: string) {
  const s = KEY_ICON_SIZE;
  ctx.fillStyle = KEY;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (typeof icon === "object") {
    ctx.font = `500 68px ${monoFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon.letter, s / 2, s / 2 + 4);
    return;
  }

  ctx.beginPath();
  switch (icon) {
    case "eye":
      ctx.moveTo(22, 64);
      ctx.quadraticCurveTo(64, 22, 106, 64);
      ctx.quadraticCurveTo(64, 106, 22, 64);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 64, 13, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "bulb":
      ctx.arc(64, 54, 26, Math.PI * 0.75, Math.PI * 0.25);
      ctx.lineTo(74, 88);
      ctx.lineTo(54, 88);
      ctx.closePath();
      ctx.moveTo(54, 102);
      ctx.lineTo(74, 102);
      ctx.stroke();
      break;
    case "planet":
      ctx.arc(64, 64, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(64, 64, 48, 13, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "orbit":
      ctx.ellipse(64, 64, 46, 22, -0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 64, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(102, 42, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "person":
      ctx.arc(64, 44, 15, 0, Math.PI * 2);
      ctx.moveTo(30, 104);
      ctx.arc(64, 104, 34, Math.PI, 0);
      ctx.stroke();
      break;
    case "envelope":
      ctx.roundRect(24, 38, 80, 54, 6);
      ctx.moveTo(26, 44);
      ctx.lineTo(64, 70);
      ctx.lineTo(102, 44);
      ctx.stroke();
      break;
    case "document":
      ctx.moveTo(38, 22);
      ctx.lineTo(74, 22);
      ctx.lineTo(92, 40);
      ctx.lineTo(92, 106);
      ctx.lineTo(38, 106);
      ctx.closePath();
      ctx.moveTo(52, 62);
      ctx.lineTo(78, 62);
      ctx.moveTo(52, 80);
      ctx.lineTo(78, 80);
      ctx.stroke();
      break;
    case "branch":
      ctx.arc(44, 34, 9, 0, Math.PI * 2);
      ctx.moveTo(53, 94);
      ctx.arc(44, 94, 9, 0, Math.PI * 2);
      ctx.moveTo(93, 50);
      ctx.arc(84, 50, 9, 0, Math.PI * 2);
      ctx.moveTo(44, 43);
      ctx.lineTo(44, 85);
      ctx.moveTo(84, 59);
      ctx.bezierCurveTo(84, 76, 44, 66, 44, 85);
      ctx.stroke();
      break;
    case "briefcase":
      ctx.roundRect(24, 46, 80, 52, 7);
      ctx.moveTo(50, 46);
      ctx.lineTo(50, 34);
      ctx.lineTo(78, 34);
      ctx.lineTo(78, 46);
      ctx.moveTo(24, 68);
      ctx.lineTo(104, 68);
      ctx.stroke();
      break;
  }
}
