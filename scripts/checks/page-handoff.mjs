// Clicking an object: the hand-off from the desk to the page.
//
// The picture on a monitor and the page that replaces it are alike but never line up. They
// used to cross-fade, and for a few frames both were on screen, out of register: a doubled
// picture that read as a glitch. Now the screens dim and the scrim comes up just before the
// camera arrives, and the page fades in over a dark screen. These checks watch every frame of
// a click.

/** Clicks an object and returns one row per frame, from the click until the page has settled. */
async function film(page, pointAt, id) {
  const at = await pointAt(page, id);
  await page.waitForTimeout(700);
  await page.evaluate((id) => {
    const rows = (window.__handoff = []);
    const t0 = performance.now();
    let stop = false;
    // The moment of the click, by the page's own clock.
    window.addEventListener("pointerdown", () => (window.__handoffClick = performance.now() - t0), { capture: true, once: true });
    window.__handoffStop = () => (stop = true);
    const tick = (now) => {
      const main = document.querySelector("main.page");
      const p = window.__scene.locate(id);
      rows.push({
        t: now - t0,
        page: main ? Number(getComputedStyle(main).opacity) : 0,
        scrim: Number(getComputedStyle(document.querySelector(".scrim")).opacity),
        screens: window.__scene.screens,
        x: p.x,
        y: p.y,
        open: Boolean(main),
      });
      if (!stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, id);
  await page.waitForTimeout(60);
  await page.mouse.click(at.x, at.y);
  await page.waitForTimeout(1600);
  const { rows, clicked } = await page.evaluate(() => (window.__handoffStop(), { rows: window.__handoff, clicked: window.__handoffClick }));
  return rows.filter((r) => r.t >= clicked).map((r) => ({ ...r, t: r.t - clicked }));
}

export default async function pageHandoff({ open, check, at, sceneReady, settle, pointAt }) {
  for (const [id, route, name] of [
    ["monitor-left", "/projects", "Projects"],
    ["monitor-right", "/about", "About"],
  ]) {
    const { context, page, errors } = await open("/");
    await sceneReady(page);
    await settle(page);
    const rows = await film(page, pointAt, id);
    check(`handoff: ${name} opens`, at(route)(page.url()), page.url());

    const shown = rows.filter((r) => r.page > 0.02);
    const first = shown[0];
    const brightest = Math.max(...shown.map((r) => r.screens));
    check(
      `handoff: ${name}: the screen's picture is gone before the page shows`,
      shown.length > 0 && brightest <= 0.15,
      `screens at ${brightest.toFixed(2)} of full when the page first shows`,
    );
    check(
      `handoff: ${name}: the desk is already dim when the page fades in`,
      Boolean(first) && first.scrim >= 0.3,
      first ? `scrim ${first.scrim.toFixed(2)} at ${Math.round(first.t)} ms` : "the page never showed",
    );
    // The screen stays lit for most of the flight: the camera is seen arriving at it.
    const lit = rows.filter((r) => r.screens > 0.9).at(-1);
    check(`handoff: ${name}: the screen stays lit while the camera flies to it`, Boolean(lit) && lit.t >= 400, lit ? `lit until ${Math.round(lit.t)} ms` : "never lit");
    // No dark, empty beat: the page is on its way in soon after the screen has dimmed.
    const dark = rows.find((r) => r.screens <= 0.15);
    const gap = first && dark ? first.t - dark.t : Infinity;
    check(`handoff: ${name}: the page follows the dimmed screen at once`, gap <= 130, `${Math.round(gap)} ms between them`);
    const readable = rows.find((r) => r.page >= 0.9);
    if (process.env.HANDOFF_TRACE) console.log(rows.filter((r, i) => i % 3 === 0).map((r) => `${Math.round(r.t)}: page ${r.page.toFixed(2)} scrim ${r.scrim.toFixed(2)} screens ${r.screens.toFixed(2)} x ${r.x.toFixed(0)} ${r.open ? "open" : ""}`).join("\n"));
    check(`handoff: ${name}: the page is readable within a second of the click`, Boolean(readable) && readable.t <= 1000, readable ? `${Math.round(readable.t)} ms` : "never");

    // The camera glides to rest: no jump when the page arrives under it.
    let worst = 0;
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].open) continue;
      worst = Math.max(worst, Math.hypot(rows[i].x - rows[i - 1].x, rows[i].y - rows[i - 1].y));
    }
    check(`handoff: ${name}: the camera does not jump as the page opens`, worst <= 6, `largest step ${worst.toFixed(1)} px`);
    check(`handoff: ${name}: no console errors`, errors.length === 0, errors.slice(0, 2).join(" | "));

    // And back: the screens light up again on the desk.
    await page.keyboard.press("Escape");
    await page.waitForURL(at("/"), { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({ screens: window.__scene.screens, mark: document.documentElement.hasAttribute("data-opening"), scrim: Number(getComputedStyle(document.querySelector(".scrim")).opacity) }));
    check(`handoff: ${name}: back on the desk the screens are lit and nothing is dimmed`, after.screens === 1 && !after.mark && after.scrim === 0, JSON.stringify(after));
    await context.close();
  }

  // Going somewhere else during the flight, after the dimming has begun: that page opens, and
  // back on the desk nothing is left dimmed.
  {
    const { context, page } = await open("/");
    await sceneReady(page);
    await settle(page);
    const p = await pointAt(page, "monitor-left");
    await page.waitForTimeout(500);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(540);
    const dimming = await page.evaluate(() => document.documentElement.hasAttribute("data-opening"));
    await page.click('.site-nav a[href$="/contact/"]');
    await page.waitForTimeout(900);
    check("handoff: a header link pressed during the flight wins", at("/contact")(page.url()), `${page.url()} (dimming had begun: ${dimming})`);
    await page.keyboard.press("Escape");
    await page.waitForURL(at("/"), { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const state = await page.evaluate(() => ({ mark: document.documentElement.hasAttribute("data-opening"), screens: window.__scene.screens, scrim: Number(getComputedStyle(document.querySelector(".scrim")).opacity) }));
    check("handoff: the dimming never outlives the page it was for", at("/")(page.url()) && !state.mark && state.screens === 1 && state.scrim === 0, JSON.stringify(state));
    await context.close();
  }

  // Reduced motion: the page opens at once, with no lead.
  {
    const { context, page } = await open("/", { reducedMotion: "reduce" });
    await sceneReady(page);
    await page.waitForTimeout(800);
    const p = await pointAt(page, "monitor-left");
    await page.waitForTimeout(300);
    const t0 = Date.now();
    await page.mouse.click(p.x, p.y);
    await page.waitForURL(at("/projects"), { timeout: 3000 }).catch(() => {});
    check("handoff: reduced motion: the page opens at once", at("/projects")(page.url()) && Date.now() - t0 < 500, `${Date.now() - t0} ms`);
    await context.close();
  }
}
