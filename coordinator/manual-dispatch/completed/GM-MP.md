# GM-MP — Core Plan Updates for Gameplay Modifier System

## Title
Integrate Gameplay Modifier Registry references into master and idle-village plans.

## Description
Update existing plan documents to reflect the verified Gameplay Modifier Registry and Engine implementation (GM-ENG). Add cross-references, registry/engine usage examples, and remove hardcoded numbers. Do not rewrite entire documents; append focused sections and integrate references.

## Prompt
Execute `prompts/GM-MP.md`. The canonical implementation lives in:
- `src/balancing/config/idleVillage/gameplayModifierRegistry.ts`
- `src/balancing/modifiers/gameplayModifierEngine.ts`
- `src/balancing/types/gameplayModifierTypes.ts`
- `src/balancing/config/idleVillage/modifierVisualizationConfig.ts`
- `src/analytics/idleVillage/modifierTelemetry.ts`

Read those files, then update the target documents with accurate references and examples. Keep all changes minimal and focused on registry integration.

## Files to Modify
- `docs/MASTER_PLAN.md`
- `docs/plans/idle_village_progression_system_plan.md`
- `docs/plans/idle_village_tick_fatigue_plan.md`
- `.windsurf/plans/style-lab-flexibility-1a9890.md`
- `docs/plans/idle_village_modifiers_plan.md`

## Expected Output
- Each target document contains a "Gameplay Modifier Integration" section or inline references.
- Cross-links to `gameplayModifierRegistry.ts` / `gameplayModifierEngine.ts` are present.
- No new hardcoded numbers are introduced.
- Safeguards pass: `npm run lint -- docs/`, `npm run build:check`, `npm run kanban:lint`.
- Evidence log: `test-results/gm-mp-plan-updates-<YYYY-MM-DD>.log`

## Dependencies
- GM-ENG completed (engine implementation available).

## Timestamp
2026-07-22T22:42:00+02:00

## Executor
manual
