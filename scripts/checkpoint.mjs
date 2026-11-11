// Checkpoint report: screenshots at the two review sizes plus scene numbers.
// Needs the dev server on :3000 and Google Chrome installed.
// Usage: node scripts/checkpoint.mjs <label> [route]
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const [label = "checkpoint", route = "/"] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3000";
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "docs/checkpoints");
mkdirSync(out, { recursive: true });

const sizes = [
  { width: 1440, height: 900, isMobile: false, dpr: 2 },
  { width: 390, height: 844, isMobile: true, dpr: 1.5 },
];

/** Forces a redraw every frame for a few seconds and reports the frame rate. */
async function measureFps(context, width, height) {
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => (window.__scene?.frames ?? 0) > 0, null, { timeout: 15000 });
  await page.waitForTimeout(800);
  const result = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now();
        const startFrames = window.__scene.frames;
        const times = [];
        let last = start;
        function loop(now) {
          times.push(now - last);
          last = now;
          window.__scene.invalidate();
          if (now - start < 3000) requestAnimationFrame(loop);
          else {
            times.sort((a, b) => a - b);
            resolve({
              fps: ((window.__scene.frames - startFrames) / (now - start)) * 1000,
              p95: times[Math.floor(times.length * 0.95)],
              renderer: window.__scene.renderer,
            });
          }
        }
        requestAnimationFrame(loop);
      }),
  );
  console.log(
    `  redrawing every frame at ${width}x${height}: ${result.fps.toFixed(0)} fps, ` +
      `95th percentile frame ${result.p95.toFixed(1)} ms (${result.renderer})`,
  );
  await page.close();
}

const browser = await chromium.launch({ channel: "chrome" });
for (const { width, height, isMobile, dpr } of sizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile,
    hasTouch: isMobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  // Bytes over the wire, by kind, for the first load of this page.
  const transferred = { models: 0, textures: 0, script: 0, other: 0 };
  page.on("requestfinished", async (request) => {
    const { responseBodySize } = await request.sizes().catch(() => ({ responseBodySize: 0 }));
    const url = request.url();
    const kind = url.includes("/models/") ? "models" : url.includes("/textures/") ? "textures" : request.resourceType() === "script" ? "script" : "other";
    transferred[kind] += Math.max(0, responseBodySize);
  });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => (window.__scene?.frames ?? 0) > 0, null, { timeout: 15000 });
  // Let the fade-in and the one-time pulse finish before measuring idle.
  await page.waitForTimeout(3500);
  const before = await page.evaluate(() => window.__scene.frames);
  await page.waitForTimeout(2000);
  const stats = await page.evaluate(() => ({
    frames: window.__scene.frames,
    triangles: window.__scene.triangles,
    calls: window.__scene.calls,
  }));
  const file = path.join(out, `${label}-${width}x${height}.png`);
  await page.screenshot({ path: file });
  console.log(
    `${width}x${height}: ${stats.triangles} triangles, ${stats.calls} draw calls, ` +
      `${stats.frames - before} frames drawn in 2 s idle, ${errors.length} console errors -> ${path.relative(root, file)}`,
  );
  for (const e of errors) console.log(`  error: ${e}`);
  console.log(
    `  transferred on first load: 3D assets ${transferred.models + transferred.textures} bytes ` +
      `(models ${transferred.models}, textures ${transferred.textures}), scripts ${transferred.script}, everything else ${transferred.other}`,
  );
  await context.close();

  // Frame rate at the real pixel ratio for that device class.
  const perf = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile, hasTouch: isMobile });
  await measureFps(perf, width, height);
  await perf.close();
}
await browser.close();

const bytes = (dir) =>
  existsSync(path.join(root, dir))
    ? Number(execSync(`find "${path.join(root, dir)}" -type f -exec stat -f %z {} + | awk '{s+=$1} END {print s+0}'`).toString())
    : 0;
console.log(`3D asset bytes: models ${bytes("public/models")}, textures ${bytes("public/textures")}`);
console.log("Open TODOs:");
console.log(execSync(`grep -rn "TODO(noah)" "${path.join(root, "src/content")}" | sed "s|${root}/||" || true`).toString());
