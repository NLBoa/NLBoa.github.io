// End-to-end checks of the Phase 2 behavior, against the dev server on :3000.
// Usage: npm run flows
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
  await page.tap(`.tiles ${a("/projects/aegis-orbit")}`);
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

// 8. A project told as a story, and its miniature --------------------------------
{
  const route = "/projects/aegis-orbit";
  const phase = (page) => page.getAttribute(".miniature svg", "data-phase");
  const buttons = (page) => page.locator(".miniature button").allTextContents();

  // In the HTML itself, so it shows without JavaScript.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto(base + route, { waitUntil: "load" });
  check("story page: the miniature's drawing is in the HTML without JavaScript", (await plain.locator(".miniature svg path").count()) > 3);
  check("story page: without JavaScript there are no dead buttons", (await plain.locator(".miniature button").count()) === 0);
  const plainText = await plain.textContent("main.page");
  check("story page: the story is readable without JavaScript", ["What it is", "How it works", "My part", "Catalog explorer"].every((t) => plainText.includes(t)));
  await context.close();

  const { context: desktop, page, errors } = await open(route);
  await page.waitForFunction(() => document.querySelector(".miniature svg")?.dataset.phase === "decision", null, { timeout: 8000 });
  check("miniature: plays to the decision and stops", JSON.stringify(await buttons(page)) === JSON.stringify(["Approve burn", "Stay on course"]));
  const fold = await page.evaluate(() => document.querySelector(".miniature-bar").getBoundingClientRect().bottom);
  check("miniature: the drawing and its buttons fit a 1440x900 screen", fold <= 900, `bottom ${fold.toFixed(0)}px`);
  await page.screenshot({ path: path.join(out, "story-aegis-orbit-1440x900.png") });

  await page.click(".miniature button.primary");
  check("miniature: Approve burn starts the burn", (await phase(page)) === "burned");
  await page.waitForSelector(".mini-ghost", { timeout: 3000 });
  check("miniature: the ghost flies the course not taken", true);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(out, "story-aegis-orbit-ghost-1440x900.png") });
  await page.waitForFunction(() => document.querySelector(".miniature svg")?.dataset.phase === "done", null, { timeout: 15000 });
  check("miniature: with the burn the spacecraft survives the pass", (await page.locator(".mini-craft").count()) === 1 && (await page.locator(".mini-clearance").count()) === 1);

  await page.click(".miniature button");
  check("miniature: Replay starts again", (await phase(page)) === "approach");
  await page.click(".miniature button:not(.primary)");
  check("miniature: the choice can be made before the clock stops", (await phase(page)) === "rejected");
  await page.waitForFunction(() => document.querySelector(".miniature svg")?.dataset.phase === "done", null, { timeout: 20000 });
  check("miniature: without the burn the spacecraft is lost at the pass", (await page.locator(".mini-craft").count()) === 0 && (await page.locator(".mini-hit").count()) === 1);

  await page.click(`.pager ${a("/projects/shell")}`);
  await page.waitForURL(at("/projects/shell"));
  check("story page: the pager leads to the next project", true);
  check("no console errors on the story page", errors.length === 0, errors.slice(0, 2).join(" | "));
  await desktop.close();

  // Reduced motion: nothing plays; the buttons step between stills.
  const still = await open(route, { reducedMotion: "reduce" });
  await still.page.waitForSelector(".miniature button.primary");
  check("reduced motion: the miniature starts at the decision", (await phase(still.page)) === "decision");
  await still.page.click(".miniature button.primary");
  check("reduced motion: the outcome is shown at once", (await phase(still.page)) === "done" && (await still.page.locator(".mini-clearance").count()) === 1);
  await still.context.close();

  // Phone.
  const phone = await open(route, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await phone.page.waitForSelector(".miniature button.primary");
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("phone: the story page does not overflow sideways", overflow <= 0, `${overflow}px`);
  const smallest = await phone.page.evaluate(() => Math.min(...[...document.querySelectorAll(".miniature button")].map((b) => b.getBoundingClientRect().height)));
  check("phone: the miniature's buttons are at least 44px tall", smallest >= 44, `${smallest}px`);
  await phone.page.waitForFunction(() => document.querySelector(".miniature svg")?.dataset.phase === "decision", null, { timeout: 8000 });
  await phone.page.screenshot({ path: path.join(out, "story-aegis-orbit-390x844.png") });
  await phone.page.tap(".miniature button.primary");
  check("phone: tapping Approve burn works", (await phase(phone.page)) === "burned");
  await phone.context.close();
}

