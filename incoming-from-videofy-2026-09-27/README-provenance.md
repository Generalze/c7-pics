# Moved out of videofy-live, 2026-09-27

These 25 files were sitting **untracked inside the videofy-live repository**,
where they did not belong. They are C7-PICS work: the dashboard pages, their
components and tests, the design spec, the QA checklist, and the agent workflow
notes from a later run than the `AGENT_1..4_*.md` files already at this repo's
root.

**They were moved, not copied, and not deleted.** Before touching anything I
checked this repository for each of them by name and found none of them here,
so the copies in videofy-live were the ONLY copies. Untracked files have no git
history to recover from, so deleting them would have destroyed the work —
including two complete React pages, `IncidentsPage.tsx` and `ReportsPage.tsx`.

**Paths are preserved exactly as they were**, relative to the videofy-live root
(`apps/operator-web/src/pages/...`, `scripts/...`). Those are Videofy's
directory names, not this project's, so nothing here is in its final home.
Someone who knows the PICS layout should place them properly — most likely
under `apps/web/` — rather than have that guessed.

**Nothing has been committed.** They are untracked here too, which is the same
state they were in before, only in the right repository. Commit them once they
are placed.

## Why they were in the wrong repo

The standing rule is that C7-PICS work never writes, runs git, or even reads in
videofy-live. These files are what happens when that slips: they had been
sitting there long enough that every agent working on Videofy had to be told
explicitly not to touch them, and one stray `git add -A` would have committed
another project's dashboard into a translation product.
