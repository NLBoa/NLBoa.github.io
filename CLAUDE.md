@AGENTS.md

# Portfolio: a clean 3D desk

Noah Leibovitz's portfolio. The home page is a calm 3D desk; a few objects on it open parts of the site. The full brief is the build prompt Noah pasted at the start (sections 1–9); this file records the stack, commands, layout and every decision made since, so a fresh session can continue.

Priorities, in order: (1) any project is readable within two clicks, on a phone and without WebGL; (2) the desk stays calm and uncluttered. When they conflict, 1 wins.

## Status

- Phase 0 (blockout): done and approved. Branch `phase-0-blockout`.
- Phase 1 (look): done and approved. Branch `phase-1-look` (stacked on phase 0).
- Phase 2 (function): done and approved. Branch `phase-2-function` (stacked on phase 1).
- Phase 3 (ship): built and tested. Branch `phase-3-ship` (stacked on phase 2).
- **Live at https://nlboa.github.io/** since 2026-11-10. Repository: https://github.com/NLBoa/NLBoa.github.io (public). It is a user site, so there is no base path. Everything is merged into `main`; every push to `main` rebuilds and republishes through `.github/workflows/pages.yml`.
- The phase branches (`phase-0-blockout` … `github-pages`) exist only locally and are fully contained in `main`.
- Work from here on: small changes can go straight to `main` if Noah asks for them to be published; otherwise use a branch and ask before pushing, because a push to `main` goes live.
- **Project pages as stories: published 2026-11-11** (Noah: "Publish it"). Six projects are on the site, each with a story page; five have a miniature (MID has none). SKIBUS is parked. The branch `project-pages` is merged into `main`. The story texts are still drafts that Noah has not confirmed line by line; see the open questions.
- **All four features are kept and merged into `main` (2026-11-11), not yet published**: the Projects page as tiles, the room with a rainy window, the About profile card with the ASCII portrait, and the Contact note paper (Noah: "Keep everything"). Their notes are in `docs/features/`. The feature branches and `preview/all-features` still exist locally but are fully contained in `main`. `main` is ahead of the published site: push only when Noah says to publish.
- **Five projects are on the site**: Argus, Smart Display, Jupiterp, Aegis Orbit, Shell. SKIBUS and MID are parked in `parkedProjects` (MID because not much of it is built yet). The Projects page and the left monitor end with a "More on GitHub" tile so the grid of six stays full.
- **Three more features are kept and merged into `main` (2026-11-11, Noah: "Merge it"), not yet published**: the room beside a project page, the cyber city with flying cars outside the window, and the orb at the back of the desk, left of the Stream Deck, that watches the pointer. Notes in `docs/features/`. Their branches and `preview/room-life` still exist locally but are fully contained in `main`. **Dropped by Noah, branches still exist unmerged:** `feature/wall-display` (the Smart Display on the wall: "Remove the home display on the right side") and `feature/desk-plant` (a snake plant built in code: he asked for a large floor plant from a found model instead, then said "Actually no plants for now"). Two Poly Haven models were found for a floor plant and not downloaded: `potted_plant_01` (1.35 m, 6.33 MB) and `potted_plant_02` (0.84 m, 2.63 MB), both CC0.
- Stop at the end of each phase, show screenshots at 1440×900 and 390×844, and wait.

## Stack

