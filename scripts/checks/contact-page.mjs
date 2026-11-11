// Feature: the Contact page as a sheet of note paper (branch feature/contact-page).
import path from "node:path";

export default async function contactPage({ browser, base, out, open, check }) {
  const email = "Noah.leibovitz@outlook.com";

  // Without JavaScript the links still work.
  const plainContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const plain = await plainContext.newPage();
  await plain.goto(base + "/contact", { waitUntil: "load" });
  check("contact: without JavaScript the note's button is still a link to my address", (await plain.getAttribute(".note-send", "href")).startsWith(`mailto:${email}?subject=`));
  check("contact: without JavaScript the three places are links", (await plain.locator(".reach li > a").count()) === 3 && (await plain.locator(".copy").count()) === 0);
  await plainContext.close();

  const { context, page, errors } = await open("/contact", { permissions: ["clipboard-read", "clipboard-write"] });
  await page.waitForSelector('.note-send[data-ready="true"]');
  const fold = await page.evaluate(() => document.querySelector(".note").getBoundingClientRect().bottom);
  check("contact: the note fits a 1440x900 screen", fold <= 900, `bottom ${fold.toFixed(0)}px`);
  await page.screenshot({ path: path.join(out, "contact-page-1440x900.png") });

  // What is written on the note becomes the draft.
  await page.fill(".note input", "Ada Lovelace");
  await page.fill(".note textarea", "Hello Noah.\nI liked Argus & the desk: 100% yes.");
  const href = await page.getAttribute(".note-send", "href");
  const query = Object.fromEntries(href.split("?")[1].split("&").map((pair) => pair.split("=").map(decodeURIComponent)));
  check("contact: the note is addressed to me", href.startsWith(`mailto:${email}?`));
  check("contact: the subject names the sender", query.subject === "A note from Ada Lovelace", query.subject);
  check("contact: the note and the name become the draft's body", query.body === "Hello Noah.\r\nI liked Argus & the desk: 100% yes.\r\n\r\nAda Lovelace", JSON.stringify(query.body));
  check("contact: the link is safely encoded", !/[\s#]/.test(href));

  // The page sends nothing itself.
  const sent = [];
  page.on("request", (request) => request.method() !== "GET" && sent.push(request.url()));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  check("contact: writing a note sends nothing from the page", sent.length === 0 && new URL(page.url()).pathname.replace(/\/$/, "").endsWith("/contact"));

  await page.click(".copy");
  await page.waitForFunction(() => document.querySelector(".copy").dataset.state === "done", null, { timeout: 3000 });
  check("contact: Copy puts my address on the clipboard and says so", (await page.evaluate(() => navigator.clipboard.readText())) === email && (await page.textContent(".copy")) === "Copied");

  const time = await page.textContent(".local-time");
  check("contact: my local time is shown", /^It is \d{1,2}:\d{2} [ap]m for me \(US Eastern time\)\.$/.test(time), time);
  check("contact: says what I am open to", (await page.textContent(".contact-status")).includes("internships"));
  check("contact: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  const phone = await open("/contact", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await phone.page.waitForSelector('.note-send[data-ready="true"]');
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("contact: phone: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  const smallest = await phone.page.evaluate(() => Math.min(...[...document.querySelectorAll(".note-send, .copy, .reach li > a")].map((el) => el.getBoundingClientRect().height)));
  check("contact: phone: every control is at least 44px tall", smallest >= 44, `${smallest}px`);
  const clash = await phone.page.evaluate(() => {
    const close = document.querySelector(".page-close").getBoundingClientRect();
    const title = document.querySelector(".contact-head h1").getBoundingClientRect();
    return title.top < close.bottom && title.right > close.left;
  });
  check("contact: phone: Close does not cover the heading", !clash);
  await phone.page.screenshot({ path: path.join(out, "contact-page-390x844.png") });
  await phone.context.close();
}
