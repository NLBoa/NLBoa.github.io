// Feature: the cat on the desk (branch feature/desk-cat).
import path from "node:path";

const doing = (page) => page.evaluate(() => window.__cat.doing);
const play = (page, name) => page.evaluate((name) => window.__cat.play(name), name);

export default async function deskCat({ open, check, sceneReady, settle, frames, out }) {
  const { context, page, errors } = await open("/", { cat: true });
  await sceneReady(page);
  await page.waitForFunction(() => window.__cat, null, { timeout: 20000 }).catch(() => {});
  check("cat: it is on the desk", await page.evaluate(() => Boolean(window.__cat)));
  await settle(page);
  // Park the pointer away from the cat and the desk's objects.
  await page.mouse.move(700, 40);

  // It only lies in the loaf and breathes: nothing of its own accord.
  await page.waitForTimeout(6000);
  check("cat: it stays in the loaf, doing nothing of its own accord", (await doing(page)) === "loaf", await doing(page));

  // The emotes are switched off, not removed: started by hand, each still plays through and comes to rest.
  for (const [emote, rest] of [
    ["loaf", "loaf"],
    ["purr", "loaf"],
    ["clean", "sit"],
    ["roll", "side"],
    ["stare", "side"],
  ]) {
    await play(page, emote);
    const seen = new Set();
    const until = Date.now() + 22000;
    while (Date.now() < until) {
      const now = await doing(page);
      seen.add(now);
      if (seen.has(emote) && now === rest) break;
      await page.waitForTimeout(150);
    }
    check(`cat: "${emote}" plays and comes to rest`, seen.has(emote) && (await doing(page)) === rest, [...seen].join(" -> "));
  }

  // It breathes: frames keep coming, at a calm pace.
  await play(page, "loaf");
  await page.waitForFunction(() => window.__cat.doing === "loaf", null, { timeout: 20000 });
  // The pointer stopped a while ago, so it has lost interest in it.
  await page.waitForTimeout(5000);
  const before = await frames(page);
  await page.waitForTimeout(2000);
  const calm = (await frames(page)) - before;
  check("cat: at rest it breathes, redrawn at a calm pace", calm >= 20 && calm <= 90, `${calm} frames in 2 s`);
  await page.screenshot({ path: path.join(out, "cat-1440x900.png") });

  // A click on it, or the pointer resting on it, is answered with nothing; and it opens nothing.
  const at = await page.evaluate(() => window.__cat.locate());
  await page.mouse.move(at.x, at.y, { steps: 5 });
  await page.mouse.click(at.x, at.y);
  await page.waitForTimeout(1200);
  check("cat: a click on it changes nothing", (await doing(page)) === "loaf", await doing(page));
  check("cat: a click on it opens nothing", !(await page.locator(".page-close").count()), page.url());
  await page.mouse.move(at.x + 4, at.y + 3, { steps: 3 });
  await page.waitForTimeout(1200);
  check("cat: the pointer resting on it changes nothing", (await doing(page)) === "loaf", await doing(page));
  await page.mouse.move(700, 40, { steps: 4 });

  // Behind an open page it holds still: nothing is drawn.
  await page.goto(new URL("/credits/", page.url()).href, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const behind = await frames(page);
  await page.waitForTimeout(1500);
  check("cat: behind an open page it holds still", (await frames(page)) === behind, `${(await frames(page)) - behind} frames`);
  check("cat: no errors", errors.length === 0, errors.join(" | "));
  await context.close();

  // Reduced motion: it is there, and still.
  const calmer = await open("/", { cat: true, reducedMotion: "reduce" });
  await sceneReady(calmer.page);
  await calmer.page.waitForFunction(() => window.__cat, null, { timeout: 20000 }).catch(() => {});
  await calmer.page.waitForTimeout(2500);
  const still = await frames(calmer.page);
  await calmer.page.waitForTimeout(1500);
  check("cat: under reduced motion it does not move", (await frames(calmer.page)) === still, `${(await frames(calmer.page)) - still} frames`);
  await calmer.context.close();

  // Phone.
  const phone = await open("/", { cat: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await sceneReady(phone.page);
  await phone.page.waitForFunction(() => window.__cat, null, { timeout: 20000 }).catch(() => {});
  await phone.page.waitForTimeout(4000);
  check("cat: on a phone too", await phone.page.evaluate(() => Boolean(window.__cat)));
  await phone.page.screenshot({ path: path.join(out, "cat-390x844.png") });
  check("cat: no errors on a phone", phone.errors.length === 0, phone.errors.join(" | "));
  await phone.context.close();
}
