# Election Command console: requirements cross-check

## Where this came from

On 2026-09-19 a four-agent workflow produced a set of dashboard pages for this
project, but it ran with another repository as its working directory and wrote
to app paths that only exist there (`apps/ecosystem-web` in the script,
`apps/operator-web` where the files landed). This repository has `api`,
`mobile`, `web` and `worker`. The work therefore never entered the project it
was written for, and sat untracked elsewhere until 2026-09-27.

Those 25 files are preserved verbatim on the branch
`archive/videofy-dashboard-agent-output-2026-09-19`. They are **not** wired in
and are not intended to run: the pages import a shell this repository does not
have (`premium/primitives`, `ConsoleShell`) and render from `MOCK_` constants
rather than the API. The screens they describe already exist at `/command`,
built against real endpoints and live since release `b59eba6`.

One document out of that set earned a place here: its per-page requirement
list. This file keeps that list and checks it honestly against what is live.

The companion design specification did **not** earn a place. It asserts "99%+
match" and "EXACT MATCH" against a target it does not contain, cites a token
vocabulary (`--op-danger` and similar) belonging to neither this app nor the
Figma reference, and uses Lagos State examples in an Ogun-only product. It is
on the archive branch if it is ever wanted.

## Incidents

| Requirement | State | Note |
|---|---|---|
| Cards with a 3px severity-coloured left border | Met | `.ec-incident--HIGH/MEDIUM/LOW` |
| Type, severity and status badges | Met | |
| Description and timestamp on the card | Met | |
| Incident **title** on the card | Gap | The card leads with the type; the title appears only in the detail panel |
| Location, ward and polling unit | Met | Names resolved, not ids |
| **Reporting agent** named on the card and in detail | Gap | The API returns `reportedByUserId` and no name |
| **Assigned operator** named | Gap | Detail shows only assigned or unassigned |
| Severity filters, and open / escalated / resolved filters | Met | Two chip rows |
| Count badges on each filter | Gap | Counts are shown on the Results and Agents pages but not here |
| Right-hand detail panel | Met by design, differently | A persistent column, not a slide-in modal with an overlay. Deliberate: an operator watching a room should not have the list covered |
| **Notes: list, author, timestamp, add a note** | Not built | There is no incident-notes endpoint. This needs API work before any UI |
| **Message the reporting agent** | Not built | No endpoint wired for it |
| Escalate, resolve | Met | Backed by the real endpoints |

## Reports

| Requirement | State | Note |
|---|---|---|
| Four rate cards: coverage, verification, activity, resolution | Met | |
| Campaign tally with per-entry bar and percentage | Met | Per party, from approved reports |
| Top LGAs leaderboard | Partly met | Rank, LGA, staffed of total, percentage. The **results reported** and **agents** columns are absent |
| Incident breakdown | Partly met | Broken down by **type**, not by severity as specified |
| Evidence summary | Partly met | Total, result sheets, verified, pending. The specified **photos / videos / documents** split is not shown |
| Five exportable reports with a download action | Not built | No endpoint produces them. The page says so rather than offering buttons that do nothing |

## What this implies

Nothing here blocks the console; it is live and correct. The list above is the
honest backlog if the reference is to be met in full. Three of the gaps need
API work before any interface can exist:

1. Incident notes: a note model, a create endpoint and author resolution.
2. Names on incidents: resolve the reporting agent and assigned operator.
3. Report exports: the five PDF and CSV exports.

The rest are interface-only and cheap: the incident title on the card, counts
on the incident filters, two more leaderboard columns, and an incident
breakdown by severity alongside the one by type.
