# Game Surface Coverage — `/game`

<!-- GENERATED — do not edit by hand. Regenerate: npm run surface:coverage -->
<!-- coverage-sha256: 4e0c0173dbc3491dde40fe5a50203b4c6d21daf77ca48893527c9765c910e5bc -->

Matrice meccanica unità → test → doc (R-232). Unità = partizione di
`scripts/verification/componentInventory.ts` sul set D di
`discoverGameSurface.ts`. Fonte dati: `.mw/contracts/components/coverage.generated.json`.

## Sintesi

| unità | ui-component | con unit test | con e2e | con doc | con contratto | zero copertura |
|---|---|---|---|---|---|---|
| 254 | 198 | 237 | 65 | 254 | 254 | 12 |

## Spec di pagina (navigano a `/game`, copertura trasversale)

- `tests/e2e/idleVillage/_probe.spec.ts`
- `tests/e2e/idleVillage/gameBootHealth.spec.ts`
- `tests/e2e/idleVillage/gameEventFreeze.spec.ts`
- `tests/e2e/idleVillage/gameGeometryT01.spec.ts`
- `tests/e2e/idleVillage/gameInvasionHandover.spec.ts`
- `tests/e2e/idleVillage/gameInvasionMarch.spec.ts`
- `tests/e2e/idleVillage/gameInvasionScene.spec.ts`
- `tests/e2e/idleVillage/gameInvasionSequence.spec.ts`
- `tests/e2e/idleVillage/gamePerf.spec.ts`
- `tests/e2e/idleVillage/gameQuestCluster.spec.ts`
- `tests/e2e/idleVillage/gameQuestDragFeedback.spec.ts`
- `tests/e2e/idleVillage/gameQuestExpedition.spec.ts`
- `tests/e2e/idleVillage/gameQuestFullFlow.spec.ts`
- `tests/e2e/idleVillage/gameQuestInputCoordination.spec.ts`
- `tests/e2e/idleVillage/gameQuestLifecycle.spec.ts`
- `tests/e2e/idleVillage/gameQuestPlannerLayout.spec.ts`
- `tests/e2e/idleVillage/gameQuestReveal.spec.ts`
- `tests/e2e/idleVillage/gameVillageView.spec.ts`
- `tests/e2e/idleVillage/questJourneyRoute.spec.ts`
- `tests/e2e/idleVillage/r223QuestUiRegressions.spec.ts`
- `tests/e2e/idleVillage/steamCapture.spec.ts`
- `tests/e2e/idleVillage/steamCaptureVideo.spec.ts`

## Matrice

### `src/pages/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `game-frame` | 1 | 1 | `tier1ContractCoverage.test.tsx` | — | `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-035-village-view-buildings.md` `PLAN-060-questwindow-input-frontier.md` `PLAN-065-quest-run-window-r231-deep.md` `hud_component_guide.md` +1 | `CTR-game-002` `CTR-game-003` `CTR-game-004` `game-frame.md` |
| `game-frame-pixi` | 1 | 59 | `minimalGameplayFlow.test.tsx` `KitShell.test.tsx` `WorkerPanel.test.tsx` `combatStrip.test.tsx` `gameBootPerf.test.tsx` `gameFrameCursors.test.ts` +188 | `gameBootHealth.spec.ts` `gamePerf.spec.ts` `gameQuestInputCoordination.spec.ts` `questJourneyRoute.spec.ts` `questRunWindow.test.tsx` `gameGeometryT01.spec.ts` +6 | `QUEST_RULES.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `GAME_INVASION_SEQUENCE.md` `PLAN-019-S4-integrazione.md` `PLAN-031-game-boot-preload-perf.md` +17 | `CTR-game-001` `CTR-game-002` `CTR-game-003` `CTR-game-004` `CTR-game-005` `CTR-game-010` +1 |

### `src/ui/designSystem/primitives/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `materic-ambient-field` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` `wanderlust_triumph_steam_concept_slice_plan.md` | `materic-ambient-field.md` |
| `materic-badge` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-badge.md` |
| `materic-button` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-button.md` |
| `materic-carved-bar` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `materic-carved-bar.md` |
| `materic-close-button` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-close-button.md` |
| `materic-cloud-wall` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-cloud-wall.md` |
| `materic-divider` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `materic-divider.md` |
| `materic-event-card` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `PLAN-012-event-reminder-aaa-v2.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` `settlement_lost_event_plan.md` | `materic-event-card.md` |
| `materic-field` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-field.md` |
| `materic-field-group` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-field-group.md` |
| `materic-frame` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `PLAN-007-observatory-primitives.md` `hud_component_guide.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` +1 | `materic-frame.md` |
| `materic-grain` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `materic-grain.md` |
| `materic-heading` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `materic-heading.md` |
| `materic-inset` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `hud_component_guide.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-inset.md` |
| `materic-plaque` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` `idle_village_hero_sheet_dynamic_stats_plan.md` | `materic-plaque.md` |
| `materic-portrait` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-portrait.md` |
| `materic-record-list` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` `idle_village_hero_sheet_dynamic_stats_plan.md` | `materic-record-list.md` |
| `materic-requirement-list` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `materic-requirement-list.md` |
| `materic-section-header` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `materic-section-header.md` |
| `materic-slot` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `materic-slot.md` |
| `materic-stat-bar` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-stat-bar.md` |
| `materic-surface` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `INDEX.md` `hud_component_guide.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` | `materic-surface.md` |
| `materic-threat-aura` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `materic-threat-aura.md` |
| `materic-title-sep` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `materic-title-sep.md` |
| `sticker-frame` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `sticker-frame.md` |
| `tab-window` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `COMPONENT_MASTER_INDEX.md` | `tab-window.md` |
| `window` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `CURRENT_STATE.md` `RICHIESTE.md` `DECISION_LOG.md` `recurring-traps.md` `PLAN-019-S2-quest-vera.md` `PLAN-030-meta-layer-gate1-harness.md` +19 | `window.md` |

### `src/ui/fantasy/atoms/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `glow-progress` | 2 | 1 | `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` +133 | — | `COMPONENT_MASTER_INDEX.md` | `glow-progress.md` |
| `hearthstone-card` | 2 | 1 | `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` +133 | — | `COMPONENT_MASTER_INDEX.md` | `hearthstone-card.md` |
| `orb-icon` | 2 | 1 | `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` +133 | — | `COMPONENT_MASTER_INDEX.md` | `orb-icon.md` |

### `src/ui/idleVillage/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `resident-name` | 1 | 1 | `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` `MinimalGameplay.dnd.test.tsx` +63 | — | `COMPONENT_MASTER_INDEX.md` | `resident-name.md` |

