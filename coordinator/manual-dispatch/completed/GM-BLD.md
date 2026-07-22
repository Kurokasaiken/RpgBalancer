# GM-BLD – Builder & Tooling Guidelines for Modifier Registry

**Status:** completed  
**Executor:** manual (Cascade)  
**Completed at:** 2026-07-22T23:25:00+02:00  
**Evidence:** `test-results/gm-bld-builder-tooling-2026-07-22.log`

## Deliverables

- `src/balancing/modifiers/modifierBuilder.ts` — typed fluent `ModifierBuilder` API and `BuilderConfigSchema`.
- `scripts/modifierRegistryCLI.ts` — `commander` CLI for listing, validating, registering and example-printing modifiers.
- `src/docs/docs/idle_village/builder_tooling.md` — added Fluent Builder and Registry CLI sections.
- `src/docs/docs/plans/idle_village_modifiers_plan.md` — added §10 Builder & Tooling.
- `tests/unit/balancing/modifierBuilder.test.ts` — 7 unit tests covering fluent API, validation and edge cases.

## Safeguards

- `npm run build:check` — PASS
- `npm run test -- tests/unit/balancing/modifierBuilder.test.ts` — PASS
- `npm run kanban:lint` — PASS
- `npm run lint -- src/balancing/modifiers scripts` — ignored by ESLint quarantine (legacy `src/balancing/**`, `scripts/**`)
- `npm run lint:docs` — FAILS due to pre-existing debt in `src/docs/prompts/prompt_library.md`
