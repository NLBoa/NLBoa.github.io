# A room around the desk, and a rainy window

Branch: `feature/room` (on top of `fix/page-close`).

## What it is

The desk used to stand in front of a blank wall. It now stands in a room taken from the reference photo: a tall window fills the left of the back wall and runs to the floor, with a curtain drawn back at its edge, a plain warm wall on the right, and a floor. Outside it is a rainy night: rain falls in two sheets, drops run down the glass, lights sit out of focus in the distance, and now and then a car's headlights pass.

## Decisions

- **The rain is not 3D.** Nothing is drawn where the glass is, so the canvas is transparent there, and the rain is an ordinary page layer behind it (`src/scene/Rain.tsx`, `rain.css`), animated by CSS transforms and opacity only. The 3D scene still draws **no frames while idle**, which was a goal of the original brief and keeps phones cool. Measured: 18,116 triangles (was 17,926), 66 draw calls (was 56), 0 idle frames, 60 fps on the M3 Pro at both sizes.
- The rain layer fills the whole view; the window in the scene decides how much of it shows. That is why the scene's background color is gone: the wall, floor and frame must cover everything else.
- The wall moved back 5 cm (`WALL_Z`) to make room for the window frame and curtain behind the desk.
- Window bars: one upright near the left edge of the view and one cross bar just above the desk, where it shows under the monitors. A bar higher up would be hidden behind the screens.
- A faint cool light comes in from the window on the desk's left; the warm fill on the right is unchanged.
- With a page open, the rain pauses and dims to 15%, so no light shows through behind the page's text.
- Reduced motion: the rain is a still picture. Without WebGL there is no scene and no rain.
- Not done, on purpose: sound, lightning, or weather that follows the real forecast.

## Files

`src/scene/objects/Room.tsx` (`Room` replaces `Wall`), `src/scene/Rain.tsx`, `src/scene/rain.css`, `src/scene/layout.ts` (`FLOOR_Y`, `WINDOW`, `CURTAIN`, `WALL_Z`), `src/scene/materials.ts`, `src/scene/Scene.tsx`, `scripts/checks/room.mjs`.

## To drop it

Delete the branch. Nothing else depends on it.