### `src/ui/idleVillage/components/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `active-hud` | 2 | 12 | `ActiveHUD.analytics.test.tsx` `ActiveHUD.skin.test.tsx` `ActiveHUD.test.tsx` `AdvancedMaintenanceOptimizer.test.ts` `CrewSchedulerController.test.ts` `CrewSchedulerDebug.test.tsx` +42 | `gameQuestLifecycle.spec.ts` `ballGuidance.test.ts` `questRewardPopup.test.tsx` `questRunWindow.test.tsx` `questSettlement.test.ts` | `PHASE_4_SETUP_GUIDE.md` `README.md` `RICHIESTE.md` `VERTICAL_SLICE_TEMPORAL_SKINS_PLAN.md` `VERTICAL_SLICE_ENTITIES_FULL.md` `VERTICAL_SLICE_FROZEN_VERSIONS.md` +22 | `CTR-game-009` `active-hud.md` |
| `crew-scheduler-hudcard` | 2 | 1 | `CrewSchedulerHUDCard.test.tsx` `designSystemPage.test.tsx` `ActiveHUD.analytics.test.tsx` `ActiveHUD.skin.test.tsx` `ActiveHUD.test.tsx` `CrewSchedulerHUDCard.test.tsx` +8 | — | `COMPONENT_MASTER_INDEX.md` | `crew-scheduler-hudcard.md` |
| `custom-drag-overlay` | 2 | 1 | `CustomDragOverlay.portal.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +22 | — | `COMPONENTS_SPECIFICATION.md` `GAMEPLAY_DESIGN.md` `VERTICAL_SLICE_ROADMAP.md` `DECISION_LOG.md` `REAL_COMPONENTS_ONLY.md` `VERTICAL_SLICE_ENTITIES_FULL.md` +19 | `custom-drag-overlay.md` |
| `drag-context` | 2 | 1 | `02_roster_pgtoken.unit.test.tsx` `ActivityDetail.unit.test.tsx` `MinimalDragPage.unit.test.tsx` `PgCard.interactions.test.tsx` `ResidentSlotRack.unit.test.tsx` `VillageRosterSection.unit.test.tsx` +34 | `roster-slotRack.spec.ts` | `VERTICAL_SLICE_ENTITIES_FULL.md` `idle-village-context-optimized.md` `idle-village-context.md` `PLAN-019-S2-quest-vera.md` `PLAN-019-S2.4-planning-lancio.md` `POSTMORTEM_ARCHIVED.md` +7 | `drag-context.md` |
| `drag-context-store` | 1 | 1 | `KitShell.test.tsx` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` +57 | — | `POSTMORTEM_ARCHIVED.md` `COMPONENT_MASTER_INDEX.md` `roster_slot_interaction_documentation.md` | `drag-context-store.md` |
| `drag-test-container` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `CanonicalStoreVerification.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +28 | `ResidentDragAccessibility.spec.ts` `gameQuestDragFeedback.spec.ts` `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `gameQuestLifecycle.spec.ts` `r223QuestUiRegressions.spec.ts` +1 | `BUG_EXPLANATION_ROSTER_DRAG_OUTSIDE.md` `CHANGELOG.md` `RICHIESTE.md` `PLAN-007-observatory-primitives.md` `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` +4 | `drag-test-container.md` |
| `drag-test-container.module` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +26 | — | `COMPONENT_MASTER_INDEX.md` | `drag-test-container.module.md` |
| `drop-feedback-ui` | 2 | 7 | `dragDropStressTest.test.ts` `dropAISuggestions.test.tsx` `useDropFeedback.test.tsx` `useResidentDropValidation.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` +39 | — | `idle-village-context-optimized.md` `idle-village-context.md` `ARCHITECTURE_BIBLE.md` `POSTMORTEM_ARCHIVED.md` `COMPONENT_MASTER_INDEX.md` `roster_slot_interaction_documentation.md` +4 | `drop-feedback-ui.md` |
| `flight-proxy` | 2 | 1 | `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` `roster-slotRack.spec.ts` +20 | `gameQuestDragFeedback.spec.ts` `flight-proxy-iso.spec.ts` | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` `gameplay_components_inventory.md` `interaction_core_spec.md` `roster_spec.md` `pgcard_trusted.md` +1 | `flight-proxy.md` |
| `floating-panel` | 2 | 1 | `FloatingPanel.test.tsx` `FloatingPanel.test.tsx` `missionPlannerPanel.test.tsx` | `gameQuestPlannerLayout.spec.ts` `heroSheetPlacement.test.ts` `stageZonesSolver.test.ts` | `CURRENT_STATE.md` `GLOSSARY.md` `KNOWLEDGE_INVENTORY.md` `RICHIESTE.md` `DECISION_LOG.md` `PLAN-018-mission-planner.md` +13 | `CTR-game-006` `floating-panel.md` |
| `game-icons` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +25 | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` `roster_trusted_components.md` | `game-icons.md` |
| `gilded-event-frame` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `PLAN-012-event-reminder-aaa-v2.md` `COMPONENT_MASTER_INDEX.md` | `gilded-event-frame.md` |
| `goblin-invasion-window` | 1 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | `gameInvasionHandover.spec.ts` `gameInvasionScene.spec.ts` | `KNOWLEDGE_INVENTORY.md` `RICHIESTE.md` `PLAN-033-game-event-shroud-goblin-march.md` `COMPONENT_MASTER_INDEX.md` | `CTR-game-004` `goblin-invasion-window.md` |
| `magic-circle-halo` | 2 | 2 | `MagicCircleHalo.test.tsx` `MagicCircleHalo.test.tsx` | — | `CURRENT_STATE.md` `RICHIESTE.md` `DECISION_LOG.md` `recurring-traps.md` `COMPONENT_MASTER_INDEX.md` `gameplay_components_inventory.md` +7 | `magic-circle-halo.md` |
| `milestone-check-modal` | 2 | 2 | — | `poiQuestDetailRosterTimeClock.spec.ts` | `CURRENT_STATE.md` `GLOSSARY.md` `RICHIESTE.md` `DECISION_LOG.md` `PLAN-019-S3-parte-precedente.md` `PLAN-021-quest-theatre.md` +12 | `milestone-check-modal.md` |
| `oxidized-grade-filter` | 2 | 1 | `SettlementLostOverlay.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` `settlement_lost_event_plan.md` | `oxidized-grade-filter.md` |
| `pg-card` | 2 | 8 | `PgCard.interactions.test.tsx` `SkinBindingRegistry.test.tsx` `useSkinHarness.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` +45 | `02_roster_pgtoken.spec.ts` `04_drag_interactions.spec.ts` `ResidentDragAccessibility.spec.ts` `drag-drop-comprehensive-test.spec.ts` `drag-drop-final-test.spec.ts` `drag-drop-functionality-test.spec.ts` +17 | `APPROACH_CRITIQUE_V2.md` `BUG_EXPLANATION_ROSTER_DRAG_OUTSIDE.md` `GAMEPLAY_DESIGN.md` `VERTICAL_SLICE_ROADMAP.md` `REAL_COMPONENTS_ONLY.md` `VERTICAL_SLICE_ENTITIES_FULL.md` +12 | `pg-card.md` |
| `quest-assignment-preview` | 2 | 1 | `QuestAssignmentPreview.test.tsx` `QuestAssignmentPreview.test.tsx` | — | `RICHIESTE.md` `PLAN-018-mission-planner.md` `PLAN-019-S3-parte-precedente.md` `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` `mission_planner_spec.md` +2 | `quest-assignment-preview.md` |
| `quest-chronicle` | 2 | 2 | `QuestChronicleRope.test.tsx` `QuestChronicleRope.test.tsx` | `poiQuestDetailRosterTimeClock.spec.ts` | `CURRENT_STATE.md` `GLOSSARY.md` `RICHIESTE.md` `DECISION_LOG.md` `PLAN-021-quest-theatre.md` `PLAN-025-quest-theatre-convergence-cinema.md` +20 | `quest-chronicle.md` |
| `quest-reward-panel` | 2 | 1 | `QuestRewardPanel.test.tsx` `QuestRewardPanel.test.tsx` `questRewardPopup.test.tsx` | `poiQuestDetailRosterTimeClock.spec.ts` | `RICHIESTE.md` `PLAN-021-quest-theatre.md` `PLAN-025-quest-theatre-convergence-cinema.md` `COMPONENT_MASTER_INDEX.md` `gameplay_components_inventory.md` `gameplay_system_complete.md` +2 | `quest-reward-panel.md` |
| `reminder-component` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `PLAN-012-event-reminder-aaa-v2.md` `COMPONENT_MASTER_INDEX.md` | `reminder-component.md` |
| `resident-roster-panel` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +26 | `gameGeometryT01.spec.ts` `gameQuestDragFeedback.spec.ts` `gameQuestExpedition.spec.ts` `gameQuestLifecycle.spec.ts` `gameQuestPlannerLayout.spec.ts` `poiQuestDetailRosterTimeClock.spec.ts` +1 | `VERTICAL_SLICE_ENTITIES_FULL.md` `MASTER_PLAN.md` `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` `roster_bundle_usage.md` `roster_slot_integration_spec.md` +2 | `resident-roster-panel.md` |
| `resident-roster-types` | 1 | 1 | `PgCard.interactions.test.tsx` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` +54 | — | `COMPONENT_MASTER_INDEX.md` | `resident-roster-types.md` |
| `resident-slot-rack` | 2 | 9 | `ResidentSlotRack.drag-feedback.test.tsx` `ResidentSlotRack.medal.test.tsx` `magneticCollision.test.ts` `useExtractionSequence.test.ts` `useSlotSounds.test.ts` `useSlottedMedalBehavior.test.ts` +49 | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `DragRosterSlotRack.test.ts` `questExpeditionBag.test.tsx` `gameQuestFullFlow.spec.ts` `poiQuestDetailRosterTimeClock.spec.ts` +2 | `ACTIVITY_CAPSULE_TESTING_PLAN.md` `CURRENT_STATE.md` `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md` `RICHIESTE.md` `APPROACH_CONSTRUCTIVE_CRITIQUE.md` `DECISION_LOG.md` +52 | `CTR-game-007` `resident-slot-rack.md` |
| `roster-sort-icon` | 2 | 1 | `rosterSortIcon.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +26 | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` `roster_trusted_components.md` | `roster-sort-icon.md` |
| `settlement-lost-overlay` | 2 | 1 | `SettlementLostOverlay.test.tsx` `SettlementLostOverlay.test.tsx` | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` `settlement_lost_event_plan.md` | `settlement-lost-overlay.md` |
| `slot` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +31 | — | `PHASE_4_SETUP_GUIDE.md` `REAL_COMPONENTS_ONLY.md` `VERTICAL_SLICE_ENTITIES_FULL.md` `VERTICAL_SLICE_FROZEN_VERSIONS.md` `DEVELOPMENT_GUIDELINES.md` `IMPLEMENTED_PLAN.md` +13 | `slot.md` |
| `slot-gem-pointer` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +33 | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `slot-gem-pointer.md` |
| `slot-v12-renderer` | 2 | 1 | `SlotV12Renderer.hud64.test.tsx` `bloomBrass.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` +35 | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `DragRosterSlotRack.test.ts` `questExpeditionBag.test.tsx` | `RICHIESTE.md` `PLAN-043-S5-slot-incastonatura.md` `PLAN-043-WS2-three-zone-stage.md` `PLAN-043-game-quest-surface-pass.md` `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` +4 | `CTR-game-007` `slot-v12-renderer.md` |
| `village-roster-section` | 2 | 1 | `02_roster_pgtoken.unit.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +27 | `drag-drop-functionality-test.spec.ts` `minimal-job-poi-roster-integration.spec.ts` `minimal-job-poi-roster-time-integration.spec.ts` `testRosterPgCards.spec.ts` | `DESIGN_PILLARS.md` `GAMEPLAY_DESIGN.md` `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md` `RICHIESTE.md` `REAL_COMPONENTS_ONLY.md` `RPG_PROJECT_CONTEXT.md` +32 | `village-roster-section.md` |
| `wanderlust-medal-overlay` | 2 | 1 | `WanderlustMedalOverlay.loading.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +32 | — | `RICHIESTE.md` `primitive_composition_rules.md` `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` `roster_slot_interaction_documentation.md` `test_hub_pages.md` +5 | `wanderlust-medal-overlay.md` |
| `wanderlust-roster-card` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +24 | — | `HANDOFF.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-024-quest-s1-lab-hud-restyle.md` `PLAN-025-quest-theatre-convergence-cinema.md` `MASTER_PLAN.md` +8 | `wanderlust-roster-card.md` |
| `worker-card` | 2 | 2 | `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` `roster-slotRack.spec.ts` +25 | — | `RICHIESTE.md` `ARCHITECTURE_BIBLE.md` `DEVELOPMENT_GUIDELINES.md` `IMPLEMENTED_PLAN.md` `POSTMORTEM_ARCHIVED.md` `COMPONENT_MASTER_INDEX.md` +10 | `worker-card.md` |
| `world-surface-atmosphere` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-atmosphere.md` |
| `world-surface-birds` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `PLAN-015-sea-ripple-port-and-voronoi.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-birds.md` |
| `world-surface-cloud-shadows` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `DECISION_LOG.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-cloud-shadows.md` |
| `world-surface-clouds` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-clouds.md` |
| `world-surface-coast-foam` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `world-surface-coast-foam.md` |
| `world-surface-creatures` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `world-surface-creatures.md` |
| `world-surface-event-card` | 1 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | `gameEventFreeze.spec.ts` `gameInvasionHandover.spec.ts` `gameInvasionMarch.spec.ts` `gameInvasionScene.spec.ts` `gameInvasionSequence.spec.ts` | `KNOWLEDGE_INVENTORY.md` `RICHIESTE.md` `GAME_INVASION_SEQUENCE.md` `recurring-traps.md` `PLAN-033-game-event-shroud-goblin-march.md` `PLAN-034-trailer-audit-fixes.md` +2 | `CTR-game-004` `world-surface-event-card.md` |
| `world-surface-event-shroud` | 2 | 2 | — | `gameInvasionSequence.spec.ts` | `RICHIESTE.md` `GAME_INVASION_SEQUENCE.md` `PLAN-033-game-event-shroud-goblin-march.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-event-shroud.md` |
| `world-surface-foam` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `world-surface-foam.md` |
| `world-surface-glass-overlay` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-glass-overlay.md` |
| `world-surface-renderer` | 2 | 2 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `CURRENT_STATE.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `DECISION_LOG.md` `PLAN-013-sea-marks.md` `PLAN-014-land-breath.md` +11 | `world-surface-renderer.md` |
| `world-surface-river-glint` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` `world_surface_reactive_artifact_plan.md` | `world-surface-river-glint.md` |
| `world-surface-sea-margin` | 2 | 1 | `gameBootPerf.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `world-surface-sea-margin.md` |
| `world-surface-sea-marks` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `DECISION_LOG.md` `PLAN-013-sea-marks.md` `PLAN-015-sea-ripple-port-and-voronoi.md` `COMPONENT_MASTER_INDEX.md` `sea_motion_measurement_contract.md` | `world-surface-sea-marks.md` |
| `world-surface-sea-pattern-overlay` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-sea-pattern-overlay.md` |
| `world-surface-sea-ripple` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `PLAN-015-sea-ripple-port-and-voronoi.md` `COMPONENT_MASTER_INDEX.md` `world_surface_reactive_artifact_plan.md` | `world-surface-sea-ripple.md` |
| `world-surface-water-field` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `PLAN-014-land-breath.md` `PLAN-015-sea-ripple-port-and-voronoi.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-water-field.md` |
| `world-surface-waves` | 2 | 1 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `PLAN-013-sea-marks.md` `PLAN-015-sea-ripple-port-and-voronoi.md` `PLAN-017-stylized-sea-pattern-evaluation.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-waves.md` |

### `src/ui/idleVillage/components/destinyAstrolabe/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `destiny-astrolabe` | 2 | 6 | `missionPlannerDraft.test.tsx` `missionPlannerEngine.test.ts` `missionPlannerMath.test.ts` `missionPlannerPanel.test.tsx` `missionResolver.test.ts` `questMilestones.test.ts` +1 | — | `ONBOARDING.md` `RICHIESTE.md` `MASTER_PLAN.md` `COMPONENT_MASTER_INDEX.md` `gameplay_system_complete.md` `skill_check_workflow_spec.md` +4 | `destiny-astrolabe.md` |
| `skill-check-legend` | 2 | 1 | — | — | `RICHIESTE.md` `MASTER_PLAN.md` `COMPONENT_MASTER_INDEX.md` `trailer_vertical_slice_plan.md` `trailer_vertical_slice_tasks.md` | `skill-check-legend.md` |