// 9. Every project's story page and miniature -----------------------------------
{
  const phase = (page, selector, name) => page.getAttribute(selector, name);
  const status = (page) => page.textContent(".miniature-status");
  const act = (page, n = 0) => page.click(`.miniature-bar button >> nth=${n}`);

  // What each miniature must do when it is used.
  const uses = {
    argus: async (page) => {
      const at = (id) => page.evaluate((id) => document.querySelector(`.mini-plan-task[data-task="${id}"]`)?.getAttribute("style").replace(/\s/g, "").replace(/;$/, "") ?? "none", id);
      const deadlines = () => page.locator(".mini-plan-deadlines .mini-plan-title").allTextContents();
      check("argus: every deadline starts as work on the calendar", (await page.locator(".mini-plan-task").count()) === 5 && (await at("exam")) === "--day:2;--start:2;--length:3");
      await act(page);
      check("argus: a new assignment is listed and takes the first free time", (await deadlines()).includes("Lab 4") && (await at("lab")) === "--day:0;--start:4;--length:2" && (await at("problem-set")) === "--day:1;--start:1;--length:2");
      await act(page);
      check("argus: a moved exam jumps ahead on the calendar", (await at("exam")) === "--day:1;--start:1;--length:3" && (await page.textContent(".mini-plan-deadlines li[data-flag] .mini-plan-flag")) === "Moved");
      await act(page);
      check("argus: a meeting pushes the work around it", (await page.locator('.mini-plan-busy[data-kind="meeting"]').count()) === 1 && (await at("quiz")) === "--day:2;--start:4;--length:1" && (await at("essay")) === "--day:3;--start:1;--length:2");
      await page.waitForTimeout(800); // the blocks glide to their new times
      const overlap = await page.evaluate(() => {
        const boxes = [...document.querySelectorAll(".mini-plan-block i")].map((el) => el.getBoundingClientRect());
        return boxes.some((p, i) => boxes.some((q, j) => j > i && p.left < q.right - 1 && q.left < p.right - 1 && p.top < q.bottom - 1 && q.top < p.bottom - 1));
      });
      check("argus: nothing on the calendar overlaps", !overlap);
      await act(page);
      check("argus: then it starts over", (await phase(page, ".mini-plan", "data-step")) === "planned" && (await page.locator(".mini-plan-task").count()) === 5);
    },
    "smart-display": async (page) => {
      const style = (id) => page.evaluate((id) => document.querySelector(`[data-widget="${id}"]`).getAttribute("style").replace(/\s/g, "").replace(/;$/, ""), id);
      await page.click(".mini-lights button >> nth=1");
      check("smart display: tapping a light switches it", (await page.getAttribute(".mini-lights button >> nth=1", "aria-pressed")) === "true");
      const still = await style("spotify");
      const box = await page.locator(".mini-board").boundingBox();
      const cell = (x, y) => [box.x + ((x + 0.5) / 6) * box.width, box.y + ((y + 0.5) / 4) * box.height];
      const dragTo = async (from, to) => {
        await page.mouse.move(...from);
        await page.mouse.down();
        await page.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 4 });
        await page.mouse.move(...to, { steps: 4 });
        await page.mouse.up();
        await page.waitForTimeout(300);
      };
      await dragTo(cell(3, 0), cell(2, 2));
      check("smart display: widgets stay put until Arrange is on", (await style("spotify")) === still);
      await act(page);
      await dragTo(cell(3, 0), cell(2, 2));
      check("smart display: a widget can be dragged to free space", (await style("spotify")) === "--x:2;--y:2;--w:1;--h:2");
      const handle = await page.locator('[data-widget="spotify"] .mini-handle').boundingBox();
      await dragTo([handle.x + handle.width / 2, handle.y + handle.height / 2], cell(4, 3));
      check("smart display: a widget can be resized from its corner", (await style("spotify")) === "--x:2;--y:2;--w:3;--h:2");
      await dragTo(cell(0, 2), cell(0, 0));
      check("smart display: a widget cannot land on another", (await style("grocery")) === "--x:0;--y:2;--w:2;--h:2");
      await page.locator('[data-widget="grocery"]').focus();
      await page.keyboard.press("ArrowDown");
      check("smart display: a move that does not fit says so", (await status(page)) === "It does not fit there.");
      await page.locator('[data-widget="lights"]').focus();
      await page.keyboard.press("ArrowLeft");
      check("smart display: arrow keys move the focused widget", (await style("lights")) === "--x:3;--y:0;--w:2;--h:2");
      await act(page, 1);
      check("smart display: Reset restores the layout", (await style("spotify")) === "--x:3;--y:0;--w:1;--h:2");
    },
    jupiterp: async (page) => {
      const listed = () => page.locator(".mini-jup-listed li").allTextContents();
      check("jupiterp: the generator starts with the planned courses", (await listed()).join() === "CMSC131,MATH140");
      await page.click('.mini-jup-catalog button[data-course="c4"]');
      check("jupiterp: planning a course adds it to the generator", (await listed()).join() === "CMSC131,MATH140,BMGT110" && (await page.locator('.mini-jup-week i[data-course="c4"]').count()) === 2);
      await page.click('.mini-jup-catalog button[data-course="c1"]');
      check("jupiterp: dropping a course removes it from the generator", (await listed()).join() === "MATH140,BMGT110" && (await page.locator('.mini-jup-week i[data-course="c1"]').count()) === 0);
    },
    shell: async (page) => {
      const typing = () => phase(page, ".mini-term", "data-typing");
      const text = () => page.evaluate(() => [...document.querySelectorAll(".mini-term p")].map((p) => p.textContent).join("\n"));
      check("shell: the session starts with the first commands run", (await text()).includes("echo is a shell builtin") && (await typing()) === "false");
      await act(page);
      check("shell: the next command is typed out", (await typing()) === "true");
      await act(page);
      check("shell: the button skips the typing", (await typing()) === "false" && (await text()).includes('two  spaces and "quotes"'));
      for (let i = 0; i < 3; i++) {
        await act(page);
        await act(page);
      }
      check("shell: the session ends with the background job", (await text()).includes("[1]+  Running                 sleep 30 &") && (await page.textContent(".miniature-bar button")) === "Start over");
      await act(page);
      await act(page);
      check("shell: Start over begins again", (await phase(page, ".mini-term", "data-group")) === "builtins");
    },
  };

  for (const slug of ["argus", "smart-display", "jupiterp", "shell"]) {
    const route = `/projects/${slug}`;

    const plainContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const plain = await plainContext.newPage();
    await plain.goto(base + route, { waitUntil: "load" });
    const plainText = await plain.textContent("main.page");
    check(`${slug}: the miniature and the story are in the HTML without JavaScript`, (await plain.locator(".miniature .miniature-stage > *").count()) === 1 && plainText.includes("What it is") && plainText.includes("Built with"));
    check(`${slug}: without JavaScript no button can be pressed`, (await plain.locator(".miniature button:not([disabled])").count()) === 0);
    await plainContext.close();

    const { context, page, errors } = await open(route);
    await page.waitForSelector(".miniature-bar");
    await page.waitForTimeout(400);
    const fold = await page.evaluate(() => document.querySelector(".miniature-bar").getBoundingClientRect().bottom);
    check(`${slug}: the miniature and its buttons fit a 1440x900 screen`, fold <= 900, `bottom ${fold.toFixed(0)}px`);
    await page.screenshot({ path: path.join(out, `story-${slug}-1440x900.png`) });
    await uses[slug](page);
    check(`${slug}: no console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));
    await context.close();

    const phone = await open(route, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await phone.page.waitForSelector(".miniature-bar");
    await phone.page.waitForTimeout(400);
    const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${slug}: phone: nothing overflows sideways`, overflow <= 0, `${overflow}px`);
    const smallest = await phone.page.evaluate(() => Math.min(...[...document.querySelectorAll(".miniature-bar button, .mini-jup-catalog button, .mini-bus-roster button")].map((b) => b.getBoundingClientRect().height)));
    check(`${slug}: phone: buttons are at least 44px tall`, smallest >= 44, `${smallest}px`);
    await phone.page.screenshot({ path: path.join(out, `story-${slug}-390x844.png`) });
    await phone.context.close();
  }

  // Reduced motion: the terminal does not type.
  const still = await open("/projects/shell", { reducedMotion: "reduce" });
  await still.page.waitForSelector(".miniature-bar button");
  await still.page.click(".miniature-bar button");
  check("reduced motion: the shell's next command appears at once", (await still.page.getAttribute(".mini-term", "data-typing")) === "false" && (await still.page.getAttribute(".mini-term", "data-group")) === "quoting");
  await still.context.close();

  // SKIBUS is off the site for now.
  const parked = await (await browser.newPage()).goto(base + "/projects/skibus");
  check("a parked project has no page", parked.status() === 404);

  // MID has nothing built to draw: a story page without a miniature.
  const { context, page } = await open("/projects/mid");
  check("mid: a story page without a miniature still reads", (await page.locator(".miniature").count()) === 0 && (await page.textContent("main.page")).includes("What it is"));
  await page.screenshot({ path: path.join(out, "story-mid-1440x900.png") });
  // The pager walks the whole set, last to first.
  let walked = ["mid"];
  for (const previous of ["shell", "aegis-orbit", "jupiterp", "smart-display", "argus"]) {
    await page.click(`.pager ${a("/projects/" + previous)}`);
    await page.waitForURL(at("/projects/" + previous));
    walked.push(previous);
  }
  check("the pager walks through all six projects", walked.length === 6 && (await page.locator(".pager a").count()) === 1);
  await context.close();
}

