# Strategist → Coordinator Handoff 2026-07-23

## Audit Summary

- **Scope:** Audit of `src/docs/docs/plans/` orphan/draft plans plus `strategy_tasks.md` gaps.
- **Result:** 14 plan clusters need master tasks registered in `strategy_tasks.md` and/or Kanban rows in `agent_assignments.md`.
- **Already tracked/completed plans (do not duplicate):**
  - `trailer_vertical_slice_plan.md` / `trailer_vertical_slice_tasks.md` → `IV-TRAILER-DAY*` completed in agent_assignments.md.
  - `world_surface_runtime_implementation_plan.md` → `IV-WORLD-SURFACE-001/002/003` completed.
  - `world_presentation_runtime_implementation_plan.md` → `WORLD-PRESENTATION-RUNTIME-FOUNDATION/DEMO` completed.
  - `quest_engine_reconciliation_plan.md` → `ADR001-T5` completed; remaining T1-T4, T6-T8 still pending.
  - `world_surface_v3_strategic_plan.md` → `WORLD-SURFACE-V3-FOUNDATION/EVENTS/WONDERS/UNDERWATER` completed; Phase 5 pending.
- **Action for Coordinator:** Convert each section below into `.spec.json` or `.md` prompts under `prompts/` and `coordinator/manual-dispatch/pending/`, then queue in `agent_assignments.md`.

---

## 1. Quest Engine Reconciliation (ADR-001)

- **Plan:** `src/docs/docs/plans/quest_engine_reconciliation_plan.md`
- **Master Task:** `ADR-001` (already in `strategy_tasks.md`)
- **Status:** T5 completed; T1-T4 and T6-T8 missing.
- **Priority:** high

**Coordinator Handoff:** Register the remaining sub-tasks as separate Kanban rows/prompts:

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| ADR001-T1 | Canonical quest event schema (E1) + `RngService` | `src/engine/quest/QuestEvent.ts`, `src/engine/quest/RngService.ts`, `src/balancing/config/idleVillage/questConfig.ts`, `tests/unit/engine/RngService.test.ts`, `tests/unit/engine/QuestEvent.test.ts` | none | `npm run lint -- src/engine/quest`, `npm run test -- tests/unit/engine/`, `npm run build:check`, `npm run kanban:lint` | `test-results/adr001-t1-<date>.log` |
| ADR001-T2 | Build deterministic resolution engine (E2) | `src/engine/quest/QuestResolutionEngine.ts`, `src/engine/quest/resolvers/*.ts`, `tests/unit/engine/QuestResolutionEngine.test.ts` | ADR001-T1 | lint/test/build/kanban | `test-results/adr001-t2-<date>.log` |
| ADR001-T3 | Migrate `ActivityDefinition` → C2 config schema | `src/balancing/config/idleVillage/activityDefinitions.ts`, `src/balancing/config/idleVillage/defaultConfig.ts`, `tests/unit/idleVillage/activityDefinitions.test.ts` | ADR001-T1 | lint/test/build/kanban | `test-results/adr001-t3-<date>.log` |
| ADR001-T4 | Purge `Math.random()` from quest engine | grep + replace in `src/engine/game/idleVillage/`, `src/engine/quest/`, add CI lint gate | ADR001-T1 | lint/test/build/kanban | `test-results/adr001-t4-<date>.log` |
| ADR001-T6 | Quest telemetry + outcome parity tests | `src/analytics/idleVillage/questTelemetry.ts`, `tests/unit/idleVillage/questOutcomeParity.test.ts` | ADR001-T2, T3 | lint/test/build/kanban | `test-results/adr001-t6-<date>.log` |
| ADR001-T7 | Deprecate C1 quest runtime + migration guide | `src/docs/docs/plans/quest_engine_reconciliation_plan.md`, `src/docs/docs/adr/ADR-001-quest-engine-reconciliation.md`, `archive/` | ADR001-T5 | docs lint, build:check, kanban:lint | `test-results/adr001-t7-<date>.log` |
| ADR001-T8 | End-to-end replay test + trusted docs | `tests/unit/engine/questReplay.test.ts`, `src/docs/docs/idle_village/trusted/quest_engine_trusted.md`, `COMPONENT_MASTER_INDEX.md` | ADR001-T2, T4, T6 | lint/test/build/kanban | `test-results/adr001-t8-<date>.log` |

**Governance / Invariants:**