### `src/ui/idleVillage/components/destinyAstrolabeV62/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `destiny-astrolabe-v62` | 2 | 9 | `tarGoo.test.ts` `ballGuidance.test.ts` `v63-pour.test.ts` `tarGoo.test.ts` `ballGuidance.test.ts` `questCheckOptions.test.tsx` +1 | `gameQuestLifecycle.spec.ts` `ballGuidance.test.ts` `questRewardPopup.test.tsx` `questRunWindow.test.tsx` `questSettlement.test.ts` | `SESSION_HANDOFF.md` `PLAN-019-S1-quest-interessante.md` `PLAN-021-quest-theatre.md` `PLAN-023-quest-s1-lab-ui-redesign.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-043-game-quest-surface-pass.md` +4 | `CTR-game-009` `destiny-astrolabe-v62.md` |

### `src/ui/idleVillage/components/gameFrame/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `director-panel` | 2 | 1 | — | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `gameQuestLifecycle.spec.ts` `gameQuestReveal.spec.ts` | `RICHIESTE.md` `SESSION_HANDOFF.md` `INDEX.md` `PLAN-034-trailer-audit-fixes.md` `PLAN-037-quest-poi-auto-reveal-goblin-repeatable.md` `COMPONENT_MASTER_INDEX.md` | `director-panel.md` |
| `engraved-icons` | 2 | 1 | `hudGuards.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +54 | `gameGeometryT01.spec.ts` | `PLAN-036-quest-planner-redesign.md` `PLAN-043-S5-slot-incastonatura.md` `PLAN-065-quest-run-window-r231-deep.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `engraved-icons.md` |
| `game-boot-screen` | 2 | 1 | `gameBootPerf.test.tsx` `gameBootPerf.test.tsx` | `gameGeometryT01.spec.ts` `gamePerf.spec.ts` `gameQuestDragFeedback.spec.ts` `gameVillageView.spec.ts` `questJourneyRoute.spec.ts` `r223QuestUiRegressions.spec.ts` | `CURRENT_STATE.md` `RICHIESTE.md` `PLAN-031-game-boot-preload-perf.md` `PLAN-036-quest-planner-redesign.md` `COMPONENT_MASTER_INDEX.md` | `game-boot-screen.md` |
| `game-frame-game-frame` | 1 | 2 | `gameHudIdle.test.tsx` `gameHudIdle.test.tsx` | — | `CURRENT_STATE.md` `RICHIESTE.md` `request-triage-2026-10-12.md` `PLAN-033-game-event-shroud-goblin-march.md` `PLAN-035-village-view-buildings.md` `hud_component_guide.md` +3 | `CTR-game-003` `CTR-game-005` `game-frame-game-frame.md` |
| `hero-sheet-panel` | 2 | 1 | `heroSheet.test.tsx` | `gameQuestPlannerLayout.spec.ts` `heroSheetPlacement.test.ts` `stageZonesSolver.test.ts` | `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-032-SP-1-hero-sheet.md` `PLAN-032-teaser-game-components.md` `PLAN-043-game-quest-surface-pass.md` `COMPONENT_MASTER_INDEX.md` | `CTR-game-006` `hero-sheet-panel.md` |
| `hud-event-ledger` | 1 | 1 | `HudEventLedger.test.tsx` `HudEventLedger.test.tsx` | — | `RICHIESTE.md` `GAME_INVASION_SEQUENCE.md` `PLAN-033-game-event-shroud-goblin-march.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `CTR-game-004` `hud-event-ledger.md` |
| `hud-game-menu` | 2 | 1 | `hudGameMenu.test.tsx` `hudGameMenu.test.tsx` | — | `RICHIESTE.md` `recurring-traps.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `hud-game-menu.md` |
| `hud-hide-toggle` | 1 | 1 | `gameHudIdle.test.tsx` `tier1ContractCoverage.test.tsx` | `gameGeometryT01.spec.ts` | `CURRENT_STATE.md` `RICHIESTE.md` `PLAN-031-game-boot-preload-perf.md` `PLAN-035-village-view-buildings.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `CTR-game-003` `hud-hide-toggle.md` |
| `hud-icons` | 2 | 1 | `HudEventLedger.test.tsx` `ResourceOutlook.test.tsx` `combatStrip.test.tsx` `gameBootPerf.test.tsx` `gameHudIdle.test.tsx` `heroSheet.test.tsx` +14 | `gameGeometryT01.spec.ts` | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` `art_direction_plan.md` | `hud-icons.md` |
| `hud-panels-menu` | 2 | 1 | — | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `hud-panels-menu.md` |
| `hud-recenter-button` | 2 | 1 | — | — | `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `hud-recenter-button.md` |
| `hud-ribbon` | 2 | 1 | `gameHudIdle.test.tsx` | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `e2e_game_quest_lifecycle_guide.md` | `hud-ribbon.md` |
| `hud-scale` | 1 | 1 | `hudScale.test.ts` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +31 | `gameGeometryT01.spec.ts` | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `hud-scale.md` |
| `map-building-poi` | 2 | 1 | `villageStash.test.tsx` `villageStash.test.tsx` | — | `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-032-SP-2-village-stash.md` `PLAN-032-SP-3-merchant-panel.md` `PLAN-032-teaser-game-components.md` `COMPONENT_MASTER_INDEX.md` | `map-building-poi.md` |
| `map-demo-poi` | 2 | 1 | — | — | `RICHIESTE.md` `PLAN-032-SP-2-village-stash.md` `PLAN-032-teaser-game-components.md` `COMPONENT_MASTER_INDEX.md` `poi_family_spec.md` `PLAN-058_hud_roster_unification.md` | `map-demo-poi.md` |
| `map-quest-poi` | 2 | 1 | `mapQuestPoi.test.ts` `questJourneyCharacterization.test.ts` `mapQuestPoi.test.ts` `questJourneyCharacterization.test.ts` `villageStash.test.tsx` | `gameQuestExpedition.spec.ts` `gameQuestLifecycle.spec.ts` `mapQuestPoi.test.ts` `poiSigillo.test.tsx` `gameQuestExpedition.spec.ts` `gameQuestReveal.spec.ts` | `RICHIESTE.md` `DECISION_LOG.md` `PLAN-019-S2-quest-vera.md` `PLAN-019-S2.4-planning-lancio.md` `PLAN-031-game-boot-preload-perf.md` `PLAN-032-SP-2-village-stash.md` +10 | `CTR-game-008` `map-quest-poi.md` |
| `merchant-offer-icons` | 2 | 1 | `merchantPanel.test.tsx` `merchantPanel.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `merchant-offer-icons.md` |
| `merchant-panel` | 2 | 1 | `merchantPanel.test.tsx` `merchantPanel.test.tsx` | — | `CURRENT_STATE.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-032-SP-3-merchant-panel.md` `PLAN-032-teaser-game-components.md` `PLAN-035-village-view-buildings.md` +1 | `merchant-panel.md` |
| `mock-buy-control` | 2 | 1 | `merchantPanel.test.tsx` | — | `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-032-SP-3-merchant-panel.md` `PLAN-035-village-view-buildings.md` `COMPONENT_MASTER_INDEX.md` | `mock-buy-control.md` |
| `mock-upgrade-control` | 2 | 1 | `villageBuildings.test.tsx` `villageBuildings.test.tsx` | — | `CURRENT_STATE.md` `RICHIESTE.md` `PLAN-035-village-view-buildings.md` `PLAN-042-village-registry.md` `COMPONENT_MASTER_INDEX.md` | `mock-upgrade-control.md` |
| `objective-cartouche` | 2 | 1 | — | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `objective-cartouche.md` |
| `quest-belt-plaque` | 2 | 1 | `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questRunWindow.test.tsx` | `gameQuestCluster.spec.ts` | `CURRENT_STATE.md` `SESSION_HANDOFF.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-043-S9-famiglia-quest-redesign.md` `COMPONENT_MASTER_INDEX.md` | `quest-belt-plaque.md` |
| `quest-check-options-panel` | 2 | 1 | `questCheckOptions.test.tsx` `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questRunWindow.test.tsx` | — | `CURRENT_STATE.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `COMPONENT_MASTER_INDEX.md` `quest_ui_component_guide.md` | `quest-check-options-panel.md` |
| `quest-epilogue` | 2 | 1 | `questRewardPopup.test.tsx` | `gameQuestFullFlow.spec.ts` `gameQuestLifecycle.spec.ts` | `CURRENT_STATE.md` `PLAN-019-S4-integrazione.md` `PLAN-032-SP-4-bag-strip.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `COMPONENT_MASTER_INDEX.md` `quest_ui_component_guide.md` | `quest-epilogue.md` |
| `quest-journey-route` | 2 | 2 | `questJourneyRoute.test.tsx` `questJourneyRoute.test.tsx` | `questJourneyRoute.spec.ts` `questJourneyRoute.spec.ts` | `RICHIESTE.md` `PLAN-053-quest-journey-legs.md` `COMPONENT_MASTER_INDEX.md` | `quest-journey-route.md` |
| `quest-log-panel` | 2 | 1 | `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questRunWindow.test.tsx` | — | `CURRENT_STATE.md` `SESSION_HANDOFF.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-043-S9-famiglia-quest-redesign.md` `COMPONENT_MASTER_INDEX.md` | `quest-log-panel.md` |
| `quest-outcome-toast` | 2 | 1 | `questOutcomeToast.test.tsx` `questRunWindow.test.tsx` `questCheckOptions.test.tsx` `questOutcomeToast.test.tsx` `questRunWindow.test.tsx` | — | `DECISION_LOG.md` `INDEX.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-043-S9-famiglia-quest-redesign.md` `PLAN-043-game-quest-surface-pass.md` `COMPONENT_MASTER_INDEX.md` | `quest-outcome-toast.md` |
| `quest-overlays` | 2 | 1 | `questCheckOptions.test.tsx` `questCheckOptions.test.tsx` | — | `PLAN-040-quest-window-skillcheck-outcomes.md` `COMPONENT_MASTER_INDEX.md` | `quest-overlays.md` |
| `quest-party-roster-panel` | 2 | 1 | `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questRunWindow.test.tsx` | `gameQuestLifecycle.spec.ts` `ballGuidance.test.ts` `questRewardPopup.test.tsx` `questRunWindow.test.tsx` `questSettlement.test.ts` `gameQuestExpedition.spec.ts` | `CURRENT_STATE.md` `SESSION_HANDOFF.md` `PLAN-043-S9-famiglia-quest-redesign.md` `COMPONENT_MASTER_INDEX.md` | `CTR-game-009` `quest-party-roster-panel.md` |
| `quest-reward-popup` | 2 | 2 | `questRewardPopup.test.tsx` `questEpilogue.test.ts` `residentXpAndSwap.test.ts` `QuestRewardPanel.test.tsx` `questRewardPopup.test.tsx` `questEpilogue.test.ts` +1 | `gameQuestLifecycle.spec.ts` `ballGuidance.test.ts` `questRewardPopup.test.tsx` `questRunWindow.test.tsx` `questSettlement.test.ts` `gameQuestFullFlow.spec.ts` +2 | `CURRENT_STATE.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-037-quest-poi-auto-reveal-goblin-repeatable.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-043-S9-famiglia-quest-redesign.md` +7 | `CTR-game-009` `quest-reward-popup.md` |
| `quest-run-window` | 2 | 8 | `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `atmosphereLayer.test.tsx` `cameraEval.test.ts` `edgeSafety.test.ts` +17 | `gameQuestInputCoordination.spec.ts` `gameQuestLifecycle.spec.ts` `gameQuestPlannerLayout.spec.ts` `questCinematicsShowcase.spec.ts` `ballGuidance.test.ts` `heroSheetPlacement.test.ts` +14 | `CURRENT_STATE.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `DECISION_LOG.md` `INDEX.md` `SYNTHESIS.md` +37 | `CTR-game-006` `CTR-game-009` `CTR-game-010` `quest-run-window.md` |
| `quest-skill-check-column` | 2 | 1 | — | `_probe.spec.ts` `gameQuestCluster.spec.ts` `gameQuestInputCoordination.spec.ts` | `RICHIESTE.md` `PLAN-043-S9-famiglia-quest-redesign.md` `COMPONENT_MASTER_INDEX.md` | `quest-skill-check-column.md` |
| `quest-skill-check-overlay` | 2 | 1 | `questCheckOptions.test.tsx` | `gameQuestCluster.spec.ts` `gameQuestInputCoordination.spec.ts` `gameQuestLifecycle.spec.ts` | `INDEX.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `COMPONENT_MASTER_INDEX.md` | `quest-skill-check-overlay.md` |
| `quest-stage-cluster` | 2 | 1 | — | `gameQuestPlannerLayout.spec.ts` `heroSheetPlacement.test.ts` `stageZonesSolver.test.ts` `_probe.spec.ts` `gameQuestCluster.spec.ts` | `RICHIESTE.md` `DECISION_LOG.md` `PLAN-043-S9-famiglia-quest-redesign.md` `PLAN-043-WS2-three-zone-stage.md` `COMPONENT_MASTER_INDEX.md` | `CTR-game-006` `quest-stage-cluster.md` |
| `region-tooltip` | 2 | 1 | — | — | `RICHIESTE.md` `PLAN-033-game-event-shroud-goblin-march.md` `COMPONENT_MASTER_INDEX.md` | `region-tooltip.md` |
| `resource-readout` | 2 | 1 | `ResourceOutlook.test.tsx` `ResourceOutlook.test.tsx` | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` `e2e_game_quest_lifecycle_guide.md` | `resource-readout.md` |
| `resource-readout-items` | 2 | 1 | — | — | `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `resource-readout-items.md` |
| `tuning-panel` | 2 | 1 | — | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `tuning-panel.md` |
| `use-hero-sheet` | 2 | 2 | `heroSheet.test.tsx` `heroSheetPlacement.test.ts` `map-page.spec.ts` `heroSheet.test.tsx` `heroSheetPlacement.test.ts` `villageSandbox-roster.spec.ts` | `gameGeometryT01.spec.ts` `gameQuestDragFeedback.spec.ts` `gameQuestExpedition.spec.ts` `gameQuestLifecycle.spec.ts` `gameQuestPlannerLayout.spec.ts` `poiQuestDetailRosterTimeClock.spec.ts` +1 | `PLAN-032-SP-1-hero-sheet.md` `PLAN-035-village-view-buildings.md` `COMPONENT_MASTER_INDEX.md` | `use-hero-sheet.md` |
| `village-building-icons` | 2 | 1 | `villageBuildings.test.tsx` `villageBuildings.test.tsx` | — | `PLAN-035-village-view-buildings.md` `PLAN-038-village-lots-pin-language.md` `PLAN-042-village-registry.md` `COMPONENT_MASTER_INDEX.md` | `village-building-icons.md` |
| `village-registry` | 2 | 1 | `villageBuildings.test.tsx` | `gameVillageView.spec.ts` | `CURRENT_STATE.md` `PLAN-042-village-registry.md` `COMPONENT_MASTER_INDEX.md` | `village-registry.md` |
| `village-screen-view` | 2 | 1 | `villageBuildings.test.tsx` `villageBuildings.test.tsx` | `gameGeometryT01.spec.ts` `gameVillageView.spec.ts` | `CURRENT_STATE.md` `RICHIESTE.md` `PLAN-035-village-view-buildings.md` `PLAN-038-village-lots-pin-language.md` `PLAN-042-village-registry.md` `COMPONENT_MASTER_INDEX.md` +1 | `village-screen-view.md` |
| `village-slot-overlay` | 2 | 1 | `villageBuildings.test.tsx` | `gameVillageView.spec.ts` | `CURRENT_STATE.md` `RICHIESTE.md` `INDEX.md` `PLAN-038-village-lots-pin-language.md` `PLAN-042-village-registry.md` `COMPONENT_MASTER_INDEX.md` | `village-slot-overlay.md` |
| `village-stash-item-icons` | 2 | 1 | `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questExpeditionBag.test.tsx` `questRunWindow.test.tsx` `villageStash.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `village-stash-item-icons.md` |
| `village-stash-panel` | 2 | 1 | `villageStash.test.tsx` `villageStash.test.tsx` | — | `CURRENT_STATE.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-029-SP-7-test-hardening.md` `PLAN-032-SP-2-village-stash.md` `PLAN-032-teaser-game-components.md` +3 | `village-stash-panel.md` |
| `when-where-cluster` | 2 | 1 | — | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `when-where-cluster.md` |

