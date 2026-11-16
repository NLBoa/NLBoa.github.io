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
  await phone.context.close();

  const sitemap = await page.request.get(base + "/sitemap.xml").catch(() => null);
  if (sitemap) check("résumé: the sitemap lists the page", sitemap.ok() && (await sitemap.text()).includes("/resume"));
}
