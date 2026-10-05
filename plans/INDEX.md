---
title: Plan Index — RPG Balancer
type: plan-registry
created: 2026-10-05
---

# Plan Index

Single source of truth for the **operational state** of every plan.
The spec of each plan lives in `plans/PLAN-*.md`. Direction and rationale live in
`.mw/desiderata.md`, `context/DECISION_LOG.md`, `CANON.md`.

## Rules

1. **Current state** lives here, not in the plan file. `status:` in a plan's frontmatter is
   spec metadata; this table wins on conflicts.
2. **Baptism/immutability** is not (yet) enforced like in Mind Weaver — adopted per audit v25;
   if the Director wants full MW baptism rules, that's a CANON-level proposal.
3. One row per plan; task-files attached to a plan are listed under it, not as rows.

## Status vocabulary

`candidate` · `proposed` · `active` · `blocked` · `completed` · `suspended` · `superseded`

## Registry

| Plan | Title | Status | Priority | Notes |
|---|---|---|---|---|
| [PLAN-004](PLAN-004-poi-quest-ui-regressions.md) | POI Quest UI regressions ERR-028/030 | active | — | Aug-era battle plan; verify still relevant |
| [PLAN-005](PLAN-005-poi-family-ai-friendly.md) | POI Family AI-friendly docs + regression suite | active | — | companion task file: `PLAN-005-poi-family-tasks.md` |
| [PLAN-006](PLAN-006-docs-and-code-alignment.md) | Align docs, code, minimal_slice docs | candidate | — | frontmatter `draft` |
| [PLAN-007](PLAN-007-observatory-primitives.md) | Observatory design-system primitives | active | — | — |
| [PLAN-008](PLAN-008-resolution-chain.md) | Catena di risoluzione esito-prima dello skill check | active | P1 | — |
| [PLAN-009](PLAN-009-la-stella-copre-la-trama.md) | La stella copre la trama | unknown | — | no status marker — needs Director read |
| [PLAN-010](PLAN-010-astrolabe-v63.md) | Astrolabe V6.3 (V16 pilotato dall'area) | active | P1 | desiderata v20 |
| [PLAN-011](PLAN-011-knowledge-repository-inventory.md) | Knowledge & Design Repository Inventory | completed | — | closed 2026-08-30; outputs: KNOWLEDGE_INVENTORY/CONFLICTS |
| [PLAN-012](PLAN-012-event-reminder-aaa-v2.md) | Event Reminder AAA v2 — polish round 3 | active | P2 | — |
| [PLAN-013](PLAN-013-sea-marks.md) | World Surface Sea Marks | active | P2 | — |
| [PLAN-014](PLAN-014-land-breath.md) | Land Breath — terraferma che respira | active | P1 | desiderata v21 |
| [PLAN-015](PLAN-015-sea-ripple-port-and-voronoi.md) | Port coastal ripple + Voronoi | proposed | — | — |
| [PLAN-016](PLAN-016-voronoi-sea-surface.md) | Superficie marina cellulare (Voronoi) | proposed | — | — |
| [PLAN-017](PLAN-017-stylized-sea-pattern-evaluation.md) | Stylized Sea Pattern Evaluation | active | P2 | desiderata v19; A gold standard, C challenger |
| [PLAN-018](PLAN-018-mission-planner.md) | Mission Planner PARTY/LOADOUT/OUTCOME | completed | — | MP-00..MP-07 done 2026-10-02; remap pending vs desiderata v24 rev.2 victory rule (C7) |
| [PLAN-019](PLAN-019-quest-macro-plan.md) | Macro plan Quest S1→S5 | active | P1 | desiderata v24, R-076 |
| [PLAN-019-S1](PLAN-019-S1-quest-interessante.md) | S1 — «La cassa delle sementi» | active | P1 | child of PLAN-019; blocked on T-001 (correzione contenuti Director) |
| [PLAN-MOCKUP-v1](PLAN-MOCKUP-TO-COMPONENT-v1.md) | Mockup→Component v1 | superseded | — | bocciato da delibera multi-AI → v2 |
| [PLAN-MOCKUP-v2](PLAN-MOCKUP-TO-COMPONENT-v2.md) | Mockup→Component v2 | superseded | — | cold read NO (5 blocking) → v3 |
| [PLAN-MOCKUP-v3](PLAN-MOCKUP-TO-COMPONENT-v3.md) | Mockup→Component v3 | active | — | decisioni Director ratificate; pilot GoblinEventLabPage |
| [PLAN-020](PLAN-020-quest-rules-canonical-doc.md) | Canonical Quest Rules Document | proposed | — | da audit KB v25 Q7; parent: PLAN-019; produce `QUEST_RULES.md` + regola di mantenimento |

## Sotto-documenti (non piani)

| File | È | Di |
|---|---|---|
| `PLAN-005-poi-family-tasks.md` | task list | PLAN-005 |
| `.mw/plans/poi-quest-config-first-cleanup.md` | sub-plan TP1–TP5 | cleanup `/poi-quest-detail-roster-time-clock` |
| `.mw/plans/sea-motion-brief.md` | brief | World Surface sea motion |