### `src/ui/idleVillage/components/gameFrame/stageZones/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `use-game-stage-zones` | 2 | 2 | `questShellLayout.test.ts` `stageStripsLayer.test.tsx` `stageZonesSolver.test.ts` `rosterKit.compact.test.tsx` `questShellLayout.test.ts` `stageStripsLayer.test.tsx` +1 | `gameQuestPlannerLayout.spec.ts` `heroSheetPlacement.test.ts` `stageZonesSolver.test.ts` `gameQuestFullFlow.spec.ts` `testRosterPgCards.spec.ts` | `COMPONENT_MASTER_INDEX.md` | `CTR-game-006` `use-game-stage-zones.md` |

### `src/ui/idleVillage/components/minimal/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `activity-poi` | 2 | 2 | `designSystemPage.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` | — | `HANDOFF.md` `COMPONENT_MASTER_INDEX.md` `gameplay_components_inventory.md` `trailer_threat_iter_rework_plan.md` | `activity-poi.md` |
| `clock-widget` | 2 | 1 | `TimeEngineStrip.skin.test.tsx` `designSystemPage.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `RackScenarioPanel.test.tsx` `TimeEngineStrip.skin.test.tsx` `TestRosterPage.drop-state-realistic.test.tsx` +4 | — | `HANDOFF.md` `REAL_COMPONENTS_ONLY.md` `VERTICAL_SLICE_REFERENCE.md` `CAPSULE_TEST_INTEGRATION.md` `SLOTTED_MEDAL_IMPLEMENTATION_PLAN.md` `AUDIT_MINIMALGAMEPLAYPAGE.md` +6 | `clock-widget.md` |
| `day-night-poi` | 2 | 1 | `DayNightPOI.test.tsx` `designSystemPage.test.tsx` `DayNightPOI.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` | — | `KNOWLEDGE_INVENTORY.md` `RICHIESTE.md` `VERTICAL_SLICE_PROGRESS.md` `AUDIT_MINIMALGAMEPLAYPAGE.md` `COMPONENT_MASTER_INDEX.md` `day_night_poi_spec.md` +15 | `day-night-poi.md` |
| `day-night-poi-skin` | 2 | 1 | `DayNightPOI.test.tsx` `designSystemPage.test.tsx` `DayNightPOI.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `RackScenarioPanel.test.tsx` `TestRosterPage.drop-state-realistic.test.tsx` +4 | — | `HANDOFF.md` `RICHIESTE.md` `DECISION_LOG.md` `recurring-traps.md` `COMPONENT_MASTER_INDEX.md` `day_night_poi_spec.md` +7 | `day-night-poi-skin.md` |
| `day-night-time-engine-strip` | 2 | 1 | `designSystemPage.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `RackScenarioPanel.test.tsx` `TestRosterPage.drop-state-realistic.test.tsx` `TestRosterPage.drop-state-validation.test.tsx` `TestRosterPage.fixes.test.tsx` +2 | — | `KNOWLEDGE_INVENTORY.md` `RICHIESTE.md` `DECISION_LOG.md` `PLAN-006-docs-and-code-alignment.md` `COMPONENT_MASTER_INDEX.md` `time_engine_day_night_poi_interaction_spec.md` +2 | `day-night-time-engine-strip.md` |
| `generic-poi-skin` | 2 | 3 | `designSystemPage.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `RackScenarioPanel.test.tsx` `WLSTY011ActivityCapsuleDetail.test.tsx` `poiMatericSkinConfig.test.ts` `TestRosterPage.drop-state-realistic.test.tsx` +4 | — | `HANDOFF.md` `RICHIESTE.md` `DECISION_LOG.md` `recurring-traps.md` `MASTER_PLAN.md` `COMPONENT_MASTER_INDEX.md` +8 | `generic-poi-skin.md` |
| `job-poi` | 2 | 2 | `designSystemPage.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` | — | `HANDOFF.md` `COMPONENT_MASTER_INDEX.md` | `job-poi.md` |
| `poi-particles` | 2 | 1 | `designSystemPage.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `RackScenarioPanel.test.tsx` `WLSTY011ActivityCapsuleDetail.test.tsx` `poiMatericSkinConfig.test.ts` `TestRosterPage.drop-state-realistic.test.tsx` +4 | — | `HANDOFF.md` `COMPONENT_MASTER_INDEX.md` | `poi-particles.md` |
| `quest-poi` | 2 | 2 | `designSystemPage.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` | `gameQuestExpedition.spec.ts` `gameQuestLifecycle.spec.ts` `mapQuestPoi.test.ts` `poiSigillo.test.tsx` `poiQuestDetailRosterTimeClock.spec.ts` | `HANDOFF.md` `RICHIESTE.md` `MASTER_PLAN.md` `COMPONENT_MASTER_INDEX.md` `detail_spec.md` `gameplay_components_inventory.md` +14 | `CTR-game-008` `quest-poi.md` |
| `time-engine-strip` | 2 | 3 | `TimeEngineStrip.skin.test.tsx` `VillageSandbox.isolation.test.tsx` `designSystemPage.test.tsx` `ActionCardWrappers.test.tsx` `DayNightActionCard.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` +9 | `gameQuestExpedition.spec.ts` `gameQuestLifecycle.spec.ts` `mapQuestPoi.test.ts` `poiSigillo.test.tsx` `clockKitSpaceControl.spec.ts` `day-night-space-pause.e2e.spec.ts` +2 | `HANDOFF.md` `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md` `RICHIESTE.md` `VERTICAL_SLICE_TEMPORAL_SKINS_PLAN.md` `CAPSULE_TEST_INTEGRATION.md` `COMPONENT_SKIN_INTEGRATION_GUIDE.md` +12 | `CTR-game-008` `time-engine-strip.md` |

### `src/ui/idleVillage/components/poi/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `poi-marker` | 2 | 1 | `poiSigillo.test.tsx` `poiAudit.test.tsx` `mapQuestPoi.test.ts` `poiSigillo.test.tsx` `questAvailability.test.ts` `questJourneyCharacterization.test.ts` +1 | `gameQuestExpedition.spec.ts` `gameQuestLifecycle.spec.ts` `mapQuestPoi.test.ts` `poiSigillo.test.tsx` | `COMPONENT_MASTER_INDEX.md` `trailer_threat_iter_rework_plan.md` | `CTR-game-008` `poi-marker.md` |
| `poi-materic-v3-5` | 2 | 1 | `poiSigillo.test.tsx` `mapQuestPoi.test.ts` `poiSigillo.test.tsx` `questJourneyCharacterization.test.ts` `villageStash.test.tsx` | — | `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-012-event-reminder-aaa-v2.md` `PLAN-032-SP-2-village-stash.md` `PLAN-032-SP-3-merchant-panel.md` `PLAN-034-trailer-audit-fixes.md` +5 | `poi-materic-v3-5.md` |

