# The room beside a project page

Branch: `feature/room-beside-page` (from `main`, 2026-11-11).

Noah: the sides of a project page are empty, "I want it to have something maybe moving". Of three ideas for the right side he chose **the room shows through**; for the left heading column he chose **keep it quiet**. Not chosen, so do not build without asking: a drawn scene per project in the margin, a pinned side panel, a reading rail or small drawings in the left column.

## What it does

On a wide window a project page's column stops at about 1060 px and the rest was empty. Now the scrim opens there, so the window with the rain running, the left monitor and the edge of the desk show beside the text. The room stays put while the page scrolls. The only motion is the rain (CSS) and one camera move when the page opens.

It applies to `/projects/<slug>` only, in a landscape window at least 83.875rem wide (1342 px). Phones, narrower windows, browsers without WebGL and every other page are unchanged.

## Decisions

- **The band** is the strip from 2rem past the column to the window's right edge, at least 16rem wide. `src/scene/band.ts` (`sideBand`) is its one definition in code; `src/app/projects/[slug]/room.css` repeats the numbers in a media query. A browser check compares the two through `window.__scene.band`.
- **Camera.** A `story` view, used only while a project page is open and a band exists; otherwise the camera behaves exactly as before (`CameraRig` decides, the store's view is untouched). The pose is a tall slice from the desk top to above the window's head whose left edge is the wall just left of the window, so a narrow band shows one pane and a wide one shows the whole window, the curtain and more of the desk. `CameraPose.shiftX` slides the picture into the band with the same lens shift `shiftY` already used.
- **Scrim.** A mask on `.scrim` fades it from solid at the column's edge to 14% over 5rem. It eases through a registered custom property (`--scrim-open`). The header is clear over the band too, so the room runs to the top of the window.
- **Rain** keeps running beside a project page (it rests and dims on every other page, as before).
- **Monitors** light up again beside a project page, but only once the camera has arrived (`beside` in the store), so their text never sweeps behind the page's text during the move.
- The band is not clickable; Close and Esc are unchanged.
- The 3D scene still draws no frames while a project page sits open.

## Checked

`npm run flows` runs `scripts/checks/room-beside-page.mjs`: the band matches the laid-out column, the window shows in it, the page behind the text and the left margin stay dark while scrolling, the rain runs, no idle frames, the Projects page keeps its full scrim, a tile and a Stream Deck key both end on the room, Esc returns to the desk, and a narrow window, reduced motion and a phone behave as before.

Looked at 1344×800, 1440×900, 1728×1117, 1920×1080 and 390×844.

## To keep or drop

Keep: merge the branch into `main`. Drop: delete the branch. It touches `CameraRig.tsx`, `camera.ts`, `Monitors.tsx`, `store.ts`, `Scene.tsx` (one stats getter) and the project page's import; everything else is new files.

## Not checked

Frame rate on a slower laptop with the rain running beside a long page. An ultrawide window (band wider than it is tall) was not looked at.
