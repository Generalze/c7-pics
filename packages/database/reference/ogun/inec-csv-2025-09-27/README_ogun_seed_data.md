# Ogun State INEC Seed Data — LGAs, Wards & Polling Units

## Files
- `ogun_state_lgas.csv` — 20 rows, one per Local Government Area (LGA).
- `ogun_state_wards.csv` — 236 rows, one per ward (INEC calls these "registration areas"), with each ward's polling-unit count.
- `ogun_state_polling_units.csv` — 5,040 rows, one per polling unit, the full detail table.

## Structure
Each polling unit's `pu_delimitation` code is `state/lga/ward/unit` (e.g. `27/01/01/001` = Ogun State, Abeokuta North, ward 01, PU 001) — this is INEC's own coding scheme and doubles as a natural composite key. `inec_lga_id`, `inec_ward_id`, and `inec_pu_id` are INEC's internal database IDs for the same records, useful as stable foreign keys if you want them instead of the human-readable codes.

`pu_status` is `EXISTING PU` (3,210 units) or `NEW PU` (1,830 units) — the "NEW PU" ones are the polling units INEC created in its 2023 polling-unit expansion exercise (Ogun's expansion was reported at ~1,832 new units, which matches almost exactly).

Totals: **20 LGAs, 236 wards, 5,040 polling units.**

## Source & accuracy notes
This was built from a dataset scraped directly from INEC's own public API (inecnigeria.org/polling-units/) on 2025-09-27, via the open-source scraper at https://github.com/JayCodist/inec-polling-units-scraper. I cross-checked it against:
- INEC's official 2015 PU directory PDF for Ogun State (ward names and structure match).
- News reporting on Ogun's 2023 polling-unit expansion (1,832 new units reported vs. 1,830 found here — consistent).

I also cleaned one scraper artifact: the raw source had one stray empty record appended to every ward (236 total), which I removed — that's why the raw source's "5,276 total" differs from the 5,040 real polling units here.

Caveats to know before you treat this as ground truth:
- The scrape is dated September 2025. INEC does occasionally adjust polling units (splits, relocations, renaming) between major registration exercises, so for anything high-stakes (actual election administration, legal use) you should verify against INEC's live portal (https://inecnigeria.org/polling-units/) or request the current PU register directly from INEC, rather than relying solely on this file.
- A few wards have non-consecutive PU numbering (e.g. Obafemi/Owode's Owode ward runs 1–39 but only has 38 actual units) — this reflects real gaps in INEC's own numbering (a unit was likely merged or decommissioned at some point), not a data error on my part.
- Polling unit *names* are transcribed exactly as INEC has them, including inconsistent spacing/capitalization in a handful of entries — I did not "clean up" wording, to avoid introducing my own errors into official location names.