### `src/ui/idleVillage/config/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `activity-log-panel-config` | 1 | 1 | `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` `QuestDecisionFeed.rtl.test.tsx` `QuestTelemetryHeatmap.rtl.test.tsx` +270 | `skin-binding.spec.ts` `styleLabDemoPresetSwitch.spec.ts` | `COMPONENT_MASTER_INDEX.md` | `activity-log-panel-config.md` |
| `drag-config` | 1 | 1 | `magneticCollision.test.ts` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` +53 | — | `COMPONENT_MASTER_INDEX.md` `card_system_description.md` `roster_slot_interaction_documentation.md` `pgcard_trusted.md` | `drag-config.md` |
| `drag-preview-instrumentation-config` | 1 | 1 | `idleVillageDragInstrumentation.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +33 | — | `idle-village-context.md` `COMPONENT_MASTER_INDEX.md` `idle_village_plan.md` | `drag-preview-instrumentation-config.md` |
| `drop-feedback-config` | 1 | 1 | `useDropFeedback.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +47 | — | `idle-village-context-optimized.md` `idle-village-context.md` `idle_village_activity_slots.md` `COMPONENT_MASTER_INDEX.md` `idle_village_plan.md` `idle_village_scenario_planner_phase_e.md` +2 | `drop-feedback-config.md` |
| `minimal-feedback-config` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +35 | — | `COMPONENT_MASTER_INDEX.md` `card_system_description.md` | `minimal-feedback-config.md` |
| `resident-drop-rules` | 1 | 1 | `activitySlotTelemetry.test.tsx` `dragDropStressTest.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` +42 | — | `idle-village-context.md` `COMPONENT_MASTER_INDEX.md` `idle_village_plan.md` `idle_village_scenario_planner_phase_e.md` `materic_roster_vertical_slice_plan.md` | `resident-drop-rules.md` |
| `roster-filter-config` | 1 | 1 | `RosterStatFilter.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +27 | — | `COMPONENT_MASTER_INDEX.md` `materic_roster_vertical_slice_plan.md` | `roster-filter-config.md` |
| `roster-sort-config` | 1 | 1 | `DragRosterSlotRack.test.ts` `Roster.unit.test.ts` `rosterSortConfig.test.ts` `rosterSortIcon.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` +33 | — | `COMPONENT_MASTER_INDEX.md` `materic_roster_vertical_slice_plan.md` | `roster-sort-config.md` |

### `src/ui/idleVillage/drag/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `resolve-slot-requirements` | 1 | 1 | `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` `idle-village-drag.spec.ts` +133 | — | `COMPONENT_MASTER_INDEX.md` | `resolve-slot-requirements.md` |

### `src/ui/idleVillage/frozen/_infra/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `kit-shell` | 2 | 1 | `KitShell.test.tsx` `designSystemPage.test.tsx` `KitShell.test.tsx` `rosterKit.compact.test.tsx` `rosterKit.dom.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` +11 | — | `COMPONENT_MASTER_INDEX.md` `systems_governance_alignment_plan.md` | `kit-shell.md` |

### `src/ui/idleVillage/frozen/kits/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `roster-kit` | 2 | 2 | `rosterKit.compact.test.tsx` `rosterKit.dom.test.tsx` `minimal-vs-test.spec.ts` `map-page.spec.ts` `componentCatalog.test.ts` `designSystemPage.test.tsx` +11 | `drag-drop-functionality-test.spec.ts` `minimal-job-poi-roster-integration.spec.ts` `minimal-job-poi-roster-time-integration.spec.ts` `testRosterPgCards.spec.ts` | `WAVE_0_SUMMARY.md` `COMPONENT_MASTER_INDEX.md` `component_freezing_certification_plan.md` | `roster-kit.md` |
| `world-surface-kit` | 2 | 1 | `gameBootPerf.test.tsx` | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `world-surface-kit.md` |

### `src/ui/idleVillage/hooks/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `use-activity-scheduler` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `useActiveHUDTelemetry.test.tsx` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` +144 | — | `POSTMORTEM_ARCHIVED.md` `COMPONENT_MASTER_INDEX.md` | `use-activity-scheduler.md` |
| `use-drag-preview-instrumentation` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +31 | — | `POSTMORTEM_ARCHIVED.md` `COMPONENT_MASTER_INDEX.md` `roster_slot_interaction_documentation.md` | `use-drag-preview-instrumentation.md` |
| `use-sandbox-timing-bridge` | 2 | 2 | `VillageSandbox.isolation.test.tsx` `designSystemPage.test.tsx` `KitShell.test.tsx` `rosterKit.compact.test.tsx` `rosterKit.dom.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` +11 | — | `POSTMORTEM_ARCHIVED.md` `COMPONENT_MASTER_INDEX.md` | `use-sandbox-timing-bridge.md` |
| `use-sensory-audio` | 1 | 1 | `PgCard.interactions.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +36 | — | `COMPONENT_MASTER_INDEX.md` | `use-sensory-audio.md` |
| `use-skin-binding` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +31 | — | `COMPONENT_MASTER_INDEX.md` | `use-skin-binding.md` |
| `use-skin-preferences` | 1 | 1 | `DayNightPOI.test.tsx` `ResidentSlotRack.skin.integration.test.tsx` `useSkinPreferences.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` +43 | — | `COMPONENT_MASTER_INDEX.md` | `use-skin-preferences.md` |
| `use-skin-system` | 1 | 1 | `KitShell.test.tsx` `TS002SkinSlot.test.tsx` `TS003SkinReplacementAPI.test.ts` `useSkinSystem.test.ts` `SkinTestHarness.test.tsx` `VillageSandbox.isolation.test.tsx` +47 | — | `COMPONENT_MASTER_INDEX.md` | `use-skin-system.md` |

### `src/ui/idleVillage/icons/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `stat-icons` | 2 | 1 | `PgDetailCard.test.tsx` `heroSheet.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `stat-icons.md` |

### `src/ui/idleVillage/intent/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `game-intent` | 1 | 1 | `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` `roster-slotRack.spec.ts` +81 | — | `COMPONENT_MASTER_INDEX.md` | `game-intent.md` |

### `src/ui/idleVillage/interaction/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `bloom-effect` | 1 | 1 | `bloomBrass.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +31 | — | `PLAN-043-S10-oro-e-bloom-hud.md` `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` `poi_family_spec.md` `quest_ui_component_guide.md` | `bloom-effect.md` |
| `drag-outcome-flight` | 2 | 1 | `rosterKit.compact.test.tsx` `rosterKit.dom.test.tsx` `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questRunWindow.test.tsx` | — | `PLAN-043-S5-slot-incastonatura.md` `COMPONENT_MASTER_INDEX.md` `gameplay_components_inventory.md` `gameplay_system_complete.md` `interaction_core_spec.md` `poi_family_spec.md` +3 | `drag-outcome-flight.md` |

### `src/ui/idleVillage/legacy/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `verb-card` | 2 | 1 | `ActivityArea.rtl.test.tsx` `ActivityArea.rtl.test.tsx` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` +135 | — | `RPG_PROJECT_CONTEXT.md` `COMPONENT_MASTER_INDEX.md` `card_system_description.md` `idle_village_ftue_plan.md` `idle_village_resident_slot_plan.md` `idle_village_tasks.md` +4 | `verb-card.md` |