- Next.js 16.4 (App Router, `output: "export"`, `trailingSlash: true`, optional `basePath`), React 19.3, TypeScript 5.9 (what `create-next-app` pins; move to 7 only if Next supports it cleanly).
- three 0.187, @react-three/fiber 9.8, @react-three/drei 10.7 (fiber 9 needs react `>=19 <19.4`). zustand 5 is installed for scene state (unused until Phase 2).
- Plain CSS with variables in `src/app/globals.css`. No component kit, no Tailwind.
- Fonts: Schibsted Grotesk (everything) and IBM Plex Mono (stack, dates, small data) via `next/font`. The monitor screens and Stream Deck keys draw with the same fonts.
- npm. Node 24.
- Latest stable releases only. Read the current docs before using a three / R3F / drei / Next API (Next's are in `node_modules/next/dist/docs/`).

## Commands

- `npm run dev` — dev server on :3000
- `npm run build` (writes the static site to `out/`), `npm run preview` (serves `out/` like GitHub Pages, port 3200), `npm run lint`, `npm test` (vitest, pure logic only)
- `npm run checkpoint -- <label> [route]` — with the dev server running: screenshots at both review sizes into `docs/checkpoints/`, triangles, draw calls, frames drawn while idle, 3D asset bytes, open TODOs. Uses the installed Google Chrome through playwright-core.
- `npm run flows` — with the dev server running: 108 end-to-end checks (hover, click, Esc, Back, Tab order, direct URLs, 404, no WebGL, reduced motion, phone) plus page screenshots
- `npm run todos` — list every `TODO(noah)` in the content files
- `npm run share-image` — re-captures `src/app/opengraph-image.png` (1200×630) from the running site; run it again after the look or the content on the screens changes
- `checkpoint`, `flows` and `share-image` read `BASE_URL`, which may include a base path. To test the exported site as GitHub Pages serves it: `NEXT_PUBLIC_BASE_PATH=/portfolio NEXT_PUBLIC_SCENE_STATS=1 npm run build`, `NEXT_PUBLIC_BASE_PATH=/portfolio npm run preview`, then `BASE_URL=http://localhost:3200/portfolio npm run flows`. The stats flag only exposes `window.__scene` for the scripts; a normal build leaves it out.
- `npm run assets:models` — `assets-src/keyboard.glb` → `public/models/keyboard-keys.glb` (crop, normalize, meshopt, WebP ≤ 1024 px)
- `npm run assets:images` — `assets-src/projects/<slug>/*.png|jpg` → `public/projects/<slug>/*.webp` (max 1600 px wide); prints each file's pixel size for the content file
- `npm run assets:textures` — downloads the Poly Haven walnut maps into `assets-src/textures/` and writes WebP into `public/textures/`

## Layout

```
src/app/         layout.tsx: header, <SceneMount/> (once, so the canvas persists), scrim, page
                 globals.css (site and the miniature frame), miniatures.css (each miniature's drawing)
                 page.tsx (home: the Projects index, hidden while the desk is up),
                 projects/, projects/[slug]/, about/, contact/   — all static HTML
src/components/  Header, NavLinks, Page (frame with Close), ProjectList, RouteSync
                 project/ProjectStory (the story layout), project/ProjectPager
src/content/     all site copy, typed (types, projects, about, contact, site, miniatures)
src/miniatures/  MiniatureSlot.tsx (slug -> miniature, each its own chunk), Figure.tsx (shared frame),
                 hooks.ts, <slug>/model.ts (pure, tested) + <slug>/Miniature.tsx (SVG or plain HTML)
                 argus, smart-display, jupiterp, aegis-orbit, skibus, shell
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
                 objects/       Room, Monitors, StreamDeck, PenCup, Keyboard, Orb
                 Rain.tsx, City.tsx (+ skyline.ts)  the weather and the city behind it: page layers, CSS only
                 band.ts        the strip beside a project page where the room shows
                 orb.ts         where the orb looks (pure, tested)
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

- 2026-11-10 — Project lives in `~/portfolio`. Local commits per phase; nothing is pushed or published without Noah's say-so.
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
- 2026-11-10 — (Superseded by the static export, below.) `/projects/[slug]` used `export const instant = false` under Cache Components so an unknown slug was a real 404.
- 2026-11-10 — Stream Deck icons are generic line drawings (eye, bulb, planet, orbit, person, envelope, document, branch, briefcase), not brand logos. A project picks its icon with `icon` in the content file; without one the key shows the title's first letter.
- 2026-11-10 — Design tokens: wall `#121110`, paper `#ece6da`, dim `#a8a093`, faint `#756e63`, screen light `#cfe0ff` (focus rings and outlines). Left-aligned single column, no cards, no all-caps labels, no rules between rows.
- 2026-11-10 — The idle camera drift (3° yaw, 1.5° pitch) is for mouse and trackpad only, only on the desk view.

- 2026-11-10 — **Credits.** `src/content/credits.ts` is the typed manifest (title, creator, source, exact license link, changes) and `/credits` is generated from it; the footer links there (on phones the link sits in the dock). The keyboard's license link is the one the Sketchfab API reports for the model: `http://creativecommons.org/licenses/by/4.0/`. Fonts are listed too.
- 2026-11-10 — **Share image** is a 1200×630 capture of the desk (`opengraph-image.png` at the app root, so every page uses it); titles follow `<page> | Noah Leibovitz`. `metadataBase`, the sitemap and robots use `siteUrl` from `src/content/site.ts`: `NEXT_PUBLIC_SITE_URL`, else localhost.
- 2026-11-10 — **Loading.** Header and page shell render at once. On the home page a quiet "Setting up the desk" note appears after 0.9 s if the scene is not ready, and after 8 s the HTML Projects index stands in until it is.
- 2026-11-10 — **404.** `src/app/not-found.tsx`, exported as `out/404.html`, which GitHub Pages serves with status 404 for any unknown address.
- 2026-11-10 — Production build measured locally: 3D assets 96.6 KB transferred (budget 3 MB), scripts about 520 KB transferred, 60 fps on the M3 Pro at both sizes. Still not measured on a real phone.

- 2026-11-10 — **GitHub Pages instead of Vercel** (Noah's call). The build is a static export: `cacheComponents` and `partialPrefetching` are off (they need a server), images are unoptimized, `sitemap.ts` and `robots.ts` are `force-static`, and the `instant` opt-out on the project page is gone. An unknown address, including an unknown project, is now always the host's real 404 (`out/404.html`), which removes the earlier soft-404 limit.
- 2026-11-10 — **Base path.** A project site lives under `/<repo>`. `next.config.ts` reads `NEXT_PUBLIC_BASE_PATH`; the workflow fills it from `actions/configure-pages`. Next prefixes its own links; every address written by hand to a file in `public/` (models, textures, project images, a résumé PDF) must go through `asset()` in `src/lib/paths.ts`. `usePathname()` now ends with a slash, so compare paths through `normalizePath()`.
- 2026-11-10 — A résumé PDF, once added, is treated as an outside link: the header link and Stream Deck key open the file in a new tab instead of routing to it.
- 2026-11-10 — `.github/workflows/pages.yml` publishes on every push to `main` (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5: the current majors on 2026-11-10). The repository needs Settings > Pages > Source set to "GitHub Actions" once.
- 2026-11-10 — Verified: all 36 browser checks pass against the export served under `/portfolio` by `scripts/serve-export.mjs` and against the dev server. On the live site: every route answers 200, unknown addresses 404, the desk loads, hover, click, Esc, header links, a direct project URL and the phone dock all work, with no console errors (first load about 700 KB transferred).
- 2026-11-10 — Pages setup note: for a `<user>.github.io` repository GitHub switches Pages on by itself in branch mode; it was changed to the Actions source with `gh api -X PUT repos/NLBoa/NLBoa.github.io/pages -f build_type=workflow`.

- 2026-11-10 — **Project pages become stories** (Noah: the pages were "boring", "no detail", "feel like bullet points"; each project should be its own thing). Chosen from five ideas: a working miniature at the top of each project page plus the page told as a story. Not chosen, so do not build without asking: covers on the Projects index, a screen takeover, the desk reacting to the open project. This relaxes "the 3D scene is the only decoration" on project pages only.
- 2026-11-10 — **Story content is drafted from each project's GitHub README** (Noah's OK). Anything unsure is a `TODO(noah)`; nothing is invented. Roll out one project at a time, Aegis Orbit first.
- 2026-11-10 — **Story layout.** A project with `story` in the content file renders `ProjectStory`; one without keeps the short facts page. Page width 60rem with the text at reading width; title beside its summary; links at the top; sections "What it is", "How it works" (an `<ol>` drawn as a line of stations, because it is a real sequence), "My part" (titled paragraphs with screenshots, not a list), "The team" (only when known), "Built with"; previous/next project at the foot. Each project has one `accent` color, used only on its page.
- 2026-11-10 — **Miniature rules.** SVG rendered by React, so the drawing is in the static HTML; buttons appear only once JavaScript runs. No second WebGL context. Animates only while on screen. Under reduced motion nothing plays and the buttons step between stills. Every miniature is a `<figure>` whose caption says it is a schematic, with a text description. **No invented numbers**: geometry only. Words live in `src/content/miniatures.ts`. Each is its own chunk through `MiniatureSlot` (a client component, because Next does not code-split a client component dynamically imported from a server component).
- 2026-11-10 — **Aegis Orbit miniature**: the ghost replay Noah built. The clock stops at a predicted close approach; "Approve burn" bends the path and a ghost flies the course not taken into the pass; "Stay on course" flies into it. Colors follow the real app (teal course, red dashed debris path). Accent `#45d0bf`. Its chunk is 6.5 KB and loads only on that page.
- 2026-11-10 — Aegis Orbit's two screenshots come from the team repository's README (MIT-licensed, Noah is a contributor). Noah still has to confirm they may be shown.
- 2026-11-10 — With a page open the monitor screens are now `#0c0c0c` (was `#262626`, whose text still ghosted behind wide pages), and the fixed header is solid, because long pages scroll under it.

- 2026-11-11 — **All seven projects are stories.** Noah: "Do the same for all the other projects displayed. Don't ask for me to verify each project." Sources, all read 2026-11-10: Argus README and CLAUDE.md; OMEGA-WB and zigbee_ceiling READMEs; Jupiterp pull request 975; Java-Shell README; the profile README for SKIBUS. **Private repositories were not read** (the SKIBUS ones are private), so SKIBUS has only the profile's facts. MID's repository is a scaffold with a template README, so its page says so and has no miniature: there is nothing built to draw.
- 2026-11-11 — **The miniatures.** Argus: a ranked queue and tonight's work window; one button steps through "a post moves a deadline", "finish the first task", "start over". Smart Display: a 6×4 board; "Arrange widgets" turns on dragging and corner resizing (off by default so the page still scrolls on a phone), arrow keys move and Shift+arrows resize, lights toggle, the clock shows the real time. Jupiterp: toggle sample courses in the planner and the generator follows. SKIBUS: riders go still to come → checked in → aboard, by list or by buttons, and seats fill. Shell: a session replayed one feature at a time with typing, taken from the README (the `jobs` lines are the README's own).
- 2026-11-11 — **Miniature rules, revised.** SVG or plain HTML, never canvas or WebGL. Made-up sample data is allowed when the caption says so ("made-up coursework", "sample courses", "made-up riders"); no invented claims about the real project. The drawing must be in the static HTML and make sense as a still; controls inside the stage are rendered disabled until JavaScript runs. Argus's sample courses and tasks are the ones in Argus's own demo data.
- 2026-11-11 — Story options: `howTitle` (Smart Display: "How a tap reaches a ceiling light"; Jupiterp: "How the sync works") and `partsTitle` ("What I built" for solo work, "My contribution" for Jupiterp; default "My part"). A project with no `how` steps or no `parts` simply has no such section.
- 2026-11-11 — Accents: Argus `#e8759a` (raspberry), Smart Display `#7cc4f5` (the board's daytime sky), Jupiterp `#f2a154`, Aegis Orbit `#45d0bf`, SKIBUS `#f0cf4f` (bus yellow), Shell `#8fdc8a` (prompt green), MID `#b9a2f7`.
- 2026-11-11 — Argus's two screenshots come from its repository's visual-test baselines, which run on demo data (`today`, `workload`, dark, desktop). Jupiterp's date is now "Merged October 2026" (the pull request was merged 2026-10-31).
- 2026-11-11 — Each miniature is a separate chunk of about 10 to 12 KB and loads only on its own page. Project images total 308 KB. The desk is untouched (17,926 triangles, 56 draw calls).

- 2026-11-11 — **SKIBUS is off the site for now** (Noah). Its entry sits in `parkedProjects` in `src/content/projects.ts` and its miniature is still in `src/miniatures/skibus`; no page, link or sitemap entry is built. To restore it, move the entry back into `projects`. Six projects remain: Argus, Smart Display, Jupiterp, Aegis Orbit, Shell, MID. The link-preview image was re-captured, since the left monitor now shows six.
- 2026-11-11 — **Jupiterp's reach** (Noah: "used by a significant amount of people each semester", "most of the School uses it"). The page says "a large share of Maryland's students" in the summary, the first paragraph and a "Who it reaches" part. No number is given because none is published (README, repository); it is Noah's own account, marked with a TODO to replace with a figure from the maintainers.
- 2026-11-11 — **Argus's miniature now shows the FlowSavvy hand-off** (Noah's request), replacing the queue. Left: the deadlines Argus collected. Right: a week in FlowSavvy with classes on it and each deadline's work fitted into the first free time before it is due (soonest deadline first). One button steps through: a new assignment is posted, a post moves the midterm, a meeting is added, start over; the blocks glide to their new times. It is a schematic of the idea, not FlowSavvy's real rules or screens, and the caption says so. The story gained a "From deadline to calendar" part; that description is a draft for Noah to confirm.

