# PLAN-005 — Task Checklist

- [x] T1 — Create `.mw/templates/ai-friendly-spec.md`.
- [x] T2 — Create `src/docs/docs/idle_village/poi_family_spec.md` root from existing docs.
- [x] T3 — Add `dailyRewardProfile` to `ActivityDefinition` in `types.ts` (if missing) — already present.
- [x] T4 — Create `poi_job_spec.md` (one-shot + continuous, stamina, auto-collect, resource HUD).
- [x] T5 — Refactor `poi_quest_spec.md` / `quest_spec.md` as child and add `trialOfFire` link.
- [x] T6 — Create `poi_training_spec.md`.
- [x] T7 — Create `poi_maintenance_spec.md`.
- [x] T8 — Create `poi_cooldown_spec.md`.
- [~] T9 — Add JSON/config fixtures for POI types (deferred; current test hooks are sufficient for selector regressions).
- [x] T10 — Add/extend `__idleVillageTestHooks` for job/training/cooldown state (selector + info + set/get selected activity + quest state).
- [x] T11 — Create `tests/e2e/idleVillage/poiFamilyRegressions.spec.ts`.
- [x] T12 — Update `COMPONENT_MASTER_INDEX.md`.
- [x] T13 — Create/extend `test-results/poi-family-2026-08-15.md` evidence log.
- [x] T14 — Run `npm run build:check`, `npm run kanban:lint`, focused Playwright.

## Notes

- Runtime verification completed for selector, job switch, training switch, and paused quest start.
- Full job continuous/cooldown/training runtime tests require dedicated page/kit support; documented in child specs but not yet verified.
