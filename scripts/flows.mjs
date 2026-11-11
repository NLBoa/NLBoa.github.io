// End-to-end checks of the Phase 2 behavior, against the dev server on :3000.
// Usage: npm run flows
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import path from "node:path";

// BASE_URL may include a base path, e.g. http://localhost:3200/portfolio
const baseUrl = new URL(process.env.BASE_URL ?? "http://localhost:3000");
const prefix = baseUrl.pathname.replace(/\/+$/, "");
const base = baseUrl.origin + prefix;
const norm = (p) => p.replace(/\/+$/, "");
/** True when a URL is the given site path, with or without a trailing slash. */
const at = (sitePath) => (url) => norm(new URL(url).pathname) === norm(prefix + sitePath);
/** Selector for a link to a site path, whichever way its href is written. */
const a = (sitePath) => {
  const href = norm(prefix + sitePath);
  return `:is(a[href="${href || "/"}"], a[href="${href}/"])`;
};
const out = path.resolve(import.meta.dirname, "../docs/checkpoints");
mkdirSync(out, { recursive: true });

let failures = 0;
function check(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
}

const browser = await chromium.launch({ channel: "chrome" });

async function open(route, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  // Failed requests are reported with their address, which the console message lacks.
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await page.goto(base + route, { waitUntil: "networkidle" });
  return { context, page, errors };
}

const sceneReady = (page) => page.waitForSelector('.scene[data-ready="true"]', { timeout: 15000 });
const settle = (page) => page.waitForTimeout(3600); // fade-in + the one-time pulse
const locate = (page, id) => page.evaluate((id) => window.__scene.locate(id), id);
const frames = (page) => page.evaluate(() => window.__scene.frames);

// Offsets from an object's label anchor down onto the object itself.
const onto = { "monitor-left": 120, "monitor-right": 130, "pen-cup": 75 };
async function pointAt(page, id) {
  const p = await locate(page, id);
  const y = p.y + (onto[id] ?? (id.startsWith("key-") ? 22 : 8));
  await page.mouse.move(p.x, y, { steps: 4 });
  return { x: p.x, y };
}

// 1. Desk: hover, label, click, Esc, Back --------------------------------------
{
  const { context, page, errors } = await open("/");
  await sceneReady(page);
  await settle(page);

  const before = await frames(page);
  await page.waitForTimeout(1500);
  check("idle desk draws no frames", (await frames(page)) === before, `${(await frames(page)) - before} frames`);

  await pointAt(page, "monitor-left");
  await page.waitForTimeout(400);
  check("hovering the left monitor shows its label", (await page.textContent("#scene-label")) === "Projects");
  check("label is visible", (await page.getAttribute("#scene-label", "data-visible")) === "true");
  await page.screenshot({ path: path.join(out, "phase-2-hover-1440x900.png") });

  const cup = await pointAt(page, "pen-cup");
  await page.waitForTimeout(300);
  check("hovering the pen cup shows Contact", (await page.textContent("#scene-label")) === "Contact");

  // Keyboard and trackpad are decoration.
  await page.mouse.move(660, 665, { steps: 3 });
  await page.waitForTimeout(300);
  check("the keyboard does not react", (await page.getAttribute("#scene-label", "data-visible")) === "false");

  const monitor = await pointAt(page, "monitor-left");
  const t0 = Date.now();
  await page.mouse.click(monitor.x, monitor.y);
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  const took = Date.now() - t0;
  check("clicking the left monitor opens /projects in about a second", took < 1500, `${took} ms`);
  await page.waitForSelector("main.page h1");
  check("the Projects page is ordinary HTML", (await page.textContent("main.page h1")) === "Projects");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "phase-2-projects-1440x900.png") });

  await page.keyboard.press("Escape");
  await page.waitForURL(at("/"), { timeout: 3000 });
  check("Esc returns to the desk", at("/")(page.url()));
  await page.waitForTimeout(1200);

  const right = await pointAt(page, "monitor-right");
  await page.mouse.click(right.x, right.y);
  await page.waitForURL(at("/about"), { timeout: 3000 });
  check("clicking the right monitor opens /about", true);
  await page.goBack();
  await page.waitForURL(at("/"), { timeout: 3000 });
  check("Back returns to the desk", at("/")(page.url()));
  await page.waitForTimeout(1200);

  await pointAt(page, "pen-cup");
  await page.mouse.click(cup.x, cup.y);
  await page.waitForURL(at("/contact"), { timeout: 3000 });
  check("clicking the pen cup opens /contact", true);
  await page.keyboard.press("Escape");
  await page.waitForURL(at("/"), { timeout: 3000 });
  await page.waitForTimeout(1200);

  const key = await pointAt(page, "key-0");
  await page.waitForTimeout(300);
  check("hovering the first Stream Deck key names its project", (await page.textContent("#scene-label")) === "Argus");
  await page.mouse.click(key.x, key.y);
  await page.waitForURL(at("/projects/argus"), { timeout: 3000 });
  check("pressing that key opens /projects/argus", true);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "phase-2-project-1440x900.png") });

  // Header links work from a page.
  await page.click(`.site-nav ${a("/about")}`);
  await page.waitForURL(at("/about"), { timeout: 3000 });
  check("header links work from any page", true);

  check("no console errors on the desk flow", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();
}

