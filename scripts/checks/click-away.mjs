// Feature: a click away from an open page closes it, the same as Close: on every page.
// "Away" is outside the box around the page's content. Clicks on the content, in the gaps
// inside it, on the header, or on anything that can itself be pressed do not close the page.

export default async function clickAway({ open, check, at, sceneReady }) {
  const home = at("/");
  const closes = async (page, x, y, name) => {
    await page.mouse.click(x, y);
    await page.waitForURL(home, { timeout: 2500 }).catch(() => {});
    check(name, home(page.url()), page.url());
  };
  const stays = async (page, route, x, y, name) => {
    await page.mouse.click(x, y);
    await page.waitForTimeout(450);
    check(name, at(route)(page.url()), page.url());
  };

  // Résumé: beside the sheet closes; the sheet's own column does not.
  {
    const { context, page, errors } = await open("/resume");
    await page.waitForTimeout(700);
    await stays(page, "/resume", 700, 232, "away: a click in the gap between the résumé's title and its sheet stays");
    await stays(page, "/resume", 290, 190, "away: a click on the résumé's title row stays");
    await stays(page, "/resume", 720, 30, "away: a click on the empty part of the header stays");
    await page.mouse.move(120, 500);
    await page.waitForTimeout(150);
    check("away: the cursor says a click here leaves the page", await page.evaluate(() => document.documentElement.hasAttribute("data-away") && getComputedStyle(document.documentElement).cursor === "zoom-out"));
    await page.mouse.move(700, 600);
    await page.waitForTimeout(150);
    check("away: over the content the cursor is the usual one", await page.evaluate(() => !document.documentElement.hasAttribute("data-away")));
    await closes(page, 120, 500, "away: a click beside the résumé closes it");
    check("away: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
    await context.close();
  }

  // The other pages: beside or below the content closes; inside it does not.
  for (const [route, away, inside, what] of [
    ["/about", [1300, 500], [640, 760], "the gap between two sections"],
    ["/contact", [700, 850], [520, 195], "the gap under the heading"],
    ["/projects", [30, 500], [720, 140], "the gap above the tiles"],
    ["/credits", [1100, 500], [400, 320], "the gap between two entries"],
  ]) {
    const { context, page } = await open(route);
    await page.waitForTimeout(700);
    await stays(page, route, inside[0], inside[1], `away: ${route}: a click in ${what} stays`);
    await closes(page, away[0], away[1], `away: ${route}: a click away from the content closes the page`);
    await context.close();
  }

  // A project page in a window too narrow for the room: the gutter closes it.
  {
    const { context, page } = await open("/projects/argus", { viewport: { width: 1200, height: 800 } });
    await page.waitForTimeout(700);
    await stays(page, "/projects/argus", 600, 300, "away: a project page: a click between its blocks stays");
    await closes(page, 1185, 500, "away: a project page: a click in the margin closes it");
    await context.close();
  }

  // An unknown address behaves the same.
  {
    const { context, page } = await open("/nothing-here");
    await page.waitForTimeout(700);
    await closes(page, 1200, 600, "away: the 404 page closes on a click away too");
    await context.close();
  }

  // Selecting text by dragging out of the content is not a click away.
  {
    const { context, page } = await open("/about");
    await page.waitForTimeout(700);
    await page.mouse.move(320, 860);
    await page.mouse.down();
    await page.mouse.move(900, 870, { steps: 6 });
    await page.mouse.move(1250, 880, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(450);
    check("away: dragging a selection out past the content does not close the page", at("/about")(page.url()));
    const selected = await page.evaluate(() => String(getSelection()).length);
    await stays(page, "/about", 1300, 500, "away: with text selected, the first click away only clears the selection");
    check("away: (text was selected for that check)", selected > 0, `${selected} characters`);
    await closes(page, 1300, 500, "away: the next click away closes the page");
    await context.close();
  }

  // A note in progress is never thrown away by a stray click.
  {
    const { context, page } = await open("/contact");
    await page.waitForTimeout(700);
    await page.click(".note textarea");
    await stays(page, "/contact", 1300, 700, "away: with the note in focus, a click away only leaves the field");
    await page.fill(".note textarea", "Hello Noah");
    await page.mouse.click(1300, 700);
    await stays(page, "/contact", 1300, 700, "away: with a note written, clicks away do not close the page");
    await page.keyboard.press("Escape");
    await page.waitForURL(home, { timeout: 2500 }).catch(() => {});
    check("away: Esc still closes it", home(page.url()));
    await context.close();
  }

  // Touch: the page fills a phone, so a tap near its edge does nothing.
  {
    const { context, page } = await open("/about", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.waitForTimeout(700);
    await page.touchscreen.tap(4, 500);
    await page.waitForTimeout(450);
    check("away: phone: a tap at the screen's edge does not close the page", at("/about")(page.url()));
    await context.close();
  }

  // The desk itself is not a page: clicking the wall does nothing.
  {
    const { context, page } = await open("/");
    await sceneReady(page);
    await page.waitForTimeout(3600);
    await page.mouse.click(1380, 300);
    await page.waitForTimeout(450);
    check("away: on the desk a click on the wall does nothing", home(page.url()) && (await page.evaluate(() => !document.documentElement.hasAttribute("data-away"))));
    await context.close();
  }
}
