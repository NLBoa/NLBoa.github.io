// Feature: beside a project's page the room shows on the right of a wide window. A click on
// the room leaves the project and returns to the desk.

export default async function roomExit({ open, check, at, sceneReady }) {
  const { context, page, errors } = await open("/projects/argus/");
  await sceneReady(page);
  await page.waitForTimeout(1500);

  const band = await page.evaluate(() => window.__scene.band);
  const exit = await page.evaluate(() => {
    const el = document.querySelector(".room-exit");
    if (!el || getComputedStyle(el).display === "none") return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, cursor: getComputedStyle(el).cursor, tabIndex: el.tabIndex, hidden: el.getAttribute("aria-hidden") };
  });
  check("exit: the room beside a project page can be clicked", exit !== null);
  if (exit) {
    check("exit: the clickable area is the band where the room shows", Math.abs(exit.left - band.left) < 2 && exit.right >= 1439 && exit.bottom >= 899, `starts ${exit.left.toFixed(0)}, band ${band.left.toFixed(0)}`);
    check("exit: it stays out of the Tab order (Close and Esc already do this)", exit.tabIndex === -1 && exit.hidden === "true");
    const column = await page.evaluate(() => document.querySelector(".project-head").getBoundingClientRect().right);
    check("exit: it does not cover the page's own column", exit.left > column, `column ends ${column.toFixed(0)}`);
  }

  // Close keeps working where it sits over the band.
  const close = await page.locator(".page-close").boundingBox();
  const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.className ?? "", [close.x + close.width / 2, close.y + close.height / 2]);
  check("exit: the Close button is still on top", top.includes("page-close"), top);

  // A hint appears while the pointer is over the room.
  await page.mouse.move(1290, 520);
  await page.waitForTimeout(400);
  const hint = await page.evaluate(() => {
    const el = document.querySelector(".room-exit span");
    return el ? { text: el.textContent, opacity: Number(getComputedStyle(el).opacity) } : null;
  });
  check("exit: hovering the room says what a click does", hint?.text === "Back to the desk" && hint.opacity > 0.9, JSON.stringify(hint));

  await page.mouse.click(1290, 520);
  await page.waitForURL(at("/"), { timeout: 3000 }).catch(() => {});
  check("exit: a click on the room returns to the desk", at("/")(page.url()), page.url());
  check("exit: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  // A click on the page itself does nothing of the kind.
  const stay = await open("/projects/argus/");
  await stay.page.waitForTimeout(800);
  await stay.page.mouse.click(600, 110);
  await stay.page.waitForTimeout(500);
  check("exit: a click on the page's own column stays on the project", at("/projects/argus")(stay.page.url()));
  await stay.context.close();

  // Narrow windows have no room beside the page, so nothing to click.
  const narrow = await open("/projects/argus/", { viewport: { width: 1200, height: 800 } });
  await narrow.page.waitForTimeout(600);
  check("exit: a window too narrow for the room has no clickable area", await narrow.page.evaluate(() => getComputedStyle(document.querySelector(".room-exit")).display === "none").catch(() => false));
  await narrow.context.close();

  // Other pages have none either.
  const about = await open("/about/");
  check("exit: only project pages have it", (await about.page.locator(".room-exit").count()) === 0);
  await about.context.close();
}