// 2. Keyboard access ------------------------------------------------------------
{
  const { context, page } = await open("/");
  await sceneReady(page);
  await settle(page);
  await page.keyboard.press("Tab"); // name
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab"); // header links
  const seen = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(60);
    const inHotspots = await page.evaluate(() => Boolean(document.activeElement?.closest(".hotspots")));
    if (!inHotspots) break;
    seen.push(await page.textContent("#scene-label"));
  }
  const expected = ["Projects", "About", "Argus", "Smart Display", "Jupiterp", "Aegis Orbit", "About", "Contact", "Résumé", "GitHub", "LinkedIn", "Contact"];
  check("Tab visits monitors, then the keys, then the pen cup", JSON.stringify(seen) === JSON.stringify(expected), seen.join(", "));

  // Shift+Tab back to the Argus key and press Enter.
  for (let i = 0; i < 9; i++) await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(100);
  check("focus shows the label", (await page.textContent("#scene-label")) === "Argus");
  await page.screenshot({ path: path.join(out, "phase-2-focus-1440x900.png") });
  await page.keyboard.press("Enter");
  await page.waitForURL(at("/projects/argus"), { timeout: 3000 });
  check("Enter activates the focused object", true);
  await context.close();
}

// 3. Direct URL: page at once, no forced fly-in ---------------------------------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const response = await page.goto(base + "/projects/argus", { waitUntil: "commit" });
  const html = await response.text();
  check("/projects/argus is in the server's HTML", html.includes("Always-on course hub") && html.includes("What I built"));
  await page.waitForSelector("main.page h1");
  await sceneReady(page);
  await page.waitForTimeout(300);
  const before = await frames(page);
  await page.waitForTimeout(1200);
  check("direct load does not fly the camera", (await frames(page)) - before === 0, `${(await frames(page)) - before} frames after ready`);
  const missing = await page.goto(base + "/projects/nope");
  check("an unknown project is a 404", missing.status() === 404);
  await context.close();
}

// 4. No WebGL: the home page is the Projects index -------------------------------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    delete window.WebGL2RenderingContext;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return String(type).startsWith("webgl") ? null : original.call(this, type, ...rest);
    };
  });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  check("without WebGL the home page shows the Projects index", await page.isVisible(".home-index .project-list"));
  check("without WebGL there is no canvas", (await page.locator("canvas").count()) === 0);
  await page.click(`.home-index ${a("/projects/argus")}`);
  await page.waitForURL(at("/projects/argus"));
  check("without WebGL a project is one click from home", true);
  await page.click(`.site-nav ${a("/contact")}`);
  await page.waitForURL(at("/contact"));
  check("without WebGL the header still works", true);
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(out, "phase-2-no-webgl-1440x900.png") });
  await context.close();
}

