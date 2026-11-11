# A cyber city outside the window

Branch: `feature/cyber-city` (from `main`, 2026-11-11).

Noah: "for the outside of the window can we add like a cyber city. Maybe find some buildings outside that could fit, and maybe a cyber car." Asked whether to draw the buildings in code or look for 3D models to download, he chose **draw it in code**.

## What it does

Behind the rain there is now a city at night: two rows of towers with lit windows, neon signs, glowing adverts, red lights on the masts, and five flying cars (three small ones far off that pass behind the near towers, two larger ones in front). Two signs flicker, the mast lights blink, the cars cross and come round again.

## Decisions

- **It is page art, not 3D.** `src/scene/City.tsx` draws SVG inside the rain layer (`Rain.tsx`), so it sits behind the rain and shows through the hole in the wall like the weather does. Everything that moves is a CSS animation, so the 3D scene still draws no frames while idle.
- **Layout comes from `src/scene/skyline.ts`**, a pure function with a fixed seed: the same city on every visit, and it is unit-tested. Change the seed (`buildCity(seed)`) for a different skyline.
- **The city is a square as wide as the longer side of the browser window**, centered. Towers run off the bottom and some off the top, so whichever part shows through the window in any camera view is full of buildings. Car lanes sit in the band a laptop window sees.
- **Signs and adverts carry shapes, not words**, so nothing is written that is not true.
- The cars and signs stop with the rain while a page is open (the rule in `rain.css` covers them). Under reduced motion nothing moves and each car is parked in the air.
- The old blurred street lights and the passing headlight glow from the rain layer are kept in front of the city: they read as lights out of focus on wet glass.

## To confirm with Noah

- On the home page most of the window is behind the left monitor, so only part of the city shows there. It shows best beside a project page (branch `feature/room-beside-page`).
- The colors: magenta, cyan, amber and violet neon over dark blue towers.

## To keep or drop

Keep: merge the branch into `main`. Drop: delete the branch. It adds `City.tsx`, `city.css`, `skyline.ts` and its test, and two lines in `Rain.tsx`.
