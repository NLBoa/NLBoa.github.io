# The phone home page: desk on top, tiles below

Status: **built and tested on the branch `phone-home`; not merged, not published.** Noah approved the design on 2026-11-21 ("Approve, build it"). Not yet tried on a real phone.

## Why

Noah, 2026-11-21, with a screenshot from his phone: "Come up with some ideas to make the phone experience better." What the screenshot showed:

- The monitor screens were too small to read, and nothing said the desk could be tapped.
- The project list was laid over the desk's legs and every summary was cut off.
- Only the four featured projects were listed; Shell was missing.

He chose "Desk on top, tiles" from four options.

## What a visitor sees

On a window that is taller than it is wide (`max-aspect-ratio: 1/1`, the test the old list used):

```
┌──────────────────────┐
│ Noah Leibovitz  links│  header, as before
│                      │
│  the live desk:      │  a banner, 332 px tall
│  monitors, cat, rain │  on a 390 × 660 phone screen
│                      │
├──────────────────────┤
│ [cover ] [cover ]    │
│  Argus    Smart Disp.│  six tiles, two columns:
│ [cover ] [cover ]    │  the five projects and
│  Jupiterp Aegis Orbit│  "More on GitHub"
│ [cover ] [cover ]    │
│  Shell    GitHub     │
│ Credits              │
└──────────────────────┘
```

- **The desk is a banner.** The canvas itself is that size, so the phone draws about half the pixels it did. The banner is wider than it is tall, so the whole desk fits in it, cat and keyboard included. There is no separate "portrait" camera view any more.
- **The tiles are real links** on the wall's color: the project's cover in its own color, and its title. One tap opens the project. They are in the page's HTML, so they are in place before the desk has loaded.
- **Everything fits on one screen** from 375 × 553 (the smallest current phone with its browser bars showing) to a tablet held upright, which gets three tiles to a row.
- **The desk still answers taps:** the monitors and the pen cup open their pages with the same flight as before.
- **The list that sat over the desk's legs (the "dock") is gone.** Credits is a row under the tiles.
- **A wide window is untouched**: a laptop, a desktop, a phone held sideways.

## Approaches considered

1. **Desk on top, tiles below** — chosen by Noah. Keeps the cat and the rain; still loads the 3D on phones.
2. **No 3D on phones**: the same tiles under a still picture. Fastest, but nothing moves. It stays the fallback: the tile panel is the same, so if the desk proves slow on a real phone only the banner changes.
3. **Keep the full-screen desk and patch it** (labels on the objects, a proper sheet for the list). Smallest change; the screens stay unreadable.
4. **A desk rebuilt for portrait** with one large monitor. Most work, and 390 px still holds little.

## Calls made (Noah saw the first three in the design and approved it)

- **Tiles show the cover and the title, no summary.** With a two-line summary under each title the banner would shrink to about 180 px on Noah's phone, a thin strip in which the desk is tiny. A bare name says little to a stranger; the summaries are one tap away. If he wants them, raise `--home-row-min` and add the line in `HomeTiles.tsx`.
- **No About / Contact / Résumé buttons under the tiles.** The header already has all three on a phone.
- **A tablet held upright gets the same layout**, three tiles to a row.
- **Without WebGL the page is the plain Projects index, not the tiles.** The design said the tiles would show there too; the index that already existed lists every project with its summary, which is better with no desk above it. The tiles do show while the desk is loading.
- **The cat sits in its usual place on a phone.** It had a second position, further in, because the old phone view cut off the desk's ends. The whole desk is in view now, so that is gone (`CAT.phonePosition`).

## How it works

- **`src/app/home.css`** holds all of it, and works the sizes out from the window alone, in CSS: `--home-row` (one row of tiles: what is left under a banner 0.85 times as tall as the screen is wide, kept between 4.75 and 8.5 rem), `--home-panel` (tiles and the Credits row), `--banner` (the rest, never taller than the window is wide and never under 4 rem + 11 rem). `.scene` takes `--banner` as its height on every page, so the canvas is not resized when a page opens.
- **`svh`, not `dvh`**, so the canvas is not resized each time a phone's browser bars slide in or out.
- **`src/components/HomeTiles.tsx`** is a server component in `src/app/page.tsx`. It is hidden unless the window is upright and the desk is there or on its way (`html[data-webgl]` or `body:has(.scene)`).
- **`src/scene/banner.ts`** tells the camera what to keep clear: the top 3 rem, where the header's text lies over the picture, and the bottom 1 rem, where the banner fades into the wall. `homePose(aspect, clear)` in `camera.ts` fits the desk between the two and slides the picture into place (`shiftY`). On a wide window nothing is kept clear and the view is exactly what it was.

## Checks

`scripts/checks/phone-home.mjs` (31 checks, run by `npm run flows`; `ONLY=phone-home` runs them alone): the tiles are in the HTML without JavaScript; at 390 × 660 all six are on screen without scrolling, in order, at least 44 px tall, two to a row; the last opens GitHub in a new tab; the canvas is the banner and the tiles start where it ends; both monitors and the pen cup are inside it below the header's text; one tap on a tile opens its project; the banner is the same size behind a page; a tap on the left monitor opens Projects; the tiles are in place and work while the desk's models are held back; the same at 375 × 553, 390 × 844, 430 × 739 and 768 × 1024; without WebGL the page is the index; on a laptop and on a phone held sideways there are no tiles and the desk fills the window.

Unit tests: `src/scene/banner.test.ts`, and the banner cases in `src/scene/camera.test.ts`.

Measured on 2026-11-21: 184 unit tests; all 384 browser checks against the production build. Against the dev server the same three hand-off timing checks fail as before this change (see CLAUDE.md, 2026-11-21).

Screenshots: `docs/checkpoints/phone-home-390x660.png`, `-390x844.png`, `-1440x900.png`.

## Not done

- **Not tried on a real phone.** The frame rate there is still unknown, and so is how iOS Safari treats `svh` as its bars move. Noah's phone is the test.
- Not measured in Safari's engine (`npm run frames` opens a desktop window, where this layout does not apply).
- The link-preview image is unchanged: it is captured at a wide size.

## To drop it

Delete the branch. Nothing else depends on it.
