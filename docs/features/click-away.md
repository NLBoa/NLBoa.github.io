# A click away closes the page

Branch: `resume-no-foil` (2026-11-16). Published the same day.

## What it is

Noah: "if I click away from the resume, it should just close out of the resume doc, I shouldn't have to press the button. This should be the same for all pages." A click outside an open page's content now closes it, exactly as Close and Esc do: it goes to `/` and the camera flies back to the desk. It works on every page, the 404 included. The cursor turns to the zoom-out one wherever a click would close the page, the same cursor the room beside a project page uses.

## What counts as "away"

The page's content is the box around all of its blocks (the direct children of `main.page` that take up room), grown by 24 px. A click beside that box, above it or below it is a click away. So on the résumé it is the space either side of the sheet; on About or a project it is the left margin and everything right of the column; on a short page it is also the empty space under the content.

## What does not close the page

- A click on the content, or in the gaps between its blocks (those are inside the box).
- A click on anything pressable (links, buttons, fields), or anywhere in the header.
- The end of a drag, such as selecting text out past the column.
- The first click away while text is selected or a field has focus: that click only clears the selection or leaves the field. (Out beside the page the browser does neither by itself, so the code does it.)
- Any click while something is typed into a form: a stray click must not throw away a note on the Contact page. Close and Esc still work there.
- A touch. On a phone the page fills the screen, and a tap near its edge should do nothing.
- Modified clicks and other mouse buttons.

## Files

`src/lib/click-away.ts` (the geometry, tested), `src/components/ClickAway.tsx` (mounted once in `layout.tsx`), one rule in `globals.css` for the cursor, `scripts/checks/click-away.mjs`.

## To drop it

Remove `<ClickAway />` from `layout.tsx`. Nothing else depends on it.