- Use `PersistenceService` for seed/state; no `localStorage`.
- Config-first: all difficulty/risk/probability values in Zod schemas.
- i18n `idleVillage` namespace for any player-facing text.
- No standalone CSS; skin tokens only.
- Update ADR-001 trusted doc and `COMPONENT_MASTER_INDEX.md` before closing.

---

## 2. Idle Village Progression System

- **Plan:** `src/docs/docs/plans/idle_village_progression_system_plan.md`
- **Master Task:** `IV-PROG-MASTER-001`
- **Status:** P0 completed as `IV-PS0`; P1-P6 missing.
- **Priority:** high

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| IV-PROG-P1 | XP progression formula + level table | `src/balancing/config/idleVillage/progressionConfig.ts`, `src/engine/game/idleVillage/XpProgressionEngine.ts`, `tests/unit/idleVillage/XpProgressionEngine.test.ts` | none | lint/test/build/kanban | `test-results/iv-prog-p1-<date>.log` |
| IV-PROG-P2 | Reward and risk scaling | `src/balancing/config/idleVillage/rewardRiskConfig.ts`, `src/engine/game/idleVillage/RewardRiskScaling.ts`, `tests/unit/idleVillage/RewardRiskScaling.test.ts` | IV-PROG-P1 | lint/test/build/kanban | `test-results/iv-prog-p2-<date>.log` |
| IV-PROG-P3 | Effective power calculator | `src/engine/game/idleVillage/EffectivePowerCalculator.ts`, `src/balancing/config/idleVillage/powerConfig.ts`, `tests/unit/idleVillage/EffectivePowerCalculator.test.ts` | IV-PROG-P2 | lint/test/build/kanban | `test-results/iv-prog-p3-<date>.log` |
| IV-PROG-P4 | Production scaling integration | `src/engine/game/idleVillage/ProductionEngine.ts` (extend), `src/balancing/config/idleVillage/productionScaling.ts` | IV-PS0, IV-PROG-P1 | lint/test/build/kanban | `test-results/iv-prog-p4-<date>.log` |
| IV-PROG-P5 | Telemetry + UI integration | `src/analytics/idleVillage/progressionTelemetry.ts`, `src/ui/idleVillage/components/ProgressionPanel.tsx` | IV-PROG-P3, P4 | lint/test/build/kanban | `test-results/iv-prog-p5-<date>.log` |
| IV-PROG-P6 | End-to-end tests + plan update | `tests/unit/idleVillage/progressionSystem.test.ts`, `src/docs/docs/plans/idle_village_progression_system_plan.md` | all above | lint/test/build/kanban | `test-results/iv-prog-p6-<date>.log` |

**Governance / Invariants:**

- All formulas in config (Zod); no hardcoded exponents/caps.
- i18n `idleVillage` namespace.
- Update `idle_village_progression_system_plan.md` changelog per phase.

---

## 3. Idle Village Tick & Fatigue

- **Plan:** `src/docs/docs/plans/idle_village_tick_fatigue_plan.md`
- **Master Task:** `IV-TF-MASTER-001`
- **Status:** draft, no existing tasks.
- **Priority:** high

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| IV-TF-001 | Fatigue config schema + recovery rates | `src/balancing/config/idleVillage/fatigueConfig.ts`, `src/balancing/config/idleVillage/defaultConfig.ts` | none | lint/test/build/kanban | `test-results/iv-tf-001-<date>.log` |
| IV-TF-002 | Tick engine fatigue application | `src/engine/game/idleVillage/TickEngine.ts` (extend), `src/engine/game/idleVillage/fatigueApplication.ts` | IV-TF-001 | lint/test/build/kanban | `test-results/iv-tf-002-<date>.log` |
| IV-TF-003 | Resident fatigue state + recovery | `src/store/useResidentStore.ts` (extend), `src/engine/game/idleVillage/residentRecovery.ts` | IV-TF-002 | lint/test/build/kanban | `test-results/iv-tf-003-<date>.log` |
| IV-TF-004 | UI hooks (fatigue badges, rest actions) | `src/ui/idleVillage/hooks/useFatigue.ts`, `src/ui/idleVillage/components/FatigueBadge.tsx`, `public/locales/en/idleVillage.json` | IV-TF-003 | lint/test/build/kanban | `test-results/iv-tf-004-<date>.log` |
| IV-TF-005 | Modifier integration + tests | `src/balancing/modifiers/fatigueModifier.ts`, `tests/unit/idleVillage/fatigueSystem.test.ts` | IV-TF-002, GM-ENG | lint/test/build/kanban | `test-results/iv-tf-005-<date>.log` |

