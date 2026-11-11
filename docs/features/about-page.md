# About page as a profile card

Branch: `feature/about-page` (on top of `fix/page-close`).

## What it is

The About page was a name and two short lists. It now opens with the profile card from Noah's GitHub profile: his portrait drawn in text characters on the left, slowly turning from side to side, and the facts on the right, set like a terminal's output (`noah@leibovitz`). Below it are Experience, Education, a Toolbox and Outside of code. The right monitor on the desk shows the same card, so the monitor leads into what it showed.

## Decisions

- **The portrait is Noah's own**, from `github.com/NLBoa/NLBOA` (`assets/face_frames.json`). `npm run assets:portrait` fetches it and writes two files: `portrait-front.ts` (the forward-facing frame, 2 KB, in the page's HTML and on the monitor) and `portrait-frames.json` (all 24 frames, 49 KB, loaded only once the card is on screen and motion is allowed).
- The portrait turns at 12 frames a second, there and back, like the GitHub card. A Pause button appears on hover (always on touch screens). Under reduced motion it stays still and there is no button.
- **More information, all from Noah's own published words** (the profile card and README): the status line ("Open to software engineering internships"), the C# scheduling engine at Gulf Coast Estate Care with a link to its public demo, the toolbox, and the hobbies. Nothing is invented; each addition has a `TODO(noah)` to confirm. Gulf Coast still shows no usage numbers.
- **Experience is written as sentences** (`summary` in `about.ts`), not points.
- **Toolbox**: a tool that a project's stack names is a button with a count; pressing it lists those projects as links. The match is worked out from the content (`src/lib/toolbox.ts`), so it stays right as projects change. Tools no project names are plain text.
- "Outside of code" is filled from the profile card's hobbies. Noah said he would write this section himself, so those two lines are a stand-in.
- Colors follow the GitHub card: Maryland red for labels, gold for section names.
- The link-preview image was re-captured, because the right monitor's screen changed.

## To confirm with Noah

The status line, the wording of both jobs, the hobbies as "Outside of code", and that he is happy to have the portrait on the site.

## Files

`src/app/about/page.tsx`, `src/app/about/about.css`, `src/components/about/`, `src/content/about.ts`, `src/content/portrait-front.ts`, `src/content/portrait-frames.json`, `src/lib/toolbox.ts`, `src/lib/portrait.ts`, `src/scene/textures/screens.ts` (`profile`), `scripts/fetch-portrait.mjs`, `scripts/checks/about-page.mjs`.

## To drop it

Delete the branch. Nothing else depends on it.
