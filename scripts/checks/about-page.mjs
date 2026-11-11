// Feature: the About page as a profile card (branch feature/about-page).
import path from "node:path";

export default async function aboutPage({ browser, base, out, open, check, at, a }) {
  // In the HTML itself.
  const plainContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const plain = await plainContext.newPage();
  await plain.goto(base + "/about", { waitUntil: "load" });
  const portrait = await plain.textContent(".card-face pre");
  check("about: the portrait is in the HTML without JavaScript", portrait.split("\n").length === 38 && portrait.replace(/\s/g, "").length > 600);
  const text = await plain.textContent("main.page");
  check("about: the card and the story read without JavaScript", ["noah@leibovitz", "University of Maryland", "Presidential Scholar", "Gulf Coast Estate Care", "Seven Simple Machines", "Toolbox", "Outside of code"].every((t) => text.includes(t)));
  check("about: without JavaScript there is no Pause button", (await plain.locator(".card-pause").count()) === 0);
  await plainContext.close();

  const { context, page, errors } = await open("/about");
  await page.waitForSelector(".card");
  const fold = await page.evaluate(() => document.querySelector(".card").getBoundingClientRect().bottom);
  check("about: the card fits a 1440x900 screen", fold <= 900, `bottom ${fold.toFixed(0)}px`);
  await page.screenshot({ path: path.join(out, "about-page-1440x900.png") });

  // The portrait turns, and can be paused.
  await page.waitForSelector(".card-pause", { timeout: 8000 });
  const frame = () => page.getAttribute(".card-face pre", "data-frame");
  const first = await frame();
  await page.waitForFunction((f) => document.querySelector(".card-face pre").dataset.frame !== f, first, { timeout: 4000 });
  check("about: the portrait turns", true);
  await page.click(".card-pause", { force: true });
  const held = await frame();
  await page.waitForTimeout(600);
  check("about: Pause holds the portrait still", (await frame()) === held && (await page.textContent(".card-pause")) === "Play");

  // The card's project names lead to the projects.
  check("about: the card names the featured projects", (await page.locator(".card-row dt a").count()) === 4);
  check("about: the anchor for Outside of code is kept", (await page.locator("section#outside-code").count()) === 1);

  // Toolbox: a numbered tool lists the projects built with it.
  await page.click('.toolbox button:has-text("Python")');
  const built = await page.locator(".toolbox-result a").allTextContents();
  check("about: picking Python lists the projects built with it", built.join() === "Argus,Smart Display", built.join(", "));
  await page.click('.toolbox button:has-text("TypeScript")');
  check("about: picking another tool replaces the list", (await page.locator(".toolbox-result a").allTextContents()).join() === "Jupiterp,Aegis Orbit,MID");
  check("about: a tool no project names is not a button", (await page.locator('.toolbox-plain:has-text("Docker")').count()) === 1);
  await page.click(`.toolbox-result ${a("/projects/jupiterp")}`);
  await page.waitForURL(at("/projects/jupiterp"), { timeout: 3000 });
  check("about: a listed project opens", true);
  check("about: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  const still = await open("/about", { reducedMotion: "reduce" });
  await still.page.waitForSelector(".card");
  await still.page.waitForTimeout(1200);
  check("about: reduced motion: the portrait stays still, with no Pause button", (await still.page.getAttribute(".card-face pre", "data-frame")) === "12" && (await still.page.locator(".card-pause").count()) === 0);
  await still.context.close();

  const phone = await open("/about", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await phone.page.waitForSelector(".card");
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("about: phone: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  const clash = await phone.page.evaluate(() => {
    const close = document.querySelector(".page-close").getBoundingClientRect();
    const name = document.querySelector(".about-head h1").getBoundingClientRect();
    return name.top < close.bottom && name.right > close.left;
  });
  check("about: phone: Close does not cover the name", !clash);
  const fits = await phone.page.evaluate(() => {
    const pre = document.querySelector(".card-face pre").getBoundingClientRect();
    const card = document.querySelector(".card").getBoundingClientRect();
    return pre.left >= card.left && pre.right <= card.right;
  });
  check("about: phone: the portrait fits inside the card", fits);
  const smallest = await phone.page.evaluate(() => Math.min(...[...document.querySelectorAll(".toolbox button")].map((b) => b.getBoundingClientRect().height)));
  check("about: phone: toolbox buttons are at least 44px tall", smallest >= 44, `${smallest}px`);
  await phone.page.screenshot({ path: path.join(out, "about-page-390x844.png") });
  await phone.context.close();
}
