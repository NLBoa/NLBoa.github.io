// The Contact page: the places to reach me, and nothing else.
import path from "node:path";

export default async function contactPage({ browser, base, out, open, check }) {
  const email = "noah.leibovitz@outlook.com";

  // Without JavaScript the links still work.
  const plainContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const plain = await plainContext.newPage();
  await plain.goto(base + "/contact", { waitUntil: "load" });
  check("contact: without JavaScript the first row writes to my address", (await plain.getAttribute(".reach li > a", "href")) === `mailto:${email}`);
  // Email, GitHub, LinkedIn and the résumé.
  check("contact: without JavaScript the four places are links", (await plain.locator(".reach li > a").count()) === 4 && (await plain.locator(".copy").count()) === 0);
  await plainContext.close();

  const { context, page, errors } = await open("/contact", { permissions: ["clipboard-read", "clipboard-write"] });
  await page.waitForSelector(".copy");
  check("contact: there is no form on the page", (await page.locator("main.page form, main.page input, main.page textarea").count()) === 0);
  const fold = await page.evaluate(() => document.querySelector(".reach").getBoundingClientRect().bottom);
  check("contact: everything fits a 1440x900 screen", fold <= 900, `bottom ${fold.toFixed(0)}px`);
  const columns = await page.evaluate(() => {
    const box = (selector) => document.querySelector(selector).getBoundingClientRect();
    return { lede: box(".contact-head .lede").left, list: box(".reach").left, title: box(".contact-head h1").right };
  });
  check("contact: the places line up under the line that introduces them", Math.abs(columns.lede - columns.list) < 1 && columns.list > columns.title, JSON.stringify(columns));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "contact-page-1440x900.png") });

  await page.click(".copy");
  await page.waitForFunction(() => document.querySelector(".copy").dataset.state === "done", null, { timeout: 3000 });
  check("contact: Copy puts my address on the clipboard and says so", (await page.evaluate(() => navigator.clipboard.readText())) === email && (await page.textContent(".copy")) === "Copied");

  const time = await page.textContent(".local-time");
  check("contact: my local time is shown", /^It is \d{1,2}:\d{2} [ap]m for me \(US Eastern time\)\.$/.test(time), time);
  check("contact: says what I am open to", (await page.textContent(".contact-status")).includes("internships"));
  check("contact: no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await context.close();

  const phone = await open("/contact", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await phone.page.waitForSelector(".copy");
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("contact: phone: nothing overflows sideways", overflow <= 0, `${overflow}px`);
  const smallest = await phone.page.evaluate(() => Math.min(...[...document.querySelectorAll(".copy, .reach li > a")].map((el) => el.getBoundingClientRect().height)));
  check("contact: phone: every control is at least 44px tall", smallest >= 44, `${smallest}px`);
  const clash = await phone.page.evaluate(() => {
    const close = document.querySelector(".page-close").getBoundingClientRect();
    const title = document.querySelector(".contact-head h1").getBoundingClientRect();
    return title.top < close.bottom && title.right > close.left;
  });
  check("contact: phone: Close does not cover the heading", !clash);
  await phone.page.waitForTimeout(500);
  await phone.page.screenshot({ path: path.join(out, "contact-page-390x844.png") });
  await phone.context.close();
}
