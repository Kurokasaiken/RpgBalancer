# Idle Village Component Index

## Scopo
Indice unico dei componenti e integration contracts rilevanti per la vertical slice.

## Regole
- Questo file NON definisce i contratti.
- Questo file linka i documenti trusted.
- Ogni riga deve puntare a una sola source of truth.

## Tabella componenti

| Component / Contract | Area | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |
|---|---|---|---|---|---|---|
| Time Engine Contract | time | trusted | `src/docs/docs/idle_village/trusted/time_engine_trusted.md` | `/minimal-gameplay` | 2026-04-25 | Single tick source - INT-TIME-DAYNIGHT-001 completed, dual-layer verified |
| POI Standard Contract | poi | trusted | `src/docs/docs/idle_village/trusted/poi_standard_trusted.md` | dedicated page | 2026-04-22 | ActivityCapsule family |
| POI Detail Contract | poi-detail | trusted | `src/docs/docs/idle_village/trusted/poi_detail_trusted.md` | dedicated page | 2026-04-25 | PoiDetailSkinWrapper - TEST-POI-D-ALIGN-001 completed, integration verified |
| Day/Night Contract | day-night | trusted | `src/docs/docs/idle_village/trusted/daynight_trusted.md` | `/minimal-gameplay` | 2026-04-24 | RT-DAYN-001 audit completed - fully compliant |
| Roster/Drag Contract | roster-drag | trusted | `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` + `src/ui/idleVillage/roster/index.ts` | `/test`, `/minimal-gameplay` | 2026-07-15 | VillageRosterSection, DragContext, statMatching - INT-DRAG-POI-ASSIGNMENT-001 completed, assignment verified. Shared bundle adopted by MinimalGameplayPage (RT-MG-ROSTER-ADOPT-007). Single source of truth for roster UI across all pages. |
| WorldSurface Component Contract | world-surface-component | candidate | `src/docs/docs/plans/component_based_world_surface_plan.md` | `/world-surface-components` | 2026-07-21 | Component-based map with semantic grouping; candidate contract supersedes layer-centric manifest v1. Trusted doc TBD after Phase 6 close-out. |
| Interaction Core (drag outcome, flight, extraction, bloom) | interaction-core | trusted | `src/docs/docs/idle_village/interaction_core_spec.md` | `/slot`, `/minimal-roster-slot-integration`, `/minimal-job-poi-roster-integration` | 2026-07-12 | useDragOutcome, DragOutcomeFlight, useExtractionSequence, bloomEffect, RosterDropVerdict, lockedResidentIds; slot blueprints now support role/emptyPenalty/residentRiskModifiers |
| POI Quest System (questPoiKit) | poi-quest | draft | `src/docs/docs/plans/poi_quest_system_plan.md` | `/poi-quest-detail-roster-time-clock` | 2026-08-11 | MagicCircleHalo (iscrizione che si scrive dalle ore 12, timer della quest), useMilestoneEngine (una milestone per fase, equispaziate), MilestoneCheckModal (consumabili → Destiny Astrolabe V1), QuestChronicle esteso con rope luminosa + gate "Raccogli ricompense"; durata da `QuestPhase.durationValue` (non da `durationFormula`), difficoltà da `questSkillCheckConfig`. R-005 / desiderata v3. Kit `draft`: manca il contract per `certified`. Evidence: `test-results/poi-quest-system-r005-2026-08-11.md` |
| Quest Assignment Rework | quest-assignment | candidate | `src/docs/docs/plans/quest_role_assignment_rework_strategy.md` | `/poi-quest-detail-roster-integration` | 2026-07-12 | QuestCard, useQuestAssignmentPreview, QuestAssignmentPreview, PoiDetailQuestRosterIntegrationPage, slotBlueprints role/emptyPenalty/residentRiskModifiers; build:check passed |
| Test Roster Population | roster-data | trusted | `scripts/populate-test-roster.js` | N/A | 2026-04-27 | Script ufficiale per popolare roster di test con 3 PG (Sir Spaccaculi 280HP, Salvatrice 210HP, Giggiolillo 195HP) |
| Character-to-Resident Contract | character-resident | trusted | `src/docs/docs/idle_village/trusted/character_resident_trusted.md` | `/test`, `/minimal-gameplay` | 2026-07-15 | CR-005 verified both surfaces consume the same canonical Village Resident Store; StoreConsistencyChecker + CanonicalStoreVerification tests pass |
| World Presentation Runtime Contract | world-presentation | trusted | `src/docs/docs/idle_village/trusted/world_presentation_runtime_trusted.md` | `/world-presentation-director` | 2026-07-22 | WorldState → PresentationOutput deterministic runtime; Foundation + DEMO verified. |

