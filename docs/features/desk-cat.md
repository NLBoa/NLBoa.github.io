# A cat on the desk

Branch: `feature/desk-cat` (from `main`, 2026-11-20). Merged into `main` and published 2026-11-21 (Noah: "Merge it", then "Publish it").

Noah sent a photo of his cat, a grey tabby Siberian, and asked for it to live on the site "as a sentient creature" so the site feels "less stale and more representative of who I am". Two found models were shown and turned down ("I don't like either. Instead create your own"). He asked for a smooth cat, a coat that "should feel like actual fur", smooth movement, and five emotes: purr ("where it shakes a little"), clean, loaf, roll over, stare ("feels as though it stares at the user").

## What it does

**Since 2026-11-21 the cat only lies in the loaf, breathes, blinks and watches the pointer.** Noah first asked to "keep the cat only in loaf mode"; asked whether it should still purr and stare there, he answered "Only breathing". Everything was then switched off, watching the pointer included, and he missed that at once ("It's no longer looking at the mouse"), so that came back: its head and eyes turn to the pointer while it moves, and return to rest a few seconds after it stops. What stays off: emotes of its own accord, the greeting, ear and tail flicks, the wandering gaze, and any answer to a stroke or a click. (It blinks because eyes that never close look wrong; that is my call, not his.)

**It sits on the left side of the desk** (Noah, the same day: "move the cat to the left side instead of the right because there is a lot of space"): in front of the left monitor, turned toward the middle. Where the text below says "the right end", read the left.

Everything described below is still built and tested, just switched off: `ONLY_BREATHING` and `REPERTOIRE` in `src/scene/cat/brain.ts` decide what it does, and each emote can still be started by hand in development with `window.__cat.play("purr")`. To bring things back, set `ONLY_BREATHING` to false and list the emotes wanted in `REPERTOIRE` ("loaf", "purr" and "stare" keep it in the loaf; "clean" sits it up; "roll" lays it on its side). Do not bring any of it back without asking.

A long-haired grey tabby rests on the desk's right end, turned a little toward the middle. Nothing about it is downloaded: body, coat and motion are all made in code.

- **On its own.** It mostly rests in a loaf, breathing, blinking, an ear flicking now and then, the tail's tip moving. About 2.5 seconds after it appears it looks up at the visitor. After that, every 11 to 24 seconds, it does one of its emotes of its own accord, never the same one twice running.
- **Stare.** Goes still, ears forward, pupils wide, head and both eyes turned exactly to the viewer; ends with one slow blink.
- **Purr.** Eyes close to slits, chin up, head leaning slowly from side to side, and the whole coat trembles (the tips of the fur shiver, the ribs hum).
- **Clean.** Sits up, lifts its right front paw to its mouth, licks it (the tongue shows), draws it over its face three times, licks again, sets it down.
- **Roll over.** Flops from the loaf on to its side, on over to its back with the paws in the air, wriggles, and settles on its side. Before long it gets up into the loaf again.
- **Loaf.** Tucks its legs away under itself with a small shuffle.
- **The pointer.** It watches the pointer while it moves, and loses interest a couple of seconds after it stops. The pointer resting on it for a third of a second is a stroke: it purrs for as long as the stroking lasts. A click on it asks for its next trick, in turn: stare, clean, roll over, loaf. A pointer that moves again after 30 seconds of quiet gets a look.

It is decoration: it opens nothing, has no label and no place in the Tab order. The four ways into the site are unchanged.

## How it is made

