# Noah Leibovitz — portfolio

A portfolio whose home page is a 3D desk at night. The two monitors, the Stream Deck and the pen cup open parts of the site; the header does the same job without the 3D scene.

The whole site is exported as static files and hosted on GitHub Pages. The desk is a layer on top of ordinary HTML pages: without WebGL the home page is simply the list of projects.

## Run it

Needs Node 24 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000.

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Builds the static site into `out/` |
| `npm run preview` | Serves `out/` locally the way GitHub Pages does (port 3200) |
| `npm test` | Unit tests (camera framing, Stream Deck keys, routes) |
| `npm run lint` | ESLint |
| `npm run flows` | Browser checks of every behavior, against a running server |
| `npm run checkpoint -- <label>` | Screenshots at 1440×900 and 390×844, triangle and draw-call counts, frame rate, asset sizes, open TODOs |
| `npm run todos` | Lists every `TODO(noah)` left in the content |
| `npm run assets:models` | Rebuilds `public/models/` from `assets-src/` |
| `npm run assets:textures` | Downloads the desk texture and rebuilds `public/textures/` |
| `npm run share-image` | Re-captures the link-preview image from the running site |

`flows`, `checkpoint` and `share-image` drive the installed Google Chrome and read `BASE_URL` (default `http://localhost:3000`).

## Change the content

All copy lives in `src/content/`. Components never contain text of their own.

| File | Holds |
|---|---|
| `projects.ts` | Every project: title, one-line summary, role, dates, stack, what I built, links, up to three images, `featured`, and the Stream Deck `icon` |
| `about.ts` | Intro, education, experience, and the "Outside of code" section |
| `contact.ts` | Email, GitHub, LinkedIn, résumé PDF path |
| `credits.ts` | Third-party assets; the `/credits` page is generated from it |
| `site.ts` | Header links and the site's public address |

Things to know:

- A project with `featured: true` gets a Stream Deck key. Keys are filled in this order: featured projects, About, Contact, Résumé, GitHub, LinkedIn. There are 15 keys, so at most 10 projects can be featured.
- A value of `null` (or an empty list) means "not known yet". The page leaves that part out. Each gap has a `TODO(noah)` comment beside it.
- To add the résumé, put the PDF in `public/` and set `resume` in `contact.ts` (for example `"/resume.pdf"`). The header link and the Stream Deck key then point to it.
- Project images go in `public/` and are listed with their pixel `width` and `height`.

## How it is built

- **Next.js** (App Router) with TypeScript. Routes: `/`, `/projects`, `/projects/[slug]`, `/about`, `/contact`, `/credits`.
- **three.js** through `@react-three/fiber` and `@react-three/drei`. The canvas is mounted once in the root layout, so it persists across routes.
- **zustand** holds the scene's state: current route, hovered and focused object, camera flight.
- Plain CSS with variables in `src/app/globals.css`.

```
src/app/         routes, root layout, global styles, share image, icon, sitemap
src/components/  header, footer, page frame, project list, route sync
src/content/     all copy (see above)
src/lib/         Stream Deck key generation
src/scene/       the 3D desk
  layout.ts        every size and position, in meters
  interactive.ts   the objects that react, in Tab order
  store.ts         scene state and activate()
  camera.ts        camera framing for each view
  CameraRig.tsx    camera moves and idle drift
  objects/         desk, monitors, Stream Deck, pen cup, keyboard, trackpad
  textures/        what the screens and keys show, drawn from the content
scripts/         asset pipeline and browser checks
```

Behavior worth knowing before changing the scene:

- The scene renders on demand. Nothing is drawn unless something moves, so anything that changes the picture must call `invalidate()`.
- Shadows are baked once when the desk has loaded. They do not follow an object that moves afterwards.
- Each object on the desk has a real link in the page (`SceneUI.tsx`), which is how Tab, Enter and screen readers reach it.
- With `prefers-reduced-motion` the camera cuts instead of flying and the first-load pulse is skipped.
- Sizes are real: the desk is 1.4 × 0.7 m, the monitors are 27-inch, the keyboard is 27.9 cm wide.

## Assets

Raw downloads live in `assets-src/` and the reference photo in `reference/`. Both are git-ignored; only the optimized files in `public/` are committed.

- **Keyboard**: "Apple Magic Keyboard" by infohack on Sketchfab, CC BY 4.0. The model is the full-size keyboard, so `scripts/optimize-models.mjs` keeps the main key block and the body is built in code at the compact size.
- **Desk**: "Walnut Veneer" from Poly Haven, CC0.
- Everything else on the desk is built in code.

Attribution for all of it is on the `/credits` page.

## Deploy (GitHub Pages)

`.github/workflows/pages.yml` builds the site and publishes it on every push to `main`. One-time setup in the GitHub repository: **Settings > Pages > Source: GitHub Actions**.

The address depends on the repository's name:

- a repository named `<username>.github.io` is served at `https://<username>.github.io/`
- any other name is served at `https://<username>.github.io/<repository>/`

The workflow passes the right base path and origin to the build (`NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_SITE_URL`), so nothing in the code names the repository. For a custom domain, set `NEXT_PUBLIC_SITE_URL` to it and leave the base path empty.

GitHub Pages on a free account needs the repository to be public.

To try the published form locally:

```bash
NEXT_PUBLIC_BASE_PATH=/portfolio npm run build
```

```bash
NEXT_PUBLIC_BASE_PATH=/portfolio npm run preview
```

Because the site may live under a sub-path, any address you write yourself to a file in `public/` must go through `asset()` from `src/lib/paths.ts`. Links made with `next/link` handle it on their own.

Before pushing to `main`, `npm run build` and `npm run flows` should both pass.
