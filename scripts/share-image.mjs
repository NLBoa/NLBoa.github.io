// Captures the desk as the link-preview image (1200x630).
// Needs a running server (dev on :3000, or set BASE_URL). Usage: npm run share-image
import { chromium } from "playwright-core";
import path from "node:path";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = path.resolve(import.meta.dirname, "../src/app/opengraph-image.png");

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await context.newPage();
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForSelector('.scene[data-ready="true"]', { timeout: 15000 });
// Only the desk and the name: no nav, footer or dev tools in the picture.
await page.addStyleTag({ content: ".site-nav, .site-footer, nextjs-portal { display: none !important; }" });
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
await browser.close();
console.log(out);