**Governance / Invariants:**

- Config-first: all fatigue/recovery/tick rates in Zod schema.
- `PersistenceService` for resident fatigue state.
- i18n `idleVillage` namespace.
- No standalone CSS.

---

## 4. Lore System

- **Plan:** `src/docs/docs/plans/lore_system_plan.md`
- **Master Task:** `WL-LORE-001` (already in `strategy_tasks.md`)
- **Status:** master exists; phases A-E not yet registered.
- **Priority:** medium

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| WL-LORE-001-A | Lore config schema + sample entries | `src/balancing/config/lore/loreConfig.ts`, `src/balancing/config/lore/loreEntries.ts`, `src/balancing/config/narrative/narrativeConfig.ts` | none | lint/test/build/kanban | `test-results/wl-lore-001-a-<date>.log` |
| WL-LORE-001-B | LoreDiscoveryService with triggers | `src/engine/game/lore/LoreDiscoveryService.ts`, `tests/unit/lore/LoreDiscoveryService.test.ts` | WL-LORE-001-A | lint/test/build/kanban | `test-results/wl-lore-001-b-<date>.log` |
| WL-LORE-001-C | LoreStore with PersistenceService | `src/store/loreStore.ts`, `tests/unit/lore/loreStore.test.ts` | WL-LORE-001-B | lint/test/build/kanban | `test-results/wl-lore-001-c-<date>.log` |
| WL-LORE-001-D | LoreBook UI components | `src/ui/components/lore/LoreBook.tsx`, `src/ui/components/lore/LoreEntryCard.tsx`, `src/ui/components/lore/FlavorText.tsx` | WL-LORE-001-C | lint/test/build/kanban | `test-results/wl-lore-001-d-<date>.log` |
| WL-LORE-001-E | Gameplay integration (quest/curio/location) | `src/ui/idleVillage/components/QuestChronicle.tsx`, `src/ui/idleVillage/frozen/kits/locationDetailKit.tsx`, `public/locales/en/idleVillage.json` | WL-LORE-001-B, D | lint/test/build/kanban | `test-results/wl-lore-001-e-<date>.log` |

**Governance / Invariants:**

- All lore strings in config; no hardcoded flavor text.
- `PersistenceService` for `LoreBookState`.
- i18n `idleVillage` namespace; art-direction kill list compliance.

---

## 5. Lore Drop Prototype

- **Plan:** `src/docs/docs/plans/lore_drop_prototype_plan.md`
- **Master Task:** `WL-LORE-DROP-001`
- **Status:** draft, no existing tasks.
- **Priority:** medium

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| WL-LORE-DROP-F1 | LoreDrop types + sample pool | `src/balancing/config/lore/loreDropTypes.ts`, `src/balancing/config/lore/loreDropSamples.ts` | none | lint/test/build/kanban | `test-results/wl-lore-drop-f1-<date>.log` |
| WL-LORE-DROP-F2 | LoreDropService + store | `src/engine/game/lore/LoreDropService.ts`, `src/store/loreDropStore.ts`, `tests/unit/lore/LoreDropService.test.ts` | WL-LORE-DROP-F1 | lint/test/build/kanban | `test-results/wl-lore-drop-f2-<date>.log` |
| WL-LORE-DROP-F3 | Wire into QuestChronicle | `src/ui/idleVillage/components/QuestChronicle.tsx`, `src/ui/idleVillage/hooks/useLoreDropForQuest.ts`, `src/balancing/config/idleVillage/defaultConfig.ts` | WL-LORE-DROP-F2 | lint/test/build/kanban | `test-results/wl-lore-drop-f3-<date>.log` |
| WL-LORE-DROP-F4 | Optional location/building drops | `src/ui/idleVillage/frozen/kits/locationDetailKit.tsx`, `src/balancing/config/idleVillage/buildings.ts` | WL-LORE-DROP-F3 | lint/test/build/kanban | `test-results/wl-lore-drop-f4-<date>.log` |
| WL-LORE-DROP-F5 | In-game smoke test | manual QA on `/minimal-gameplay` | WL-LORE-DROP-F3 | manual + lint/build | `test-results/wl-lore-drop-f5-<date>.log` |
| WL-LORE-DROP-F6 | Evidence log + plan status | `src/docs/docs/plans/lore_drop_prototype_plan.md` | all above | docs lint, kanban:lint | `test-results/wl-lore-drop-f6-<date>.log` |