## Regole di aggiornamento
- Se cambia il contratto di un componente, aggiornare il suo trusted doc.
- Aggiornare qui solo:
  - status
  - link
  - runtime/test page
  - data ultima certificazione
- Non copiare qui i dettagli del contratto.

## Workflow documentale

Per le procedure di freeze, update ed evidence requirements, fare riferimento a:
`idle-village-documentation-governance-pack.md` - Sezioni 1 (Policy ufficiale) e 4 (Procedura operativa)

Questo index segue le regole governative:
- Single source of truth per ogni componente
- Nessuna duplicazione dei contratti
- Aggiornamento solo di status/metadata in questa tabella
- I dettagli del contratto vivono nei documenti trusted linkati

## Navigazione trusted docs

### Time Engine
- **Contract**: `src/docs/docs/idle_village/trusted/time_engine_trusted.md`
- **Status**: trusted
- **Area**: Temporal engine
- **Last Certified**: 2026-04-25
- **Notes**: INT-TIME-DAYNIGHT-001 completed, dual-layer architecture verified

### POI Standard  
- **Contract**: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md`
- **Status**: trusted
- **Area**: Point of Interest base components
- **Last Certified**: 2026-04-22

### POI Detail
- **Contract**: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`
- **Status**: trusted
- **Area**: Point of Interest detail components
- **Last Certified**: 2026-04-25
- **Notes**: TEST-POI-D-ALIGN-001 completed, integration verified

### POI Standard
- **Contract**: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md`
- **Status**: trusted
- **Area**: ActivityCapsule contract and POI visualization
- **Last Certified**: 2026-04-22
- **Verification**: RT-POI-S-001 completed, 100% compliant
- **Harness**: `src/ui/idleVillage/pages/PoiVerificationPage.tsx`

### Day/Night Cycle
- **Contract**: `src/docs/docs/idle_village/trusted/daynight_trusted.md`
- **Status**: trusted
- **Area**: Temporal cycle system
- **Last Certified**: 2026-04-24
- **Notes**: RT-DAYN-001 audit completed - fully compliant with trusted contract

### Roster/Drag System
- **Contract**: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` + `src/ui/idleVillage/roster/index.ts`
- **Status**: trusted
- **Area**: Drag & drop system architecture
- **Last Certified**: 2026-07-15
- **Notes**: INT-DRAG-POI-ASSIGNMENT-001 completed, assignment flow verified. Shared bundle adopted by MinimalGameplayPage (RT-MG-ROSTER-ADOPT-007). Single source of truth for roster UI across all pages.

### Character-to-Resident Architecture
- **Contract**: `src/docs/docs/idle_village/trusted/character_resident_trusted.md`
- **Status**: trusted
- **Area**: Character -> Resident conversion pipeline
- **Last Certified**: 2026-07-15
- **Notes**: CR-005 verified both `/test` and `/minimal-gameplay` consume the same canonical Village Resident Store; StoreConsistencyChecker + CanonicalStoreVerification tests pass

### World Presentation Runtime
- **Contract**: `src/docs/docs/idle_village/trusted/world_presentation_runtime_trusted.md`
- **Status**: trusted
- **Area**: World presentation runtime
- **Last Certified**: 2026-07-22
- **Notes**: `WORLD-PRESENTATION-RUNTIME-FOUNDATION` + `WORLD-PRESENTATION-RUNTIME-DEMO` verified; deterministic `WorldState → PresentationOutput` loop.