- **Body** (`src/scene/cat/build/`, run by `npm run assets:cat`). The cat is a distance field: rounded cones along a 30-bone skeleton, melted together (`shape.ts`), turned into a mesh by surface nets (`nets.ts`), with the head meshed twice as finely as the body and the paws finer still, so the toes show. Every vertex is given its bones, its fur length, the way the fur is combed and how flat it lies, and its coat color (the tabby markings are worked out here, in the bind pose). The result is one file, `public/models/cat.bin` (637 KB, 14,900 vertices). The ears are thin cupped sheets added by hand. Change the shape or the markings in `shape.ts`, run the bake, reload.
- **Fur** (`fur.ts`). Shells: the skin is drawn 22 times (13 on a phone), each copy pushed further out along the strands, keeping only the strands that reach that far. The shorter fur of the head and paws gets fewer layers (13, or 8 on a phone). The copies are instances of one geometry, so the coat is two draw calls. Strands come from a small block of 3D noise sampled at each point's place in the bind pose, so they stay put on the skin as it moves. Fur leans along the comb, bends over and sags; short fur (face, paws) is dense velvet; under the belly it hangs. The material is the scene's ordinary lit material with this added, so the screens, the light bar and the warm fill light the cat as they light everything else.
- **Soft edges without sorting.** Strand edges are softened by alpha-to-coverage (multisampling), not blending. The canvas is see-through where nothing is drawn (the window), so the coat must not write alpha: it is masked off for the coat, and a puffed-out copy of the skin fills alpha in underneath (`hullGeometry`).
- **Eyes, lids, nose, tongue, whiskers** (`body.ts`) hang on the head bone. The iris and pupil are drawn by a small shader; the lids are two half-shells that close over the eye.
- **Poses** (`pose.ts`, `stances.ts`). A pose is written as a description: trunk bones by how far they turn, leg and tail segments by which way they point, a paw that reaches for a point on the head. Two things are worked out rather than guessed: the tip of the body that puts front and back on the ground together (`level`), and the height that rests the lowest part on the desk (`settle`). The tail has weight: it falls to the desk from wherever the pose left it and is laid there joint by joint (`layTail`). Folded-away legs stop holding the body up (`tucked`) and sink out of sight below the desk top, which is why a loaf has no legs.
- **Motion** (`motion.ts`). A queue of clips (rests, changes of stance, emotes) gives a base pose; body parts move at different moments of a change of stance; a new clip always takes over gradually, and takes longer the further the cat has to go. On top run breathing, blinking, ear flicks, the tail, and the gaze (neck, head, then the eyes, which get there first). Sit and side are both reached through the loaf.
- **Deciding** (`brain.ts`). When to do what; time and chance are handed in, so it is tested.
- **On the desk** (`objects/Cat.tsx`). Loads after the desk is ready, in its own chunk, so the baked shadows never include it; three soft dark patches under hips, chest and head stand in for its shadow. An unseen rounded shape catches the pointer.

## Decisions

- **The desk now draws frames while it is on show.** This sets aside "nothing may draw 3D frames on a timer" for the cat only, because a cat that does not breathe is not alive. It is paced: every frame while something is visibly moving, about 30 a second while it only breathes, and none at all behind an open page, in a hidden tab, or under reduced motion (it then rests in the loaf, still). Everything else on the desk still draws nothing on its own: `npm run flows` holds the cat still (`window.__catHold`) for every check that counts idle frames, and only `scripts/checks/desk-cat.mjs` lets it live.
- **Smoothness is tested, not judged by eye alone.** `cat.test.ts` plays a minute of emotes at 60 frames a second, cutting from one into another mid-way, and fails if any joint turns more than 8 degrees in a frame or the body's height moves more than 7 mm in a frame.
- **No sound.** Browsers allow none before a click, and Noah asked for a purr that shakes, not one that is heard.
- **Colors are cooler than the photo** on purpose: the room's fill light is warm, and lit by it the coat comes out the brown-grey of the photo.
- Its place and facing are `CAT` in `src/scene/layout.ts`. On a narrow screen the desk's ends are out of frame, so it sits 7 cm further in (`phonePosition`).
- **Noah's first notes, 2026-11-21, while it was being built:** the eyes were "a little creepy" and should be more open; the paws needed to be more defined; the face should be fluffier and closer to the real cat. Done the same day: lids open wider with almost no slant, pupils rounder, a darker iris shaded by the upper lid; four toes on each paw with the lines between them; longer fur on the forehead, brows, cheeks and jowls, longer ear tufts, a visible nose and mouth, and a muzzle that is pale grey, not white. He has not yet said whether that is enough.
- **No drawn lines on the head** (Noah, 2026-11-21: "instead of lines on the cat's head make it more fluffy like and less lines. In actuality cats don't have lines like that"). The tabby "M" on the forehead and the two stripes across each cheek are gone. The crown is a soft, uneven, slightly darker grey, and the head's fur is longer (27 mm) and stands out more, drawn in 17 layers. Do not bring crisp markings back on the face.
- **No drawn stripes on the body either** (Noah, the same day: "Yes, soften them"). The stripes down the flanks, the line along the spine, the rings on the legs and the tail are now only a faint, broad, uneven darkening, about a third as strong as before with no edges; the tail still darkens toward its tip. The coat's character now comes from the fur, not from a pattern.

