// Feature: the Projects page as a grid of project tiles (branch feature/projects-index).
import path from "node:path";

export default async function projectsIndex({ browser, base, out, open, check, at, a }) {
  const slugs = ["argus", "smart-display", "jupiterp", "aegis-orbit", "shell"];
  // Every project, then the tile that leads to GitHub.
  const tiles = slugs.length + 1;

  // In the HTML itself.
  const plainContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const plain = await plainContext.newPage();
  await plain.goto(base + "/projects", { waitUntil: "load" });
  check("projects: every tile and its cover is in the HTML without JavaScript", (await plain.locator(".tile").count()) === tiles && (await plain.locator(".tile .cover path").count()) > 40);
  await plainContext.close();

  const { context, page, errors } = await open("/projects");
  await page.waitForSelector(".tiles");
  const hrefs = await page.locator(".tile").evaluateAll((els) => els.map((el) => el.getAttribute("href").replace(/\/$/, "").split("/").pop()));
  check("projects: one tile per project, in order, then More on GitHub", JSON.stringify(hrefs) === JSON.stringify([...slugs, "NLBoa"]), hrefs.join(", "));
  const last = page.locator(".tile >> nth=-1");
  check("projects: the last tile opens GitHub in a new tab", (await last.getAttribute("href")) === "https://github.com/NLBoa" && (await last.getAttribute("target")) === "_blank" && (await last.locator(".cover path").count()) > 3);
  const bottom = await page.evaluate(() => Math.max(...[...document.querySelectorAll(".tile")].map((el) => el.getBoundingClientRect().bottom)));
  check("projects: the whole grid fits a 1440x900 screen", bottom <= 900, `bottom ${bottom.toFixed(0)}px`);
  const columns = await page.evaluate(() => new Set([...document.querySelectorAll(".tile")].map((el) => Math.round(el.getBoundingClientRect().left))).size);
  check("projects: three tiles to a row, as on the monitor", columns === 3);
  const accents = await page.locator(".tile").evaluateAll((els) => els.map((el) => getComputedStyle(el).getPropertyValue("--accent").trim()));
  check("projects: each tile has its own color", new Set(accents).size === tiles, accents.join(" "));

  const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
  await page.hover(".tile >> nth=3");
  await page.waitForTimeout(250);
  const border = await page.locator(".tile >> nth=3").evaluate((el) => getComputedStyle(el).borderTopColor);
  check("projects: a tile under the pointer takes its color", border === rgb(accents[3]), border);
  await page.screenshot({ path: path.join(out, "projects-index-1440x900.png") });

  // Keyboard: tiles come right after the header and Close, and Enter opens one.
  await page.mouse.move(5, 5);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement?.classList.contains("tile"))) break;
  }
  check("projects: Tab reaches the first tile", (await page.evaluate(() => document.activeElement?.getAttribute("href") ?? "")).includes("/projects/argus"));
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForURL(at("/projects/smart-display"), { timeout: 3000 });
  check("projects: Enter opens the focused tile", true);
  await page.click(`.page-bar ${a("/projects")}`);
  await page.waitForURL(at("/projects"), { timeout: 3000 });
  check("projects: a project's back link returns to the tiles", (await page.locator(".tile").count()) === tiles);
  check("projects: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  const phone = await open("/projects", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await phone.page.waitForSelector(".tiles");
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("projects: phone: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  const rows = await phone.page.evaluate(() => new Set([...document.querySelectorAll(".tile")].map((el) => Math.round(el.getBoundingClientRect().left))).size);
  const smallest = await phone.page.evaluate(() => Math.min(...[...document.querySelectorAll(".tile")].map((el) => el.getBoundingClientRect().height)));
  check("projects: phone: one tile to a row, each a comfortable target", rows === 1 && smallest >= 72, `${smallest.toFixed(0)}px`);
  const clash = await phone.page.evaluate(() => {
    const close = document.querySelector(".page-close").getBoundingClientRect();
    const bar = document.querySelector(".screen-bar p").getBoundingClientRect();
    return bar.width > 0 && bar.right > close.left && bar.bottom > close.top && bar.top < close.bottom;
  });
  check("projects: phone: Close does not cover the heading", !clash);
  await phone.page.screenshot({ path: path.join(out, "projects-index-390x844.png") });
  await phone.context.close();
}
