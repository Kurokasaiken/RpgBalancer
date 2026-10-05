---
title: "PLAN-006 — Align docs, code, and old minimal_slice docs for the new Idle Village specs"
status: draft
owner: executor
updated: 2026-08-15
---

# PLAN-006 — Align docs, code, and old minimal_slice docs

## Goal

Make the new `src/docs/docs/idle_village/` spec set the canonical source of truth for every trusted/frozen component and every interaction, by:

1. Comparing current docs with the actual code.
2. Recovering valid scenarios/invariants from deleted `src/docs/docs/minimal_slice/` docs.
3. Marking obsolete docs, updating drift, creating missing spec/trusted docs.
4. Updating `COMPONENT_MASTER_INDEX.md` and evidence logs.

## Scope

Start with the **time engine / clock** surface because it is hot (loop just moved to `DayNightTimeEngineStrip`) and because the user explicitly wants to understand it. Then expand to the POI family, roster/slot, and remaining surfaces.

## Phases

### Phase 1 — Time engine audit and alignment

- Audit `TimeEngine`, `DayNightTimeEngineStrip`, `clockKit`, `useMinimalGameplay` and the related docs.
- Identify doc/code drift and obsolete claims.
- Update `time_engine_spec.md`, `time_engine_trusted.md`, `time_engine_day_night_poi_interaction_spec.md`, `clockKit.md`, `day_night_poi_spec.md`/`daynight_trusted.md` to match the code.
- Update `COMPONENT_MASTER_INDEX.md` row for `clockKit`.
- Run `build:check` and the relevant Playwright tests.
- Evidence log in `test-results/`.

### Phase 2 — POI family docs

- For each POI kind (job, quest, training, maintenance, cooldown):
  - verify that `poi_*_spec.md` matches the page + engine code;
  - update or create missing interaction docs with other components (time engine, slot rack, roster);
  - update `poi_family_spec.md` and `COMPONENT_MASTER_INDEX.md`.

### Phase 3 — Roster / slot rack docs

- Verify `roster_spec.md`, `slot_rack_spec.md`, `roster_trusted_components.md`, `roster_drag_trusted.md`.
- Update interaction docs: `roster_slot_rack_interaction_spec.md`, `slot_rack_poi_interaction_spec.md`, `poi_detail_interaction_spec.md`.

### Phase 4 — Master index and templates

- Ensure `COMPONENT_MASTER_INDEX.md` has exactly one row per component and one per interaction.
- Update `ai-friendly-spec.md` template if new sections are needed.
- Final `build:check`, `kanban:lint`, and evidence log.

## Safeguards

- `npm run build:check` after doc-only changes to catch broken cross-references or unexpected drift.
- `npm run kanban:lint` to keep Kanban valid.
- Relevant Playwright suites for touched surfaces.

## Output

- Aligned `idle_village` spec set.
- `COMPONENT_MASTER_INDEX.md` updated.
- Evidence logs for each phase.
- Old `minimal_slice` docs left in git history; no recovery unless explicitly needed.