### `src/ui/idleVillage/map/actionCards/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `action-card` | 2 | 2 | `VillageSandbox.isolation.test.tsx` `designSystemPage.test.tsx` `ActionCardWrappers.test.tsx` `DayNightActionCard.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `QuestCard.test.tsx` +8 | — | `CURRENT_STATE.md` `DEVELOPMENT_GUIDELINES.md` `GAMEPLAY_DESIGN.md` `GLOSSARY.md` `KNOWLEDGE_INVENTORY.md` `RICHIESTE.md` +18 | `action-card.md` |

### `src/ui/idleVillage/map/validators/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `location-drop-validators` | 1 | 1 | `LocationDeck.test.tsx` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` `VillageSandbox.isolation.test.tsx` +134 | — | `idle_village_action_cards.md` `COMPONENT_MASTER_INDEX.md` `drag_diagnostics_cli.md` `gameplay_components_inventory.md` | `location-drop-validators.md` |

### `src/ui/idleVillage/pixiSpike/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `pixi-world-map` | 1 | 9 | `WorldSurfaceLayerOrder.test.tsx` `WorldSurfaceRenderer.test.tsx` `regionOutline.test.ts` `useWorldSurface.test.ts` `validateWorldSurfaceAssets.test.ts` `worldSurfaceRendererStrategy.test.ts` +5 | `gameBootHealth.spec.ts` `questJourneyRoute.spec.ts` `gameGeometryT01.spec.ts` `gameQuestFullFlow.spec.ts` `gameQuestLifecycle.spec.ts` `gameQuestReveal.spec.ts` +1 | `CURRENT_STATE.md` `RICHIESTE.md` `recurring-traps.md` `PLAN-013-sea-marks.md` `PLAN-031-game-boot-preload-perf.md` `PLAN-032-teaser-game-components.md` +8 | `CTR-game-001` `CTR-game-005` `pixi-world-map.md` |

### `src/ui/idleVillage/questS1Lab/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `beat-sequencer` | 1 | 1 | `cinemaFx.test.tsx` `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questRunWindow.test.tsx` `beatSequencer.test.ts` +21 | — | `PLAN-025-quest-theatre-convergence-cinema.md` `COMPONENT_MASTER_INDEX.md` `quest_theatre_spec.md` `quest_ui_component_guide.md` | `beat-sequencer.md` |
| `quest-lab-presets` | 1 | 1 | `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questJourneyCharacterization.test.ts` `questOutcomeToast.test.tsx` `questPartyReal.test.ts` +98 | — | `PLAN-019-S2.1-scenario-canonico.md` `COMPONENT_MASTER_INDEX.md` | `quest-lab-presets.md` |
| `quest-run` | 1 | 1 | `cinemaFx.test.tsx` `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questJourneyCharacterization.test.ts` `questOffer.test.ts` +123 | `gameQuestLifecycle.spec.ts` `ballGuidance.test.ts` `questRewardPopup.test.tsx` `questRunWindow.test.tsx` `questSettlement.test.ts` | `CURRENT_STATE.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `DECISION_LOG.md` `QUEST_GENERATION_CONTRACTS.md` `QUEST_GOBLIN_REWORK_PROPOSAL.md` +25 | `CTR-game-009` `quest-run.md` |
| `quest-scenario` | 1 | 1 | `questOffer.test.ts` `questPartyCalibration.test.ts` `questPartyReal.test.ts` `questCertainty.test.ts` `questOutcomeSpec.test.ts` `questSimulation.test.ts` +103 | — | `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-019-S1-quest-interessante.md` `PLAN-036-quest-planner-redesign.md` `PLAN-053-quest-journey-legs.md` `COMPONENT_MASTER_INDEX.md` | `quest-scenario.md` |

### `src/ui/idleVillage/questS1Lab/hud/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `action-zone` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `RICHIESTE.md` `PLAN-024-quest-s1-lab-hud-restyle.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `action-zone.md` |
| `astro-overlay` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `astro-overlay.md` |
| `atoms` | 2 | 1 | `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `questExpeditionBag.test.tsx` `questOutcomeToast.test.tsx` `questRewardPopup.test.tsx` +2 | — | `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `atoms.md` |
| `chronicle-drawer` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `PLAN-021-quest-theatre.md` `PLAN-024-quest-s1-lab-hud-restyle.md` `PLAN-025-quest-theatre-convergence-cinema.md` `COMPONENT_MASTER_INDEX.md` | `chronicle-drawer.md` |
| `consumable-belt` | 2 | 1 | `pageCrash.repro.test.tsx` | `gameQuestFullFlow.spec.ts` | `RICHIESTE.md` `SESSION_HANDOFF.md` `PLAN-025-quest-theatre-convergence-cinema.md` `PLAN-032-SP-4-bag-strip.md` `PLAN-032-teaser-game-components.md` `COMPONENT_MASTER_INDEX.md` | `consumable-belt.md` |
| `context-strip` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `PLAN-024-quest-s1-lab-hud-restyle.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `context-strip.md` |
| `damage-channel` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `PLAN-025-quest-theatre-convergence-cinema.md` `COMPONENT_MASTER_INDEX.md` | `damage-channel.md` |
| `preset-screen` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `COMPONENT_MASTER_INDEX.md` | `preset-screen.md` |
| `quest-select-screen` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `RICHIESTE.md` `scene_prompt_authoring_guide.md` `COMPONENT_MASTER_INDEX.md` | `quest-select-screen.md` |
| `stage-band` | 2 | 1 | `pageCrash.repro.test.tsx` | `gameQuestPlannerLayout.spec.ts` `heroSheetPlacement.test.ts` `stageZonesSolver.test.ts` | `RICHIESTE.md` `PLAN-046-quest-cinematics-depth-parallax.md` `PLAN-050-cinematic-showcase-juice.md` `scene_prompt_authoring_guide.md` `COMPONENT_MASTER_INDEX.md` | `CTR-game-006` `stage-band.md` |
| `stash-picker` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `RICHIESTE.md` `PLAN-024-quest-s1-lab-hud-restyle.md` `PLAN-032-teaser-game-components.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `stash-picker.md` |
| `transit-view` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `RICHIESTE.md` `PLAN-025-quest-theatre-convergence-cinema.md` `scene_prompt_authoring_guide.md` `COMPONENT_MASTER_INDEX.md` | `transit-view.md` |
| `verdict-card` | 2 | 1 | `pageCrash.repro.test.tsx` | — | `PLAN-024-quest-s1-lab-hud-restyle.md` `PLAN-025-quest-theatre-convergence-cinema.md` `COMPONENT_MASTER_INDEX.md` | `verdict-card.md` |

### `src/ui/idleVillage/questS1Lab/render/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `ambient-layer` | 2 | 1 | `runtimeInvariants.test.tsx` `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `runtimeInvariants.test.tsx` `questRunWindow.test.tsx` | `questCinematicsShowcase.spec.ts` | `RICHIESTE.md` `PLAN-050-cinematic-showcase-juice.md` `COMPONENT_MASTER_INDEX.md` | `ambient-layer.md` |
| `atmosphere-layer` | 2 | 1 | `atmosphereLayer.test.tsx` `combatStrip.test.tsx` `questBag.test.tsx` `questCheckOptions.test.tsx` `atmosphereLayer.test.tsx` `runtimeInvariants.test.tsx` +1 | — | `RICHIESTE.md` `INDEX.md` `PLAN-046-quest-cinematics-depth-parallax.md` `PLAN-049-plan-queue.md` `PLAN-050-cinematic-showcase-juice.md` `COMPONENT_MASTER_INDEX.md` | `atmosphere-layer.md` |
| `depth-scene` | 2 | 3 | `atmosphereLayer.test.tsx` `depthShader.test.ts` `edgeSafety.test.ts` `runtimeInvariants.test.tsx` `sceneManifest.test.ts` `combatStrip.test.tsx` +8 | `gameQuestCluster.spec.ts` | `RICHIESTE.md` `PLAN-046-quest-cinematics-depth-parallax.md` `PLAN-050-cinematic-showcase-juice.md` `PLAN-065-quest-run-window-r231-deep.md` `COMPONENT_MASTER_INDEX.md` | `depth-scene.md` |

### `src/ui/idleVillage/quests/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `quest-expedition-detail` | 2 | 1 | `questExpeditionBag.test.tsx` `map-page.spec.ts` `questExpeditionBag.test.tsx` `villageSandbox-roster.spec.ts` | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `gameQuestLifecycle.spec.ts` `gameQuestPlannerLayout.spec.ts` `DragRosterSlotRack.test.ts` `heroSheetPlacement.test.ts` +14 | `CURRENT_STATE.md` `RICHIESTE.md` `DECISION_LOG.md` `PLAN-019-S2.4-planning-lancio.md` `PLAN-019-S3-parte-precedente.md` `PLAN-019-S4-integrazione.md` +14 | `CTR-game-006` `CTR-game-007` `CTR-game-008` `quest-expedition-detail.md` |
| `quest-journey` | 1 | 1 | `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` `roster-slotRack.spec.ts` +82 | — | `RICHIESTE.md` `PLAN-053-quest-journey-legs.md` `COMPONENT_MASTER_INDEX.md` | `quest-journey.md` |
| `quest-journey-engine` | 1 | 1 | `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` `roster-slotRack.spec.ts` +81 | — | `RICHIESTE.md` `PLAN-053-quest-journey-legs.md` `COMPONENT_MASTER_INDEX.md` | `quest-journey-engine.md` |
| `quest-settlement` | 1 | 1 | `questJourneyCharacterization.test.ts` `questOutcomeToast.test.tsx` `questOverlayIdentity.test.ts` `questSettlement.test.ts` `residentXpAndSwap.test.ts` `residentXpPersistence.test.ts` +88 | `gameQuestLifecycle.spec.ts` `ballGuidance.test.ts` `questRewardPopup.test.tsx` `questRunWindow.test.tsx` `questSettlement.test.ts` | `QUEST_RULES.md` `RICHIESTE.md` `GOOD_QUEST_DEFINITION.md` `PLAN-019-S2.5-settlement-e2e.md` `COMPONENT_MASTER_INDEX.md` `e2e_game_quest_lifecycle_guide.md` | `CTR-game-009` `quest-settlement.md` |
| `use-quest-expedition-session` | 2 | 8 | `questExpeditionBag.test.tsx` `questPartyCalibration.test.ts` `questPartyReal.test.ts` `questCertainty.test.ts` `questEligibility.test.ts` `questExpedition.test.ts` +11 | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `DragRosterSlotRack.test.ts` `questExpeditionBag.test.tsx` | `RICHIESTE.md` `DECISION_LOG.md` `PLAN-019-S2.4-planning-lancio.md` `PLAN-036-quest-planner-redesign.md` `PLAN-054-living-component-contracts.md` `PLAN-065-quest-run-window-r231-deep.md` +2 | `CTR-game-007` `use-quest-expedition-session.md` |
| `use-quest-poi-session` | 2 | 12 | `contract.test.ts` `rosterKit.dom.test.tsx` `ActiveHUD.analytics.test.tsx` `ActiveHUD.skin.test.tsx` `ActiveHUD.test.tsx` `ActiveHUDNotifications.test.tsx` +35 | `minimal-vs-test.spec.ts` `gameQuestExpedition.spec.ts` `gameQuestLifecycle.spec.ts` `mapQuestPoi.test.ts` `poiSigillo.test.tsx` | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` | `CTR-game-008` `use-quest-poi-session.md` |

### `src/ui/idleVillage/roster/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `canonical-roster-bundle` | 1 | 1 | `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` `roster-slotRack.spec.ts` +23 | — | `PLAN-019-S4-integrazione.md` `AUDIT_TESTROSTERPAGE_SUBTREE.md` `COMPONENT_MASTER_INDEX.md` `e2e_game_quest_lifecycle_guide.md` | `canonical-roster-bundle.md` |
| `index` | 1 | 1 | `MinimalDragPage.unit.test.tsx` `ResidentSlotRack.unit.test.tsx` `VillageRosterSection.unit.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` +23 | `roster-slotRack.spec.ts` | `HANDOFF.md` `PLAN-024-quest-s1-lab-hud-restyle.md` `PLAN-035-village-view-buildings.md` `PLAN-038-village-lots-pin-language.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-042-village-registry.md` +27 | `index.md` |

