# Contact page as a sheet of note paper

Branch: `feature/contact-page` (on top of `fix/page-close`).

## What it is

The Contact page was three lines. The pen cup opens it, so it is now a sheet of ruled note paper on the dark desk, in the cup's own paper color. A visitor writes their name and a note; the button opens a draft in their own mail app, addressed to Noah, with the note as its body. Beside the paper are the other ways to reach him, each a whole row to press, a Copy button for the address, a line saying what he is open to, and his local time.

## Decisions

- **The page sends nothing.** The site is static, so there is no form handler. The button is an ordinary `mailto:` link whose subject and body are built from what is typed (`src/lib/mailto.ts`, tested). The page says so in plain words under the button. Without JavaScript the button still opens a blank draft.
- **Local time** ("It is 1:49 am for me (US Eastern time).") tells a visitor when to expect an answer. It comes from the visitor's clock and a time zone in `contact.ts`, so it appears only once JavaScript runs.
- **The status line** ("Open to software engineering internships") is from the GitHub profile card.
- Copy uses the clipboard and confirms in the button; if the browser refuses, it says to copy by hand.
- The note uses the site's two typefaces: labels in the sans, what you type in the monospace. No handwriting font.
- The paper is not rotated: at a slight angle its ruled lines turned jagged on ordinary screens.
- The scrim is a little heavier on this page (97.5%), because the pale pen cup sits right behind it.
- Not done: a server-side form. It would need a backend or a third-party form service, and GitHub Pages has neither.

## To confirm with Noah

The status line, and that he is happy to show his local time.

## Files

`src/app/contact/page.tsx`, `src/app/contact/contact.css`, `src/components/contact/`, `src/content/contact.ts`, `src/lib/mailto.ts`, `scripts/checks/contact-page.mjs`.

## To drop it

Delete the branch. Nothing else depends on it.
