@AGENTS.md

# Portfolio: a clean 3D desk

Noah Leibovitz's portfolio. The home page is a calm 3D desk; a few objects on it open parts of the site. The full brief is the build prompt Noah pasted at the start (sections 1–9); this file records the stack, commands, layout and every decision made since, so a fresh session can continue.

Priorities, in order: (1) any project is readable within two clicks, on a phone and without WebGL; (2) the desk stays calm and uncluttered. When they conflict, 1 wins.

## Status

- **Phase 0 (blockout): done, waiting for Noah's review.** Branch `phase-0-blockout`.
- Phase 1 (look), Phase 2 (function), Phase 3 (ship): not started.
- Stop at the end of each phase, show screenshots at 1440×900 and 390×844, and wait.

## Stack

- Next.js 16.4 (App Router, `cacheComponents`), React 19.3, TypeScript 5.9 (what `create-next-app` pins; move to 7 only if Next supports it cleanly).
- three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7 (fiber 9 needs react `>=19 <19.4`). zustand 5 is installed for scene state (unused until Phase 2).
- Plain CSS with variables in `src/app/globals.css`. No component kit, no Tailwind.
- Fonts: Geist and Geist Mono via `next/font` (scaffold default; to be confirmed with Noah in Phase 2).
- npm. Node 24.
- Latest stable releases only. Read the current docs before using a three / R3F / drei / Next API (Next's are in `node_modules/next/dist/docs/`).

## Commands

- `npm run dev` — dev server on :3000
- `npm run build`, `npm run lint`, `npm test` (vitest, pure logic only)
- `npm run checkpoint -- <label> [route]` — with the dev server running: screenshots at both review sizes into `docs/checkpoints/`, triangles, draw calls, frames drawn while idle, 3D asset bytes, open TODOs. Uses the installed Google Chrome through playwright-core.
- `npm run todos` — list every `TODO(noah)` in the content files

## Layout

```
src/app/         layout.tsx mounts <SceneMount/> once so the canvas persists across routes;
                 page.tsx is the Projects index as plain HTML (the no-WebGL fallback)
src/content/     all site copy, typed (types.ts, projects.ts, about.ts, contact.ts)
src/scene/       layout.ts    every size and position in meters (single source of truth)
                 camera.ts    fitCamera / homePose: framing per aspect ratio (tested)
                 Scene.tsx    the <Canvas>, lights, camera rig, dev stats (window.__scene)
                 SceneMount.tsx  WebGL check + dynamic import with ssr: false
                 Blockout.tsx Phase 0 gray boxes (replaced object by object in Phase 1)
scripts/         checkpoint.mjs
docs/checkpoints/ screenshots from each phase
reference/       desk-reference.jpg (+ original HEIC)   — git-ignored
assets-src/      keyboard.glb (raw Sketchfab download)  — git-ignored
```

## Scene conventions

- Meters, real-world scale. Origin = center of the desk's top surface; +x right, +y up, +z toward the viewer.
- Desk coordinates from the brief (x 0–1 left to right, z 0–1 back to front) go through `onDesk(u, v)`.
- Sizes used: desk 1.4 × 0.7 m; 27-inch 16:9 screens 59.8 × 33.6 cm; Magic Keyboard 27.9 × 11.5 cm; Magic Trackpad 16 × 11.5 cm; Stream Deck body 11.8 × 8.4 × 2.5 cm tilted 50° on its stand, 15 keys of 16 mm; pen cup a hexagonal prism 8 cm across, 10.5 cm tall. The Stream Deck, trackpad and pen cup sizes are from memory and still need Noah's check.
- Monitor bottom edges sit 21 cm above the desk so the pens clear the right monitor.
- `frameloop="demand"`: nothing is drawn unless something calls `invalidate()`. Never give `useFrame` a render priority (it switches off R3F's own rendering).
- Pixel ratio capped at 2, 1.5 under 640 px wide.
- Camera: landscape looks down 30° with the whole desk top and both monitors in frame. Portrait frames the monitors and Stream Deck by width and shifts the picture up (`shiftY`), leaving the lower part of the screen for page content.

## Decisions

- 2026-11-10 — Project lives in `~/portfolio`. Local commits per phase; nothing is pushed or deployed without Noah's say-so.
- 2026-11-10 — **No shrine.** Overrides sections 4–6 of the brief. Four interactive objects: left monitor (`/projects`), right monitor (`/about`), Stream Deck (per key), pen cup (`/contact`). "Outside of code" stays a section of `/about` (`#outside-code`). The only downloaded model is the keyboard, so the credits manifest has one CC BY entry.
- 2026-11-10 — **Featured projects come from the "Featured work" section of the GitHub profile README** (github.com/NLBoa): Argus, Smart Display, Jupiterp, Aegis Orbit. Stream Deck: those 4 + About, Contact, Résumé, GitHub, LinkedIn = 9 lit keys, 6 dark.
- 2026-11-10 — Content sources are the brief's starter facts and that README. Never invent facts. Where the two disagree, keep a `TODO(noah): confirm` and ask; do not pick silently. Nothing else from GitHub (private repos, "More projects") is added unless Noah says so.
- 2026-11-10 — Unknown content is `null` (or an empty list) with a `TODO(noah)` comment beside it; pages leave those parts out instead of showing filler.
- 2026-11-10 — Résumé link and key point to `/contact` until a PDF exists.
- 2026-11-10 — Monitor screens and Stream Deck keys will be canvas textures drawn from the content files. Keep the right screen behind a small interface so a terminal (TypeScript port of the Java shell) can replace it later. Do not build the terminal now.
- 2026-11-10 — Both monitors are at the same height in the blockout; in the photo the right one sits a little higher. Open question for Noah.
- 2026-11-10 — Reference photo reviewed. Take from it only: monitor arrangement, wood tone, night lighting (cool screen light, light bar wash, warm fill from the right). None of the clutter.

- 2026-11-10 — Noah's content rulings: Smart Display **is** the brief's "Pi home hub" (one project, README description). Jupiterp is its own project and stays featured. **TerpScheduler is not used. The Bitcamp project (CampusEats / UMD event feed) is not part of the site.** Aegis Orbit uses the README's description. The honor is "Presidential Scholar". SKIBUS uses the README's numbers (roughly 10x faster check-in, 180+ person-trips, 5-person team, 4 seasons). The email, GitHub and LinkedIn from the README are right to publish.
- 2026-11-10 — Missing dates show the `DATES_PLACEHOLDER` text ("Dates to be added") from `src/content/types.ts`, each with a `TODO(noah): dates` beside it, until Noah supplies them.
- 2026-11-10 — Project list is now seven: Argus, Smart Display, Jupiterp, Aegis Orbit (featured), SKIBUS, Shell, MID.

## Open questions for Noah

See `npm run todos` for content gaps (dates, some roles, images, 7SM title, "Outside of code", résumé PDF, MID details). Beyond those: the font choice, the Stream Deck / trackpad / pen cup dimensions, whether the right monitor should sit higher than the left, and the phone framing.
