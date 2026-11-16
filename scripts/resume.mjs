// The résumé: a PDF -> what the /resume page needs.
//
//   public/resume/<name>.pdf       the file itself, for "Download" and "Open the PDF"
//   public/resume/page-N.webp      each page as a picture, so it shows on every device
//                                  (phones do not display a PDF inside a page)
//   src/content/resume-data.json   page sizes, where the PDF's links are, and its text
//
// Usage: npm run assets:resume -- "/path/to/Resume.pdf"
//        npm run assets:resume            (again, from the PDF already in public/resume)
//
// The PDF is drawn by pdf.js in the installed Google Chrome, through playwright-core,
// like the other scripts here that need a browser.
import { chromium } from "playwright-core";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const target = path.join(root, "public/resume");
const pdfjs = path.join(root, "node_modules/pdfjs-dist");
/** The name a visitor's download gets. */
const FILE_NAME = "Noah-Leibovitz-Resume.pdf";
/** Pixels per PDF point: a Letter page comes out 1836 px wide, sharp on a 2x screen. */
const SCALE = 3;

const published = path.join(target, FILE_NAME);
const source = process.argv[2] ? path.resolve(process.argv[2]) : published;
if (!existsSync(source)) {
  console.error(process.argv[2] ? `No file at ${source}` : `There is no résumé yet. Run: npm run assets:resume -- "/path/to/Resume.pdf"`);
  process.exit(1);
}
const bytes = readFileSync(source);
if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
  console.error(`${source} is not a PDF.`);
  process.exit(1);
}

const types = { ".mjs": "text/javascript", ".wasm": "application/wasm", ".pfb": "application/octet-stream", ".ttf": "font/ttf", ".bcmap": "application/octet-stream", ".icc": "application/octet-stream" };

// A page of our own, on an address that never leaves this machine: every request is answered
// from the PDF and from pdf.js in node_modules.
const ORIGIN = "http://resume.invalid";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
page.on("pageerror", (error) => console.error("pdf.js:", error.message));
await page.route(`${ORIGIN}/**`, (route) => {
  const { pathname } = new URL(route.request().url());
  if (pathname === "/") return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>resume</title>" });
  if (pathname === "/resume.pdf") return route.fulfill({ contentType: "application/pdf", body: bytes });
  const file = path.join(pdfjs, pathname);
  if (!file.startsWith(pdfjs + path.sep) || !existsSync(file) || !statSync(file).isFile()) return route.fulfill({ status: 404, body: "" });
  return route.fulfill({ contentType: types[path.extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
});
await page.goto(`${ORIGIN}/`);

const result = await page.evaluate(async (scale) => {
  const lib = await import("/build/pdf.mjs");
  lib.GlobalWorkerOptions.workerSrc = "/build/pdf.worker.mjs";
  const doc = await lib.getDocument({ url: "/resume.pdf", standardFontDataUrl: "/standard_fonts/", cMapUrl: "/cmaps/", wasmUrl: "/wasm/", iccUrl: "/iccs/" }).promise;
  const { info } = await doc.getMetadata();
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pdfPage = await doc.getPage(n);
    const viewport = pdfPage.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    // Paper is white; a PDF page itself has no background.
    await pdfPage.render({ canvas, viewport, background: "#ffffff" }).promise;

    // Links, as fractions of the page, so the page can lay real links over the picture.
    const links = [];
    for (const annotation of await pdfPage.getAnnotations()) {
      if (annotation.subtype !== "Link" || !annotation.url) continue;
      const [x1, y1] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
      const [x2, y2] = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
      links.push({
        href: annotation.url,
        left: Math.min(x1, x2) / viewport.width,
        top: Math.min(y1, y2) / viewport.height,
        width: Math.abs(x2 - x1) / viewport.width,
        height: Math.abs(y2 - y1) / viewport.height,
      });
    }

    // The text, line by line, for screen readers and search engines.
    const lines = [];
    let line = "";
    let lastY = null;
    for (const item of (await pdfPage.getTextContent()).items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2 && line.trim()) {
        lines.push(line);
        line = "";
      }
      line += item.str;
      lastY = y;
      if (item.hasEOL) {
        if (line.trim()) lines.push(line);
        line = "";
        lastY = null;
      }
    }
    if (line.trim()) lines.push(line);

    pages.push({ width: canvas.width, height: canvas.height, png: canvas.toDataURL("image/png"), links, lines });
  }
  return { pages, info };
}, SCALE);
await browser.close();

mkdirSync(target, { recursive: true });
// Start clean, so a résumé that got shorter leaves no old page behind.
for (const file of readdirSync(target)) if (/^page-\d+\.webp$/.test(file)) rmSync(path.join(target, file));
if (source !== published) copyFileSync(source, published);

/** "D:20261116093000-05'00'" -> "2026-11-16" */
const pdfDate = (value) => (typeof value === "string" && /^D:\d{8}/.test(value) ? `${value.slice(2, 6)}-${value.slice(6, 8)}-${value.slice(8, 10)}` : null);
const tidy = (text) => text.replace(/\s+/g, " ").trim();

const pages = [];
for (const [index, drawn] of result.pages.entries()) {
  const name = `page-${index + 1}.webp`;
  const png = Buffer.from(drawn.png.split(",")[1], "base64");
  // Black type on white paper: lossless is both the sharpest and, here, small.
  const info = await sharp(png).webp({ lossless: true, effort: 6 }).toFile(path.join(target, name));
  console.log(`/resume/${name}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB  ${drawn.links.length} links  ${drawn.lines.length} lines of text`);
  pages.push({
    image: `/resume/${name}`,
    width: drawn.width,
    height: drawn.height,
    links: drawn.links.map((link) => ({ ...link, left: round(link.left), top: round(link.top), width: round(link.width), height: round(link.height) })),
    lines: drawn.lines.map(tidy).filter(Boolean),
  });
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

const data = {
  file: `/resume/${FILE_NAME}`,
  fileName: FILE_NAME,
  bytes: bytes.length,
  // When the PDF says it was last saved; the page shows the month.
  updated: pdfDate(result.info?.ModDate) ?? pdfDate(result.info?.CreationDate) ?? statSync(source).mtime.toISOString().slice(0, 10),
  pages,
};
writeFileSync(path.join(root, "src/content/resume-data.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log(`/resume/${FILE_NAME}  ${(bytes.length / 1024).toFixed(0)} KB  saved ${data.updated}`);
console.log("wrote src/content/resume-data.json");
