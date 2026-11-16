# Résumé page

Branch: `resume-and-polish` (2026-11-16).

## What it is

The header's Résumé link used to lead to Contact, because no PDF had ever been added: it looked broken. `/resume` now shows the résumé as a sheet of paper on the dark desk, with a Download button, a link that opens the PDF in a new tab, and the PDF's own links (email, LinkedIn, GitHub) working where they are printed. The Stream Deck's Résumé key, the About page and the Contact page lead to the same page.

## To publish a new résumé

```bash
npm run assets:resume -- "/path/to/Resume.pdf"
```

That one command copies the PDF to `public/resume/Noah-Leibovitz-Resume.pdf`, draws each page to `public/resume/page-N.webp`, and writes `src/content/resume-data.json` (page sizes, link positions, the text, the date the PDF was saved). Commit those files. Nothing on the page is typed by hand, so it cannot drift from the PDF. A résumé of several pages works: every page becomes a sheet.

## Decisions

- **A picture of each page, not an embedded PDF viewer.** A phone will not show a PDF inside a page, and on a laptop each browser puts its own gray toolbar around one. A picture looks the same everywhere and suits the site. It is drawn at three pixels per point (1836 px wide for Letter) and stored as lossless WebP, about 210 KB for one page.
- **The PDF is still one press away**: Download (with the size shown), "Open the PDF in a new tab", and pressing the sheet itself, which is how a phone gets a view it can zoom.
- **Links on the sheet are real links**, laid over the picture from the PDF's own link positions. On a phone the sheet is small and they are a few pixels tall, so there a press anywhere opens the PDF instead.
- **Screen readers and search engines get the text**: the PDF's text is in the page, visually hidden, and the picture is marked as decoration.
- **Layout.** On a wide window the title and the download sit in a column on the left that stays in view while the sheet scrolls; room is kept on the right so the Close button never covers the sheet. Narrower, the title and download sit above the sheet.
- **Printing the page prints the résumé**, not the site around it.
- The picture is `loading="lazy"` so the home page does not fetch it ahead of time just because the header links here; on this page it is in view and loads at once.
- **The camera** rests on the Stream Deck behind this page (`viewForPath`), since its Résumé key opens it.
- The PDF is drawn by pdf.js (`pdfjs-dist`, a dev dependency only) inside the installed Google Chrome through playwright-core, like the other scripts that need a browser. Nothing from pdf.js ships to visitors.
- The old plan (the header link and key open the bare PDF in a new tab) is replaced by this page. `contact.resume` is gone; the résumé's data is `src/content/resume.ts`.

## Settled with Noah (2026-11-16)

- The résumé stays as he supplied it, phone number included ("keep the resume on there").
- The site uses the résumé's LinkedIn address and its degree wording.

## Files

`src/app/resume/page.tsx`, `src/app/resume/resume.css`, `src/content/resume.ts`, `src/content/resume-data.json` (generated), `src/lib/resume.ts` (tested), `scripts/resume.mjs`, `public/resume/`, `scripts/checks/resume-page.mjs`.
