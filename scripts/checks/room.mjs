// Feature: a room around the desk and a rainy window (branch feature/room).
import path from "node:path";
import sharp from "sharp";

/** The average color of a patch of the page, as [r, g, b]. */
async function patch(page, left, top, size = 36) {
  const shot = await page.screenshot({ clip: { x: left, y: top, width: size, height: size } });
  const { channels } = await sharp(shot).stats();
  return channels.slice(0, 3).map((c) => Math.round(c.mean));
}

export default async function room({ browser, base, out, open, check, at, sceneReady, settle, frames, pointAt }) {
  const { context, page, errors } = await open("/");
  await sceneReady(page);
  await settle(page);

  check("room: the rain is a page layer behind the canvas", (await page.locator(".scene > .rain").count()) === 1 && (await page.evaluate(() => document.querySelector(".scene").firstElementChild.classList.contains("rain"))));
  const glass = await patch(page, 190, 150);
  const wall = await patch(page, 1340, 150);
  const below = await patch(page, 40, 600);
  const beside = await patch(page, 6, 250, 20);
  check("room: the window shows the night outside", glass[2] > glass[0] + 8, `rgb ${glass.join(" ")}`);
  check("room: the wall on the right stays warm", wall[0] > wall[2] + 4, `rgb ${wall.join(" ")}`);
  check("room: under the sill it is wall, not window", below[2] <= below[0] + 6, `rgb ${below.join(" ")}`);
  check("room: beside the window it is wall, not window", beside[2] <= beside[0] + 6, `rgb ${beside.join(" ")}`);

  const moving = await page.evaluate(() => ["rain-far", "rain-near", "rain-drop", "rain-car"].map((c) => getComputedStyle(document.querySelector("." + c)).animationName));
  check("room: the rain falls", moving.every((name) => name !== "none"), moving.join(", "));
  const before = await frames(page);
  await page.waitForTimeout(1500);
  check("room: the falling rain costs the 3D scene no frames", (await frames(page)) === before, `${(await frames(page)) - before} frames`);
  await page.screenshot({ path: path.join(out, "room-1440x900.png") });

  // The objects on the desk still answer.
  await pointAt(page, "monitor-left");
  await page.waitForTimeout(400);
  check("room: the monitors still react in front of the window", (await page.textContent("#scene-label")) === "Projects");
  const monitor = await pointAt(page, "monitor-left");
  await page.mouse.click(monitor.x, monitor.y);
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => ({
    paused: getComputedStyle(document.querySelector(".rain-near")).animationPlayState,
    opacity: Number(getComputedStyle(document.querySelector(".rain")).opacity),
  }));
  check("room: with a page open the rain rests and dims", state.paused === "paused" && state.opacity < 0.3, `${state.paused}, opacity ${state.opacity}`);
  check("room: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  const still = await open("/", { reducedMotion: "reduce" });
  await sceneReady(still.page);
  const names = await still.page.evaluate(() => ["rain-far", "rain-near", "rain-drop", "rain-car"].map((c) => getComputedStyle(document.querySelector("." + c)).animationName));
  check("room: reduced motion: the rain is still", names.every((name) => name === "none"), names.join(", "));
  await still.context.close();

  const plain = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await plain.addInitScript(() => {
    delete window.WebGL2RenderingContext;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return String(type).startsWith("webgl") ? null : original.call(this, type, ...rest);
    };
  });
  const noGl = await plain.newPage();
  await noGl.goto(base + "/", { waitUntil: "networkidle" });
  check("room: without WebGL there is no rain layer either", (await noGl.locator(".rain").count()) === 0);
  await plain.close();

  const phone = await open("/", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await sceneReady(phone.page);
  await settle(phone.page);
  const sky = await patch(phone.page, 100, 62, 28);
  check("room: phone: the window shows above the monitors", sky[2] > sky[0] + 8, `rgb ${sky.join(" ")}`);
  const under = await patch(phone.page, 60, 470, 28);
  check("room: phone: under the desk it is wall, not window", under[2] <= under[0] + 6, `rgb ${under.join(" ")}`);
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("room: phone: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  await phone.page.screenshot({ path: path.join(out, "room-390x844.png") });
  await phone.context.close();
}