**Governance / Invariants:**

- Config-first: 12 sample drops in config; no hardcoded strings.
- `PersistenceService` for `LoreDropState`.
- i18n `idleVillage` namespace.

---

## 6. Component-Based World Surface

- **Plan:** `src/docs/docs/plans/component_based_world_surface_plan.md`
- **Master Task:** `IV-WSC-001`
- **Status:** draft, supersedes `world_surface_runtime_implementation_plan.md` for new work.
- **Priority:** high

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| IV-WSC-P1 | Schemas + query engine | `src/engine/world/model/WorldComponent.ts`, `src/engine/world/model/WorldGroup.ts`, `src/engine/world/model/WorldQuery.ts`, `src/engine/world/systems/WorldComponentQueryEngine.ts`, `tests/unit/idleVillage/WorldComponentQueryEngine.test.ts` | none | lint/test/build/kanban | `test-results/iv-wsc-p1-<date>.log` |
| IV-WSC-P2 | Manifest v1 → v2 migration | `src/engine/world/systems/manifestV1ToV2Migration.ts`, `src/ui/idleVillage/hooks/useWorldSurface.ts` | IV-WSC-P1 | lint/test/build/kanban | `test-results/iv-wsc-p2-<date>.log` |
| IV-WSC-P3 | Component batch renderer | `src/ui/idleVillage/components/WorldSurfaceComponent.tsx`, `WorldSurfaceComponentBatch.tsx`, `WorldSurfaceRenderer.tsx` | IV-WSC-P2 | lint/test/build/kanban | `test-results/iv-wsc-p3-<date>.log` |
| IV-WSC-P4 | PresentationOutput extensions | `src/engine/world/presentation/types.ts`, `src/engine/world/presentation/OutputComposer.ts`, `src/engine/world/presentation/effects/ThreatPresenceEffect.ts` | WORLD-PRESENTATION-RUNTIME-FOUNDATION, IV-WSC-P3 | lint/test/build/kanban | `test-results/iv-wsc-p4-<date>.log` |
| IV-WSC-P5 | Test harness + director | `src/ui/idleVillage/pages/WorldSurfaceComponentTestPage.tsx`, `src/ui/idleVillage/TestHub.tsx` | IV-WSC-P4 | lint/test/build/kanban | `test-results/iv-wsc-p5-<date>.log` |
| IV-WSC-P6 | Governance close-out | `src/docs/docs/idle_village/trusted/world_surface_component_trusted.md`, `COMPONENT_MASTER_INDEX.md`, `src/docs/docs/plans/component_based_world_surface_plan.md` | all above | docs lint, build:check, kanban:lint | `test-results/iv-wsc-p6-<date>.log` |

**Governance / Invariants:**

- No `WorldState` mutation from renderer/runtime.
- `PresentationOutput` remains JSON-serializable.
- i18n `idleVillage` for labels.
- No standalone CSS; skin tokens only.
- Add `candidate` row to `COMPONENT_MASTER_INDEX.md`; promote to `trusted` after P6.

---

## 7. World Surface V3 — Phase 5

- **Plan:** `src/docs/docs/plans/world_surface_v3_strategic_plan.md`
- **Master Task:** `IV-WSV3-005`
- **Status:** Phases 1-4 completed; Phase 5 (polish/testing) pending.
- **Priority:** medium

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| IV-WSV3-P5 | Polish, calibration & testing | `src/ui/idleVillage/worldSurface/**`, `tests/e2e/idleVillage/worldSurfaceV3.spec.ts`, `src/docs/docs/plans/world_surface_v3_strategic_plan.md` | WORLD-SURFACE-V3-FOUNDATION/EVENTS/WONDERS/UNDERWATER | lint/test/build/kanban | `test-results/iv-wsv3-p5-<date>.log` |

**Acceptance:**

- 80/15/5 rule verified by telemetry or manual review.
- 60 FPS target on target hardware.
- `event_presaged`, `event_active`, `wonder_spotted` telemetry events emitted.

---

## 8. Rendering System

