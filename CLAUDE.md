@AGENTS.md

# Portfolio: a clean 3D desk

Noah Leibovitz's portfolio. The home page is a calm 3D desk; a few objects on it open parts of the site. The full brief is the build prompt Noah pasted at the start (sections 1–9); this file records the stack, commands, layout and every decision made since, so a fresh session can continue.

Priorities, in order: (1) any project is readable within two clicks, on a phone and without WebGL; (2) the desk stays calm and uncluttered. When they conflict, 1 wins.

## Status

- Phase 0 (blockout): done and approved. Branch `phase-0-blockout`.
- Phase 1 (look): done and approved. Branch `phase-1-look` (stacked on phase 0).
- Phase 2 (function): done and approved. Branch `phase-2-function` (stacked on phase 1).
- **Phase 3 (ship): everything built and tested except the deploy itself.** Branch `phase-3-ship` (stacked on phase 2). `main` still holds only the scaffold commit; the four phase branches have not been merged.
- **Not deployed.** There is no Git remote and the Vercel CLI is not installed. Creating a GitHub repo, pushing, and deploying each need Noah's explicit go-ahead (repo name, public or private, and whether to publish with the content placeholders still showing).
- Stop at the end of each phase, show screenshots at 1440×900 and 390×844, and wait.

## Stack