## Measured (2026-11-21, M3 Pro MacBook on mains power)

- With the cat the desk draws about 540,000 triangles a frame at laptop size (the desk alone is 22,000) and about 345,000 on a phone, in 94 draw calls.
- Chrome, 1440 x 900 and 390 x 844: 60 frames a second while redrawing every frame, with the cat and without it (median 16.7 ms, slowest 20.7 ms; development build, an earlier and slightly lighter model).
- DuckDuckGo and Safari (`npm run frames`, production build, 2560-wide window): resting on the desk and moving the pointer, 17 ms a frame with none late. Opening and closing a page shows the same few late frames as the same build without the cat (longest 88 to 117 ms with it, 85 to 123 ms without, three runs each): the cat adds nothing that could be measured there.
- Every emote plays at a steady 60 frames a second in Chrome (`npm run cat:film -- all`).
- **Not measured:** on battery (Low Power Mode halves the frame rate in Safari's engine), and on a real phone. Half a million triangles is a lot for an old phone; if it struggles there, lower `SHELLS.phone` in `objects/Cat.tsx` first.
- `npm run flows` against the production build: all 353 checks pass. Against the dev server three timing checks of the desk-to-page hand-off fail (133 to 167 ms where 130 is allowed, and a header link pressed during the flight); they fail the same way with the cat switched off, so they are the dev server's speed, not the cat. Run the hand-off checks against the build.

## Tools

- `npm run assets:cat` rebuilds `public/models/cat.bin`.
- `npm run cat:film -- clean` (or `roll`, `stare`, `purr`, `loaf`, `all`; `--desk` for the visitor's view; `still --pose sit` for one picture) plays an emote in Chrome and lays twelve frames on one sheet in `test-results/cat/`.
- In development, `window.__cat` can hold a pose (`pose("sit")`, or a description to try), hold one moment of an emote (`preview("clean", 2.5, "sit")`), start one (`play("roll")`), and move the camera (`look(position, target)`).

## To confirm with Noah

- The likeness: coat color, the markings on the face, eye color (green-gold now), and the cat's size on the desk.
- Its place: the right end of the desk. With a tall window it sits in front of the right monitor's lower corner when it sits up.
- Whether clicks and strokes are the right way to ask for emotes, or whether the Stream Deck's six dark keys should each be one.
- Whether it should ever leave its spot (walk, jump down). It does not.

## To keep or drop

Keep: merge the branch into `main`. Drop: delete the branch. It adds `src/scene/cat/`, `objects/Cat.tsx`, `public/models/cat.bin`, two scripts and one check; and touches `Scene.tsx` (mounts it), `CameraRig.tsx` (a camera position for close inspection in development), `layout.ts` (`CAT`), `scripts/flows.mjs` (holds the cat still for the other checks), `tsconfig.json` (lets the bake files import each other by full name) and `package.json` (two commands).
