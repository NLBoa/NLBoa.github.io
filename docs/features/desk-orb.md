# An orb on the desk that watches the pointer

Branch: `feature/desk-orb` (from `main`, 2026-11-11).

Noah: "on the right corner of the desk maybe make a little AI ball thing that watches the mouse." After seeing it: "I like the robot, but move it to the left corner side." Then: "Move the robot back to the back corner so it's adjacent to the stream deck."

## What it does

A black glass ball, 8 cm across, sits in a small dock at the back of the desk, just left of the Stream Deck and under the left monitor. It has one glowing eye. The eye turns to follow the pointer, opens a little wider when the pointer is over something that can be clicked, and blinks when you click anywhere.

## Decisions

- **Decoration, not a link.** It has no label, no outline and no place in the Tab order, and clicking it opens nothing. The four ways into the site stay the monitors, the Stream Deck and the pen cup.
- **Where it looks** is worked out in `src/scene/orb.ts` (`gazePoint`), a pure function with tests: the spot where the line from the camera through the pointer crosses a plane 45 cm in front of the orb. With the pointer on the orb it looks straight at you.
- **Frames.** It draws only while the pointer is moving or the eye is still turning, like the camera's lean toward the pointer. The idle desk stays at zero frames.
- **It watches on the desk view only.** With a page open it looks at the viewer and ignores the pointer. Under reduced motion it holds still.
- **A fix that came with it:** moving the pointer while a page was open used to redraw the 3D scene on every move (the camera's lean listened everywhere). `CameraRig` now redraws for the pointer only on the desk view.
- **Touch.** It follows a finger while it moves and looks at the last tap.
- No light of its own: the eye and the dock's ring are unlit glowing material, so the scene's lighting cost is unchanged. Its shadow is baked once with the rest of the desk.
- Size and position are in `ORB` in `src/scene/layout.ts`.

## To confirm with Noah

- Its place: left of the Stream Deck, 3 cm from it. "Back corner" could also mean the far back-left corner of the desk.
- Its look: black ball, pale blue eye (the color of the screens' light).

## To keep or drop

Keep: merge the branch into `main`. Drop: delete the branch. It adds `objects/Orb.tsx`, `orb.ts` and its test, an `ORB` block in `layout.ts` and two lines in `Scene.tsx`.