### `src/ui/idleVillage/rosterV2/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `drag-test-container-v2` | 2 | 1 | `rosterV2Controls.test.tsx` `CanonicalStoreVerification.test.tsx` `roster-slotRack.spec.ts` `map-page.spec.ts` `rosterKit.compact.test.tsx` `MinimalDragPage.unit.test.tsx` +3 | `ResidentDragAccessibility.spec.ts` `gameQuestDragFeedback.spec.ts` `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `gameQuestLifecycle.spec.ts` `r223QuestUiRegressions.spec.ts` +1 | `SESSION_HANDOFF.md` `PLAN-032-teaser-game-components.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `drag-test-container-v2.md` |
| `hero-level-decor` | 2 | 1 | `heroLevelUp.test.tsx` `heroLevelUp.test.tsx` `rosterV2Controls.test.tsx` | — | `RICHIESTE.md` `SESSION_HANDOFF.md` `COMPONENT_MASTER_INDEX.md` | `hero-level-decor.md` |
| `materic-roster-component-v2` | 2 | 1 | — | — | `PLAN-043-S8-preview-quest.md` `COMPONENT_MASTER_INDEX.md` `roster_bundle_usage.md` `PLAN-058_hud_roster_unification.md` | `materic-roster-component-v2.md` |
| `resident-roster-panel-v2` | 2 | 1 | `map-page.spec.ts` `villageSandbox-roster.spec.ts` | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `DragRosterSlotRack.test.ts` `questExpeditionBag.test.tsx` `gameGeometryT01.spec.ts` `gameQuestDragFeedback.spec.ts` +5 | `COMPONENT_MASTER_INDEX.md` | `CTR-game-007` `resident-roster-panel-v2.md` |
| `roster-draggable-v2` | 2 | 1 | — | — | `COMPONENT_MASTER_INDEX.md` | `roster-draggable-v2.md` |
| `village-roster-section-v2` | 2 | 1 | `map-page.spec.ts` `rosterKit.dom.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `VillageRosterSection.skin.test.tsx` `VillageRosterSection.unit.test.tsx` `skinVerticalSlice.spec.ts` | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `DragRosterSlotRack.test.ts` `questExpeditionBag.test.tsx` `drag-drop-functionality-test.spec.ts` `minimal-job-poi-roster-integration.spec.ts` +2 | `COMPONENT_MASTER_INDEX.md` | `CTR-game-007` `village-roster-section-v2.md` |
| `wanderlust-roster-card-v2` | 2 | 1 | `rosterV2Controls.test.tsx` | — | `PLAN-024-quest-s1-lab-hud-restyle.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `PLAN-058_hud_roster_unification.md` | `wanderlust-roster-card-v2.md` |

### `src/ui/idleVillage/skins/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `skin-config-registry` | 1 | 1 | `SkinConfigRegistry.test.ts` `useSkinPreferences.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` +63 | — | `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md` `PLAN-054-living-component-contracts.md` `PLAN-MOCKUP-TO-COMPONENT-v1.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `config_driven_architecture_01_component_runtime.md` +3 | `skin-config-registry.md` |
| `skin-css-variables` | 1 | 1 | `hudGuards.test.ts` `poiSigillo.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` +56 | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `poi_family_spec.md` `PLAN-058_hud_roster_unification.md` `rendering_system_implementation_plan.md` | `skin-css-variables.md` |
| `skin-manager` | 1 | 1 | `SkinManager.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +46 | — | `VERTICAL_SLICE_TEMPORAL_SKINS_PLAN.md` `COMPONENT_MASTER_INDEX.md` | `skin-manager.md` |
| `skin-schemas` | 1 | 1 | `SkinConfigRegistry.test.ts` `useSkinPreferences.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` +67 | — | `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md` `COMPONENT_MASTER_INDEX.md` | `skin-schemas.md` |
| `slot-rack-skin-config` | 1 | 1 | `TestRosterPage.integration.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +45 | — | `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md` `PLAN-054-living-component-contracts.md` `idle_village_complete_architecture.md` `COMPONENT_MASTER_INDEX.md` `skin_rendering_fix_plan.md` `visual_design_philosophy.md` | `slot-rack-skin-config.md` |

### `src/ui/idleVillage/skins/activityCapsuleDetail/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `activity-capsule-detail-skin-aware` | 2 | 11 | `TS001SkinSchema.test.ts` `TS002SkinSlot.test.tsx` `TS003SkinReplacementAPI.test.ts` `TS004ComponentIntegration.test.ts` `WLSTY011ActivityCapsuleDetail.test.tsx` `poiAmberSkinConfig.test.tsx` +31 | — | `HANDOFF.md` `RICHIESTE.md` `idle-village-context.md` `PLAN-019-S2-quest-vera.md` `PLAN-019-S2.4-planning-lancio.md` `ACTIVITY_CAPSULE_TESTING_PLAN.md` +12 | `activity-capsule-detail-skin-aware.md` |

### `src/ui/idleVillage/skins/converted/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `slot-wilderness-bronze-config` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +39 | — | `COMPONENT_MASTER_INDEX.md` `skin_rendering_fix_plan.md` | `slot-wilderness-bronze-config.md` |

### `src/ui/idleVillage/skins/primitives/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `cinema-fx` | 2 | 1 | `designSystemPage.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` `QuestRewardPanel.test.tsx` `cinemaFx.test.tsx` `combatStrip.test.tsx` +12 | — | `RICHIESTE.md` `PLAN-025-quest-theatre-convergence-cinema.md` `PLAN-050-cinematic-showcase-juice.md` `PLAN-064-questwindow-idle-animation.md` `PLAN-065-quest-run-window-r231-deep.md` `COMPONENT_MASTER_INDEX.md` +2 | `cinema-fx.md` |
| `hud-band` | 1 | 1 | `designSystemPage.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `QuestRewardPanel.test.tsx` `RackScenarioPanel.test.tsx` +25 | — | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `hud-band.md` |
| `hud-panel` | 2 | 1 | `designSystemPage.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` `QuestRewardPanel.test.tsx` `cinemaFx.test.tsx` `combatStrip.test.tsx` +12 | `gameQuestPlannerLayout.spec.ts` `heroSheetPlacement.test.ts` `stageZonesSolver.test.ts` | `RICHIESTE.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` | `CTR-game-006` `hud-panel.md` |
| `hud-plaque` | 2 | 2 | `cartouchePath.test.ts` `designSystemPage.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `QuestRewardPanel.test.tsx` +26 | — | `CURRENT_STATE.md` `KNOWLEDGE_INVENTORY.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `DECISION_LOG.md` `INDEX.md` +20 | `hud-plaque.md` |
| `index-primitives` | 1 | 1 | `cinemaFx.test.tsx` `designSystemPage.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` `QuestRewardPanel.test.tsx` `cinemaFx.test.tsx` +13 | — | `HANDOFF.md` `PLAN-024-quest-s1-lab-hud-restyle.md` `PLAN-035-village-view-buildings.md` `PLAN-038-village-lots-pin-language.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-042-village-registry.md` +26 | `index-primitives.md` |
| `skin-badge` | 2 | 1 | `designSystemPage.test.tsx` `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` +20 | — | `RICHIESTE.md` `PLAN-063-questwindow-chrome-layout.md` `COMPONENT_MASTER_INDEX.md` `world_presentation_runtime_trusted.md` `world_presentation_runtime_implementation_plan.md` | `skin-badge.md` |
| `skin-button` | 2 | 1 | `designSystemPage.test.tsx` `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` +20 | — | `RICHIESTE.md` `PLAN-040-quest-window-skillcheck-outcomes.md` `PLAN-063-questwindow-chrome-layout.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `world_presentation_runtime_trusted.md` +1 | `skin-button.md` |
| `skin-close-button` | 2 | 1 | `designSystemPage.test.tsx` `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` +20 | — | `PLAN-063-questwindow-chrome-layout.md` `COMPONENT_MASTER_INDEX.md` `world_presentation_runtime_implementation_plan.md` | `skin-close-button.md` |
| `skin-scope` | 2 | 1 | `designSystemPage.test.tsx` `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` +24 | — | `RICHIESTE.md` `SESSION_HANDOFF.md` `recurring-traps.md` `PLAN-032-SP-1-hero-sheet.md` `PLAN-032-SP-2-village-stash.md` `PLAN-032-SP-3-merchant-panel.md` +13 | `skin-scope.md` |
| `skin-title` | 2 | 1 | `designSystemPage.test.tsx` `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `FloatingPanel.test.tsx` `HudEventLedger.test.tsx` +20 | — | `RICHIESTE.md` `PLAN-012-event-reminder-aaa-v2.md` `COMPONENT_MASTER_INDEX.md` `world_presentation_runtime_trusted.md` `trailer_threat_iter_rework_plan.md` `trailer_v9_skin_alignment_plan.md` +1 | `skin-title.md` |

### `src/ui/idleVillage/skins/temporary/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `temporary-skin-config` | 1 | 1 | `poiAmberSkinConfig.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +41 | — | `PLAN-054-living-component-contracts.md` `ACTIVITY_CAPSULE_TESTING_PLAN.md` `COMPONENT_MASTER_INDEX.md` `skin_rendering_fix_plan.md` | `temporary-skin-config.md` |

### `src/ui/idleVillage/skins/types/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `skin-schema` | 1 | 1 | `useSkinSystem.test.ts` `SkinManager.test.ts` `SkinSchema.test.ts` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` +50 | — | `COMPONENT_MASTER_INDEX.md` `poi_detail_trusted.md` | `skin-schema.md` |

### `src/ui/idleVillage/slots/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `resident-slot-validators` | 1 | 1 | `residentSlotValidators.test.ts` `useResidentDropAdvisor.test.tsx` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` `LocationCard.playwright.spec.ts` +141 | `gameQuestExpedition.spec.ts` `gameQuestFullFlow.spec.ts` `DragRosterSlotRack.test.ts` `questExpeditionBag.test.tsx` | `POSTMORTEM_ARCHIVED.md` `COMPONENT_MASTER_INDEX.md` `roster_slot_interaction_documentation.md` `ws3-theater-controller-crew-scheduler.md` | `CTR-game-007` `resident-slot-validators.md` |
| `types` | 1 | 1 | `MinimalDragPage.unit.test.tsx` `ResidentSlotRack.drag-feedback.test.tsx` `ResidentSlotRack.medal.test.tsx` `ResidentSlotRack.skin.integration.test.tsx` `ResidentSlotRack.unit.test.tsx` `useQuestAssignmentPreview.test.ts` +145 | `roster-slotRack.spec.ts` | `BALANCER_NEW_IMPROVEMENTS.md` `DEVELOPMENT_GUIDELINES.md` `RICHIESTE.md` `SESSION_HANDOFF.md` `recurring-traps.md` `idle-village-context.md` +69 | `types.md` |

### `src/ui/idleVillage/types/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `activity-slot-data` | 1 | 1 | `ActivitySlotTelemetryMirror.test.tsx` `TheaterViewSync.test.tsx` `useActiveHUDTelemetry.test.tsx` `useTheaterController.test.ts` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` +137 | — | `ACTIVITY_CAPSULE_TESTING_PLAN.md` `COMPONENT_MASTER_INDEX.md` `activityslot_telemetry_mirror.md` `poi_standard_trusted.md` `village_sandbox_perf.md` | `activity-slot-data.md` |

### `src/ui/idleVillage/utils/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `portrait-decode-cache` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +37 | — | `COMPONENT_MASTER_INDEX.md` `pgcard_trusted.md` | `portrait-decode-cache.md` |
| `renderer-stack-instrumentation` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +29 | — | `COMPONENT_MASTER_INDEX.md` | `renderer-stack-instrumentation.md` |
| `sandbox-diagnostics` | 1 | 1 | `LocationDeck.test.tsx` `useTheaterController.test.ts` `sandboxDiagnostics.test.tsx` `active-hud-regression.spec.ts` `activity-cards-parity.spec.ts` `ActivityArea.rtl.test.tsx` +128 | — | `idle_village_activity_slots.md` `COMPONENT_MASTER_INDEX.md` `idle_village_scenario_planner_phase_e.md` | `sandbox-diagnostics.md` |