- 2026-11-11 — **Features on their own branches** (Noah: "put each feature on a separate branch so I can keep and remove things"). Each feature branches from `fix/page-close`, keeps its notes in `docs/features/<name>.md`, its browser checks in `scripts/checks/<name>.mjs` (run by `npm run flows`), and its styles in its own CSS file, so the branches merge without touching the same lines. `npm run flows` writes its screenshots to the ignored `test-results/` folder, and feature branches do not re-capture the link-preview image, for the same reason: run `npm run share-image` after merging. Read `docs/features/` for what each one decided.
- 2026-11-11 — **Close and Esc.** Close is a pill fixed in the window's top-right corner under the header (it used to sit at the end of the text column, which is mid-window on a wide screen). Esc closes on key-down or key-up, because an embedded browser pane can keep the key-down for itself, and its listener is attached once and reads the address when the key arrives, so it works the instant a page opens.

- 2026-11-11 — **The sides of a project page** (Noah: "currently empty", "something maybe moving", "also on the right side"). Right: the room shows through beside the column (chosen over a drawn scene per project and a pinned side panel). Left heading column: kept quiet, by his choice. The band's size is defined once in `src/scene/band.ts` and mirrored in `src/app/projects/[slug]/room.css`; change both together. `CameraPose.shiftX` is a sideways lens shift like `shiftY`.