- **Plan:** `src/docs/docs/plans/rendering_system_implementation_plan.md`
- **Master Task:** `REND-SYS-001`
- **Status:** draft, no existing tasks.
- **Priority:** high

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| REND-SYS-P1 | Foundation: schemas + material/frame/recipe libraries | `src/ui/idleVillage/rendering/schemas.ts`, `src/ui/idleVillage/rendering/materialLibrary.ts`, `src/ui/idleVillage/rendering/frameLibrary.ts`, `src/ui/idleVillage/rendering/layerRecipes.ts` | none | lint/test/build/kanban | `test-results/rend-sys-p1-<date>.log` |
| REND-SYS-P2 | React components + V9PanelShell refactor | `src/ui/idleVillage/rendering/components/Surface.tsx`, `Frame.tsx`, `Recipe.tsx`, `src/ui/idleVillage/components/V9PanelShell.tsx` | REND-SYS-P1 | lint/test/build/kanban | `test-results/rend-sys-p2-<date>.log` |
| REND-SYS-P3 | Library expansion | `src/ui/idleVillage/rendering/{cornerLibrary,dividerLibrary,overlayLibrary,lightSourceLibrary,decorationLibrary}.ts` | REND-SYS-P1 | lint/test/build/kanban | `test-results/rend-sys-p3-<date>.log` |
| REND-SYS-P4 | Visual recipes + decoration packs | `src/ui/idleVillage/rendering/visualRecipes.ts`, `src/ui/idleVillage/rendering/decorationLibrary.ts` | REND-SYS-P2, P3 | lint/test/build/kanban | `test-results/rend-sys-p4-<date>.log` |
| REND-SYS-P5 | Art direction integration | `src/ui/idleVillage/rendering/pillarRecipes.ts`, `src/ui/idleVillage/rendering/artistRecipes.ts`, `src/ui/idleVillage/skins/skinConfigRegistry.ts` | REND-SYS-P4 | lint/test/build/kanban | `test-results/rend-sys-p5-<date>.log` |
| REND-SYS-P6 | Performance & optimization | `src/ui/idleVillage/rendering/utils/{cacheManager,cssGenerator,complexityScaler}.ts` | REND-SYS-P2, P4 | lint/test/build/kanban | `test-results/rend-sys-p6-<date>.log` |
| REND-SYS-P7 | Documentation + migration guide | `docs/guides/rendering_system_guide.md`, `docs/guides/component_migration_guide.md`, `docs/guides/recipe_examples.md` | REND-SYS-P5, P6 | docs lint, build:check, kanban:lint | `test-results/rend-sys-p7-<date>.log` |
| REND-SYS-P8 | Testing & validation | `tests/unit/idleVillage/rendering/*.test.ts`, visual regression | REND-SYS-P6 | lint/test/build/kanban | `test-results/rend-sys-p8-<date>.log` |

**Governance / Invariants:**

- No standalone `.css` files; all visual output from `skinConfigRegistry` tokens or generated CSS.
- Backward compatibility with existing CSS variables.
- i18n `idleVillage` namespace.
- Update `art_direction_plan.md` v0.11 with rendering system section.

---

## 9. Trailer Threat Iter V3

- **Plan:** `src/docs/docs/plans/trailer_threat_iter_plan_v3.md`
- **Master Task:** `TRAILER-THREAT-ITER-V3` (already in `strategy_tasks.md`)
- **Status:** master exists; phases not yet registered.
- **Priority:** medium

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| TRAILER-THREAT-V3-P1 | 4 static frames | `src/ui/idleVillage/trailer/ThreatPresence.tsx`, `src/ui/idleVillage/trailer/TrailerThreatIter.tsx`, `src/balancing/config/idleVillage/trailerConfig.ts` | none | lint/build/kanban | `test-results/trailer-threat-v3-p1-<date>.log` |
| TRAILER-THREAT-V3-P2 | Static-to-static transition (Expanded ↔ Compact) | same as P1 + `public/locales/en/idleVillage.json` (if any) | P1 | lint/build/kanban | `test-results/trailer-threat-v3-p2-<date>.log` |
| TRAILER-THREAT-V3-P3 | Optional polish (timer visual, easing, audio, map reactions) | `src/ui/idleVillage/trailer/**` | P2 | lint/build/kanban | `test-results/trailer-threat-v3-p3-<date>.log` |

**Notes:**

- `@trailer-only` exemption applies: no PersistenceService, no i18n for copy, no gameplay state.
- Config-first for timing/animation values.
- Acceptance tests listed in plan §9.

---

## 10. Art Direction Plan

