// Films the cat: plays one emote in a real browser and lays the frames out on one sheet, so the
// motion can be looked at as a whole. With the dev server running:
//
//   npm run cat:film -- clean            one emote, close up
//   npm run cat:film -- roll --desk      the same, as a visitor sees it on the desk
//   npm run cat:film -- all              every emote, one sheet each
//   npm run cat:film -- still --pose sit one picture of a stance, held
//
// Options: --seconds 10  --frames 12  --from sit|loaf|side (stance to start from)  --view az,el,dist,height
// Sheets go to test-results/cat/.

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const which = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true) ?? "all";
const desk = args.includes("--desk");
const frames = Number(option("frames", 12));
const from = option("from", null);
const view = option("view", "32,22,1.05,0.15").split(",").map(Number);
const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = path.resolve(import.meta.dirname, "../test-results/cat");
await mkdir(out, { recursive: true });

const SECONDS = { loaf: 5, purr: 9, clean: 11.5, roll: 9.5, stare: 9 };
// The cat's place on the desk and the way it faces (see CAT in src/scene/layout.ts).
const CAT = { x: 0.504, z: 0.112, yaw: -28 };

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__cat, null, { timeout: 30000 });

if (!desk) {
  await page.evaluate(
    ([cat, [az, el, dist, height]]) => {
      const a = ((az + cat.yaw) * Math.PI) / 180;
      const e = (el * Math.PI) / 180;
      window.__cat.look(
        [cat.x + dist * Math.sin(a) * Math.cos(e), height + dist * Math.sin(e), cat.z + dist * Math.cos(a) * Math.cos(e)],
        [cat.x, height, cat.z],
        30,
      );
    },
    [CAT, view],
  );
}
// Keep the pointer out of it: the cat would watch it.
await page.mouse.move(700, 30);

// "still": one picture of a held stance (--pose sit|loaf|side), close up or on the desk.
if (which === "still") {
  const pose = option("pose", "loaf");
  await page.evaluate((name) => window.__cat.pose(name), pose);
  await page.waitForTimeout(400);
  const file = path.join(out, `still-${pose}${desk ? "-desk" : ""}.jpg`);
  await sharp(await page.screenshot(desk ? {} : { clip: { x: 270, y: 60, width: 900, height: 720 } })).jpeg({ quality: 85 }).toFile(file);
  console.log(file);
  await browser.close();
  process.exit(0);
}

const clip = desk ? { x: 960, y: 400, width: 400, height: 300 } : { x: 360, y: 150, width: 720, height: 540 };
const tile = { width: 360, height: 270 };

for (const emote of which === "all" ? Object.keys(SECONDS) : [which]) {
  const seconds = Number(option("seconds", SECONDS[emote] ?? 8));
  if (from) {
    // Get to the starting stance first, and let it settle there.
    await page.evaluate((stance) => window.__cat.play(stance === "sit" ? "clean" : stance === "side" ? "roll" : "loaf"), from);
    await page.waitForFunction((stance) => window.__cat.doing === stance, from, { timeout: 30000 });
  }
  const before = await page.evaluate(() => window.__scene.frames);
  const started = Date.now();
  await page.evaluate((name) => window.__cat.play(name), emote);
  const shots = [];
  const doing = [];
  for (let i = 0; i < frames; i++) {
    const due = started + (i * seconds * 1000) / (frames - 1);
    await page.waitForTimeout(Math.max(0, due - Date.now()));
    doing.push(await page.evaluate(() => window.__cat.doing));
    shots.push(await sharp(await page.screenshot({ clip })).resize(tile.width, tile.height).toBuffer());
  }
  const drawn = (await page.evaluate(() => window.__scene.frames)) - before;
  const columns = 4;
  const rows = Math.ceil(frames / columns);
  const file = path.join(out, `${emote}${desk ? "-desk" : ""}.jpg`);
  await sharp({ create: { width: columns * tile.width, height: rows * tile.height, channels: 3, background: "#000" } })
    .composite(shots.map((input, i) => ({ input, left: (i % columns) * tile.width, top: Math.floor(i / columns) * tile.height })))
    .jpeg({ quality: 82 })
    .toFile(file);
  console.log(`${emote}: ${file}`);
  console.log(`  ${drawn} frames drawn in ${((Date.now() - started) / 1000).toFixed(1)} s; doing: ${[...new Set(doing)].join(" -> ")}`);
}
if (errors.length) console.log("errors:", errors.slice(0, 5));
await browser.close();
