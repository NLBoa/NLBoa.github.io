// Feature: the Résumé page. The header link, the Stream Deck key and the About and Contact
// pages all lead to /resume, which shows the résumé and offers the PDF.

export default async function resumePage({ browser, base, open, check, at, a, sceneReady, settle, locate, shownLabel }) {
  // From the desk: the header link.
  const { context, page, errors } = await open("/");
  await sceneReady(page);
  await settle(page);
  await page.click(`.site-nav ${a("/resume")}`);
  await page.waitForURL(at("/resume"), { timeout: 3000 });
  await page.waitForSelector("main.resume h1");
  check("résumé: the header's Résumé link opens the résumé page", (await page.textContent("main.resume h1")) === "Résumé");
  const current = await page.locator('.site-nav a[aria-current="page"]').allTextContents();
  check("résumé: only Résumé is marked as the current page", JSON.stringify(current) === JSON.stringify(["Résumé"]), current.join(", "));
  await page.waitForFunction(() => document.title !== "", null, { timeout: 3000 });
  check("résumé: the page has its own title", (await page.title()) === "Résumé | Noah Leibovitz");

  // The sheet: a picture of every page, loaded.
  await page.waitForFunction(() => [...document.querySelectorAll(".resume-sheet img")].every((img) => img.complete && img.naturalWidth > 0));
  const sheets = await page.locator(".resume-sheet img").count();
  check("résumé: the résumé is shown", sheets >= 1, `${sheets} page(s)`);
  const sheet = await page.locator(".resume-sheet").first().boundingBox();
  check("résumé: the page keeps a sheet of paper's proportions", Math.abs(sheet.height / sheet.width - 11 / 8.5) < 0.02, `${(sheet.height / sheet.width).toFixed(3)}`);
  const close = await page.locator(".page-close").boundingBox();
  check("résumé: Close does not sit on the sheet", close.x >= sheet.x + sheet.width || close.y + close.height <= sheet.y, `sheet ends ${(sheet.x + sheet.width).toFixed(0)}, Close starts ${close.x.toFixed(0)}`);

  // Centered in the window, at any width.
  const centre = (box) => box.x + box.width / 2;
  check("résumé: the sheet is centered in the window", Math.abs(centre(sheet) - 720) <= 1, `center at ${centre(sheet).toFixed(1)} of 1440`);

  // The sheet tips toward the pointer like a card, with a shine that follows it.
  const tilt = () =>
    page.evaluate(() => {
      const el = document.querySelector(".resume-sheet");
      const shine = document.querySelector(".resume-shine");
      return {
        x: Number(el.style.getPropertyValue("--tilt-x") || 0),
        y: Number(el.style.getPropertyValue("--tilt-y") || 0),
        transform: getComputedStyle(el).transform,
        shine: shine ? Number(getComputedStyle(shine).opacity) : 0,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
  const rest = await tilt();
  check("résumé: at rest the sheet lies flat", rest.x === 0 && rest.y === 0 && rest.transform === "none" && rest.shine === 0, JSON.stringify(rest));
  await page.mouse.move(sheet.x + sheet.width * 0.92, sheet.y + 80, { steps: 6 });
  await page.waitForTimeout(700);
  const right = await tilt();
  await page.mouse.move(sheet.x + sheet.width * 0.08, sheet.y + 80, { steps: 6 });
  await page.waitForTimeout(700);
  const left = await tilt();
  check("résumé: the sheet tilts with the pointer, one way on the right and the other on the left", right.y > 2 && left.y < -2 && right.transform !== "none", `right ${right.y.toFixed(1)} deg, left ${left.y.toFixed(1)} deg`);
  check("résumé: the tilt stays gentle", Math.abs(right.y) <= 8 && Math.abs(left.y) <= 8 && Math.abs(right.x) <= 8);
  check("résumé: a shine shows while the pointer is on the sheet", left.shine > 0.5, `opacity ${left.shine}`);
  check("résumé: tilting causes no sideways scrolling", left.overflow <= 0 && right.overflow <= 0, `${Math.max(left.overflow, right.overflow)}px`);
  await page.mouse.move(40, 500, { steps: 4 });
  await page.waitForTimeout(1500);
  const after = await tilt();
  check("résumé: it settles flat again when the pointer leaves", after.x === 0 && after.y === 0 && after.transform === "none" && after.shine === 0, JSON.stringify(after));

  // The download.
  const download = page.locator(".resume-download");
  const href = await download.getAttribute("href");
  check("résumé: Download is a link to the PDF that saves it", href.endsWith(".pdf") && (await download.getAttribute("download"))?.endsWith(".pdf"));
  const file = await page.request.get(new URL(href, page.url()).href);
  const body = await file.body();
  check("résumé: the PDF is served as a PDF", file.ok() && file.headers()["content-type"].startsWith("application/pdf") && body.subarray(0, 5).toString("latin1") === "%PDF-", `${file.status()} ${file.headers()["content-type"]}`);
  const [saved] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), download.click()]);
  check("résumé: pressing Download saves the file under a sensible name", saved.suggestedFilename() === "Noah-Leibovitz-Resume.pdf", saved.suggestedFilename());
  await saved.cancel();
  check("résumé: the PDF can also be opened in a new tab", (await page.getAttribute(".resume-open", "href")) === href && (await page.getAttribute(".resume-open", "target")) === "_blank");

  // The PDF's own links, laid over the picture.
  const links = await page.locator(".resume-link").evaluateAll((els) => els.map((el) => ({ href: el.getAttribute("href"), name: el.getAttribute("aria-label"), box: el.getBoundingClientRect().toJSON() })));
  check("résumé: the links printed on the résumé work", links.some((l) => l.href.startsWith("mailto:")) && links.some((l) => l.href.includes("github.com")), links.map((l) => l.name).join(", "));
  check("résumé: every link lies on the sheet", links.every((l) => l.box.left >= sheet.x && l.box.right <= sheet.x + sheet.width && l.box.width > 20 && l.box.height > 8));
  const text = await page.textContent('main.resume section[aria-label="The résumé as text"]');
  check("résumé: its text is in the page for screen readers", text.includes("EDUCATION") && text.includes("University of Maryland"));

  // Esc goes back to the desk, and the Stream Deck's Résumé key leads here too.
  await page.keyboard.press("Escape");
  await page.waitForURL(at("/"), { timeout: 3000 });
  await page.waitForTimeout(1200);
  // Find the key by its label: it is in the second row, below the first key of its column.
  const names = await page.locator(".hotspots a").allTextContents();
  const id = `key-${names.findIndex((name) => name.trim() === "Résumé") - 2}`; // after the two monitors
  // Park the pointer by the Stream Deck first: the camera leans toward the pointer, and a key is
  // only a few pixels wide, so it has to be measured with the lean already settled there.
  const near = await locate(page, id);
  await page.mouse.move(near.x, near.y + 40, { steps: 4 });
  await page.waitForTimeout(1300);
  const top = await locate(page, id);
  let key = null;
  for (let dy = 12; dy <= 70 && !key; dy += 3) {
    await page.mouse.move(top.x, top.y + dy);
    await page.waitForTimeout(80);
    if ((await shownLabel(page)) === "Résumé") key = { x: top.x, y: top.y + dy };
  }
  check("résumé: the Stream Deck has a Résumé key", key !== null);
  if (!key) return;
  await page.mouse.click(key.x, key.y);
  await page.waitForURL(at("/resume"), { timeout: 3000 });
  check("résumé: pressing that key opens the résumé page", true);
  check("résumé: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  // About and Contact lead here.
  for (const route of ["/about", "/contact"]) {
    const other = await open(route);
    check(`résumé: ${route} links to the résumé`, (await other.page.locator(`main.page ${a("/resume")}`).count()) === 1);
    await other.context.close();
  }

  // Without JavaScript the résumé and the download are still there.
  const plainContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const plain = await plainContext.newPage();
  await plain.goto(base + "/resume", { waitUntil: "load" });
  check("résumé: without JavaScript the sheet and the download are in the HTML", (await plain.locator(".resume-sheet img").count()) >= 1 && (await plain.locator(".resume-download[download]").count()) === 1);
  await plainContext.close();

  // Phone.
  const phone = await open("/resume", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("résumé: phone: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  const button = await phone.page.locator(".resume-download").boundingBox();
  check("résumé: phone: Download is a 44px target", button.height >= 44, `${button.height}px`);
  const phoneSheet = await phone.page.locator(".resume-sheet").boundingBox();
  check("résumé: phone: the sheet fills the width", phoneSheet.width > 330, `${phoneSheet.width.toFixed(0)}px`);
  check("résumé: phone: pressing the sheet opens the PDF", (await phone.page.getAttribute(".resume-zoom", "href")).endsWith(".pdf"));
  await phone.page.touchscreen.tap(phoneSheet.x + 20, phoneSheet.y + phoneSheet.height - 20).catch(() => {});
  await phone.page.waitForTimeout(400);
  check("résumé: phone: a touch does not tilt the sheet", await phone.page.evaluate(() => getComputedStyle(document.querySelector(".resume-sheet")).transform === "none"));
  await phone.context.close();

  // Other window widths: still centered, and never under the Close button while it can be avoided.
  for (const width of [1200, 1728]) {
    const other = await open("/resume", { viewport: { width, height: 900 } });
    const box = await other.page.locator(".resume-sheet").first().boundingBox();
    const closeBox = await other.page.locator(".page-close").boundingBox();
    check(`résumé: centered at ${width}px wide, clear of Close`, Math.abs(box.x + box.width / 2 - width / 2) <= 1 && box.x + box.width <= closeBox.x, `center ${(box.x + box.width / 2).toFixed(1)}, sheet ends ${(box.x + box.width).toFixed(0)}, Close starts ${closeBox.x.toFixed(0)}`);
    await other.context.close();
  }

  // Reduced motion: the sheet holds still.
  const still = await open("/resume", { reducedMotion: "reduce" });
  const stillSheet = await still.page.locator(".resume-sheet").first().boundingBox();
  await still.page.mouse.move(stillSheet.x + stillSheet.width * 0.9, stillSheet.y + 100, { steps: 4 });
  await still.page.waitForTimeout(500);
  check("résumé: reduced motion: the sheet does not tilt", await still.page.evaluate(() => getComputedStyle(document.querySelector(".resume-sheet")).transform === "none"));
  await still.context.close();

  const sitemap = await page.request.get(base + "/sitemap.xml").catch(() => null);
  if (sitemap) check("résumé: the sitemap lists the page", sitemap.ok() && (await sitemap.text()).includes("/resume"));
}