- **Plan:** `src/docs/docs/plans/art_direction_plan.md`
- **Master Task:** `ART-DIR-001`
- **Status:** draft v0.10, no implementation tasks.
- **Priority:** medium

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| ART-DIR-UPDATE-001 | Update art direction bible to v0.11 + rendering system rules | `src/docs/docs/plans/art_direction_plan.md` | none | docs lint, build:check, kanban:lint | `test-results/art-dir-update-001-<date>.log` |
| ART-DIR-CREATURE-001 | Create canonical creature example (Gnarled Nightmare) | `art-direction/creatures/creatures/gnarled-nightmare/**` or equivalent | ART-DIR-UPDATE-001 | docs lint, kanban:lint | `test-results/art-dir-creature-001-<date>.log` |

**Governance / Invariants:**

- Document is a bible, not code; keep governance sections (kill list, pillars, rendering grammar) in sync with `rendering_system_implementation_plan.md`.

---

## 11. World Presence Grammar

- **Plan:** `src/docs/docs/plans/world_presence_grammar_plan.md`
- **Master Task:** `WL-WPG-001`
- **Status:** draft v0.2, no implementation tasks.
- **Priority:** high

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| WL-WPG-001-CONCEPT | Goblin invasion 4-frame concept + Delta Test | `docs/art-direction/presences/goblin-invasion-concept.md` (or similar), `src/docs/docs/plans/world_presence_grammar_plan.md` | none | design review, docs lint | `test-results/wl-wpg-001-concept-<date>.log` |
| WL-WPG-001-CONFIG | Presence grammar config + validation matrix | `src/balancing/config/worldPresence/presenceGrammar.ts`, `src/engine/world/presence/PresenceValidator.ts`, `tests/unit/world/presenceGrammar.test.ts` | WL-WPG-001-CONCEPT | lint/test/build/kanban | `test-results/wl-wpg-001-config-<date>.log` |

**Acceptance:**

- 4 frames pass Delta Test (§4.1).
- 40px, no-hover, 3am tests pass.
- World Presence Grammar Matrix (§3.2) implemented as config.

---

## 12. Wanderlust Triumph Steam Concept Slice

- **Plan:** `src/docs/docs/plans/wanderlust_triumph_steam_concept_slice_plan.md`
- **Master Task:** `WL-TEASER-001`
- **Status:** Planning, no existing tasks.
- **Priority:** medium

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| WL-TEASER-D1 | Scaffolding: route + controller + config | `src/pages/teaser-showcase.tsx`, `src/ui/teaser/TeaserShowcase.tsx`, `TeaserSceneController.ts`, `TeaserConfig.ts`, `src/App.tsx` | none | lint/build/kanban | `test-results/wl-teaser-d1-<date>.log` |
| WL-TEASER-D2 | Scene composites (map, village, choice) | `src/ui/teaser/TeaserMapScene.tsx`, `TeaserVillageScene.tsx`, `TeaserChoiceCard.tsx` | WL-TEASER-D1 | lint/build/kanban | `test-results/wl-teaser-d2-<date>.log` |
| WL-TEASER-D3 | Hero, drag & astrolabe | `src/ui/teaser/TeaserHeroSheet.tsx`, `TeaserDragOverlay.tsx`, `TeaserAstrolabeScene.tsx`, `TeaserOutcomeCard.tsx` | WL-TEASER-D2 | lint/build/kanban | `test-results/wl-teaser-d3-<date>.log` |
| WL-TEASER-D4 | Consequence, legacy, outro | `src/ui/teaser/TeaserImpactOverlay.tsx`, `TeaserLegacyScreen.tsx`, `TeaserOutroScreen.tsx` | WL-TEASER-D3 | lint/build/kanban | `test-results/wl-teaser-d4-<date>.log` |
| WL-TEASER-D5 | Polish & controls | keyboard/auto-play/timer overlay, `window.__teaserController` | WL-TEASER-D4 | lint/build/kanban | `test-results/wl-teaser-d5-<date>.log` |

**Notes:**

- `@trailer-only` exemption: no PersistenceService, no real engine, all mocked.
- Reuse existing components with mocked props only.
- 55s deterministic sequence, no random physics.

---

## 13. Config-Driven Component-Based Architecture

- **Plan:** `src/docs/docs/plans/config_driven_architecture_plan.md`
- **Master Task:** `CDA-MASTER-001`
- **Status:** Draft architecture proposal; 11 sub-plans referenced, most not yet created.
- **Priority:** high