<!-- GOV-006-FROZEN-KITS-START -->
## Frozen Kits

| Kit ID | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |
| --- | --- | --- | --- | --- | --- |
| rosterKit | frozen | src/ui/idleVillage/frozen/kits/rosterKit.md | /minimal-roster | 2026-07-14 | KIT_REGISTRY status: certified |
| pgcardKit | frozen | src/ui/idleVillage/frozen/kits/pgcardKit.md | N/A | 2026-07-14 | KIT_REGISTRY status: certified |
| slotRackKit | frozen | src/ui/idleVillage/frozen/kits/slotRackKit.md | /minimal-slotRack | 2026-07-14 | KIT_REGISTRY status: certified |
| destinyAstrolabeKit | draft | TBD | /minimal-destiny-astrolabe | 2026-07-14 | KIT_REGISTRY status: certified |
| poiKit | draft | TBD | /minimal-poi | 2026-07-14 | KIT_REGISTRY status: certified |
| clockKit | frozen | src/ui/idleVillage/frozen/kits/clockKit.md | /minimal-clock | 2026-07-14 | KIT_REGISTRY status: certified |
| questDetailKit | candidate | src/ui/idleVillage/frozen/kits/questDetailKit.tsx | /minimal-quest-detail | 2026-07-15 | C2 ActivityDefinition source adopted; reads from `DEFAULT_IDLE_VILLAGE_CONFIG.activities` |
| resourceHudKit | draft | src/ui/idleVillage/frozen/kits/resourceHudKit.md | /minimal-resourcehud | 2026-07-14 | KIT_REGISTRY status: draft |
| questCardKit | draft | src/ui/idleVillage/frozen/kits/questCardKit.md | /minimal-questcard | 2026-07-14 | KIT_REGISTRY status: draft |
| outcomeKit | draft | src/ui/idleVillage/frozen/kits/outcomeKit.md | /minimal-outcome | 2026-07-14 | KIT_REGISTRY status: draft |
| marketKit | draft | src/ui/idleVillage/frozen/kits/marketKit.md | /minimal-market | 2026-07-14 | KIT_REGISTRY status: draft |
| integrationQuestFlowKit | draft | src/ui/idleVillage/frozen/kits/integrationQuestFlowKit.md | /minimal-integration-quest-flow | 2026-07-14 | KIT_REGISTRY status: draft |
| skillCheckKit | draft | src/ui/idleVillage/frozen/kits/skillCheckKit.md | N/A | 2026-07-14 | KIT_REGISTRY status: draft |
| activeHudKit | draft | src/ui/idleVillage/frozen/kits/activeHudKit.md | N/A | 2026-07-14 | KIT_REGISTRY status: draft |
| activityCapsuleKit | draft | src/ui/idleVillage/frozen/kits/activityCapsuleKit.md | N/A | 2026-07-14 | KIT_REGISTRY status: draft |
| slottedMedalKit | draft | src/ui/idleVillage/frozen/kits/slottedMedalKit.md | N/A | 2026-07-14 | KIT_REGISTRY status: draft |
| jobDetailKit | draft | TBD | N/A | 2026-07-14 | KIT_REGISTRY status: draft |
| locationDetailKit | candidate | src/ui/idleVillage/frozen/kits/locationDetailKit.tsx | /minimal-location-detail | 2026-07-15 | ancient-ruins demo location now derived from C2 `ActivityDefinition` |
| rosterSlotKit | draft | TBD | /minimal-roster-slot-integration | 2026-07-14 | KIT_REGISTRY status: draft |
| jobPoiRosterKit | draft | TBD | /minimal-job-poi-roster-integration | 2026-07-14 | KIT_REGISTRY status: draft |
| jobPoiRosterTimeKit | draft | TBD | /minimal-job-poi-roster-time-integration | 2026-07-14 | KIT_REGISTRY status: draft |

<!-- GOV-006-FROZEN-KITS-END -->

---

*Last Updated: 2026-07-22*
*Status: Reconciled from KIT_REGISTRY.*