// 10. Close and Esc on every kind of page -----------------------------------------
{
  for (const route of ["/projects", "/projects/argus", "/about", "/contact", "/credits"]) {
    const { context, page } = await open(route);
    await page.waitForSelector(".page-close");
    const box = await page.locator(".page-close").boundingBox();
    const navRight = await page.evaluate(() => document.querySelector(".site-nav").getBoundingClientRect().right);
    check(`${route}: Close is in the top-right corner, in line with the header`, Math.abs(box.x + box.width - navRight) <= 1 && box.y < 140, `right ${(box.x + box.width).toFixed(0)}px, top ${box.y.toFixed(0)}px`);
    await page.evaluate(() => window.scrollTo(0, 600));
    const after = await page.locator(".page-close").boundingBox();
    check(`${route}: Close stays put while the page scrolls`, Math.abs(after.y - box.y) <= 1);
    await page.click(".page-close");
    await page.waitForURL(at("/"), { timeout: 3000 });
    check(`${route}: Close returns to the desk`, true);
    await context.close();
  }
  // A host that keeps the key-down and passes on only the key-up.
  const { context, page } = await open("/projects");
  await page.waitForSelector(".page-close");
  await page.keyboard.up("Escape");
  await page.waitForURL(at("/"), { timeout: 3000 });
  check("Esc closes the page even when only its key-up arrives", true);
  await context.close();

  const phone = await open("/projects/argus", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const size = await phone.page.locator(".page-close").boundingBox();
  check("phone: Close is a 44px target inside the screen", size.height >= 44 && size.x + size.width <= 390, `${size.height}px tall`);
  await phone.context.close();
}

// Checks that belong to one feature live in scripts/checks/, one file each.
{
  const dir = path.resolve(import.meta.dirname, "checks");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort() : [];
  for (const file of files) {
    const { default: run } = await import(pathToFileURL(path.join(dir, file)).href);
    await run({ browser, base, out, open, check, at, a, sceneReady, settle, locate, pointAt, frames });
  }
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
