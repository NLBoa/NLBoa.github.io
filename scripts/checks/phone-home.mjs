// Feature: the home page on an upright screen (branch phone-home, docs/features/phone-home.md).
// The desk is a banner across the top and every project is a tile under it.
import path from "node:path";

const touch = (width, height) => ({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

/** Everything the checks need to know about the page's layout, in one read. */
const layout = (page) =>
  page.evaluate(() => {
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const one = (selector) => {
      const el = document.querySelector(selector);
      return el && el.getClientRects().length ? rect(el) : null;
    };
    const tiles = [...document.querySelectorAll(".home-tile")].filter((el) => el.getClientRects().length);
    return {
      width: innerWidth,
      height: innerHeight,
      scrolls: document.documentElement.scrollHeight - innerHeight,
      overflow: document.documentElement.scrollWidth - innerWidth,
      canvas: one(".scene canvas"),
      panel: one(".home-tiles"),
      index: one(".home-index"),
      credits: one(".site-footer a"),
      dock: document.querySelectorAll(".dock").length,
      tiles: tiles.map((el) => ({ ...rect(el), href: el.getAttribute("href"), target: el.getAttribute("target"), title: el.textContent.trim() })),
    };
  });

const near = (a, b, by = 1) => Math.abs(a - b) <= by;

export default async function phoneHome({ browser, base, open, check, at, a, sceneReady, settle, locate, out }) {
  // The tiles are in the page's own HTML: there with JavaScript switched off.
  {
    const context = await browser.newContext({ ...touch(390, 660), javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(base + "/");
    check("phone home: the six tiles are in the HTML without JavaScript", (await page.locator(".home-tile").count()) === 6);
    await context.close();
  }

  // A phone with its browser bars showing: the size of Noah's screenshot.
  {
    const { context, page, errors } = await open("/", touch(390, 660));
    await sceneReady(page);
    await settle(page);
    const l = await layout(page);

    const titles = l.tiles.map((t) => t.title).join(", ");
    check("phone home: five projects and More on GitHub, in the site's order", titles === "Argus, Smart Display, Jupiterp, Aegis Orbit, Shell, More on GitHub", titles);
    check("phone home: every tile is on screen without scrolling", l.tiles.length === 6 && l.tiles.every((t) => t.top >= 0 && t.bottom <= l.height && t.left >= 0 && t.right <= l.width) && l.scrolls <= 0, `scrolls ${l.scrolls}px`);
    const smallest = Math.min(...l.tiles.map((t) => t.height));
    check("phone home: every tile is at least 44px tall", smallest >= 44, `${smallest.toFixed(0)}px`);
    check("phone home: nothing overflows sideways", l.overflow <= 0, `${l.overflow}px`);
    check("phone home: two tiles to a row", near(l.tiles[0].top, l.tiles[1].top) && l.tiles[2].top > l.tiles[1].bottom);
    const last = l.tiles[5];
    check("phone home: the last tile opens GitHub in a new tab", /^https:\/\/github\.com\//.test(last.href) && last.target === "_blank", last.href);

    check("phone home: the desk is a banner across the top", l.canvas && near(l.canvas.top, 0) && near(l.canvas.left, 0) && near(l.canvas.width, l.width), JSON.stringify(l.canvas));
    check("phone home: the tiles start where the banner ends", near(l.canvas.bottom, l.panel.top), `${l.canvas.bottom} / ${l.panel.top}`);
    check("phone home: the banner is wider than it is tall, and at least 240px", l.canvas.width >= l.canvas.height && l.canvas.height >= 240, `${l.canvas.width} x ${l.canvas.height}`);
    check("phone home: Credits is a 44px target at the foot of the screen", l.credits && l.credits.height >= 44 && l.credits.bottom <= l.height, JSON.stringify(l.credits));
    check("phone home: the old list over the desk is gone", l.dock === 0);

    // The whole desk is in the banner: its far corners' objects are inside it, under the header.
    const spots = await Promise.all(["monitor-left", "monitor-right", "pen-cup"].map((id) => locate(page, id)));
    check(
      "phone home: both monitors and the pen cup are inside the banner, below the header's text",
      spots.every((p) => p.x > 0 && p.x < l.width && p.y > 44 && p.y < l.canvas.height),
      spots.map((p) => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" "),
    );
    await page.screenshot({ path: path.join(out, "phone-home-390x660.png") });

    // One tap on a tile opens the project.
    await page.tap(`.home-tiles ${a("/projects/argus")}`);
    await page.waitForURL(at("/projects/argus"), { timeout: 3000 });
    check("phone home: one tap on a tile opens the project", true);
    const behind = await layout(page);
    check("phone home: the banner is the same size behind a page", near(behind.canvas.height, l.canvas.height) && near(behind.canvas.width, l.canvas.width), `${behind.canvas.height} / ${l.canvas.height}`);

    // And the desk still answers a tap.
    await page.goBack();
    await page.waitForURL(at("/"));
    await page.waitForTimeout(900);
    const monitor = await locate(page, "monitor-left");
    await page.touchscreen.tap(monitor.x, monitor.y + 30);
    await page.waitForURL(at("/projects"), { timeout: 3000 });
    check("phone home: a tap on the left monitor opens Projects", true);
    check("phone home: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
    await context.close();
  }

  // The tiles do not wait for the desk: with its models held back they are already in place.
  {
    const context = await browser.newContext(touch(390, 660));
    await context.route("**/models/**", () => {}); // never answered
    const page = await context.newPage();
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".scene", { state: "attached", timeout: 15000 });
    await page.waitForTimeout(600);
    const l = await layout(page);
    const ready = await page.locator('.scene[data-ready="true"]').count();
    check("phone home: the tiles are in place before the desk has loaded", ready === 0 && l.tiles.length === 6 && l.tiles.every((t) => t.bottom <= l.height) && l.panel.top >= 240, `ready ${ready}, panel at ${l.panel?.top}`);
    await page.tap(`.home-tiles ${a("/projects/shell")}`);
    await page.waitForURL(at("/projects/shell"), { timeout: 3000 });
    check("phone home: and they work before the desk has loaded", true);
    await context.close();
  }

  // Other upright screens: the smallest phone, a tall one with no browser bars, a tablet.
  for (const [width, height, columns] of [
    [375, 553, 2],
    [390, 844, 2],
    [430, 739, 2],
    [768, 1024, 3],
  ]) {
    const { context, page } = await open("/", touch(width, height));
    await sceneReady(page);
    const l = await layout(page);
    const fits = l.tiles.length === 6 && l.tiles.every((t) => t.bottom <= l.height && t.height >= 44) && l.scrolls <= 0 && l.overflow <= 0;
    const perRow = l.tiles.filter((t) => near(t.top, l.tiles[0].top)).length;
    check(`phone home: ${width}x${height}: six tiles on one screen, ${columns} to a row`, fits && perRow === columns, `${perRow} to a row, scrolls ${l.scrolls}px`);
    check(`phone home: ${width}x${height}: the banner is wider than tall and ends at the tiles`, l.canvas.width >= l.canvas.height && near(l.canvas.bottom, l.panel.top), `${l.canvas.width} x ${l.canvas.height}`);
    await page.waitForTimeout(3600);
    await page.screenshot({ path: path.join(out, `phone-home-${width}x${height}.png`) });
    await context.close();
  }

  // Without WebGL there is no banner: the page is the plain index, as on any screen.
  {
    const context = await browser.newContext(touch(390, 660));
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
    const l = await layout(page);
    check("phone home: without WebGL the page is the Projects index, with no tiles and no gap for a banner", l.index && l.index.top < 10 && l.tiles.length === 0 && !l.canvas, JSON.stringify(l.index));
    await page.tap(`.home-index ${a("/projects/shell")}`);
    await page.waitForURL(at("/projects/shell"));
    check("phone home: without WebGL a project is one tap from home", true);
    await context.close();
  }

  // A wide window is untouched: the desk fills it and there are no tiles.
  for (const [name, options] of [
    ["a laptop", { viewport: { width: 1440, height: 900 } }],
    ["a phone held sideways", touch(844, 390)],
  ]) {
    const { context, page } = await open("/", options);
    await sceneReady(page);
    const l = await layout(page);
    check(`phone home: on ${name} the desk fills the window and there are no tiles`, l.tiles.length === 0 && !l.panel && near(l.canvas.width, l.width) && near(l.canvas.height, l.height), `${l.canvas.width} x ${l.canvas.height}`);
    await context.close();
  }
}
