# Features on their own branches

Each feature has one file in this folder: what it is, the decisions made, and how to keep or drop it. A feature's file exists only on that feature's branch (and wherever it has been merged).

All feature branches start from `fix/page-close`, which pins Close to the top-right corner and makes Esc reliable. That one is recorded in `CLAUDE.md`.

To keep a feature, merge its branch into `main`. To drop it, delete the branch. Each feature also adds one file to `scripts/checks/`, which `npm run flows` runs.

After merging a feature that changes what a monitor shows or how the desk looks, run `npm run share-image` (with the dev server running) to re-capture the link-preview image. The feature branches leave that image alone so they never conflict over it.
