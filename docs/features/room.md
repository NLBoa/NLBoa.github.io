# A room around the desk, and a rainy window

Branch: `feature/room` (on top of `fix/page-close`).

## What it is

The desk used to stand in front of a blank wall. It now stands in a room: an ordinary window is set into the back wall behind the left monitor, with painted trim, a sill, a curtain drawn back at its right edge, a plain warm wall on the right, and a floor. Outside it is a rainy night: rain falls in two sheets, drops run down the glass, lights sit out of focus in the distance, and now and then a car's headlights pass.

## Decisions

- **The rain is not 3D.** Nothing is drawn where the glass is, so the canvas is transparent there, and the rain is an ordinary page layer behind it (`src/scene/Rain.tsx`, `rain.css`), animated by CSS transforms and opacity only. The 3D scene still draws **no frames while idle**, which was a goal of the original brief and keeps phones cool. Measured: 18,178 triangles (was 17,926), 72 draw calls (was 56), 0 idle frames, 60 fps on the M3 Pro at both sizes.
- The rain layer fills the whole view; the window in the scene decides how much of it shows. That is why the scene's background color is gone: the wall, floor and frame must cover everything else.
- The wall moved back 5 cm (`WALL_Z`) to make room for the window frame and curtain behind the desk.
- **It is a window in a wall, not a wall of glass** (Noah, after the first version: "it looks like the window is the entire wall"). The first version ran floor to ceiling across the whole left of the view. Now wall shows on every side: a strip beside it at the left of the view with the window's trim, wall under the sill (the sill sits 9 cm above the desk so it shows under the monitors), and wall above its head (visible on a phone). The sizes are those of a real window: sill 84 cm above the floor, head 187 cm, 90 cm wide.
- Window bars: one upright in the middle and one cross bar, high enough to stay clear of the header on a wide screen.
- A faint cool light comes in from the window on the desk's left; the warm fill on the right is unchanged.
- With a page open, the rain pauses and dims to 15%, so no light shows through behind the page's text.
- Reduced motion: the rain is a still picture. Without WebGL there is no scene and no rain.
- Not done, on purpose: sound, lightning, or weather that follows the real forecast.

## Files

`src/scene/objects/Room.tsx` (`Room` replaces `Wall`), `src/scene/Rain.tsx`, `src/scene/rain.css`, `src/scene/layout.ts` (`FLOOR_Y`, `WINDOW`, `CURTAIN`, `WALL_Z`), `src/scene/materials.ts`, `src/scene/Scene.tsx`, `scripts/checks/room.mjs`.

## To drop it

Delete the branch. Nothing else depends on it.
