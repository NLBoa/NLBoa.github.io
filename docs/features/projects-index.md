# Projects page as project tiles

Branch: `feature/projects-index` (on top of `fix/page-close`).

## What it is

The Projects page was a plain list. It is now the left monitor's screen at full size: six large buttons, three to a row. Five are the projects, each with a drawn cover in the project's own color, its name, one line and its stack. The sixth, "More on GitHub", leads to the GitHub profile; it was added when MID came off the site, so the grid stays full. The left monitor in the 3D scene shows the same six tiles, so clicking it leads into what you were looking at.

## Decisions

- **Covers are vector shapes, defined once** in `src/covers/shapes.ts` as SVG path strings. `Cover.tsx` draws them as SVG on the page; `paint.ts` paints the same paths onto the monitor's canvas texture with `Path2D`. A new project needs one entry there (a unit test fails if one is missing).
- Each cover echoes the project's miniature: Argus's week, Smart Display's board, Jupiterp's plan and week, Aegis Orbit's orbit and debris, Shell's prompt, MID's mostly empty palette. Covers carry no text.
- The page uses the screen's own colors (`#0b111c` and so on) and sits in one rounded panel, like a display.
- At 1440×900 the whole grid is visible without scrolling. Two columns under 62rem; on a phone one column with the cover beside the words.
- Hover and keyboard focus give a tile its color; pressing it scales it down slightly, like a key. Nothing moves by itself.
- The home page's no-WebGL fallback keeps the plain list (`ProjectList`).
- The link-preview image was re-captured, because the monitor's screen changed.

## Files

`src/covers/`, `src/components/ProjectTiles.tsx`, `src/app/projects/page.tsx`, `src/app/projects/projects.css`, `src/scene/textures/screens.ts` (`projectGrid`), `scripts/checks/projects-index.mjs`.

## To drop it

Delete the branch. Nothing else depends on it.
