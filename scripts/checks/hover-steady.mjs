// The hover on a desk object must not flicker while the pointer travels over it.
//
// Each object is several meshes (a monitor is a shell, a screen and an outline). When the
// pointer crossed from one of them to the next, the hover used to drop out for a moment:
// the outline, the label and the cursor all blinked. These checks walk the pointer in one
// pixel steps over the edges where that happened.

/** Walks the pointer from one point to another and returns every hover state seen, in order. */
async function walk(page, from, to) {
  const state = () =>
    page.evaluate(() => {
      const label = document.querySelector('.scene-label[data-visible="true"]');
      return document.body.style.cursor === "pointer" && label ? label.textContent : "";
    });
  // Park the pointer first, so the camera's lean toward it has settled before the walk.
  await page.mouse.move(from.x, from.y);
  await page.waitForTimeout(1300);
  const seen = [await state()];
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
    await page.waitForTimeout(30);
    const now = await state();
    if (now !== seen[seen.length - 1]) seen.push(now);
  }
  return seen;
}

export default async function hoverSteady({ open, check, at, sceneReady, settle, locate, pointAt }) {
  const { context, page, errors } = await open("/");
  await sceneReady(page);
  await settle(page);

  const steady = (seen, label) => JSON.stringify(seen) === JSON.stringify(["", label]);

  for (const [id, label] of [
    ["monitor-left", "Projects"],
    ["monitor-right", "About"],
  ]) {
    const top = await locate(page, id);
    // Up through the bottom bezel onto the screen, down over the top edge, and in from the side.
    const below = await walk(page, { x: top.x, y: top.y + 330 }, { x: top.x, y: top.y + 180 });
    check(`hover: entering the ${label} monitor from below never drops out`, below.at(-1) === label && below.filter((s) => s === label).length === 1, below.join(" > "));
    const above = await walk(page, { x: top.x, y: top.y - 25 }, { x: top.x, y: top.y + 90 });
    check(`hover: entering the ${label} monitor from above never drops out`, steady(above, label), above.join(" > "));
  }

  // Onto a Stream Deck key from the desk in front of it, over the keycap's edge to its face.
  // (A key is only a few pixels across here, so the walk stops at its middle.)
  const key = await pointAt(page, "key-0");
  const onto = await walk(page, { x: key.x - 12, y: key.y + 3 }, { x: key.x, y: key.y });
  check("hover: moving onto a Stream Deck key never drops out", steady(onto, "Argus"), onto.join(" > "));

  // Down the pen cup, from its pens to its foot.
  const cup = await locate(page, "pen-cup");
  const down = await walk(page, { x: cup.x, y: cup.y + 35 }, { x: cup.x, y: cup.y + 110 });
  check("hover: moving down the pen cup never drops out", down.filter((s) => s === "Contact").length === 1 && !down.slice(down.indexOf("Contact")).includes("About"), down.join(" > "));

  // A click starts the flight; nothing else on the desk reacts until the page is open.
  const monitor = await pointAt(page, "monitor-left");
  await page.waitForTimeout(300);
  await page.mouse.click(monitor.x, monitor.y);
  const during = [];
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(monitor.x + 40 * (i % 2 ? 1 : -1), monitor.y + 60 + i * 20);
    await page.waitForTimeout(50);
    during.push(await page.evaluate(() => document.body.style.cursor));
  }
  check("hover: nothing reacts while the camera is flying to a clicked object", during.every((c) => c === ""), during.join(","));
  await page.waitForURL(at("/projects"), { timeout: 3000 });

  check("hover: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();
}
