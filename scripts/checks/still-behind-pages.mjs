// Behind an open page the desk holds still. Pages that keep the whole-desk view behind them
// (Credits, an unknown address) used to lean with the pointer like the home page does, which
// redrew the scene on every pointer move and made the dimmed desk shift under the text.

export default async function stillBehindPages({ open, check, sceneReady, frames }) {
  for (const route of ["/credits", "/resume", "/about"]) {
    const { context, page } = await open(route);
    await sceneReady(page);
    await page.waitForTimeout(1500);
    const before = await frames(page);
    for (let i = 0; i < 12; i++) {
      await page.mouse.move(200 + i * 90, 300 + (i % 3) * 120);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(600);
    const drawn = (await frames(page)) - before;
    check(`still: the desk behind ${route} does not redraw as the pointer moves`, drawn === 0, `${drawn} frames`);
    await context.close();
  }

  // The screens dim with the page instead of snapping to black: right after a monitor's page
  // opens, the scene is still drawing its fade.
  const { context, page } = await open("/");
  await sceneReady(page);
  await page.waitForTimeout(3600);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll(".site-nav a")].find((a) => a.textContent === "About");
    el.click();
  });
  await page.waitForSelector("main.about");
  await page.waitForTimeout(1600);
  const settled = await frames(page);
  await page.waitForTimeout(800);
  check("still: once a page has opened, the scene stops drawing", (await frames(page)) === settled, `${(await frames(page)) - settled} frames`);
  await context.close();
}
