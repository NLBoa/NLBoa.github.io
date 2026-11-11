// Feature: the room shows beside a project page (branch feature/room-beside-page).
import path from "node:path";
import sharp from "sharp";

/** The average color of a patch of the page, as [r, g, b]. */
async function patch(page, left, top, size = 36) {
  const shot = await page.screenshot({ clip: { x: Math.round(left), y: Math.round(top), width: size, height: size } });
  const { channels } = await sharp(shot).stats();
  return channels.slice(0, 3).map((c) => Math.round(c.mean));
}

const dark = (rgb) => rgb.every((c) => c < 34);
const night = (rgb) => rgb[2] > rgb[0] + 8;
const rain = (page) =>
  page.evaluate(() => ({
    state: getComputedStyle(document.querySelector(".rain-near")).animationPlayState,
    name: getComputedStyle(document.querySelector(".rain-near")).animationName,
    opacity: Number(getComputedStyle(document.querySelector(".rain")).opacity),
  }));

/** A point on the window's glass, in the band of a 1440 x 900 window. */
const GLASS = { x: 1290, y: 250 };
/** A point of bare page, between the "All projects" link and the Close button. */
const BARE = { x: 600, y: 110 };

export default async function roomBesidePage({ open, check, at, sceneReady, frames, locate, pointAt, out }) {
  const { context, page, errors } = await open("/projects/aegis-orbit/");
  await sceneReady(page);
  await page.waitForTimeout(1500);

  const band = await page.evaluate(() => window.__scene.band);
  const column = await page.evaluate(() => document.querySelector(".project-head").getBoundingClientRect().right);
  check("beside: the band starts 2rem past the column the browser laid out", band && Math.abs(band.left - 32 - column) < 1, `band ${band?.left}, column ${column}`);

  const glass = await patch(page, GLASS.x, GLASS.y);
  check("beside: the window shows in the band", night(glass), `rgb ${glass.join(" ")}`);
  const bare = await patch(page, BARE.x, BARE.y);
  check("beside: behind the column the page is still dark", dark(bare), `rgb ${bare.join(" ")}`);
  const falling = await rain(page);
  check("beside: the rain keeps falling beside the page", falling.state === "running" && falling.opacity === 1, `${falling.state}, opacity ${falling.opacity}`);

  const before = await frames(page);
  await page.waitForTimeout(1500);
  check("beside: the 3D scene draws no frames while the page sits open", (await frames(page)) === before, `${(await frames(page)) - before} frames`);

  // Nothing bright may sit behind the text, however far the page scrolls.
  const text = await page.evaluate(() => {
    const box = document.querySelector(".story-body").getBoundingClientRect();
    return { right: box.right, top: box.top + window.scrollY };
  });
  await page.evaluate((top) => window.scrollTo(0, top - 300), text.top);
  await page.waitForTimeout(300);
  check("beside: the room stays put while the page scrolls", night(await patch(page, GLASS.x, GLASS.y)));
  const margin = await patch(page, 20, 450, 28);
  check("beside: the left margin stays dark", dark(margin), `rgb ${margin.join(" ")}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("beside: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(out, "beside-1440x900.png") });

  // Back to the list of projects: the scrim closes again and the rain rests.
  await page.click('.page-bar a[href$="/projects/"]');
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  await page.waitForTimeout(1300);
  const list = await rain(page);
  check("beside: the Projects page keeps its full scrim", dark(await patch(page, 1380, 500, 24)) && list.state === "paused", `${list.state}`);

  // And from a tile into a project: the camera turns to the window.
  await page.click('main a[href$="/projects/argus/"]');
  await page.waitForURL(at("/projects/argus"), { timeout: 3000 });
  await page.waitForTimeout(1500);
  check("beside: opening a project from its tile ends on the room", night(await patch(page, GLASS.x, GLASS.y)));
  const screen = await patch(page, 1385, 560, 30);
  check("beside: the left monitor is lit again once the camera has arrived", screen[0] + screen[1] + screen[2] > 90, `rgb ${screen.join(" ")}`);

  await page.keyboard.press("Escape");
  await page.waitForURL(at("/"), { timeout: 3000 });
  await page.waitForTimeout(1200);
  const home = await locate(page, "monitor-left");
  check("beside: Esc returns to the whole desk", home.x > 300 && home.x < 720, `monitor at ${Math.round(home.x)}`);

  // From a Stream Deck key.
  const key = await pointAt(page, "key-0");
  await page.mouse.click(key.x, key.y);
  await page.waitForURL((url) => /\/projects\/[^/]+\/?$/.test(new URL(url).pathname), { timeout: 4000 });
  await page.waitForTimeout(1600);
  check("beside: opening a project from a Stream Deck key ends on the room", night(await patch(page, GLASS.x, GLASS.y)));
  check("beside: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  // A window too narrow for a band: everything as before.
  const narrow = await open("/projects/aegis-orbit/", { viewport: { width: 1100, height: 800 } });
  await sceneReady(narrow.page);
  await narrow.page.waitForTimeout(1200);
  const rests = await rain(narrow.page);
  const monitor = await locate(narrow.page, "monitor-left");
  check("beside: a narrow window has no band", (await narrow.page.evaluate(() => window.__scene.band)) === null);
  check("beside: a narrow window keeps the full scrim and resting rain", dark(await patch(narrow.page, 1040, 400, 24)) && rests.state === "paused" && rests.opacity < 0.3, `${rests.state}, opacity ${rests.opacity}`);
  check("beside: a narrow window keeps the camera on the left monitor", Math.abs(monitor.x - 550) < 4, `monitor at ${Math.round(monitor.x)}`);
  await narrow.context.close();

  const still = await open("/projects/aegis-orbit/", { reducedMotion: "reduce" });
  await sceneReady(still.page);
  await still.page.waitForTimeout(600);
  const quiet = await rain(still.page);
  check("beside: reduced motion: the room shows, the rain is still", night(await patch(still.page, GLASS.x, GLASS.y)) && quiet.name === "none", quiet.name);
  await still.context.close();

  const phone = await open("/projects/aegis-orbit/", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await sceneReady(phone.page);
  await phone.page.waitForTimeout(1000);
  const resting = await rain(phone.page);
  check("beside: phone: no band, the rain rests", (await phone.page.evaluate(() => window.__scene.band)) === null && resting.state === "paused" && resting.opacity < 0.3, `${resting.state}, opacity ${resting.opacity}`);
  await phone.context.close();

}
