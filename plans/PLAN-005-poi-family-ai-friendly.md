---
title: PLAN-005 — POI Family AI-friendly docs and regression test suite
status: active
owner: Agent
project: RPG
---

# PLAN-005 — POI Family AI-friendly docs and regression test suite

**Desiderata FROZEN:** `.mw/desiderata.md` v7
**RICHIESTE:** R-026
**Date:** 2026-08-15
**Scope:** Idle Village POI family

## Goal

Apply the v7 AI-friendly documentation method to the POI family. Produce a root spec, per-type child specs, a shared template, JSON-driven test fixtures, and a linked Playwright regression suite. The result is reproducible: any agent can read the specs and implement or verify POI behavior without asking the Director.

## Why

- POI logic exists in `ActivityDefinition` but is not documented in one canonical surface.
- Existing specs are quest-centric (`poi_spec.md`, `quest_spec.md`, `interaction_core_spec.md`) while `ActivityCardKind` already supports `job`, `training`, `maintenance`.
- Without a linked test suite, every new POI will require repeated questions and re-explanation.

## Deliverables

1. `.mw/templates/ai-friendly-spec.md` — canonical spec template.
2. `src/docs/docs/idle_village/poi_family_spec.md` — root POI family contract.
3. `src/docs/docs/idle_village/poi_job_spec.md` — one-shot / continuous jobs, stamina, auto-collect, resource HUD.
4. `src/docs/docs/idle_village/poi_quest_spec.md` — child spec for quest, includes `trialOfFire`.
5. `src/docs/docs/idle_village/poi_training_spec.md` — stat/XP training.
6. `src/docs/docs/idle_village/poi_maintenance_spec.md` — maintenance / building POIs.
7. `src/docs/docs/idle_village/poi_cooldown_spec.md` — time-limited / cooldown POIs.
8. `src/balancing/config/idleVillage/__tests__/fixtures/poiFamilyFixtures.ts` or JSON — test data for job/training/cooldown.
9. `tests/e2e/idleVillage/poiFamilyRegressions.spec.ts` — Playwright suite linked to the specs.
10. `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` updated.
11. `test-results/poi-family-2026-08-15.md` evidence log.

## Design decisions

- **One root + children** — common lifecycle, drag, slot, time, reward collection in `poi_family_spec.md`; differences in child specs.
- **Slot modifiers mapping** — `ActivitySlotModifier` (per slot index) is multipliers on fatigue/risk/yield for the slot environment; `residentRiskModifiers` (per slot blueprint) is flat death/injury deltas for the resident occupying that slot; `emptyPenalty` is a party-level malus for required empty slots.
- **Pause / Embark** — opening a POI detail does not pause time; `Embark` is a pending intent that is invalidated as soon as assignments, consumables, or other state change; time must be running for the activity to actually start.
- **`dailyRewardProfile`** — make it canonical in `ActivityDefinition` for continuous jobs; derived from config, consumed by the job engine and shown in resource HUD as a small `+` delta.
- **`resourceHudKit`** — keep it for now as the working test harness; canonicalize its API in the root/job spec but do not re-implement unless needed.

## Risks

- `poi_spec.md` and `quest_spec.md` may overlap with the new root. We refactor them to child/indexes, not duplicate.
- `defaultConfig.ts` has fields (`dailyRewardProfile`) not in `types.ts`. We add the missing type and keep config-first.
- Child specs for training/maintenance/cooldown may have incomplete engine implementations; we document current expected contract and mark gaps as `draft` with TODO links to R-026.

## Verification

- `npm run build:check`
- `npm run kanban:lint`
- `npx playwright test tests/e2e/idleVillage/poiFamilyRegressions.spec.ts --project="Desktop Chrome"`

## References

- `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
- `.mw/templates/ai-friendly-spec.md`
- `.mw/desiderata.md` v7