### `src/ui/shared/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `stat-icon-utils` | 1 | 1 | `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `RackScenarioPanel.test.tsx` `WLSTY011ActivityCapsuleDetail.test.tsx` `questExpeditionBag.test.tsx` `pageCrash.repro.test.tsx` `tier1ContractCoverage.test.tsx` +5 | — | `RICHIESTE.md` `COMPONENT_MASTER_INDEX.md` `idle_village_hero_sheet_dynamic_stats_plan.md` `skill_check_preview_lab_plan.md` | `stat-icon-utils.md` |

### `src/ui/styleLab/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `style-lab-surface` | 2 | 1 | `POISkinIntegration.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +17 | — | `IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md` `RICHIESTE.md` `DEVELOPMENT_GUIDELINES.md` `IMPLEMENTED_PLAN.md` `ArtDirection_Wanderlust.md` `TechnicalDirection.md` +4 | `style-lab-surface.md` |

### `src/ui/styleLab/config/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `demo-config` | 1 | 1 | `ActionHalo.skin.test.tsx` `ActivityCapsule.skin.test.tsx` `VillageRosterSection.skin.test.tsx` `RosterDemo.test.tsx` `StyleLabDemo.test.tsx` `VillageSandbox.isolation.test.tsx` +47 | `styleLabDemoPresetSwitch.spec.ts` | `COMPONENT_MASTER_INDEX.md` | `demo-config.md` |
| `physics-defaults` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +56 | `styleLabDemoPresetSwitch.spec.ts` | `COMPONENT_MASTER_INDEX.md` | `physics-defaults.md` |

### `src/ui/styleLab/hooks/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `use-style-lab-tokens` | 1 | 4 | `DayNightPOI.test.tsx` `WL-STY-006-SurfaceIntegration.test.tsx` `StyleLabTokens.test.tsx` `WanderlustPreset.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` +59 | `styleLabDemoPresetSwitch.spec.ts` | `COMPONENT_MASTER_INDEX.md` | `use-style-lab-tokens.md` |

### `src/ui/v9-skin/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `v9-glass-layers-only` | 2 | 2 | `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `RackScenarioPanel.test.tsx` `WLSTY011ActivityCapsuleDetail.test.tsx` `TestRosterPage.drop-state-realistic.test.tsx` `TestRosterPage.drop-state-validation.test.tsx` `TestRosterPage.fixes.test.tsx` +2 | — | `COMPONENT_MASTER_INDEX.md` | `v9-glass-layers-only.md` |

### `src/ui/visualFidelityLab/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `carved-bar` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `HANDOFF.md` `COMPONENT_MASTER_INDEX.md` | `carved-bar.md` |
| `field-grain` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `PgDetailCard.test.tsx` `SkillDeck.test.tsx` `WorldSurfaceLayerOrder.test.tsx` +5 | — | `HANDOFF.md` `COMPONENT_MASTER_INDEX.md` | `field-grain.md` |
| `plate-variants` | 2 | 2 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +35 | — | `COMPONENT_MASTER_INDEX.md` | `plate-variants.md` |

### `src/ui/wanderlust-surface/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `inset-panel` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `PgDetailCard.test.tsx` `RackScenarioPanel.test.tsx` +13 | — | `COMPONENT_MASTER_INDEX.md` `test_hub_pages.md` `trailer_threat_iter_rework_plan.md` | `inset-panel.md` |
| `material-presets` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +40 | — | `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` | `material-presets.md` |
| `materic-skin-config` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +47 | — | `HANDOFF.md` `PLAN-054-living-component-contracts.md` `COMPONENT_MASTER_INDEX.md` `materic_roster_vertical_slice_plan.md` | `materic-skin-config.md` |
| `materic-skin-context` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +47 | — | `CHANGELOG.md` `COMPONENT_MASTER_INDEX.md` | `materic-skin-context.md` |
| `materic-skin-provider` | 2 | 1 | — | — | `CHANGELOG.md` `COMPONENT_MASTER_INDEX.md` `materic_roster_vertical_slice_plan.md` | `materic-skin-provider.md` |
| `wanderlust-inner-surface` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +39 | — | `COMPONENT_MASTER_INDEX.md` | `wanderlust-inner-surface.md` |
| `wanderlust-material-context` | 1 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +40 | — | `COMPONENT_MASTER_INDEX.md` | `wanderlust-material-context.md` |
| `wanderlust-surface` | 2 | 2 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +39 | — | `HANDOFF.md` `RICHIESTE.md` `MASTER_PLAN.md` `COMPONENT_MASTER_INDEX.md` `interaction_core_spec.md` `test_hub_pages.md` +5 | `wanderlust-surface.md` |

### `src/ui/wanderlust-surface/layout/`

| unità | tier | scope | unit test | e2e | doc | contratti |
|---|---|---|---|---|---|---|
| `wanderlust-ambient-field` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `PgDetailCard.test.tsx` `RackScenarioPanel.test.tsx` +13 | — | `COMPONENT_MASTER_INDEX.md` `trailer_threat_iter_rework_plan.md` | `wanderlust-ambient-field.md` |
| `wanderlust-layout` | 2 | 1 | `ConsumablePile.test.tsx` `EquipSlotRack.test.tsx` `EquippableItemCard.test.tsx` `JobPoiRosterTimeIntegrationPage.rtl.test.tsx` `PgDetailCard.test.tsx` `RackScenarioPanel.test.tsx` +13 | — | `COMPONENT_MASTER_INDEX.md` `wanderlust_triumph_steam_concept_slice_plan.md` | `wanderlust-layout.md` |
| `wanderlust-portrait` | 2 | 1 | `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` `minimalGameplayFlow.test.tsx` +36 | — | `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `materic_roster_vertical_slice_plan.md` `trailer_vertical_slice_plan.md` `wanderlust_triumph_steam_concept_slice_plan.md` | `wanderlust-portrait.md` |
| `wanderlust-stat-bar` | 2 | 1 | `WanderlustStatBar.test.tsx` `VillageSandbox.isolation.test.tsx` `MinimalGameplay.dnd.test.tsx` `MinimalGameplay.gameOver.test.tsx` `MinimalGameplay.resident-flow.test.tsx` `MinimalGameplay.visible-contract.test.tsx` +47 | — | `CHANGELOG.md` `HANDOFF.md` `hud_component_guide.md` `COMPONENT_MASTER_INDEX.md` `materic_roster_vertical_slice_plan.md` `trailer_vertical_slice_plan.md` +1 | `wanderlust-stat-bar.md` |

## Unità senza copertura rilevata né dichiarata

- `hud-panels-menu` — `src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx`
- `hud-recenter-button` — `src/ui/idleVillage/components/gameFrame/HudRecenterButton.tsx`
- `map-demo-poi` — `src/ui/idleVillage/components/gameFrame/MapDemoPoi.tsx`
- `materic-roster-component-v2` — `src/ui/idleVillage/rosterV2/MatericRosterComponentV2.tsx`
- `materic-skin-provider` — `src/ui/wanderlust-surface/MatericSkinProvider.tsx`
- `objective-cartouche` — `src/ui/idleVillage/components/gameFrame/ObjectiveCartouche.tsx`
- `region-tooltip` — `src/ui/idleVillage/components/gameFrame/RegionTooltip.tsx`
- `resource-readout-items` — `src/ui/idleVillage/components/gameFrame/resourceReadoutItems.tsx`
- `roster-draggable-v2` — `src/ui/idleVillage/rosterV2/RosterDraggableV2.tsx`
- `skill-check-legend` — `src/ui/idleVillage/components/destinyAstrolabe/SkillCheckLegend.tsx`
- `tuning-panel` — `src/ui/idleVillage/components/gameFrame/TuningPanel.tsx`
- `when-where-cluster` — `src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx`