// 5. Reduced motion: cut between views, no pulse ---------------------------------
{
  const { context, page } = await open("/", { reducedMotion: "reduce" });
  await sceneReady(page);
  await page.waitForTimeout(600);
  const before = await frames(page);
  await page.waitForTimeout(2500);
  check("reduced motion: no pulse", (await frames(page)) - before === 0, `${(await frames(page)) - before} frames`);
  const monitor = await pointAt(page, "monitor-left");
  const t0 = Date.now();
  await page.mouse.click(monitor.x, monitor.y);
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  check("reduced motion: the page opens without a flight", Date.now() - t0 < 450, `${Date.now() - t0} ms`);
  await context.close();
}

// 6. Phone ------------------------------------------------------------------------
{
  const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
  const { context, page } = await open("/", phone);
  await sceneReady(page);
  await settle(page);
  check("phone: the featured projects are listed under the desk", await page.isVisible(`.dock ${a("/projects/argus")}`));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("phone: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  const nav = await page.evaluate(() => document.querySelector(".site-nav").getBoundingClientRect().right);
  check("phone: the header fits", nav <= 390, `right edge ${nav.toFixed(0)}px`);
  const p = await locate(page, "monitor-left");
  await page.touchscreen.tap(p.x, p.y + 50);
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  check("phone: tapping the left monitor opens /projects", true);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, "phase-2-projects-390x844.png") });
  await page.tap(`.project-list ${a("/projects/aegis-orbit")}`);
  await page.waitForURL(at("/projects/aegis-orbit"));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "phase-2-project-390x844.png") });
  check("phone: a project is two taps from home", true);
  await context.close();
}

// 7. Shipping details: credits, titles, share image, 404 -------------------------
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  check("home has a title and a share image", (await page.title()) === "Noah Leibovitz" && (await page.locator('meta[property="og:image"]').count()) === 1);
  const image = await page.getAttribute('meta[property="og:image"]', "content");
  // The tag carries the public address; fetch the same file from this server.
  const imageUrl = new URL(image);
  const imageResponse = await page.request.get(baseUrl.origin + imageUrl.pathname + imageUrl.search);
  check("the share image loads", imageResponse.ok() && imageResponse.headers()["content-type"] === "image/png");
  await page.waitForSelector('.scene[data-ready="true"]');
  await page.click(`.site-footer ${a("/credits")}`);
  await page.waitForURL(at("/credits"));
  await page.waitForFunction(() => document.title !== "", null, { timeout: 3000 });
  check("the footer links to Credits", (await page.title()) === "Credits | Noah Leibovitz");
  const text = await page.textContent("main.page");
  check("Credits names the keyboard model, its creator and license", text.includes("Apple Magic Keyboard") && text.includes("infohack") && text.includes("CC BY 4.0"));
  check("Credits links the exact license", (await page.locator('main.page a[href="http://creativecommons.org/licenses/by/4.0/"]').count()) === 1);
  await page.goto(base + "/projects/argus");
  check("project pages have their own title", (await page.title()) === "Argus | Noah Leibovitz");
  const missing = await page.goto(base + "/nothing-here");
  check("an unknown address is a 404 with a way back", missing.status() === 404 && (await page.isVisible(`main.page ${a("/")}`)));
  await page.screenshot({ path: path.join(out, "phase-3-404-1440x900.png") });
  await page.goto(base + "/credits", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "phase-3-credits-1440x900.png") });
  const sitemap = await page.request.get(base + "/sitemap.xml");
  check("sitemap lists the project pages", sitemap.ok() && (await sitemap.text()).includes("/projects/argus"));
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
