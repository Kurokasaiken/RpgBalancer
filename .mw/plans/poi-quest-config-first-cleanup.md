# Sub-plan: POI Quest config-first cleanup

## Goal

Remove all hardcoded quest configuration from the POI quest page and related components, routing every quest rule through `IdleVillageConfig` edited from the `/idle-village-config` Activities tab.

## Precondition

Complete the five task packages in order. TP1 is a hard prerequisite for the others.

## Task packages

### TP1 — IdleVillageConfig schema (ERR-022)

- Add `questTimeScale` and `questSkillCheckConfig` to `IdleVillageConfig`.
- Update `src/balancing/config/idleVillage/types.ts`, `schemas.ts`, `defaultConfig.ts`, `configNormalizer.ts`, `IdleVillageConfigStore.ts`.
- Acceptance: `useIdleVillageConfig().config.questTimeScale` and `.questSkillCheckConfig` are defined and Zod-validated.

### TP2 — POI Quest page refactor (ERR-019, 020, 021, 025, 026)

- Consume `IdleVillageConfig` in `src/ui/idleVillage/pages/PoiDetailQuestRosterTimeClockIntegrationPage.tsx` instead of `DEFAULT_IDLE_VILLAGE_CONFIG` and `defaultQuestBlueprints`.
- Pass `questTimeScale` and `questSkillCheckConfig` to the quest engine functions.
- Read `questPowerRules` from `config.globalRules`.
- Expand `handleCollect` to all blueprint reward types (`materials`, `renown`, `reputation`, `items`) not just `gold/food/wood/xp`.
- Acceptance: Playwright suite `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts` still passes (17/1), no `DEFAULT_IDLE_VILLAGE_CONFIG` imports in the page.

### TP3 — QuestChronicle hardcoded removal (ERR-023)

- Remove `RISK_FALLBACKS`, `PAL`, `VARIANT_MAP`, `FILL_GRADIENTS`, `FILL_SHADOWS` from `src/ui/idleVillage/components/QuestChronicle.tsx`.
- Drive variant/color mapping from `src/ui/idleVillage/skins/questChronicleSkinConfig.ts` and per-phase risk from `phase.riskProfile`.
- Acceptance: `npm run build:check` passes, no hardcoded color/risk tables.

### TP4 — MilestoneCheckModal hardcoded removal (ERR-024)

- Pass `criticalFailChance` from `questSkillCheckConfig` (or the active `IdleVillageConfig`) to `src/ui/idleVillage/components/MilestoneCheckModal.tsx`.
- Acceptance: the prop is no longer hardcoded to `5`.

### TP5 — Quest kit default config removal (ERR-027)

- Remove `DEFAULT_IDLE_VILLAGE_CONFIG.resources` lookups from `src/ui/idleVillage/frozen/kits/questPoiKit.tsx` and `questDetailKit.tsx`.
- Use `useIdleVillageConfig().config.resources` for label/icon resolution.
- Acceptance: `npm run build:check` passes, no `DEFAULT_IDLE_VILLAGE_CONFIG` imports in the two kits.

## Evidence target

- `src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_error_registry.md` (mark closed as each ERR is fixed).
- `test-results/poi-quest-detail-roster-time-clock-runtime-2026-08-14.md` (append evidence for each TP).

## Execution

Each TP lives in its own `.mw/bugs/<timestamp>-<slug>` directory. Start with `tp1-schema`; the others unlock after it.
