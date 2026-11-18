# A cyber city outside the window

Branch: `feature/cyber-city` (from `main`, 2026-11-11).

Noah: "for the outside of the window can we add like a cyber city. Maybe find some buildings outside that could fit, and maybe a cyber car." Asked whether to draw the buildings in code or look for 3D models to download, he chose **draw it in code**.

## What it does

Behind the rain there is now a city at night: two rows of towers with lit windows, neon signs, glowing adverts, red lights on the masts, and five flying cars (three small ones far off that pass behind the near towers, two larger ones in front). Two signs flicker, the mast lights blink, the cars cross and come round again.

## Decisions

- **It is page art, not 3D.** `src/scene/City.tsx` draws SVG inside the rain layer (`Rain.tsx`), so it sits behind the rain and shows through the hole in the wall like the weather does. Everything that moves is a CSS animation, so the 3D scene still draws no frames while idle.
- **Layout comes from `src/scene/skyline.ts`**, a pure function with a fixed seed: the same city on every visit, and it is unit-tested. Change the seed (`buildCity(seed)`) for a different skyline.
- **The city is a square as wide as the longer side of the browser window**, centered. Towers run off the bottom and their roofs sit at many heights, so whichever part shows through the window in any camera view has a skyline in it. Car lanes sit in the band a laptop window sees.
- **Signs and adverts carry shapes, not words**, so nothing is written that is not true.
- The cars and signs stop with the rain while a page is open (the rule in `rain.css` covers them). Under reduced motion nothing moves and each car is parked in the air.
- The old blurred street lights and the passing headlight glow from the rain layer are kept in front of the city: they read as lights out of focus on wet glass.

## No filters in the city (2026-11-18)

The glow round the neon signs was an SVG blur filter. In Safari's engine (Safari, DuckDuckGo) an SVG filter is worked out again on the main thread every time the picture it belongs to repaints, which took about a tenth of a second at laptop size, and the city repainted whenever a mast light blinked, the hand cursor appeared or a page opened. On Noah's MacBook that showed as the desk stalling several times a second.

The glow is now the sign's own lines drawn six more times under the bright one, each wider and fainter (`GLOW` in `City.tsx`); together they fall off like the blur did. Each sign's lines are written once in `<defs>` and drawn with `<use>`. One element per sign flickers now, so a sign's glow and its lines always blink together.

Do not put an SVG filter, or a CSS `filter`, on anything inside `.city`: `scripts/checks/cyber-city.mjs` checks for both. To see what a change costs in that engine, `npm run build` and then `npm run frames -- Safari`.

## To confirm with Noah

- On the home page most of the window is behind the left monitor, so only part of the city shows there. It shows best beside a project page (branch `feature/room-beside-page`).
- The colors: magenta, cyan, amber and violet neon over dark blue towers.

## To keep or drop

Keep: merge the branch into `main`. Drop: delete the branch. It adds `City.tsx`, `city.css`, `skyline.ts` and its test, and two lines in `Rain.tsx`.
