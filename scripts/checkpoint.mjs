// Checkpoint report: screenshots at the two review sizes plus scene numbers.
// Needs the dev server on :3000 and Google Chrome installed.
// Usage: node scripts/checkpoint.mjs <label> [route]
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const [label = "checkpoint", route = "/"] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "docs/checkpoints");
mkdirSync(out, { recursive: true });

const sizes = [
  { width: 1440, height: 900, isMobile: false },
  { width: 390, height: 844, isMobile: true },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const { width, height, isMobile } of sizes) {
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
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => (window.__scene?.frames ?? 0) > 0, null, { timeout: 15000 });
  await page.waitForTimeout(500);
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
  await context.close();
}
await browser.close();

const bytes = (dir) =>
  existsSync(path.join(root, dir))
    ? Number(execSync(`find "${path.join(root, dir)}" -type f -exec stat -f %z {} + | awk '{s+=$1} END {print s+0}'`).toString())
    : 0;
console.log(`3D asset bytes: models ${bytes("public/models")}, textures ${bytes("public/textures")}`);
console.log("Open TODOs:");
console.log(execSync(`grep -rn "TODO(noah)" "${path.join(root, "src/content")}" | sed "s|${root}/||" || true`).toString());
