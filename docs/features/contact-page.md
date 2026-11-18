# Contact page: the places to reach me

## What it is

The pen cup opens it. The heading on the left; beside it one line of introduction, a line saying what Noah is open to, and the places to reach him, each a whole row to press: email (with a Copy button), GitHub, LinkedIn and the résumé. Under them, his local time.

## History

- 2026-11-11: built as a sheet of ruled note paper with these links beside it (branch `feature/contact-page`). A visitor wrote a name and a note, and a button opened a draft in their own mail app.
- 2026-11-18: **the note paper was removed** (Noah: "just keep the find me information not the weird note thing on the side. The goal is to provide some more links to reach me, that's all."). `Note.tsx` and `src/lib/mailto.ts` are deleted; they are in git history before the branch `contact-links-only` if ever wanted. Do not bring a form or a note back without asking.

## Decisions

- **Links only.** No form, no fields. To add a place, add it to `src/content/contact.ts` and a row in `src/app/contact/page.tsx`; never invent an address.
- The rows sit in the second column, under the introduction, at most 34rem wide; on a phone everything is one column.
- The list has no visible heading: the line above it ("Find me in any of these places.") introduces it, and the section is labeled "Find me" for screen readers.
- **Local time** ("It is 1:49 am for me (US Eastern time).") tells a visitor when to expect an answer. It comes from the visitor's clock and a time zone in `contact.ts`, so it appears only once JavaScript runs.
- **The status line** ("Open to software engineering internships") is from the GitHub profile card.
- Copy uses the clipboard and confirms in the button; if the browser refuses, it says to copy by hand. Without JavaScript the button is not shown and the rows are still links.
- The scrim is a little heavier on this page (97.5%), because the pale pen cup sits right behind it.

## To confirm with Noah

The status line, and that he is happy to show his local time.

## Files

`src/app/contact/page.tsx`, `src/app/contact/contact.css`, `src/components/contact/` (`CopyButton`, `LocalTime`), `src/content/contact.ts`, `scripts/checks/contact-page.mjs`.