- 2026-11-11 — **More life in the room** (Noah: the right side "is very boring", "a cyber city" outside the window with "a cyber car", "a little AI ball thing that watches the mouse"). Chosen by Noah: the city drawn in code, not downloaded models. For the right side he first chose the Smart Display on the wall, then a plant, then nothing: the right side stays empty for now. He liked the orb and moved it to the back, next to the Stream Deck. The orb is decoration only; the four things that open something are unchanged.
- 2026-11-11 — **Nothing may draw 3D frames on a timer.** The city, cars and signs are CSS in the rain layer. The orb draws only while the pointer moves or its eye is turning. Keep it that way: the idle-frame checks in `npm run flows` depend on it.
- 2026-11-11 — The view is fitted to the desk: on a 16:10 laptop only about 25 cm of wall is in view right of the monitors, and none of the floor beside the desk. Anything meant to fill the right side on a laptop has to stand on the desk's right end; a floor plant beside the desk would only show fully on a wide window. The pointer no longer redraws the scene while a page is open (`CameraRig`).
- 2026-11-11 — Measured on the preview branch (static export, M3 Pro): 22,346 triangles, 78 draw calls, 0 idle frames, 60 fps at both review sizes; 227 browser checks and 124 unit tests pass. One export run timed out part-way while the laptop was busy and on battery, and read 30 fps; the rerun was clean.

## Open questions for Noah

Every story is a draft for Noah to read. Aegis Orbit: role wording; teammates and who built what; any result at Technica; whether the README's figures belong; which parts of the sandbox HUD were his; OK to use the two screenshots. Argus: OK to use the two demo-data screenshots; order of the steps; whether the FlowSavvy hand-off is described correctly. Jupiterp: a usage figure, if the maintainers have one. Smart Display: whether the tap-to-light chain is right for the board; whether to name the roommates. Shell: whether each replayed output matches what the shell prints. MID: what it does; whether to link its public repository.

See `npm run todos` for content gaps (dates, some roles, images, 7SM title, "Outside of code", résumé PDF, MID details). Beyond those: whether to keep the cropped full-size keyboard model or supply a compact one, an optional `assets-src/pencup.jpg` pattern for the pen cup, and a frame-rate check on a real phone.
