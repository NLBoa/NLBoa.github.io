// A screenshot of one route, for looking at work in progress.
// Usage: node scripts/shot.mjs <route> <file.png> [width] [height] [wait ms] [full] [click selector,...]
import { chromium } from "playwright-core";

const [, , route = "/", file = "shot.png", width = "1440", height = "900", wait = "1500", full = "", clicks = ""] = process.argv;
const base = process.env.BASE_URL ?? "http://localhost:3000";
const phone = Number(width) < 600;

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: 1,
  ...(phone ? { isMobile: true, hasTouch: true } : {}),
});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
await page.goto(base + route, { waitUntil: "networkidle" });
await page.waitForTimeout(Number(wait));
for (const selector of clicks.split(",").filter(Boolean)) {
  await page.click(selector);
  await page.waitForTimeout(700);
}
await page.screenshot({ path: file, fullPage: full === "full" });
console.log(file, "overflow", await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
await browser.close();