**Coordinator Handoff:**

| Subtask | Description | File Targets | Dependencies | Safeguards | Evidence Log |
|---|---|---|---|---|---|
| CDA-00-001 | Architecture Foundation & ADRs | `src/docs/docs/architecture/ADR/ADR-001..006.md`, `src/docs/docs/plans/config_driven_architecture_00_architecture_foundation.md` | none | docs lint, build:check, kanban:lint | `test-results/cda-00-001-<date>.log` |
| CDA-01-001 | Component Runtime (registry/factory/resolver/validation) | `src/game/runtime/ComponentRegistry.ts`, `ComponentFactory.ts`, `ComponentDefaultResolver.ts`, `ValidationSystem.ts` | CDA-00-001 | lint/test/build/kanban | `test-results/cda-01-001-<date>.log` |
| CDA-02-001 | Rendering Primitive System | `src/rendering/primitives/**`, `src/rendering/materials/**` | CDA-01-001 | lint/test/build/kanban | `test-results/cda-02-001-<date>.log` |
| CDA-03-001 | Material Engine (complexity/layers/binding) | `src/rendering/materials/MaterialEngine.ts`, `complexityScaler.ts` | CDA-02-001 | lint/test/build/kanban | `test-results/cda-03-001-<date>.log` |
| CDA-04-001 | Physics System (profiles + unified hook) | `src/game/physics/PhysicsProfile.ts`, `useComponentPhysics.ts` | CDA-01-001 | lint/test/build/kanban | `test-results/cda-04-001-<date>.log` |
| CDA-05-001 | Seed / Procedural Variation | `src/game/seed/SeedSystem.ts`, deterministic RNG | CDA-01-001 | lint/test/build/kanban | `test-results/cda-05-001-<date>.log` |
| CDA-06-001 | Village Evolution System | `src/game/village/VillageSystem.ts` | CDA-02, CDA-04, CDA-05 | lint/test/build/kanban | `test-results/cda-06-001-<date>.log` |
| CDA-07-001 | POI World Map System | `src/game/poi/PointOfInterestComponent.ts`, config packs | CDA-01-05 | lint/test/build/kanban | `test-results/cda-07-001-<date>.log` |
| CDA-08-001 | Frozen Kit Migration | migrate `PgCard`, `WorkerCard`, `POI`, `Token`, panels | CDA-01-07 | lint/test/build/kanban | `test-results/cda-08-001-<date>.log` |
| CDA-09-001 | Modding Layer | `src/modding/` registry/loader/validator/sandbox/UI | CDA-01-08 | lint/test/build/kanban | `test-results/cda-09-001-<date>.log` |
| CDA-10-001 | AI Production Pipeline | `scripts/ai/` prompt runner, scaffolder, validator, freeze checklist | CDA-00-09 | lint/test/build/kanban | `test-results/cda-10-001-<date>.log` |

**Governance / Invariants:**

- Config-first; no hardcoded switch/case on component types.
- i18n contracts per component.
- Skin contracts per component.
- Update `config_driven_architecture_plan.md` index as each sub-plan is created.
- Promote `COMPONENT_MASTER_INDEX.md` rows to `trusted` only after runtime verification.

---

## Kanban Queue Instructions

For each master/subtask row above, the Coordinator must:

1. Create a prompt file in `prompts/<TASK_ID>.spec.json` or `prompts/<TASK_ID>.md`.
2. Add a row to `src/docs/docs/coordinator/agent_assignments.md` with status `Non assegnato`.
3. Set `execution_hint` based on task nature:
   - `atomic` for single-file/schema changes.
   - `verified` for tasks requiring design/architecture judgment.
   - `architectural` for foundational layers (CDA, REND-SYS, IV-WSC).
4. When an agent picks a prompt, update status to `In corso` with agent name and date.
5. On completion, update status to `Completato` with evidence log path and run `npm run kanban:lint`.
6. Do **not** start new tasks before closing ongoing dependent tasks.

## Suspension Notes

- Plans whose master task is `pending` should be treated as **suspended** until the first task is queued.
- Outdated/duplicate plans identified during audit:
  - `trailer_threat_iter_rework_plan.md` (v2) is superseded by `trailer_threat_iter_plan_v3.md`.
  - `world_surface_runtime_implementation_plan.md` is superseded by `component_based_world_surface_plan.md` for new work, but remains valid for migration context.
- Mark superseded plans in their changelog and link to the successor plan.
