# Features on their own branches

Each file here records one feature: what it is, the decisions made, and how to keep or drop it.

| Branch | Notes |
|---|---|
| `fix/page-close` | The base for the others: Close pinned to the top-right corner, Esc on key-up as well as key-down. Recorded in `CLAUDE.md`. |
| `feature/about-page` | [about-page.md](about-page.md) |

To keep a feature, merge its branch into `main`. To drop it, delete the branch. Each feature also adds one file to `scripts/checks/`, which `npm run flows` runs.