- Next.js 16.4 (App Router, `cacheComponents`), React 19.3, TypeScript 5.9 (what `create-next-app` pins; move to 7 only if Next supports it cleanly).
- three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7 (fiber 9 needs react `>=19 <19.4`). zustand 5 is installed for scene state (unused until Phase 2).
- Plain CSS with variables in `src/app/globals.css`. No component kit, no Tailwind.
- Fonts: Schibsted Grotesk (everything) and IBM Plex Mono (stack, dates, small data) via `next/font`. The monitor screens and Stream Deck keys draw with the same fonts.
- npm. Node 24.
- Latest stable releases only. Read the current docs before using a three / R3F / drei / Next API (Next's are in `node_modules/next/dist/docs/`).

## Commands

- `npm run dev` — dev server on :3000
- `npm run build`, `npm run lint`, `npm test` (vitest, pure logic only)
- `npm run checkpoint -- <label> [route]` — with the dev server running: screenshots at both review sizes into `docs/checkpoints/`, triangles, draw calls, frames drawn while idle, 3D asset bytes, open TODOs. Uses the installed Google Chrome through playwright-core.
- `npm run flows` — with the dev server running: 27 end-to-end checks (hover, click, Esc, Back, Tab order, direct URLs, 404, no WebGL, reduced motion, phone) plus page screenshots
- `npm run todos` — list every `TODO(noah)` in the content files
- `npm run share-image` — re-captures `src/app/opengraph-image.png` (1200×630) from the running site; run it again after the look or the content on the screens changes
- `checkpoint`, `flows` and `share-image` read `BASE_URL`. To test a production build: `NEXT_PUBLIC_SCENE_STATS=1 npm run build`, `npx next start -p 3100`, then `BASE_URL=http://localhost:3100 npm run flows`. The stats flag only exposes `window.__scene` for the scripts; a normal build leaves it out.
- `npm run assets:models` — `assets-src/keyboard.glb` → `public/models/keyboard-keys.glb` (crop, normalize, meshopt, WebP ≤ 1024 px)
- `npm run assets:textures` — downloads the Poly Haven walnut maps into `assets-src/textures/` and writes WebP into `public/textures/`

## Layout

```
src/app/         layout.tsx: header, <SceneMount/> (once, so the canvas persists), scrim, page
                 page.tsx (home: the Projects index, hidden while the desk is up),
                 projects/, projects/[slug]/, about/, contact/   — all static HTML
src/components/  Header, NavLinks, Page (frame with Close), ProjectList, RouteSync
src/content/     all site copy, typed (types, projects, about, contact, site)
src/lib/         deck.ts: the Stream Deck's 15 keys generated from content (tested)
src/scene/       layout.ts      every size and position in meters (single source of truth)
                 interactive.ts the objects that react, in Tab order; URL -> camera view
                 store.ts       zustand: path, flight, hovered, focused, pressed, pulse, activate()
                 camera.ts      fitCamera / homePose / poseFor (tested)
                 CameraRig.tsx  owns the camera: poses, flights, pointer drift
                 Highlight.tsx  outline frames, pointer handlers
                 Scene.tsx      the <Canvas>, label anchor, ready flag, pulse, dev stats
                 SceneUI.tsx    DOM beside the canvas: label, hotspot links, phone dock
                 SceneMount.tsx WebGL check, error boundary, dynamic import with ssr: false
                 Lights.tsx, materials.ts, geometry.ts
                 objects/       Room, Monitors, StreamDeck, PenCup, Keyboard
                 textures/      screens.ts, useScreenTexture.ts, keyIcons.ts
scripts/         checkpoint.mjs, flows.mjs, optimize-models.mjs, fetch-textures.mjs
public/models/   keyboard-keys.glb      public/textures/  walnut-diff.webp, walnut-normal.webp
docs/checkpoints/ screenshots from each phase
reference/       desk-reference.jpg (+ original HEIC)   — git-ignored
assets-src/      keyboard.glb, textures/                — git-ignored
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

- 2026-11-10 — **The downloaded keyboard model is the full-size Magic Keyboard with a numeric keypad**, not the compact one on the desk. `optimize-models.mjs` keeps only the keycaps of the main block (legends intact) and the aluminum body is built in code at 27.9 × 11.5 cm. So the shipped keyboard has no fn key or arrow cluster; at desk scale it reads as the compact board. The credits entry must say "cropped to the compact layout; body rebuilt". If Noah supplies a true compact model, swap it in.
- 2026-11-10 — Credits data so far (the manifest and `/credits` page are Phase 3): "Apple Magic Keyboard" by infohack, https://sketchfab.com/3d-models/apple-magic-keyboard-faa71198d6884781bf8a9cf89a26b930, CC BY (copy the exact license link from the model page in Phase 3). Walnut Veneer by Poly Haven is CC0 (no attribution required; credit it anyway).
- 2026-11-10 — Lighting recipe (night): two cool `RectAreaLight`s on the screens, a spot from the light bar with `decay={1}` so the wash is even, a faint warm directional "room bounce", a warm point fill from the right, low hemisphere ambient, ACES tone mapping at exposure 1.25. Screens and the light-bar strip are `toneMapped={false}` basic materials. No post-processing.
- 2026-11-10 — Shadows are drei `ContactShadows` with `frames={1}`: baked once after everything under the Suspense boundary has loaded, never per frame (so phones have no real-time shadows). Anything that moves an object on the desk in Phase 2 must not rely on that shadow updating.
- 2026-11-10 — The walnut roughness map is not used (it read as glare under the single low light); diffuse + normal only, tinted `#948b80`, grain along the desk's width.
- 2026-11-10 — No environment map, so no metallic materials: "aluminum" is a satin gray.
- 2026-11-10 — The desk has two dark slab legs (part of the desk, kept in shadow) so it does not float on phones, where the area under it is visible.
- 2026-11-10 — Monitor screens already show site content (project grid, intro) drawn with the site's fonts. Stream Deck keys are dark until Phase 2 gives each its icon texture.
- 2026-11-10 — `useGLTF(url, false, true)`: Draco off (it would fetch a decoder from a CDN), meshopt on. Meshopt quantizes positions, so use the mesh's world matrix, not the bare geometry.
- 2026-11-10 — Measured on Noah's M3 Pro MacBook (dev build, Chrome, Metal): 60 fps while redrawing every frame at 1440×900 @2x and at 390×844 @1.5x. **Not measured on a real phone yet.**

- 2026-11-10 — **How navigation works.** Every route is a real static page. The store's `view` is `flight?.view ?? viewForPath(path)`. Clicking an object calls `activate(id)`: the camera eases there (700 ms), then `router.push`. Header links and direct loads skip the flight; a direct load starts with the camera already on that route's pose. Esc pushes `/`. Under reduced motion `activate` pushes at once and the camera cuts.
- 2026-11-10 — **Accessibility model.** `SceneUI.Hotspots` renders a real link for each interactive object (visually hidden, in Tab order: monitors, lit keys, pen cup). Focus on one outlines and labels its object in the scene; Enter is an ordinary link activation. The canvas itself is `aria-hidden`. Keyboard and trackpad have no handlers.
- 2026-11-10 — **Fallbacks.** An inline head script sets `html[data-webgl]` when the browser has WebGL2; that hides the home page's HTML index. `SceneMount` removes the mark if the context cannot be created or the scene throws, so the index comes back. Header and pages never depend on the scene.
- 2026-11-10 — **Phones.** Stream Deck keys are too small to tap, so on portrait screens the four featured projects are listed as links under the desk (`SceneUI.Dock`). Pixel ratio 1.5, shadows baked once.
- 2026-11-10 — Outlines are explicit geometry (`OutlineFrame` rings, `OutlineHull` for the cup). drei's `<Outlines>` rendered nothing visible here; do not go back to it without checking a screenshot.
- 2026-11-10 — With a page open the scrim is 94% and the monitor screens go dark, otherwise the screen text ghosts behind the page text.
- 2026-11-10 — `/projects/[slug]` sets `export const instant = false` and awaits `params` at the top, so an unknown slug is a real 404. Under `<Suspense>` it streamed a 200. `dynamicParams` is unavailable with Cache Components.
- 2026-11-10 — Stream Deck icons are generic line drawings (eye, bulb, planet, orbit, person, envelope, document, branch, briefcase), not brand logos. A project picks its icon with `icon` in the content file; without one the key shows the title's first letter.
- 2026-11-10 — Design tokens: wall `#121110`, paper `#ece6da`, dim `#a8a093`, faint `#756e63`, screen light `#cfe0ff` (focus rings and outlines). Left-aligned single column, no cards, no all-caps labels, no rules between rows.
- 2026-11-10 — The idle camera drift (3° yaw, 1.5° pitch) is for mouse and trackpad only, only on the desk view.

- 2026-11-10 — **Credits.** `src/content/credits.ts` is the typed manifest (title, creator, source, exact license link, changes) and `/credits` is generated from it; the footer links there (on phones the link sits in the dock). The keyboard's license link is the one the Sketchfab API reports for the model: `http://creativecommons.org/licenses/by/4.0/`. Fonts are listed too.
- 2026-11-10 — **Share image** is a 1200×630 capture of the desk (`opengraph-image.png` at the app root, so every page uses it); titles follow `<page> | Noah Leibovitz`. `metadataBase`, the sitemap and robots use `siteUrl` from `src/content/site.ts`: `NEXT_PUBLIC_SITE_URL`, else Vercel's production URL, else localhost.
- 2026-11-10 — **Loading.** Header and page shell render at once. On the home page a quiet "Setting up the desk" note appears after 0.9 s if the scene is not ready, and after 8 s the HTML Projects index stands in until it is.
- 2026-11-10 — **404.** `src/app/not-found.tsx`. Known limit of Cache Components: in a production build the first request for an unknown `/projects/<slug>` can answer 200 with the not-found page and a `noindex` tag, then 404 once cached. Other unknown addresses are 404 from the first request.
- 2026-11-10 — Production build measured locally: 3D assets 96.6 KB transferred (budget 3 MB), scripts about 520 KB transferred, 60 fps on the M3 Pro at both sizes. Still not measured on a real phone.

## Open questions for Noah

See `npm run todos` for content gaps (dates, some roles, images, 7SM title, "Outside of code", résumé PDF, MID details). Beyond those: whether to keep the cropped full-size keyboard model or supply a compact one, an optional `assets-src/pencup.jpg` pattern for the pen cup, and a frame-rate check on a real phone.
