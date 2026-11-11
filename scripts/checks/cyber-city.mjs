// Feature: a cyber city and flying cars outside the window (branch feature/cyber-city).
import path from "node:path";

const city = (page) =>
  page.evaluate(() => {
    const box = document.querySelector(".city").getBoundingClientRect();
    const cars = [...document.querySelectorAll(".city-car")];
    const style = (selector) => getComputedStyle(document.querySelector(selector));
    return {
      first: document.querySelector(".rain").firstElementChild.classList.contains("city"),
      covers: box.left <= 0 && box.top <= 0 && box.right >= innerWidth && box.bottom >= innerHeight,
      towers: document.querySelectorAll(".city-near > g").length,
      cars: cars.length,
      fly: style(".city-car").animationName,
      state: style(".city-car").animationPlayState,
      beacon: style(".city-beacon").animationName,
      flicker: style(".city-flicker").animationName,
      x: cars.map((car) => car.getBoundingClientRect().left),
    };
  });

export default async function cyberCity({ open, check, at, sceneReady, settle, frames, pointAt, out }) {
  const { context, page, errors } = await open("/");
  await sceneReady(page);
  await settle(page);

  const before = await city(page);
  check("city: it sits in the rain layer, behind the rain", before.first);
  check("city: it covers the whole view", before.covers);
  check("city: there are towers, signs that flicker and lights that blink", before.towers > 15 && before.flicker === "city-flicker" && before.beacon === "city-beacon", `${before.towers} towers`);
  check("city: cars fly at two distances", before.cars === 5 && before.fly === "city-fly" && before.state === "running", `${before.cars} cars, ${before.fly}`);

  const drawn = await frames(page);
  await page.waitForTimeout(1200);
  const after = await city(page);
  check("city: the cars are moving", after.x.every((x, i) => Math.abs(x - before.x[i]) > 2), after.x.map((x, i) => Math.round(x - before.x[i])).join(" "));
  check("city: the moving city costs the 3D scene no frames", (await frames(page)) === drawn, `${(await frames(page)) - drawn} frames`);
  await page.screenshot({ path: path.join(out, "city-1440x900.png") });

  // With a page open the city rests with the rain.
  const monitor = await pointAt(page, "monitor-left");
  await page.mouse.click(monitor.x, monitor.y);
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  await page.waitForTimeout(700);
  check("city: with a page open the cars stop", (await city(page)).state === "paused");
  check("city: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  const still = await open("/", { reducedMotion: "reduce" });
  await sceneReady(still.page);
  const parked = await city(still.page);
  check("city: reduced motion: nothing moves", parked.fly === "none" && parked.beacon === "none" && parked.flicker === "none", `${parked.fly}, ${parked.beacon}, ${parked.flicker}`);
  check("city: reduced motion: the cars are parked in view", parked.x.every((x) => x > 0 && x < 1440), parked.x.map(Math.round).join(" "));
  await still.context.close();

  const phone = await open("/", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await sceneReady(phone.page);
  const small = await city(phone.page);
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("city: phone: it covers the view and nothing overflows sideways", small.covers && overflow <= 0, `${overflow}px`);
  await phone.context.close();
}
