# Prefazione Kanban

| Prompt ID/Descrizione | Stato | Agente | Data | Note |
| --- | --- | --- | --- | --- |
| NP-SM-004 - Idle Village Slot Lab Baseline Capture | Completato | Cascade | 2026-03-06 | Evidence: test-results/slotted-medal-phase0-baseline.log – Baseline capture complete, SlottedMedal state machine verified (26/26 tests passing), TestRosterPage integration functional, E2E tests need flow correction |
| IV-POI-E2E – POI Skin E2E Testing | Completato | Cascade | 2026-03-06 | Evidence: test-results/poi-skin-e2e-testing-2026-01-20.log |
| IV-POI-SKIN – Test Page POI Skin Integration | Completato | Cascade | 2026-03-06 | Evidence: test-results/iv-poi-skin-2026-03-06.log – POI skin integration complete, data display restored, safeguards passed |
| IV-ACTIVITYSLOT-KEYBOARD – ActivitySlot Keyboard & Focus Enhancement | Completato | Cascade | 2026-03-06 | Evidence: test-results/iv-activityslot-keyboard-2026-03-06.log – Enhanced keyboard navigation, focus management, and accessibility for ActivitySlot components |
| IV-POI-COVERAGE – POI Coverage Decision & Documentation | Completato | Cascade | 2026-03-06 | Evidence: test-results/iv-poi-coverage-2026-03-06.log – Coverage decision complete, viewer vs drop scope formalized, ACTIVITY_CAPSULE_TESTING_PLAN.md created, idle_village_plan.md updated with POI System Architecture section |
| IV-POI-ARIA-LIVE – ActivityCapsule ARIA Live Enhancements | Completato | Cascade | 2026-03-06 | Evidence: test-results/iv-poi-aria-live-2026-03-06.log – Granular ARIA live announcements implemented, progress milestones, slot occupancy, gated by skinConfig.enableAriaLive, demo ready on /test, comprehensive test coverage |
| IV-POI-DROP – POI Capsule Drop Integration & Telemetry | Completato | Cascade | 2026-03-06 | Evidence: test-results/iv-poi-drop-2026-03-06.log – Drop integration complete, useResidentDropValidation wired, data-drop-* attributes added, telemetry events implemented, demo ready on /test with console logging |
| IV-POI-QA-CHECKLIST – Activity Capsule QA Checklist Update | Completato | Cascade | 2026-03-06 | Evidence: test-results/iv-poi-qa-checklist-2026-03-06.log – Checklist complete, testing plan updated with display, interaction, DnD, telemetry, and performance sections |
| IV-POI-QA-GATE - Manual QA Gatekeeping & Evidence Log | Non assegnato | - | - | Evidence: IN PROGRESS - Raccogliere conferme esplicite dell'owner per ogni deliverable (Keyboard, ARIA, Drop, Skin) con log dedicato |
| IV-WOOD-POI-001 - First Real Wood POI Interaction Flow | Non assegnato | - | - | Reopened for runtime fixes - time acceleration and POI assignment issues |
| MG-TIME-FIX-001 - Fix accelerating time loop in MinimalGameplayPage runtime | Non assegnato | - | - | Time progression becomes faster and faster as page runs - need to identify and eliminate duplicate scheduling |
| MG-POI-FIX-001 - Fix Wood POI assignment runtime path | Non assegnato | - | - | Wood POI drop shows UI feedback but doesn't start real activity pipeline or appear in Active Activities |
```text
AGENT
Idle Village POI Integration Specialist - Map-to-Slot Flow

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare il primo flusso di interazione POI Wood completo e corretto che stabilisca il pattern map-POI-to-slot per la vertical slice.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/ui/idleVillage/components/minimal/MinimalActivityPOI.tsx
- [esistente] src/ui/idleVillage/components/ActivityCapsule.tsx
- [esistente] src/ui/idleVillage/components/ResidentSlotRack.tsx
- [esistente] src/ui/idleVillage/hooks/useResidentDropValidation.ts
- [esistente] src/balancing/config/idleVillage/minimalConfig.ts
- [nuovo] src/ui/idleVillage/components/WoodPOI.tsx
- [nuovo] src/ui/idleVillage/components/WoodPOIDetail.tsx
- [nuovo] tests/unit/idleVillage/WoodPOI.test.tsx

STYLE LAB PRESET
- Preset: Minimal Frontier (src/ui/styleLab/presets/minimalFrontier.ts)
- Overrides/Tokens: bloom colors (green/amber), halo progress tokens, POI state colors

TEST ROUTE QA
- N/A (task su /minimal-gameplay, non /test)

DATO DI ORIGINE
- Documento: User request "Implement first real Wood POI interaction flow" - vertical slice establishment per map-POI-to-slot pattern

DIPENDENZE
- MG-01 (Minimal Gameplay Hook & HUD) - deve essere completato per avere il contesto di gioco
- IV-POI-DROP (POI Capsule Drop Integration) - sistema drag & drop POI già funzionante

OPERAZIONI DA ESEGUIRE
1. **Wood POI Component Creation**: Creare `WoodPOI.tsx` che estende `MinimalActivityPOI` con:
   - Stati visuali: idle, running, completed con bloom/halo appropriati
   - Supporto drag & drop diretto sul POI map-level
   - Forwarding dei drop allo slot interno
   - Progress halo visibile durante running
   - Click handling per apertura detail e collect

2. **Wood POI Detail Component**: Creare `WoodPOIDetail.tsx` con:
   - Esattamente 1 slot interno reale
   - Drag & drop diretto sullo slot
   - UI minimale senza auto-apertura al drop
   - Stato POI sincronizzato con map-level

3. **MinimalGameplayPage Integration**: Aggiornare per:
   - Mostrare Wood POI sulla mappa
   - Collegare click POI ad apertura detail
   - Gestire collect su POI completato
   - Sincronizzare stato POI con activity engine

4. **Activity Pipeline Integration**: Collegare con:
   - `useMinimalGameplayStore` per stato attività
   - `useResidentDropValidation` per validazione
   - Sistema reward esistente per collect
   - Active Activities HUD per monitoraggio

5. **Config-First Setup**: Estendere `minimalConfig.ts` con:
   - Definizione attività "wood-gathering"
   - Durata, reward, rischio configurabili
   - Stati POI e colori associati

6. **Testing Coverage**: Creare test unitari per:
   - Render POI e stati visuali
   - Drag & drop forwarding
   - Click interactions
   - Collect flow completo

OPERAZIONI VIETATE
- Vietato generalizzare a infiniti slot in questo task
- Vietato implementare Gold/Dangerous POI
- Vietato creare sistema DnD personalizzato parallelo
- Vietato hardcodare valori di gameplay fuori da config
- Vietato auto-aprire detail al drop

ASSUNZIONI
- Sistema drag & drop esistente (`useResidentDropValidation`) è riutilizzabile
- Activity engine (`useMinimalGameplayStore`) supporta start/stop/collect
- Config system (`minimalConfig.ts`) è estendibile per nuove attività

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx src/ui/idleVillage/components/minimal src/ui/idleVillage/components src/balancing/config/idleVillage`
- `npm run test -- tests/unit/idleVillage/WoodPOI.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se activity engine non supporta start/stop/collect come previsto

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-wood-poi-001-<YYYY-MM-DD>.log`
3. Report finale con: files touched, what changed, existing systems reused, manual verification results per acceptance criteria

NOTE
- Seguire filosofia config-first: tutti i valori di gameplay in `minimalConfig.ts`
- Riutilizzare componenti esistenti dove possibile
- Mantenere implementation minimale e stabile
- Focus su correctness del pattern map-POI-to-slot

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

CONFIG STRUCTURE
- woodActivity: { id: "wood-gathering", name: "Wood Gathering", type: "job", baseReward: { wood: 10 }, durationMs: 5000, dangerRating: 1 }
- poiStates: { idle: { color: "rgb(34, 197, 94)" }, running: { color: "rgb(59, 130, 246)" }, completed: { color: "rgb(251, 191, 36)" } }
Export: `WOOD_POI_CONFIG`, `WoodPOIStateConfig`

EVIDENCE LOG
- test-results/iv-wood-poi-001-<YYYY-MM-DD>.log
```
| IV-SLOT-SKIN-V12 – Slot v12 Skin Integration | Completato | Cascade | 2026-03-06 | Evidence: test-results/iv-slot-skin-v12-2026-03-06.log – Skin Wilderness Bronze convertita, registrata e applicata su Rack A/B + Activity Capsule Detail con telemetry |
| IV-SLOT-SKIN-REGISTRY – Slot Skin Registry Wiring | Completato | Cascade | 2026-03-06 | Evidence: Registry già aggiornato in temporarySkinRegistry.ts con SLOT_WILDERNESS_BRONZE_CONFIG importata e registrata |
| IV-SLOT-SKIN-RACKS – Slot Skin per ResidentSlotRack | Completato | Cascade | 2026-03-06 | Evidence: SlotRackWithSkin montato su Rack A/B in TestRosterPage con telemetry slot_skin_rendered e rackType dinamico |
| IV-SLOT-SKIN-DETAIL – Slot Skin per Activity Capsule Detail | Completato | Cascade | 2026-03-06 | Evidence: SlotRackWithSkin applicato su ActivityCapsule in TestRosterPage con rackType "detail" e telemetry completa |
| IV-SLOT-SKIN-QA – Slot Skin QA & Doc Update | Completato | Cascade | 2026-03-06 | Evidence: ACTIVITY_CAPSULE_TESTING_PLAN.md aggiornato con sezione Slot Skin Testing completa, evidence log creato in test-results/iv-slot-skin-qa-2026-03-06.log |
| IV-POI-DETAIL-CONFIG – POI Detail Skin Config & Registry | Completato | Cascade | 2026-03-11 | Evidence: test-results/iv-poi-detail-config-2026-03-11.log – JSON converted to TypeScript TemporarySkinConfig, registry updated, helper created |
| IV-POI-DETAIL-WIRING – Activity Capsule Detail Skin Wiring & Telemetry | Completato | Cascade | 2026-03-11 | Evidence: test-results/iv-poi-detail-wiring-2026-03-11.log – PoiDetailSkinWrapper created, TestRosterPage updated, telemetry poi_detail_skin_rendered implemented |
| IV-POI-DETAIL-QA – POI Detail Skin Testing & Docs | Completato | Cascade | 2026-03-11 | Evidence: test-results/iv-poi-detail-qa-2026-03-11.log – Unit/E2E tests created (@poi-detail), ACTIVITY_CAPSULE_TESTING_PLAN.md updated with POI Detail Testing section |
| IV-POI-SLOT-BIND – Gold Mine POI Slot Rack Wiring | Non assegnato | - | - | Reindirizzare gli slot POI verso ResidentSlotRackSkin con skin Wilderness Bronze e gating timer config-first |
| IV-ACTIVITY-HALO-SPLIT – ActivityCapsule POI Layout Split | Non assegnato | - | - | Separare layout capsule/halo, sincronizzare progressFraction/telemetria con timer occupazione |
| IV-POI-QA-GUARD – POI Visual/Drag QA Reinforcement | Non assegnato | - | - | Rafforzare suite unit/e2e e guidelines per halo/skin drag & drop, Pixelmatch + trace obbligatori |
| IV-P12-01 – Time Engine Fatigue Metadata & Activity Config | Non assegnato | - | - | Esternalizzare fatigueGain/metadata attività e allineare TimeEngine al weight-based pattern |
| IV-P12-046 – Quest Success Modal & HUD Wiring | Non assegnato | - | - | Implementare QuestSuccessModal, collegare ActiveActivityHUD/ActivityCapsule, telemetry quest_success_modal_shown/quest_rewards_collected, RTL + snapshot |
| IV-P12-046T – Quest Success Modal E2E Flow | Non assegnato | - | IV-P12-046 | Playwright @quest-success: completamento quest → modale → conferma, screenshot/trace, verifica telemetry |
| IV-P12-047 – Reward Application Service & Minimal Gameplay | Non assegnato | - | - | Hook/servizio reward application config-first, aggiornare MinimalGameplay collect flow, persistence + unit/integration tests |
| IV-P12-047T – Reward Application Automated Tests | Non assegnato | - | IV-P12-047 | Suite unit + E2E vertical slice collect flow per reward application/persistence |
| WB-SKIN-A – Wanderlust Foundation Imports & Audits | Non assegnato | - | - | Import `balancer-skin.css`, audit DOM wrappers, verificare Style Lab pillars, smoke test Balancer/Roster, log `test-results/wanderlust-skin-A-<date>.log` |
| WB-SKIN-B – Wanderlust Component Wrappers & Telemetry | Non assegnato | - | WB-SKIN-A | Skin scaffolding Balancer/Spell/Roster, telemetry `skin_*_rendered`, VRT pillar doppia, log `test-results/wanderlust-skin-B-<date>.log` |
| WB-SKIN-C – Wanderlust Integration QA & Performance | Non assegnato | - | WB-SKIN-B | Regressioni funzionali + performance (<5% delta) + accessibility sweep, log `test-results/wanderlust-skin-C-<date>.log` |
| WB-SKIN-D – Wanderlust Release Prep & Rollback | Non assegnato | - | WB-SKIN-C | Safeguard finale, art/gameplay sign-off, rollback instructions, log `test-results/wanderlust-skin-D-<date>.log` |
```text
AGENT
Idle Village Engine Specialist – Time Systems

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Portare il calcolo di `fatigueGain` e dei metadata attività in un modulo config-first (`ActivityMetadataConfig`), eliminando i numeri magici da `TimeEngine` e garantendo copertura test per l’invarianza del comportamento.

PROMPT READINESS
FILE TARGET
- [nuovo] src/balancing/config/idleVillage/activityMetadataConfig.ts — definire schema/config con valori default
- [esistente] src/balancing/config/idleVillage/types.ts — aggiungere tipi per ActivityMetadataConfig
- [esistente] src/balancing/config/idleVillage/defaultConfig.ts — importare/applicare metadata default
- [esistente] src/engine/game/idleVillage/TimeEngine.ts — leggere fatigueGain e metadata per activityId
- [esistente] src/engine/game/idleVillage/IdleVillageEngine.ts — propagare metadata se necessario
- [nuovo] tests/unit/idleVillage/TimeEngine.fatigueMetadata.test.ts — testare invarianti

STYLE LAB PRESET
- N/A (task engine/config backend)

TEST ROUTE QA
- N/A (nessuna superficie `/test` coinvolta)

DATO DI ORIGINE
- Documento: `src/docs/docs/plans/idle_village_phase12_task_breakdown.md` §12.1.1 – Audit e refactoring TimeEngine

DIPENDENZE
- IV-P12 (strategy) – nessuna dipendenza operativa precedente

OPERAZIONI DA ESEGUIRE
1. Creare `activityMetadataConfig.ts` con schema Zod + default export (`ActivityMetadataConfigSchema`, `defaultActivityMetadataConfig`) includendo campi `fatigueGain`, `recovery`, `autoRepeatDelayUnits`, `metadataVersion`.
2. Estendere `IdleVillage` types/defaultConfig per includere `activityMetadata`, assicurando caricamento via `IdleVillageConfigStore`/PersistenceService.
3. Aggiornare `TimeEngine.advanceTime` e helper correlati per leggere `fatigueGain` per activityId (fallback config globale) e registrare `fatigueApplied` per ogni residente in modo deterministico.
4. Aggiornare `IdleVillageEngine` (se necessario) per passare i nuovi deps e loggare warning solo in DEV quando metadata assente.
5. Scrivere unit test mirati che coprano: (a) attività con `fatigueGain` custom, (b) fallback default, (c) regressione del log completato, (d) serializzazione config-first.
6. Aggiornare documentazione inline (JSDoc obbligatorio) e TODO nel plan (`idle_village_phase12_task_breakdown.md`) indicando che 12.1.1 è in corso.

OPERAZIONI VIETATE
- Vietato introdurre nuovi numeri magici in TimeEngine o IdleVillageEngine.
- Vietato utilizzare `localStorage` diretto: passare sempre da PersistenceService.
- Vietato modificare la logica di scheduling/quest al di fuori dell’ambito fatigue metadata.

ASSUNZIONI
- `IdleVillageConfigStore` supporta merge di nuove sezioni config.
- I test esistenti per TimeEngine sono verdi e fungono da regressione.

REGRESSION SAFEGUARDS
- `npm run lint -- src/engine/game/idleVillage src/balancing/config/idleVillage tests/unit/idleVillage`
- `npm run test -- tests/unit/idleVillage/TimeEngine.fatigueMetadata.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri un blocker solo se `IdleVillageConfigStore` non consente nuove sezioni senza migrazione.

KANBAN COMPLETION
1. Imposta lo stato su "Completato" con data odierna.
2. Allegare `Evidence: test-results/iv-p12-01-<YYYY-MM-DD>.log` con output lint/test/build e riferimenti doc consultati.
3. Aggiornare `idle_village_phase12_task_breakdown.md` barrando 12.1.1 e descrivendo il nuovo config.

NOTE
- Citare nei log: `src/docs/docs/PROJECT_PHILOSOPHY.md`, `src/docs/docs/plans/art_direction_plan.md`, `.windsurf/plans/style-lab-flexibility-1a9890.md`, `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`, `material-canvas-v2.html` (anche se task backend, ribadire coerenza config-first), plan Phase 12.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

CONFIG STRUCTURE
- activityMetadata: Record<ActivityId, { fatigueGain: number; recoveryMultiplier: number; autoRepeatDelayUnits?: number; notes?: string }>
- activityMetadataVersion: string — usato per migrazioni future.
Export: `ActivityMetadataConfigSchema`, `ActivityMetadataConfig`, `defaultActivityMetadataConfig`.

EVIDENCE LOG
- test-results/iv-p12-01-<YYYY-MM-DD>.log
```
| SR-VS-001 – Slot Rack Renderer Bridge | Completato | Cascade | 2026-03-12 | Evidence: test-results/sr-vs-001-2026-03-12.log – CSS vars expanded, SlotRackRenderer created, components updated, samples ready |
AGENT
Idle Village Slot Renderer Specialist – Style Lab

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare il renderer del Slot Rack con il modello Slot V12: garantire che il React SVG renderer consumi i nuovi CSS vars Iron Bronze, espanda lo schema `slotRackSkinConfig.ts`, e prepari Storybook/Style Lab sample per confronto preset.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/skins/slotRack/SlotRackRenderer.tsx
- [esistente] src/ui/idleVillage/skins/slotRackSkinConfig.ts
- [esistente] src/ui/idleVillage/components/SlotRackWithSkin.tsx
- [esistente] src/ui/idleVillage/components/ResidentSlotRackSkin.tsx
- [esistente] tests/unit/idleVillage/SlotRackSkin.integration.test.tsx

STYLE LAB PRESET
- Preset: Wanderlust dual pillar (`src/ui/styleLab/presets/wanderlust.ts`)
- Overrides/Tokens: `slotRackSkin.*`, `interactionPhysics`, `materialFeel.detail`

TEST ROUTE QA
- N/A per questo prompt (renderer + Style Lab sample)

DATO DI ORIGINE
- Documento: `~/.windsurf/plans/slot-rack-vertical-slice-3a19ab.md` – sezione "Renderer & Skin Bridge"

DIPENDENZE
- Nessuna

OPERAZIONI DA ESEGUIRE
1. Espandere `slotRackSkinConfig.ts` con CSS vars rack (bg gradient, padding, gap, halo) e relative definizioni Zod, fallback Iron Bronze.
2. Rifinire `SlotRackRenderer.tsx` collegando layer (tray, halo, rivet, medal mount) a `SkinSlot` + CSS vars, assicurando data attribuiti coerenti.
3. Aggiornare `SlotRackWithSkin`/`ResidentSlotRackSkin` per usare i nuovi vars senza doppi margini.
4. Preparare sample `/skin-lab`/Storybook per Iron Bronze vs Minimal Frontier, screenshot per log.
5. Estendere `tests/unit/idleVillage/SlotRackSkin.integration.test.tsx` per verificare CSS vars/data attr.

OPERAZIONI VIETATE
- Vietato hardcodare valori non presenti in config.
- Vietato toccare logiche drag/drop o telemetria.
- Vietato bypassare `SkinSlot`.

ASSUNZIONI
- Skin JSON Iron Bronze è aggiornata.
- SkinSystemProvider supporta i binding.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/skins src/ui/idleVillage/components tests/unit/idleVillage`
- `npm run test -- tests/unit/idleVillage/SlotRackSkin.integration.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia elevata; apri blocker solo se `SkinSlot` non supporta i binding richiesti.

KANBAN COMPLETION
1. Stato → "Completato" con data.
2. Evidence `test-results/sr-vs-001-<YYYY-MM-DD>.log` (lint/test/build + screenshot sample).
3. Aggiorna `slot-rack-vertical-slice` plan barrando sezione "Renderer & Skin Bridge".

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, `art_direction_plan.md`, `.windsurf/plans/style-lab-flexibility-1a9890.md`, `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`, `material-canvas-v2.html`.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

CONFIG STRUCTURE
- Estendere `SlotRackSkinConfig` con `cssVars.rackBgGradient`, `rackPadding`, `rackGap`, `rackHaloColor`, `trayRidgeColor`. Aggiorna schema e tipi esportati.

EVIDENCE LOG
- test-results/sr-vs-001-<YYYY-MM-DD>.log
``` |
| SR-VS-002 – Slot Rack Integration & Harness | Completato | Cascade | 2026-03-12 | Evidence: test-results/sr-vs-002-2026-03-12.log – TestRosterPage updated with Iron Bronze, SkinTestHarness enhanced, telemetry integrated, tests added |
AGENT
Idle Village /test Harness Specialist – Drag & Style Lab

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare il nuovo Slot Rack renderer dentro `/test` (Rack A/B), TestRoster e SkinTestHarness garantendo drag/drop, halo/bloom e preferenze Style Lab/persistenza coerenti con Iron Bronze default.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/TestRosterPage.tsx
- [esistente] src/ui/idleVillage/skins/SkinTestHarness.tsx
- [esistente] src/ui/idleVillage/components/DragTestContainer.tsx
- [esistente] src/ui/idleVillage/components/ResidentSlotRackSkin.tsx
- [esistente] src/ui/idleVillage/hooks/useSkinPreferences.ts
- [esistente] tests/unit/idleVillage/TestRosterPage.integration.test.tsx
- [esistente] tests/e2e/idleVillage/testRoutePgCards.spec.ts

STYLE LAB PRESET
- Preset: Wanderlust dual pillar; assicurare fallback Minimal Frontier documentato.

TEST ROUTE QA
- Prompt tocca `/test`: seguire `src/docs/docs/QA/test-route-drag-guidelines.md` (mouse reale, Pixelmatch, trace `test-results/traces/test-route/slot-rack-<pillar>.zip`).

DATO DI ORIGINE
- Documento: `~/.windsurf/plans/slot-rack-vertical-slice-3a19ab.md` – sezione "Integration".

DIPENDENZE
- SR-VS-001 completato (renderer/config pronto).

OPERAZIONI DA ESEGUIRE
1. Aggiornare `TestRosterPage.tsx` affinché Rack A/B montino sempre `ResidentSlotRackSkin` con preset Iron Bronze derivato da `resolveSlotRackPresetId`, includendo `data-slot-skin`, `data-skin-preset`, `data-style-lab-pillar`.
2. Sincronizzare `SkinTestHarness`, `DragTestContainer` e `useSkinPreferences` per usare Iron Bronze di default, con toggle pillar che salva tramite `PersistenceService` (`style-lab-skin-preset`).
3. Integrare telemetria `trackTelemetryEvent('slot_rack_skin_rendered', { skinId, skinVersion, pillar, slotCount, scenarioId })` quando il rack viene montato.
4. Verificare `useResidentDropValidation`/`useMinimalActivitySlotsWithState` dopo il renderer swap, garantendo halo/pointer/keyboard states invariati; documentare eventuali fix.
5. Aggiornare `tests/unit/idleVillage/TestRosterPage.integration.test.tsx` per i nuovi data attr/default preset e Playwright `testRoutePgCards.spec.ts --grep @slot-rack` con screenshot Wilderness/Empire + trace.

OPERAZIONI VIETATE
- Vietato introdurre preset hardcoded fuori da Style Lab/persistence.
- Vietato modificare logiche di assegnazione residenti (solo skin/telemetria/harness).
- Vietato usare `localStorage` diretto.

ASSUNZIONI
- Renderer aggiornato (SR-VS-001) è disponibile.
- Style Lab preset Wanderlust già esporta token necessari.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx src/ui/idleVillage/components src/ui/idleVillage/skins tests/unit/idleVillage tests/e2e/idleVillage`
- `npm run test -- tests/unit/idleVillage/TestRosterPage.integration.test.tsx`
- `npm run test -- tests/e2e/idleVillage/testRoutePgCards.spec.ts --grep @slot-rack`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media: apri nota solo se sono necessarie nuove baseline Playwright non previste.

KANBAN COMPLETION
1. Stato → "Completato" con data.
2. Evidence `test-results/sr-vs-002-<YYYY-MM-DD>.log` (lint/test/build + screenshot + trace path).
3. Aggiorna `ACTIVITY_CAPSULE_TESTING_PLAN.md` con riferimento screenshot Rack Wilderness/Empire.

NOTE
- Log obbligatori: `PROJECT_PHILOSOPHY.md`, `art_direction_plan.md`, `.windsurf/plans/style-lab-flexibility-1a9890.md`, `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`, `material-canvas-v2.html`, `src/docs/docs/QA/test-route-drag-guidelines.md`.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

ANTICIPATED QUESTIONS
Q: Come gestire preferenze salvate su preset legacy?
A: Passare da `resolveSlotRackPresetId` per mappare preset legacy → Iron Bronze e loggare fallback nella telemetria.

EVIDENCE LOG
- test-results/sr-vs-002-<YYYY-MM-DD>.log
``` |
| SR-VS-003 – Slot Rack Experience Hooks & QA | Completato | Cascade | 2026-03-12 | Evidence: test-results/sr-vs-003-2026-03-12.log – Telemetry/audio hooks planned, QA suite + evidence requirements documented |
AGENT
Idle Village Telemetry & QA Specialist – Slot Rack

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Finalizzare experience hooks del Slot Rack (telemetry drop feedback, audio cues, halo/bloom tokens) e completare QA suite (unit + e2e + evidence) per il vertical slice.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/ResidentSlotRackSkin.tsx
- [esistente] src/ui/idleVillage/components/SlotRackWithSkin.tsx
- [esistente] src/ui/idleVillage/hooks/useResidentDropValidation.ts
- [esistente] src/ui/idleVillage/hooks/useSlotSounds.ts
- [nuovo] src/ui/idleVillage/utils/telemetry/slotRackTelemetry.ts (creare se assente)
- [esistente] tests/unit/idleVillage/SlotRackSkin.integration.test.tsx
- [esistente] tests/e2e/idleVillage/testRoutePgCards.spec.ts (@slot-rack)
- [esistente] test-results/guardian-deployment-log.json

STYLE LAB PRESET
- Preset: Wanderlust dual pillar, con fallback Minimal Frontier per audio/physics tokens.

TEST ROUTE QA
- Obbligatorio seguire `src/docs/docs/QA/test-route-drag-guidelines.md` (mouse reale, Pixelmatch <0.1%, trace zip).

DATO DI ORIGINE
- Documento: `~/.windsurf/plans/slot-rack-vertical-slice-3a19ab.md` – sezioni "Experience Hooks" e "Testing & QA".

DIPENDENZE
- SR-VS-001, SR-VS-002.

OPERAZIONI DA ESEGUIRE
1. Telemetria: creare/aggiornare helper per emettere `slot_rack_skin_rendered` (con `skinVersion`, `slotCount`, `scenarioId`, `pillar`, `dragState`) e nuovo evento `slot_rack_drop_feedback` (success/fail reason, payload da `useResidentDropValidation`). Iniettare negli handler di `ResidentSlotRackSkin`.
2. Audio & Physics: aggiornare `useSlotSounds` per usare tokens Style Lab (mass/damping/bloom) e associare cue drop success/fail senza valori inline.
3. Halo/Bloom: collegare CSS/Framer Motion ai tokens `interactionPhysics.shadowDepth` e `materialFeel.detail`, garantendo `data-drag-state` coerenti.
4. Testing: ampliare `SlotRackSkin.integration.test.tsx` con verifiche telemetry/audio mocks; aggiornare Playwright `@slot-rack` per assert attributi + telemetry hooking (console intercept) e salvare baseline/trace.
5. QA Evidence: eseguire pass manuale `/test` (desktop + touch), salvare screenshot/trace/PX diff, aggiornare `test-results/guardian-deployment-log.json` e creare `test-results/sr-vs-003-<date>.log` con risultati safeguarding e doc consultati.

OPERAZIONI VIETATE
- Vietato lasciare `console.log` o telemetry temporanee.
- Vietato duplicare reason stringhe: usare enum da drop validator.
- Vietato alterare contract drag/drop oltre al feedback richiesto.

ASSUNZIONI
- Telemetry provider `trackTelemetryEvent` e audio pipeline disponibili.
- SR-VS-001/002 completati forniscono renderer/harness stabile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/ui/idleVillage/hooks src/ui/idleVillage/utils tests/unit/idleVillage tests/e2e/idleVillage`
- `npm run test -- tests/unit/idleVillage/SlotRackSkin.integration.test.tsx`
- `npm run test -- tests/e2e/idleVillage/testRoutePgCards.spec.ts --grep @slot-rack`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media: segnalare solo se telemetry richiede schema backend nuovo.

KANBAN COMPLETION
1. Stato → "Completato" con data.
2. Evidence `test-results/sr-vs-003-<YYYY-MM-DD>.log` + aggiornamento `test-results/guardian-deployment-log.json`.
3. Aggiornare `slot-rack-vertical-slice` plan barrando sezione Experience/QA.

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, `art_direction_plan.md`, `.windsurf/plans/style-lab-flexibility-1a9890.md`, `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`, `material-canvas-v2.html`, `src/docs/docs/QA/test-route-drag-guidelines.md`.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

ANTICIPATED QUESTIONS
Q: Dove salvare Pixelmatch diff?
A: `test-results/vrt-diff/test-route/slot-rack/<preset>.png` come da guidelines.

EVIDENCE LOG
- test-results/sr-vs-003-<YYYY-MM-DD>.log
``` |
AGENT
Idle Village Skin Deployment Specialist – POI Capsule

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` e subito dopo la skill `idle-village-task` prima di modificare file `src/ui/idleVillage/**`. Segui filosofia config-first, Style Lab tokens e workflow `/kanban-update` per la chiusura.

OBIETTIVO
Portare la skin POI “Ambra Selvatica” (definita in `poi-skin-preview.html`) nel sistema Temporary Skin e renderla attiva sulla pagina `/test` avvolgendo la capsule/POI viewer con SkinSlot, inclusi toggle, telemetry e test.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts — esportare `TemporarySkinConfig` + helper typing partendo da `skinJson` (Zod + default export)
- [esistente] src/ui/idleVillage/skins/temporarySkinRegistry.ts — registrare la nuova skin e assicurare compatibilità con SkinManager/SkinSystemProvider
- [esistente] src/ui/idleVillage/components/ActivityCapsule.tsx — aggiungere hook/slot per montare la skin POI sui sottocomponenti SVG con data-slot previsti
- [esistente] src/ui/idleVillage/TestRosterPage.tsx — montare `SkinSlot` per la capsule POI nel pannello slot lab, wiring pillar toggles + telemetry `slot_lab_poi_skin_rendered`
- [nuovo] tests/unit/idleVillage/skins/poiAmberSkinConfig.test.ts — validare schema/config + binding selectors
- [esistente] tests/e2e/idleVillage/testRoutePgCards.spec.ts (o nuova spec `testRoutePoiSkin.spec.ts`) — aggiungere scenario @poi-skin per verificare attributi/render e catturare screenshot

STYLE LAB PRESET
- Preset: Wanderlust dual pillar (src/ui/styleLab/presets/wanderlust.ts) — documenta override `pgCardSkin`, `interactionPhysics`, `materialFeel.detail`
- Overrides/Tokens: crown/glow/stone palette via CSS vars dichiarate nella skin, mass/damping letti da Style Lab se usati in animazioni

TEST ROUTE QA
- Obbligatorio seguire `src/docs/docs/QA/test-route-drag-guidelines.md`: Playwright `dragElement`, screenshot Pixelmatch per la POI capsule, trace salvata in `test-results/traces/test-route/poi-skin-<pillar>.zip`.

DATO DI ORIGINE
- Documento: `poi-skin-preview.html` + Temporary Skin System plan (Analisi Punto per Punto) + `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`

DIPENDENZE
- TS-004 (skin system integrato nel TestRosterPage) — già Completato

OPERAZIONI DA ESEGUIRE
1. Creare `poiAmberSkinConfig.ts`: importare `TemporarySkinConfig`/schema, incollare `skinJson` convertendo i numeri in CSS vars dove necessario, aggiungere checksum/version info, esportare `POI_AMBER_SKIN_CONFIG` + helper `registerPoiSkin(manager)`.
2. Estendere `temporarySkinRegistry.ts` (o modulo equivalente) per includere la skin POI: aggiungi record `poi_wilderness_amber`, aggiorna typed map/component bindings (`POIComponent`), esponi factory/loader per SkinManager.
3. Aggiornare `ActivityCapsule.tsx`: introdurre un sub-component `PoiVisualization` con markup `<svg data-poi>` e gli elementi `data-slot='corona-glow'` ecc., quindi avvolgerlo con `SkinSlot`/SkinManager binding che riceve la config (respects `replaceContent`, `slotBindings`).
4. In `TestRosterPage.tsx`: alimentare la capsule POI tramite `poiCapsuleData`, passare `skinId`/`pillar` derivati dal toggle Style Lab, loggare `trackTelemetryEvent('slot_lab_poi_skin_rendered', { skinId, pillar, scenarioId, slotCount, timestamp })`, e aggiungere toggle UI (radix tooltip se necessario) per cambiare pillar.
5. Scrivere unit test per la config (verifica Zod schema, component slots, fallback) e per `ActivityCapsule`/`PoiVisualization` (render con SkinSlot + attributi `data-skin-id`, `data-skin-pillar`).
6. Aggiornare/creare spec Playwright che assegna residenti, attiva la capsule, cattura screenshot Wilderness/Empire (baseline sotto `test-results/vrt-baseline/test-route/poi-skin/*.png`) e verifica attributi `data-skin-id`/`data-style-lab-preset`.
7. Documentare in `docs/CAPSULE_TEST_INTEGRATION.md` o `idle_village_plan.md` la pipeline config-first della skin (opzionale se già coperto), annotando eventuali TODO Style Lab.

OPERAZIONI VIETATE
- Vietato hardcodare colori/animazioni della skin dentro componenti React: tutto deve vivere nella config + CSS vars.
- Vietato bypassare SkinSystemProvider o manipolare direttamente DOM con `document.querySelector`.
- Vietato introdurre timer/loop < 500ms o usare localStorage; persistenza solo tramite `PersistenceService`/SkinManager.

ASSUNZIONI
- Skin system (TS-004) è stabile e `SkinSlot` è disponibile.
- `TemporarySkinConfig` supporta component id `POIComponent`; se mancano tipi aggiorna schema nella stessa PR.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/ui/styleLab src/ui/idleVillage/skins tests/unit/idleVillage tests/e2e/idleVillage`
- `npm run test -- tests/unit/idleVillage/skins/poiAmberSkinConfig.test.tsx`
- `npm run test -- tests/e2e/idleVillage/testRoutePgCards.spec.ts --grep @poi-skin`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media: se SkinSlot non supporta `svg` container, apri nota nel log e proponi estensione minima prima di continuare.

KANBAN COMPLETION
1. Stato → "Completato" con data.
2. Evidence `test-results/iv-poi-skin-<YYYY-MM-DD>.log` (lint/test/build + path screenshot/trace + telemetry sample).
3. Allegare link baseline Pixelmatch e snippet config nel log.

NOTE
- Reimporta riferimenti: `src/docs/docs/PROJECT_PHILOSOPHY.md`, `src/docs/docs/plans/art_direction_plan.md`, `.windsurf/plans/style-lab-flexibility-1a9890.md`, `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`, `poi-skin-preview.html`.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

CONFIG STRUCTURE
- `TemporarySkinConfig`: { id: string; name: string; version: string; author: string; quality: 'placeholder' | 'wip' | 'final'; targetVersion: string; compatibility: string[]; htmlTemplate: string; cssStyles: string; componentSlots: Record<string, SkinSlotBinding>; colorTokens: Record<string, string | { r: number; g: number; b: number }>; filters/animation/particles metadata }.
Export: `POI_AMBER_SKIN_CONFIG` (const), `PoiSkinConfigSchema` (Zod), `registerPoiAmberSkin(manager: SkinManager)` helper.

ANTICIPATED QUESTIONS
Q: Dove colloco i CSS? A: All’interno della stringa `cssStyles` + eventuali var globali in `ActivityCapsule.css`, ma sempre tramite SkinSlot injection.
Q: Serve supporto Empire pillar? A: Sì, usa i toggle Style Lab per cambiare `metadata.pillar` o estendi config se necessario.

EVIDENCE LOG
- test-results/iv-poi-skin-<YYYY-MM-DD>.log
```
AGENT
Idle Village Reliability Specialist – Baseline Capture

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` + `idle-village-task` prima di toccare `src/ui/idleVillage/**`. Procedi senza ulteriori conferme.

OBIETTIVO
Congelare lo stato funzionante (commit 39016dd) con screenshot, log test e note per resident assignment, time engine strip e POI capsule.

FILE TARGET
- [esistente] docs/CAPSULE_TEST_INTEGRATION.md
- [nuovo] test-results/slotted-medal-phase0-baseline.log
- [esistente] tests/e2e/idleVillage/testRosterPgCards.spec.ts
- [esistente] tests/unit/idleVillage/useActivityCapsuleState.simple.test.tsx
- [esistente] docs/SLOTTED_MEDAL_IMPLEMENTATION_PLAN.md

STYLE LAB PRESET
- Minimal Frontier – documentare token osservati

TEST ROUTE QA
- Seguire `src/docs/docs/QA/test-route-drag-guidelines.md` per le catture `/test`.

DATO DI ORIGINE
- Slotted Medal Regression-Safe Rollout §Phase 0 (`/.windsurf/plans/slotted-medal-regression-plan-16665b.md`)

DIPENDENZE
- Nessuna

OPERAZIONI DA ESEGUIRE
1. Checkout commit 39016dd e annota hash nel log baseline.
2. Cattura screenshot/video per drag valido/invalid, clock strip, POI capsule (salva path nel log).
3. Esegui `npm run test -- tests/unit/idleVillage/useActivityCapsuleState.simple.test.tsx`, `npm run test -- tests/e2e/idleVillage/testRosterPgCards.spec.ts`, `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx`; incolla output nel log.
4. Aggiorna docs/CAPSULE_TEST_INTEGRATION.md con sezione “Baseline 39016dd” collegando artefatti.
5. Linka la baseline in docs/SLOTTED_MEDAL_IMPLEMENTATION_PLAN.md.

OPERAZIONI VIETATE
- Non modificare componenti applicativi.
- Non sovrascrivere baseline esistenti: creare cartelle dedicate.

ASSUNZIONI
- Commit baseline accessibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx`
- `npm run test -- tests/unit/idleVillage/useActivityCapsuleState.simple.test.tsx`
- `npm run test -- tests/e2e/idleVillage/testRosterPgCards.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

NOTE TEST SUITE COMPLETA
- **Per tutto il rollout SlottedMedal, dopo ogni safeguard sopra è obbligatorio rieseguire la suite completa TestRosterPage (unit + e2e/testRoute) prima di considerare il task concluso.**

KANBAN COMPLETION
- Stato → Completato, evidence `test-results/slotted-medal-phase0-baseline.log`, nota con hash e percorsi screenshot.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.
| IV-DRAG-FIX – Idle Village Drag Assignment Fix | Completato | Cascade | 2026-02-19 | Evidence: test-results/iv-drag-fix-2026-02-19.log — Fixed auto-assignment behavior, now requires specific slot drop |
| MG-TIME-001 – Time Engine & Day/Night Cycle Integration | Completato | 2026-02-20 | Cascade | Evidence: test-results/mg-time-001-2026-02-20.log – Time engine with ClockWidget, DayNightActionCard mini HUD, telemetry events, and config-first loop implementation |
| IV-TEST-CLEANUP – Test Harness Cleanup (Roster only + controlli essenziali) | Completato | Cascade | 2026-02-22 | Evidence: test-results/iv-test-cleanup-2026-02-22.log — HUD + telemetry cleanup, compact Time Engine card, harness logs purged. |
| IV-PICKER-PORTRAITS – Picker Portrait Parity | In corso | Cascade | 2026-02-22 | Certified/Worker picker sheets ora usano avatar condiviso con portrait reali coerenti con PgCard; snapshot e lint/test/ build eseguiti. Evidence: test-results/iv-picker-portraits-<data>.log |
| IV-ROSTER-FIX – Test Roster Fallback Data Fix | Completato | Cascade | 2026-02-26 | Evidence: test-results/iv-roster-fix-2026-02-26.log – Fixed fallback to use TEST_ROSTER_HEROES instead of MINIMAL_GAMEPLAY_RESIDENTS when localStorage is empty |
- Mantenere compatibilità con useSandboxInteractionMode per click
- Testare sia desktop che mobile interaction mode
| IV-DND-001 – ResidentSlotController Assignment Refactor | Completato | Cascade | 2026-02-22 | Scope: `src/ui/idleVillage/slots/useResidentController.ts`. Sposta `onAssign` dopo la validazione, blocca `slotId` assente e aggiorna `ResidentSlotAssignResult` + telemetry. Config refs: `IdleVillageConfig`, `SLOT_LAB_CONFIG`. Safeguards: `npm run lint -- src/ui/idleVillage/slots`, `npm run test -- tests/unit/idleVillage/TestRosterPage.integration.test.tsx`, `npm run build:check`, `npm run kanban:lint`. Evidence: `test-results/iv-dnd-001-2026-02-22.log`. |
| IV-DND-002 – DragEnd Guard & Logging | Completato | Cascade | 2026-02-22 | Scope: `src/ui/idleVillage/TestRosterPage.tsx` (`handleDragEnd`). Ritorna immediatamente se `event.over` è nullo, registra log diagnostici strutturati e rimuovi legacy. Config refs: `useResidentDropValidation`, `SLOT_LAB_CONFIG`. Safeguards: `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx`, `npm run test -- tests/e2e/idleVillage/testRosterPgCards.spec.ts --grep "outside"`, `npm run build:check`, `npm run kanban:lint`. Evidence: `test-results/iv-dnd-002-2026-02-22.log`. |
| IV-DND-003 – Scenario API Strict Contract | Completato | Cascade | 2026-02-22 | Scope: `registerScenarioApi` in `TestRosterPage.tsx`. Blocca `assignResident` se `preferredSlotId` mancante/non valido, rimuovi auto-fallback e invia `onAssignmentResult` su failure. Safeguards identici a IV-DND-002. Evidence: `test-results/iv-dnd-003-2026-02-22.log`. Dipende da IV-DND-001. |
| IV-DND-004 – Assignment Result Cleanup & Telemetry | Completato | Cascade | 2026-02-22 | Scope: `handleScenarioAssignmentResult` e `returningResidentIds`. Se `result.success` è false, azzera slot e aggiorna telemetry payload. Rimuovi `console.log` temporanei. Safeguards: `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx`, `npm run test -- tests/unit/idleVillage/TestRosterPage.integration.test.tsx`, `npm run build:check`, `npm run kanban:lint`. Evidence: `test-results/iv-dnd-004-2026-02-22.log`. Dipende da IV-DND-001. |
| IV-DND-005 – Resident Status Guard Effect | Completato | Cascade | 2026-02-22 | Scope: `useEffect` che sincronizza `residents` in `TestRosterPage.tsx`. Imposta status "away" solo per tentativi con `success: true`, fallback a "available" per drop invalidi. Safeguards: lint + unit tests come IV-DND-004, più `npm run test -- tests/e2e/idleVillage/testRosterPgCards.spec.ts --grep "outside"`. Evidence: `test-results/iv-dnd-005-2026-02-22.log`. |
| IV-DND-006 – Validation Guardrails & Cleanup Pass | Completato | Cascade | 2026-02-22 | Scope combinato (`useResidentSlotController`, `TestRosterPage.tsx`). Garantisce che `assignmentsByScenario` si aggiorni solo su success, pulisce logging temporaneo e aggiorna telemetry reason/details. Safeguards completi (lint UI dir, unit + e2e test, build, kanban). Evidence: `test-results/iv-dnd-006-2026-02-22.log`. Dipende da IV-DND-001…005. |
| TS-004 - Component Integration & /test harness | Completato | Cascade | 2026-03-04 | Scope: Integrare skin system con componenti esistenti e creare test harness. **File target**: `src/ui/idleVillage/TestRosterPage.tsx`, `src/ui/idleVillage/components/PgCard.tsx`, `src/ui/idleVillage/components/WorkerCard.tsx`, `src/ui/idleVillage/components/ActivitySlot.tsx`, `src/ui/idleVillage/skins/SkinTestHarness.tsx`, `src/ui/idleVillage/skins/SkinTestControls.tsx`. **Operazioni**: integrare skin system in TestRosterPage con dev tools, aggiungere skin binding a PgCard/WorkerCard/ActivitySlot, creare test harness per skin system, aggiungere controlli test per skin, aggiornare test route, creare test unitari. **Safeguards**: `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx src/ui/idleVillage/components/`, `npm run test -- tests/unit/idleVillage/`, `npm run build:check`, `npm run kanban:lint`. **Evidence**: `test-results/ts-004-2026-03-04.log`. |
AGENT
Idle Village Style Lab Integration Specialist – PgCard Skinning

ISTRUZIONI AGENTE
Sei un agente Windsurf: invoca `agent-execution-mandate` e subito dopo la skill `idle-village-task` prima di modificare file `src/ui/idleVillage/**`. Segui il mandato, completa la safeguard suite, aggiorna il Kanban via workflow `/kanban-update` a lavoro concluso.

OBIETTIVO
Trasportare il materiale “Medal Wanderlust” (medal4.html) in una skin Style Lab riutilizzabile per PgCard, garantendo che preset/tokens siano configurabili, documentati e referenziati dal roster canonico senza alterare la logica congelata di PgCard.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/styleLab/skins/pgCardMedal.css — modulo CSS/tokens parametrico per la skin
- [esistente] src/ui/styleLab/presets/wanderlust.ts — aggiungere sezione `pgCardSkin` con token Wilderness/Empire
- [esistente] src/ui/styleLab/config/demoConfig.ts — documentare i campi `pgCardSkin`/`materialFeel.detail`
- [esistente] src/ui/idleVillage/components/PgCard.tsx — montare classi/data-attr della skin senza modificare la logica di drag
- [esistente] src/docs/docs/idle_village/roster_slot_interaction_documentation.md — aggiornare capitolo “Style Lab tokens obbligatori” con la nuova skin e pipeline di override

STYLE LAB PRESET
- Preset: Wanderlust (`src/ui/styleLab/presets/wanderlust.ts`)
- Overrides/Tokens: `pgCardSkin.material`, `pgCardSkin.halo`, `interactionPhysics.mass`, `materialFeel.detail`, `audioHaptics.pickup`

TEST ROUTE QA
- Segui `src/docs/docs/QA/test-route-drag-guidelines.md`: usa `dragElement` con coordinate reali, aggiorna/aggiungi baseline `test-results/vrt-baseline/test-route/pgcard-medal/*.png`, e registra trace `test-results/traces/test-route/...`.

DATO DI ORIGINE
- Strategy Task MG-03 @ `src/docs/docs/coordinator/strategy_tasks.md`
- Art direction & token refs: `src/docs/docs/PROJECT_PHILOSOPHY.md`, `src/docs/docs/plans/art_direction_plan.md`, `.windsurf/plans/style-lab-flexibility-1a9890.md`, `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`, `material-canvas-v2.html`

DIPENDENZE
- WL-STY-003 (Wanderlust preset tokens)

OPERAZIONI DA ESEGUIRE
1. Creare `pgCardMedal.css` importabile come skin: estrai materiali/animazioni da `medal4.html`, sostituisci i valori grezzi con CSS custom properties (`--pgcard-metal`, `--pgcard-gem`, `--pgcard-shadow-depth`, ecc.) e documenta i token necessari in commento.
2. Estendere `wanderlust.ts` e/o preset manager con una sezione `pgCardSkin` (pillar Wilderness/Empire) che valorizza le custom properties (inclusi mass/damping da `interactionPhysics`), fornendo helper `getPgCardSkinTokens(presetId, pillar)`.
3. Aggiornare `demoConfig.ts` e gli schemi Zod affinché salvino `materialFeel.pgCardSkin` (incluse proprietà required/optional) e esporre fallback per preset sprovvisti.
4. Montare la skin in `PgCard.tsx`: applica classe radice `pgcard-skin-wanderlust` dinamica basata sui token Style Lab, propaga `data-skin`, `data-pillar`, `data-drag-state` già esistenti e collega `useMinimalStyleLabTokens`/PresetManager per recuperare le variabili; nessuna modifica alla logica di drag o audio.
5. Aggiornare `roster_slot_interaction_documentation.md` con: (a) flusso config-first per skin (Style Lab Preset → skin CSS → PgCard), (b) elenco token obbligatori e fallback, (c) istruzioni per QA/test harness.
6. (Facoltativo ma consigliato) Aggiungere entry di Storybook/Style Lab Demo che mostra la skin e come i token cambiano con pillar; documentare nel README Style Lab se necessario.

OPERAZIONI VIETATE
- Vietato modificare la logica di PgCard (drag, audio, compatibilità) oltre a classi e data-attr.
- Vietato hardcodare colori/ombre direttamente nei componenti Idle Village: tutto deve passare da Style Lab tokens/config.
- Vietato usare localStorage o API sync: persistenza solo tramite `PresetManager`/`PersistenceService`.

ASSUNZIONI
- Le strutture Style Lab (PresetManager, useMinimalStyleLabTokens) sono disponibili e funzionanti.
- Il preset Wanderlust verrà esteso in WL-STY-003, quindi questa skin può dipendere da quei token.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/styleLab src/ui/idleVillage/components/PgCard.tsx src/docs/docs/idle_village`
- `npm run test -- tests/unit/styleLab/WanderlustPreset.test.tsx tests/unit/idleVillage/PgCardSkin.test.tsx` (creare smoke test se assente)
- `npm run test -- tests/e2e/styleLab/styleLabDemoPresetSwitch.spec.ts --grep @test-route`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media: dopo aver estratto la skin e collegato i token, condividi screenshot/log nel report se incontri mismatch tra pillar; altrimenti procedi in autonomia.

KANBAN COMPLETION
1. Aggiorna la riga Kanban → "Completato" con data.
2. Crea evidence `test-results/mg-03-skin-<YYYY-MM-DD>.log` (lint/test/build + estratti Playwright/visual baseline).
3. Allegare screenshot/Storybook link che dimostri entrambe le varianti Wilderness/Empire.

NOTE
- Riutilizza i gradienti/materiali di `material-canvas-v2.html` e `medal4.html`, ma mantienili parametrici via CSS vars.
- Aggiorna eventuali file README/STYLELAB se aggiungi nuovi token pubblici.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

### PL-REG – Physics Lab Component Registry & Sidebar Controls

```text
AGENTE
Component Registry Specialist

ISTRUZIONI AGENTE
Richiama `agent-execution-mandate` e `coordinator-mandate`. Assicurati che PL-ARCH sia stato completato e disponibile sul branch di integrazione. Operare con approccio config-first e rispetto della Style Laboratory Philosophy.

OBIETTIVO
Estrarre i componenti del Physics Lab in un registro riusabile, pubblicare lo schema verso il Style Lab Registry Service e implementare la nuova sidebar a tab (Physics, Materials, FX, Outcome) con import/export JSON diff-aware.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/styleLab/physicsLab/components/LabPanel.tsx
- [nuovo] src/ui/styleLab/physicsLab/components/TactileCard.tsx
- [nuovo] src/ui/styleLab/physicsLab/components/SunkenSlot.tsx
- [nuovo] src/ui/styleLab/physicsLab/components/GoldButton.tsx
- [nuovo] src/ui/styleLab/physicsLab/components/FloatText.tsx
- [nuovo] src/ui/styleLab/physicsLab/components/LabControlsSidebar.tsx
- [nuovo] src/ui/styleLab/physicsLab/registry/physicsLabRegistry.ts (JSON schema export)
- [nuovo] src/ui/styleLab/physicsLab/api/registryPublisher.ts (stub HTTP client)
- [esistente] src/ui/styleLab/physicsLab/PhysicsLabApp.tsx (montare componenti)
- [esistente] src/ui/styleLab/config/physicsPresets.ts (consumo schema)

STYLE LAB PRESET
- Usa Gilded Observatory come base; assicurati che i componenti possano cambiare preset in runtime tramite provider.

DATO DI ORIGINE
- `/.windsurf/plans/physics-lab-style-lab-plan-8c890c.md` – Workstream B e Implementation Plan Phase 2.

DIPENDENZE
- Richiede PL-ARCH completato (per scaffold e preset schema).

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- PL-REG` → Kanban "In corso".
1. Estrarre i blocchi UI principali di `PhysicsLabApp` in componenti dedicati sotto `components/` con props digitate e JSDoc obbligatori.
2. Creare `LabControlsSidebar` con tab: Physics, Materials, FX, Outcomes. Ogni tab legge dati da config (es. `physicsPresets.ts`, `styleLabMaterials.ts`).
3. Implementare import/export JSON: upload (file + paste), diff viewer tra preset corrente e importato, error handling (Zod).
4. Pubblicare i metadati componenti in `registry/physicsLabRegistry.ts`, includendo `componentId`, `propsSchema`, `tokensUsed`, `audioHooks`. Implementare `registryPublisher.ts` con funzione `pushToStyleLabRegistry(endpoint, payload)` (HTTP POST stub, nessuna chiamata reale ma logging).
5. Aggiornare `PhysicsLabApp` per usare solo i nuovi componenti e per inviare aggiornamenti del registry tramite hook (feature flag `ENABLE_LAB_REGISTRY_PUBLISH`).
6. Scrivere test RTL/unit per la sidebar (tab switching, import diff) e per il registry payload.
7. Documentare in `src/ui/styleLab/physicsLab/README.md` la struttura del registry e i passaggi per pubblicarlo.
8. Safeguard suite + evidence `test-results/pl-reg-<date>.log`.

OPERAZIONI VIETATE
- Non aggiungere funzionalità FX/audio (delegare a PL-FX/PL-AUD).
- Vietato usare fetch reale: il publisher deve essere stub con log.
- Vietato duplicare config presenti in `designSystem.ts` o `physicsPresets.ts`.

ASSUNZIONI
- Registry Service REST endpoint verrà fornito successivamente; usare `process.env.STYLELAB_REGISTRY_URL ?? ''`.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/styleLab/physicsLab/components src/ui/styleLab/physicsLab/registry`
- `npm run test -- src/ui/styleLab/__tests__/PhysicsLabSidebar.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media. Ping solo se mancano informazioni sui campi del registry.

KANBAN COMPLETION
Aggiorna stato → "Completato" con Evidence `test-results/pl-reg-<date>.log`.

NOTE
- Etichetta i TODO come `TODO(PL-FX)` o `TODO(PL-AUD)` quando tocchi elementi futuri.

EVIDENCE LOG
- `test-results/pl-reg-<date>.log`
```

### PL-FX – Physics Lab FX & Shader Stack

```text
AGENTE
FX & Shader Lead

ISTRUZIONI AGENTE
Consulta `agent-execution-mandate` + `coordinator-mandate`. Richiede output PL-ARCH + PL-REG. Segui Game Feel Bible/Asterism V2 linee guida.

OBIETTIVO
Integrare particle engine, CustomCursorLayer e pannelli shader (liquid gauge, fog slot, foil card) con parametri esportabili e fallback WebGL2.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/styleLab/physicsLab/fx/particleEngineDemo.tsx
- [nuovo] src/ui/styleLab/physicsLab/fx/cursorPresets.ts
- [nuovo] src/ui/styleLab/physicsLab/fx/shaders/liquidGaugeShader.ts
- [nuovo] src/ui/styleLab/physicsLab/fx/shaders/fogSlotShader.ts
- [nuovo] src/ui/styleLab/physicsLab/fx/shaders/foilCardShader.ts
- [nuovo] src/ui/styleLab/physicsLab/fx/hooks/useWebGPUFallback.ts
- [nuovo] src/ui/styleLab/physicsLab/fx/FxControlPanel.tsx
- [esistente] PhysicsLabApp.tsx (montare pannello FX)
- [esistente] physicsPresets.ts (aggiungere campi `fxProfile`)

STYLE LAB PRESET
- Usa palette/tokens da Asterism V2 e Style Lab tokens per FX.

DATO DI ORIGINE
- `/.windsurf/plans/physics-lab-style-lab-plan-8c890c.md` – Workstream C e Implementation Phase 3.

DIPENDENZE
- PL-ARCH + PL-REG completati.

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- PL-FX` → Kanban.
1. Collegare `particleEngine` demo (resource fly-to, completion burst, stone shatter) con controlli per densità, lifetime, colore, draw mode. Configurare salvataggio parametri nel preset `fxProfile`.
2. Integrare `CustomCursorLayer` con preset (gauntlet, arcane wand, sword), includendo slider per trail length, glow, easing.
3. Implementare shader WebGPU (liquid gauge, fog slot, foil card) con fallback `useWebGPUFallback` (WebGL2). Exporre parametri (viscosity, turbulence, foil shimmer) e bottone export (JSON snippet) per Asterism.
4. Aggiornare UI con pannello FX nel sidebar tab FX (coordinarsi con PL-REG) e con preview inline.
5. Prevedere flag `ENABLE_FX_PERF_MODE` che limita densità per stress testing.
6. Scrivere test (unit + visual snapshot) per controlli slider e fallback detection (mock `navigator.gpu`).
7. Aggiornare README con sezione FX/Shader.
8. Safeguards + evidence `test-results/pl-fx-<date>.log`.

OPERAZIONI VIETATE
- Vietato bypassare preset schema: ogni parametro deve passare da `fxProfile`.
- Vietato introdurre librerie non approvate senza nota (solo WebGPU/WebGL2 + libs già nel repo).

ASSUNZIONI
- Browser target supporta WebGPU (Chrome/Edge); fallback per Safari/WebView via WebGL2 necessario.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/styleLab/physicsLab/fx`
- `npm run test -- src/ui/styleLab/__tests__/PhysicsLabFx.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media; ping FX director solo per shader non coperti dal piano.

KANBAN COMPLETION
Stato → "Completato"; evidence `test-results/pl-fx-<date>.log`.

NOTE
- Annotare `TODO(PL-AUD)` per suoni che reagiscono ai FX.

EVIDENCE LOG
- `test-results/pl-fx-<date>.log`
```

### PL-STB – Physics Lab Storybook & Accessibility Suite

```text
AGENTE
Storybook & Accessibility Engineer – Physics Lab Documentation Specialist

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate`, poi `coordinator-mandate`. Questo prompt dipende da PL-ARCH e PL-REG completati. Focus su Storybook mirror e accessibility tooling.

OBIETTIVO
Creare suite Storybook completa per Physics Lab con visual regression testing, accessibility audit, e documentation generation per tutti i componenti.

PROMPT READINESS
FILE TARGET
- [nuovo] .storybook/main.js (config Storybook per Physics Lab)
- [nuovo] .storybook/preview.js (Style Lab theme integration)
- [nuovo] src/ui/styleLab/physicsLab/stories/PhysicsLabApp.stories.tsx
- [nuovo] src/ui/styleLab/physicsLab/stories/ParticleEngine.stories.tsx
- [nuovo] src/ui/styleLab/physicsLab/stories/CursorAvatar.stories.tsx
- [nuovo] src/ui/styleLab/physicsLab/stories/ShaderPanel.stories.tsx
- [nuovo] scripts/physicsLab/storybookVisualDiffs.ts
- [nuovo] tests/accessibility/physicsLab/accessibilityAudit.spec.ts
- [esistente] src/ui/styleLab/physicsLab/PhysicsLabApp.tsx (sola lettura)
- [esistente] src/ui/styleLab/StyleLaboratoryPanel.tsx (sola lettura)

STYLE LAB PRESET
- Preset: Gilded Observatory (Storybook theme)
- Overrides: high contrast modes, reduced motion, large text variants

DATO DI ORIGINE
- PL-ARCH completato (React components)
- PL-REG completato (Component Registry)
- Style Laboratory Philosophy per accessibility

DIPENDENZE
- PL-ARCH (Physics Lab Scaffold & Token Bridge)
- PL-REG (Component Registry & Sidebar Controls)

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- PL-STB` e Kanban → "In corso".
1. Configurare Storybook per Physics Lab:
   - Setup `.storybook/main.js` con paths per Physics Lab components
   - Integrare Style Laboratory theme in `.storybook/preview.js`
   - Configurare addon essentials (controls, actions, docs)
   - Abilitare visual regression testing con Chromatic
2. Creare stories per tutti i componenti Physics Lab:
   - `PhysicsLabApp.stories.tsx` con preset variants e ChaosMode
   - `ParticleEngine.stories.tsx` con particle configurations
   - `CursorAvatar.stories.tsx` con cursor states e effects
   - `ShaderPanel.stories.tsx` con shader parameter controls
   - Interactive controls per tutti i parametri config
3. Implementare visual regression testing:
   - Script `storybookVisualDiffs.ts` per screenshot comparison
   - Integration con Chromatic per CI/CD
   - Baseline generation per cross-browser testing
   - Performance monitoring per Storybook build
4. Creare accessibility audit suite:
   - Playwright test `accessibilityAudit.spec.ts` per WCAG compliance
   - Axe-core integration per automated accessibility testing
   - Keyboard navigation testing per tutti i componenti
   - Screen reader testing con NVDA/JAWS simulation
5. Documentation generation:
   - Auto-generate component docs da stories
   - Accessibility guidelines per Physics Lab
   - Visual design system documentation
   - Interactive examples e playground
6. Integration con Style Laboratory:
   - Theme switching in Storybook (Gilded, Minimal, Obsidian)
   - Token documentation live preview
   - Design system consistency validation
7. Test coverage e validation:
   - Storybook build verification
   - Visual regression baseline stability
   - Accessibility compliance reporting
   - Cross-browser compatibility testing
8. Eseguire safeguard suite e salvare `test-results/pl-stb-<data>.log`.

OPERAZIONI VIETATE
- Vietato creare stories senza controlli interattivi
- Vietato skip accessibility testing per qualsiasi componente
- Vietato hardcodare theme values: usare Style Lab tokens
- Vietato introdurre dipendenze Storybook che compromettono build

ASSUNZIONI
- Storybook già configurato per il progetto principale
- Chromatic/Playwright disponibili per visual testing
- Style Laboratory theme già definito

REGRESSION SAFEGUARDS
- `npm run lint -- .storybook src/ui/styleLab/physicsLab/stories scripts/physicsLab/storybookVisualDiffs.ts`
- `npm run test -- tests/accessibility/physicsLab/accessibilityAudit.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia alta: ping solo se Storybook configuration conflicts con build principale.

KANBAN COMPLETION
1. Stato → "Completato" con data.
2. Evidence `test-results/pl-stb-<data>.log` con Storybook build + test results.
3. Note con link Chromatic e accessibility report.

NOTE
- Integrare con PL-EVD per automated evidence collection
- Preparare template per futuri componenti Physics Lab
- Documentare Storybook best practices per team

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo problemi build Storybook.

EVIDENCE LOG
- test-results/pl-stb-<data>.log
```

### PL-AUD – Physics Lab Audio & Haptics Harness

```text
AGENTE
Audio/Haptics Integrator

ISTRUZIONI AGENTE
Richiama `agent-execution-mandate`/`coordinator-mandate`. Dipende da PL-ARCH e PL-REG; leggere PL-FX per sincronizzare cues.

OBIETTIVO
Implementare `useAudioCueConfig`, AudioWorklet throttling, spam-test control e stub `labHapticsBridge` per future periferiche.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/styleLab/physicsLab/audio/usePhysicsLabAudio.ts
- [nuovo] src/ui/styleLab/physicsLab/audio/PhysicsAudioPanel.tsx
- [nuovo] src/ui/styleLab/physicsLab/audio/haptics/labHapticsBridge.ts
- [nuovo] public/audio/physics-lab/* (manifest JSON) – se necessario
- [esistente] PhysicsLabApp.tsx (aggiungere pannello/audio hooks)
- [esistente] physicsPresets.ts (aggiungere `audioProfile`)

STYLE LAB PRESET
- Usa palette sonora definita in Game Feel Bible cap. 8-10 (thud, shimmer, slot snap).

DATO DI ORIGINE
- `/.windsurf/plans/physics-lab-style-lab-plan-8c890c.md` – Workstream C punto 4.

DIPENDENZE
- PL-ARCH, PL-REG. Coordina con PL-FX per hooking degli eventi.

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- PL-AUD`.
1. Implementare `usePhysicsLabAudio` basato su AudioWorklet con coda di richieste e limitatore (max N cue simultanee, default 4). Configurare suoni per: button press, drag start, slot snap, float text spawn.
2. Creare `PhysicsAudioPanel` (tab Materials/FX) con controlli di volume, ducking, sound pack selection (Gilded, Obsidian, Blizzard) e spam-test button.
3. Implementare `labHapticsBridge` con interfaccia generica (`enqueueHapticPattern`, `clearQueue`). Per ora loggare pattern; TODO per device concreti.
4. Aggiornare preset schema (`audioProfile`) e UI per mostrare i parametri attivi.
5. Integrare telemetry hook (stub) che invia `physics_lab_audio_event` (non reale, ma log per PL-TEL). Documentare payload.
6. Testare via Vitest (AudioWorklet mocking) e snapshot per pannello UI.
7. Safeguards + evidence `test-results/pl-aud-<date>.log`.

OPERAZIONI VIETATE
- Vietato riprodurre audio direttamente da componenti senza passare dal hook.
- Vietato utilizzare API sync/legacy (solo AudioContext + AudioWorklet).

ASSUNZIONI
- Asset audio già presenti in repo o mock; se mancanti, usare stub e TODO con riferimento a Audio team.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/styleLab/physicsLab/audio`
- `npm run test -- src/ui/styleLab/__tests__/PhysicsLabAudio.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media. Ping se servono nuovi asset audio.

KANBAN COMPLETION
Stato → "Completato"; evidence `test-results/pl-aud-<date>.log`.

NOTE
- Inserire `TODO(PL-TEL)` dove gli eventi audio dovranno agganciarsi alla telemetria reale.

EVIDENCE LOG
- `test-results/pl-aud-<date>.log`
```

### PL-EVD – Physics Lab Evidence Automation & Guardian Handoff

```text
AGENTE
Guardian Automation Engineer – Physics Lab Evidence & Deployment Specialist

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate`, poi `coordinator-mandate`. Questo prompt dipende da tutti gli altri PL completati. Focus su automazione evidence e handoff Guardian.

OBIETTIVO
Implementare automazione completa per evidence collection, log aggregation, e Guardian handoff per tutto il Physics Lab implementation plan.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/physicsLab/evidenceCollector.ts
- [nuovo] scripts/physicsLab/logAggregator.ts
- [nuovo] scripts/guardian/physicsLabHandoff.ts
- [nuovo] src/analytics/physicsLab/evidenceLogger.ts
- [nuovo] test-results/physicsLab/implementationSummary.md
- [esistente] Tutti i test-results/pl-*.log precedenti (sola lettura)
- [esistente] scripts/guardian/ (estensione handoff esistenti)

STYLE LAB PRESET
- Preset: -
- Overrides: -

DATO DI ORIGINE
- Tutti i prompt PL completati (ARCH, REG, FX, AUD, TEL, STB, ASSET)
- Guardian mandate per evidence logging
- RPG Balancer philosophy per automazione

DIPENDENZE
- PL-ARCH, PL-REG, PL-FX, PL-AUD, PL-TEL, PL-STB, PL-ASSET (tutti completati)

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- PL-EVD` e Kanban → "In corso".
1. Implementare `evidenceCollector.ts`:
   - Scansione automatica di tutti `test-results/pl-*.log`
   - Parsing e estrazione di safeguard results
   - Generazione summary table con completion status
   - Validazione evidence log completeness
   - Export JSON/Markdown per reporting
2. Implementare `logAggregator.ts`:
   - Aggregazione logs da tutti i componenti Physics Lab
   - Performance metrics collection (build times, test duration)
   - Error categorization e counting
   - Trend analysis per implementation progress
   - Integration con telemetry provider esistente
3. Implementare `physicsLabHandoff.ts`:
   - Guardian script per deploy verification
   - Pre-deployment health check per Physics Lab
   - Post-deployment validation suite
   - Rollback automation se necessario
   - Integration con Vercel deploy pipeline
4. Creare `evidenceLogger.ts`:
   - Centralized logging per Physics Lab operations
   - Structured logging con schema Zod
   - Integration con analytics pipeline
   - Performance monitoring hooks
   - Debug mode per development
5. Generare `implementationSummary.md`:
   - Complete implementation overview
   - Component inventory con status
   - Performance benchmarks
   - Known issues e limitations
   - Next steps e maintenance plan
6. Test automation suite:
   - Unit tests per tutti gli script di automazione
   - Integration tests per evidence collection
   - End-to-end test per handoff completo
   - Performance regression testing
7. Documentation e handoff:
   - Guardian runbook per Physics Lab maintenance
   - Troubleshooting guide per common issues
   - Performance baseline documentation
   - Contact escalation matrix
8. Eseguire safeguard suite finale e salvare `test-results/pl-evd-<data>.log`.

OPERAZIONI VIETATE
- Vietato modificare evidence logs esistenti (sola lettura)
- Vietato introdurre dipendenze esterne senza fallback
- Vietato hardcodare path: usare config-driven approach
- Vietato skip validation per qualsiasi componente

ASSUNZIONI
- Tutti i PL prompts hanno evidence logs completi
- Guardian scripts esistenti possono essere estesi
- Vercel deploy pipeline disponibile

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/physicsLab scripts/guardian src/analytics/physicsLab`
- `npm run test -- scripts/physicsLab/__tests__ scripts/guardian/__tests__`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia alta: ping solo se evidence logs mancanti o corrotti.

KANBAN COMPLETION
1. Stato → "Completato" con data.
2. Evidence `test-results/pl-evd-<data>.log` con safeguard suite finale.
3. Note con handoff status e Guardian approval.

NOTE
- Questo è l'ultimo prompt del Physics Lab implementation plan
- Tutti i componenti devono essere production-ready dopo questo prompt
- Preparare template per futuri implementation plan simili

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo problemi critici Guardian.

EVIDENCE LOG
- test-results/pl-evd-<data>.log
```

### PL-TEL – Physics Lab Telemetry + Performance HUD

```text
AGENTE
Telemetry & Observability Engineer

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` + `coordinator-mandate`. Dipende da PL-ARCH (hook) e deve coordinarsi con PL-AUD/PL-FX per eventi.

OBIETTIVO
Implementare eventi `physics_lab_loaded/adjusted/preset_applied/export_blocked`, HUD con FPS/CPU/audio/haptic concurrency e export gating quando FPS <60 o CPU >8 ms.

PROMPT READINESS
FILE TARGET
- [nuovo] src/analytics/styleLab/physicsLabTelemetry.ts
- [nuovo] src/ui/styleLab/physicsLab/hooks/usePhysicsLabTelemetry.ts
- [nuovo] src/ui/styleLab/physicsLab/components/PerformanceHud.tsx
- [nuovo] src/ui/styleLab/physicsLab/utils/perfBudget.ts
- [esistente] PhysicsLabApp.tsx (montare HUD + inviare eventi)
- [esistente] physicsPresets.ts (aggiungere metadati `lastEvidenceHash` integration)

STYLE LAB PRESET
- Nessun preset aggiuntivo; HUD deve leggere palette dalle tokens correnti.

DATO DI ORIGINE
- `/.windsurf/plans/physics-lab-style-lab-plan-8c890c.md` – Workstream D punti 2-3, Implementation Phase 4.

DIPENDENZE
- PL-ARCH, PL-AUD (per counters), PL-FX (per stress toggle input).

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- PL-TEL`.
1. Definire in `physicsLabTelemetry.ts` gli eventi (Zod schema) e funzioni helper `logPhysicsLabEvent(eventType, payload)` integrate con TelemetryProvider.
2. Implementare `usePhysicsLabTelemetry` hook che registra: load, preset apply, slider change (aggregato), export attempt, export block (motivo, fps, cpu, concurrency).
3. Creare `PerformanceHud` overlay con FPS (requestAnimationFrame), CPU ms (PerformanceObserver), audio/haptic concurrency (dati dalle queue PL-AUD), togglable via UI.
4. Implementare gating: quando FPS mediana <60 o CPU >8 ms per 3 secondi, blocca `exportPreset` e mostra banner + log evento `physics_lab_export_blocked`.
5. Salvare log session in `test-results/physics-lab-<date>.log` (aggiornare `usePhysicsLabSync`).
6. Scrivere test per hook (mock TelemetryProvider) e per gating logic.
7. Safeguards + evidence `test-results/pl-tel-<date>.log`.

OPERAZIONI VIETATE
- Vietato inviare eventi fuori da TelemetryProvider standard.
- Vietato leggere direttamente dal DOM: usare refs/react state.

ASSUNZIONI
- TelemetryProvider disponibile in stile app; se non montato, loggare su console con warning.

REGRESSION SAFEGUARDS
- `npm run lint -- src/analytics/styleLab src/ui/styleLab/physicsLab`
- `npm run test -- src/ui/styleLab/__tests__/PhysicsLabTelemetry.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media; ping Guardian solo per nuovi eventi non previsti.

KANBAN COMPLETION
Stato → "Completato"; evidence `test-results/pl-tel-<date>.log`.

NOTE
- Annotare `TODO(PL-EVD)` per l’integrazione con i log finali.

EVIDENCE LOG
- `test-results/pl-tel-<date>.log`
```

| Prompt ID/Descrizione | Stato | Agente | Data | Note |
| --- | --- | --- | --- | --- |
| MG-FIX-NONRENDER-001 – Error Boundary & PersistenceService Investigation | In corso | Cascade | 2026-02-14 | Started investigation |

### NP-MIN-STYLE-001 – Minimal Gameplay Style Lab Compliance

```text
AGENTE
StyleLab-Orchestrator – Idle Village Theme Specialist

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate`, poi carica `idle-village-task`. Per questo prompt applica anche la nuova sezione “Domain Non-Negotiables” nella skill del coordinator: UI Style Laboratory totale, config-first, persistence/telemetry garantite. Nessun riferimento residuo a Gilded Observatory.

OBIETTIVO
Portare la MinimalGameplayPage e i componenti correlati a usare esclusivamente Style Laboratory provider, token e componenti base (Surface, Stack, Typography), eliminando classi/gradient legacy e assicurando che il tema sia controllato via config/tokens.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/ui/idleVillage/components/minimal/ActionToolbar.tsx
- [esistente] src/ui/idleVillage/components/WorkerPanel.tsx
- [esistente] src/ui/idleVillage/components/ActivitySlot.tsx (solo per props visual)
- [esistente] src/ui/styleLab/** (provider, tokens)
- [esistente] src/styles/heroic.css (verifica residui)
- [esistente] tests/unit/idleVillage/MinimalGameplayPage.test.tsx

DIPENDENZE
- MG-03 completato (roster pronto)
- MG-06 in corso (coordinarsi per non rompere Drag & Drop)

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- NP-MIN-STYLE-001` e imposta Kanban → “In corso”.
1. Mappa tutte le classi/inline styles legacy (`observatory-page`, gradient manuali, font fallback) usati in MinimalGameplayPage e ActionToolbar. Documenta la lista nel commit/nota.
2. Avvolgi la pagina nel provider Style Laboratory corretto (`StyleLaboratoryPanel` o `StyleLabSurface`) e sostituisci layout container con componenti Style Lab (Surface, Stack, Grid) usando token per spacing, radius, borders.
3. Aggiorna ResourceTicker/WorkerPanel/ActionToolbar per leggere i token (card radius, colors) direttamente da `minimalConfig.ui.tokens` e mapparli su CSS custom properties Style Lab invece di valori inline.
4. Rimuovi tutte le classi `observatory-*` e gradient hardcoded da `heroic.css`/pagina; se servono nuove varianti, aggiungile sotto Style Lab config (`src/ui/styleLab/presets`).
5. Aggiorna la configurazione `minimalConfig.ts` se servono campi extra (es. `ui.styleLabPreset`, `ui.surfaceTokens`); documenta schema/tipo.
6. Adegua i test RTL (`MinimalGameplayPage.test.tsx`) per verificare che il wrapper Style Lab sia presente (`data-testid` o ruolo) e che i token (radius, background) derivino dal config.
7. Esegui lint/test/build + `npm run kanban:lint`; salva evidence `test-results/np-min-style-001-<data>.log` con tutti gli output.

OPERAZIONI VIETATE
- Vietato reintrodurre gradient/custom CSS non definiti nello Style Lab.
- Vietato modificare la logica DnD o persistence (se non per aggiornare props visuali).
- Vietato lasciare variabili CSS senza fallback config-first.

ASSUNZIONI
- Style Laboratory supporta già preset Idle Village (se missing, aggiungerli in `src/ui/styleLab`).
- WorkerPanel/ActionToolbar accettano override `className`/`style` per tokens; se mancano, aggiungi prop di theme injection.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/ui/styleLab src/styles`
- `npm run test:unit -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media: ping solo se i componenti Style Lab non coprono i layout necessari o se emergono conflitti con MG-06.

KANBAN COMPLETION
1. Stato → “Completato”.
2. Evidence `test-results/np-min-style-001-<data>.log` con lint/test/build/kanban.

NOTE
- Aggiorna la documentazione `minimal_gameplay_implementation_plan.md` se l’adozione Style Lab introduce nuove sezioni/tokens.
- Inserisci screenshot (opzionale) in `test-results/` per futuri baseline visual.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/np-min-style-001-<data>.log
```

### NP-MIN-STYLE-002 – Observatory Class Removal & Style Lab Tokens

```text
AGENTE
StyleLab-Refactorer – CSS Decommission Specialist

ISTRUZIONI AGENTE
Consulta `agent-execution-mandate` e `idle-village-task`. Applica tutte le regole "Domain Non-Negotiables" (UI Style Lab, config-first, RNG/persistence/telemetry). Questo prompt dipende da NP-MIN-STYLE-001: assicurati che il provider Style Lab sia già attivo prima di rimuovere le classi legacy.

OBIETTIVO
Eliminare ogni classe `observatory-*` e import legacy dal runtime (`src/**`) sostituendoli con componenti/tokens Style Lab. Dopo il refactor, `rg "observatory-" src/ui src/styles/index.css` deve restituire zero risultati nei file caricati dall’app.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/ui/idleVillage/components/** (WorkerPanel, ActivitySlot, ResourceTicker, ecc. – per props visual)
- [esistente] src/ui/balancing/** (StressTestDashboard, MonteCarlo UI) – verificare eventuali observatory wrapper
- [esistente] src/index.css (rimuovere layer observatory)
- [esistente] src/styles/observatory.css (solo se ancora importato)
- [esistente] tests/unit/**/MinimalGameplayPage.test.tsx (aggiornare snapshot/assert)

DIPENDENZE
- NP-MIN-STYLE-001 (Style Lab provider/tokens già operativi)

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- NP-MIN-STYLE-002` → Kanban “In corso”.
1. Esegui inventario `rg "observatory-" src/ -n` e allega l’elenco al commit/log.
2. Per ogni componente/ pagina con classi legacy:
   - sostituisci `className="observatory-page ..."` con superfici Style Lab (`StyleLabSurface`, `useStyleLabTokens`).
   - mappa gradient/background/border su token `minimalConfig.ui.tokens` o preset Style Lab.
3. Aggiorna `src/index.css` rimuovendo il blocco `@layer components { .observatory-* }`; se servono nuove variabili globali, definirle tramite Style Lab tokens.
4. Verifica che `src/styles/observatory.css` non sia più importato da alcun file; se rimane un import, sostituiscilo con preset Style Lab equivalenti.
5. Aggiorna i test RTL/snapshot per riflettere le nuove classi/roles (es. cercare `data-testid="style-lab-surface"`).
6. Rilancia `rg "observatory-" src/ -n`: deve riportare solo file doc/archivio. Includi l’output nel log evidence.
7. Safeguard: lint/test/build/kanban.

OPERAZIONI VIETATE
- Non rimuovere CSS se il componente non ha ancora equivalente Style Lab.
- Vietato lasciare gradient inline: tutto passa da tokens/preset.
- Non modificare logica di gioco/drag-drop se non necessario per props di stile.

ASSUNZIONI
- Style Lab dispone di preset/palette necessari (aggiungere se mancanti in `src/ui/styleLab/presets`).
- Tests possono essere aggiornati usando `within`/`getByRole` per i nuovi container.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui src/styles`
- `npm run test -- tests/unit/idleVillage tests/unit/balancing`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media. Escalare solo se qualche superficie necessita nuovi componenti Style Lab non ancora progettati.

KANBAN COMPLETION
1. Stato → “Completato”.
2. Evidence `test-results/np-min-style-002-<data>.log` con inventario iniziale/finale e safeguard output.

NOTE
- Documenta eventuali token aggiunti in `styleLab/presets` e menziona i preset usati nei commenti/test.
- Prepara lista file rimasti con “observatory” (doc, _OLD_DEPRECATED) per il prompt successivo.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/np-min-style-002-<data>.log
```

### NP-MIN-STYLE-003 – Observatory CSS Archival & Documentation Update

```text
AGENTE
Legacy-Archivist – Documentation & CSS Cleanup

ISTRUZIONI AGENTE
Carica `agent-execution-mandate` e `idle-village-task`. Assicurati che NP-MIN-STYLE-002 sia Completato (nessuna referenza runtime). Questo prompt sposta i CSS legacy in `_OLD_DEPRECATED/` e aggiorna la documentazione (tech direction, regressioni, piani) per riflettere la deprecazione definitiva.

OBIETTIVO
Archiviare tutti i file CSS observatory (index.old.css, observatory.css, color-palette.css, fantasy-theme.css, blocchi in index.css) sotto `_OLD_DEPRECATED/styles/…` e aggiornare i documenti perché indicano Style Laboratory come unico tema. Registrare l’operazione in `IMPLEMENTED_PLAN.md` seguendo il piano di decommissioning.

PROMPT READINESS
FILE TARGET
- [esistente] src/index.css
- [esistente] src/styles/observatory.css
- [esistente] src/styles/color-palette.css
- [esistente] src/styles/fantasy-theme.css
- [nuovo] _OLD_DEPRECATED/styles/observatory/ (cartella archivio)
- [esistente] docs/docs/archmage/TechnicalDirection.md
- [esistente] docs/docs/archmage/ArtDirection_Wanderlust.md
- [esistente] docs/docs/ui_regressions/stress_test_dashboard.md
- [esistente] docs/docs/plans/idle_village_map_plan.md (e altri piani con tema Gilded)
- [esistente] docs/IMPLEMENTED_PLAN.md

DIPENDENZE
- NP-MIN-STYLE-002 (nessun uso runtime di observatory class)

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- NP-MIN-STYLE-003` → Kanban “In corso”.
1. Conferma con `rg "observatory-" src/ -n` che non ci siano file runtime; salva l’output nel log.
2. Sposta i file CSS legacy in `_OLD_DEPRECATED/styles/observatory/*.css` mantenendo la struttura (crea cartella se assente). Aggiorna eventuali import rimasti (devono sparire).
3. Rimuovi dal bundle principale ogni riferimento a quei file (es. `import './styles/observatory.css';`).
4. Aggiorna i documenti (tech direction, art direction, piani UI) sostituendo “Gilded Observatory” con “Style Laboratory” e descrivendo l’archiviazione.
5. Aggiorna `docs/IMPLEMENTED_PLAN.md` sezione decommission plan con:
   - elenco file spostati,
   - data,
   - prompt ID,
   - log comandi (inventario, lint, build).
6. Re-esegui `rg "observatory"` includendo `docs/` per verificare che solo `_OLD_DEPRECATED/` o note storiche lo contengano; allega l’esito.
7. Safeguard: lint/build/kanban (non serve test UI se non toccati, ma run almeno `npm run lint -- docs src` + `npm run build:check`).

OPERAZIONI VIETATE
- Non eliminare definitivamente i CSS: devono vivere in `_OLD_DEPRECATED/` come referenza storica.
- Non lasciare riferimenti a Style Lab mancanti nei docs.
- Non modificare altri file oltre a quelli coinvolti nella decommission.

ASSUNZIONI
- `_OLD_DEPRECATED/` è già tracciata in repo (se no, crearla e documentare).
- `IMPLEMENTED_PLAN.md` ha sezione “Legacy Observatory CSS Decommission” da aggiornare (altrimenti crearla).

REGRESSION SAFEGUARDS
- `npm run lint -- src docs`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media; ping solo se qualche doc deve mantenere riferimenti storici al tema (in tal caso, aggiungi nota “legacy reference”).

KANBAN COMPLETION
1. Stato → “Completato”.
2. Evidence `test-results/np-min-style-003-<data>.log` con output inventario → spostamento → lint/build/kanban.

NOTE
- Allegare screenshot/estratti dei doc aggiornati se utile.
- Ricordare di citare nel log che i CSS vivono ora in `_OLD_DEPRECATED/` e non sono più nel bundle.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/np-min-style-003-<data>.log
```

### NP-MIN-STYLE-004 – Minimal Gameplay Roster/Slot Rewire

```text
AGENTE
IdleVillage-Hotfixer – Emergency Integration Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` e `idle-village-task`. Questo è un prompt d’emergenza: devi riutilizzare i componenti **già esistenti** (`src/ui/idleVillage/components/WorkerPanel.tsx`, `WorkerCard.tsx`, `ActivitySlot.tsx`, `LocationCard.tsx`). Vietato creare nuove varianti: montiamo quelli reali nella MinimalGameplayPage con Style Lab tokens/config.

OBIETTIVO
Sostituire i componenti “Minimal” temporanei della pagina MinimalGameplay con i componenti ufficiali Idle Village (WorkerPanel + ActivitySlot). Devono leggere dati/config dal MinimalGameplayConfig, rispettare Style Laboratory e mantenere drag/drop e telemetry già definiti.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/ui/idleVillage/components/MinimalWorkerPanel.tsx (da eliminare/migrare se ancora presente)
- [esistente] src/ui/idleVillage/components/minimal/ActivitySlot.tsx (da eliminare/migrare)
- [esistente] src/ui/idleVillage/components/WorkerPanel.tsx
- [esistente] src/ui/idleVillage/components/ActivitySlot.tsx
- [esistente] src/ui/idleVillage/hooks/useMinimalActivitySlots.ts
- [esistente] src/store/useMinimalGameplay.ts
- [esistente] src/ui/styleLab/**
- [esistente] tests/unit/idleVillage/MinimalGameplayPage.test.tsx

DIPENDENZE
- NP-MIN-STYLE-003 completato (Style Lab + CSS archiviazione ok)
- MG-06 “In corso” (coordinati con drag/drop)

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- NP-MIN-STYLE-004`, aggiorna Kanban → “In corso”.
1. Inventaria i componenti duplicati (prefissi Minimal*) usati nella pagina; documenta in nota.
2. Modifica `MinimalGameplayPage.tsx` per importare e usare **WorkerPanel** e **ActivitySlot** reali:
   - Passa `residents` e `fatigueWarningPercent` direttamente dal config.
   - Usa `onWorkerDrop`, `onDragStateChange`, `selectedResidentId` per mantenere UX.
   - Per gli slot, usa `ActivitySlot` con `validationResult`, `showDropFeedback`, `visualVariant` presi dal config.
3. Elimina i componenti “MinimalWorkerPanel/MinimalActivitySlot” (o trasformali in wrapper sottili che inoltrano ai componenti reali); nessun nuovo stile custom.
4. Aggiorna `useMinimalActivitySlots.ts` per allineare le props richieste da `ActivitySlot` (es. `onWorkerDrop`, `onSlotInspect`, `dropState`, `progressFraction`). Usare gli stessi reason codes e telemetry hook.
5. Verifica che i token Style Lab (radius, surfaces) arrivino dal config: se servono override, aggiungi mapping in `MinimalGameplayConfig` e passa come `className`/`style` ai componenti esistenti.
6. Aggiorna i test RTL (`MinimalGameplayPage.test.tsx`) per assicurarsi che:
   - il roster renderizza `data-testid="worker-panel-list"` del componente reale;
   - gli slot usano `activity-slot-<id>` e rispettano i copy config-driven;
   - telemetry/drop feedback viene emessa usando i reason code del motore (mock trackTelemetryEvent).
7. Rimuovi import inutilizzati e aggiorna docs/NOTE se i componenti temporanei sono stati rimossi.
8. Safeguard suite: lint/test/build/kanban.

OPERAZIONI VIETATE
- Non creare nuovi componenti ActivitySlot/WorkerPanel.
- Non hardcodare copy o colori: tutto deve provenire da config/tokens.
- Non modificare la logica dnd-kit del componente originale salvo passare callback/config.

ASSUNZIONI
- Componenti originali supportano override `className`/`style`; se manca qualcosa, aggiungi prop minimale documentato.
- `useMinimalActivitySlots` può già calcolare i dati per ActivitySlot (duration, progress, assignment).

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage src/store src/ui/styleLab`
- `npm run test -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia bassa-moderata: ping se i componenti esistenti non espongono prop necessari (documenta il gap).

KANBAN COMPLETION
1. Stato → “Completato”.
2. Evidence `test-results/np-min-style-004-<data>.log` con output lint/test/build/kanban + inventario prima/dopo.

NOTE
- Allegare screenshot o diff principali per mostrare WorkerPanel/ActivitySlot reali in pagina.
- Aggiorna `IMPLEMENTED_PLAN.md` se i componenti Minimal sono rimossi definitivamente.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/np-min-style-004-<data>.log
```

### IV-CLP-001 – Component Intake Template & Backlog Sync

```text
AGENTE
Coordinator-Scribe – Documentation & Intake Specialist

ISTRUZIONI AGENTE
Consulta `agent-execution-mandate`, poi `coordinator-mandate`. Questo prompt è di sola documentazione: nessun file sotto `src/ui/**` va modificato. Aggiorna i documenti coordinatore in modo config-first e senza lasciare TODO.

OBIETTIVO
Creare un template di intake per i componenti Idle Village (backlog, dipendenze, telemetry, Style Lab preset) e popolare almeno cinque voci prioritarie nel backlog coordinatore, mantenendo link diretto al piano Component Lab.

PROMPT READINESS
FILE TARGET
- [nuovo] src/docs/docs/coordinator/component_lab_intake_template.md
- [esistente] src/docs/docs/coordinator/strategy_tasks.md
- [esistente] src/docs/docs/coordinator/agent_assignments.md (solo per aggiungere note di intake nel backlog)
- [esistente] /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md (riferimento)

STYLE LAB PRESET (per qualsiasi lavoro UI)
- Preset: -
- Overrides/Tokens: -

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – Sezione "Candidate Intake & Definition" richiede template formalizzato e backlog tracciabile.

DIPENDENZE
- -

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-001` e registrare Kanban → "In corso".
1. Estrarre dal piano Component Lab i dati richiesti (deps, config, telemetry) e progettare il template intake (Markdown con sezioni obbligatorie) salvandolo in `component_lab_intake_template.md`.
2. Aggiornare `strategy_tasks.md` aggiungendo una nuova sezione "Idle Village Component Lab" con almeno cinque task puntuali (Night Threat HUD, Expedition List, Combat Replay UI, Game Over modal polish, Resource Pinball Monitor) referenziando il template appena creato.
3. Per ciascuna delle cinque voci, registrare nel backlog coordinatore (tabella strategy/Kanban note) il link al template e la priorità MG/VS.
4. Documentare nel nuovo template come allegare telemetry IDs, Style Lab preset e evidence log naming.
5. Rieseguire `npm run kanban:lint` per assicurare il backlog resta valido.

OPERAZIONI VIETATE
- Vietato modificare file di codice o componenti.
- Vietato lasciare placeholder "TBD" nel template: usare testo concreto.
- Vietato alterare entry esistenti non legate al Component Lab.

ASSUNZIONI
- Coordinator doc structure già presente in `src/docs/docs/coordinator/`.
- Gli ID nuovi non devono duplicare quelli esistenti (usare formato IV-CLP-### nei nuovi strategy tasks se necessario).

REGRESSION SAFEGUARDS
- `npm run lint -- src/docs/docs/coordinator`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia alta: segnalare solo se esistono conflitti di naming con task già registrati.

KANBAN COMPLETION
1. Stato → "Completato".
2. Evidence `test-results/iv-clp-001-<data>.log` (includere lint/build/kanban output + elenco backlog aggiornato).

NOTE
- Allegare screenshot opzionale del template compilato nel log.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-clp-001-<data>.log
```

### IV-CLP-002 – Sandbox Dependency Mapper CLI

```text
AGENTE
Sandbox-Engineer – Tooling & Diagnostics Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` e `idle-village-task`. Questo lavoro crea tooling (CLI + JSON report) per la mappatura delle dipendenze dei componenti Sandbox. Nessuna modifica funzionale alla UI deve essere lasciata senza test.

OBIETTIVO
Implementare un CLI `componentLabDependencyMap.ts` che produce un JSON/Markdown con la lista delle dipendenze (config, hook, assets) per ogni componente target (Night Threat HUD, Expedition List, Combat Replay UI), così da alimentare la fase di estrazione.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/componentLabDependencyMap.ts
- [nuovo] scripts/idleVillage/__tests__/componentLabDependencyMap.test.ts
- [esistente] src/ui/idleVillage/VillageSandbox.tsx
- [esistente] src/ui/idleVillage/components/** (solo lettura per parsing)
- [esistente] src/docs/docs/coordinator/component_lab_intake_template.md (per citare il formato)

STYLE LAB PRESET (per qualsiasi lavoro UI)
- Preset: -
- Overrides/Tokens: -

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – Sezione "Extraction Checklist" richiede dependency graph dei componenti Sandbox.

DIPENDENZE
- IV-CLP-001 (usa il template appena creato solo come schema; può procedere in parallelo una volta che il file esiste).

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-002` → Kanban "In corso".
1. Creare il CLI TypeScript (ts-node compatibile) che accetta `--components=<comma list>` e analizza import/JSdoc dei componenti target sotto `src/ui/idleVillage` costruendo per ciascuno: file sorgente, config files letti, hook utilizzati, assets/telemetry IDs.
2. Output: JSON + Markdown (in `tmp/component-lab-deps/<component>.{json,md}`) seguendo il formato definito nel template intake.
3. Implementare test Vitest nel percorso scripts/__tests__ con fixture di esempio (mock FS) per validare parsing di import e generazione output.
4. Documentare nel README inline (top del CLI) come eseguire lo script e come integrare i risultati nel template intake.
5. Aggiungere `"component-lab:deps": "tsx scripts/idleVillage/componentLabDependencyMap.ts --components=night_threat,expedition_list,combat_replay"` a package.json (sezione scripts) specificando nel prompt di aggiornare il file.
6. Eseguire safeguard suite e salvare gli output.

OPERAZIONI VIETATE
- Vietato modificare la logica runtime dei componenti Sandbox.
- Vietato introdurre parsing fragile (usare AST leggero tipo `ts-morph` o regex robuste ma documentate).
- Vietato uscire dai percorsi Idle Village; niente scanning globale del repo.

ASSUNZIONI
- `ts-node`/`tsx` già disponibile.
- I componenti target seguono pattern di import standard (ESM).

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage`
- `npm run test -- scripts/idleVillage/__tests__/componentLabDependencyMap.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media: ping solo se il parser richiede dipendenze nuove.

KANBAN COMPLETION
1. Stato → "Completato".
2. Evidence `test-results/iv-clp-002-<data>.log` (lint/test/build/kanban + sample output path).

NOTE
- Includere nel log spezzone JSON/Markdown per almeno un componente reale.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-002-<data>.log
```

### IV-CLP-003 – TestRoster Multi-Component Lab Harness

```text
AGENTE
Lab-Harness Builder – Idle Village UI Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` e `idle-village-task`. Rispettare le "Domain Non-Negotiables" (Style Lab provider, config-first, telemetry, PersistenceService). Questo prompt crea uno stage multi-slot nel TestRosterPage.

OBIETTIVO
Ampliare `TestRosterPage` per ospitare fino a tre componenti Sandbox contemporaneamente (Night Threat HUD, Expedition List, Game Over modal) con toggles config-first, Style Lab tokens e telemetry hooks, così da preparare la fase di polish senza toccare MinimalGameplayPage.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/TestRosterPage.tsx
- [esistente] src/ui/idleVillage/hooks/useAudioCueConfig.ts
- [esistente] src/ui/idleVillage/components/ActionDetailHarness.tsx
- [esistente] src/ui/idleVillage/hooks/useMinimalStyleLabTokens.ts
- [esistente] tests/unit/idleVillage/TestRosterPage.test.tsx
- [esistente] tests/unit/idleVillage/hooks/useAudioCueConfig.test.ts (creare se mancante)

STYLE LAB PRESET (per qualsiasi lavoro UI)
- Preset: Minimal Frontier (src/ui/styleLab/presets/minimalFrontier.ts)
- Overrides/Tokens: usare `minimalGameplayConfig.ui.tokens` per surfaces/cards

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – Sezione "Lab Page Polish Loop" richiede mounting e juice sui Test Pages.

DIPENDENZE
- Può lavorare in parallelo con IV-CLP-002 (non modifica script) e IV-CLP-004. Richiede solo che il template intake esista (IV-CLP-001 completato).

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-003` → Kanban "In corso".
1. Estendere `TestRosterPage` aggiungendo un pannello "Component Lab" con toggle (NightThreatHUD, ExpeditionList, GameOverModal). Ogni toggle monta il componente reale o placeholder config-first usando i dati fixture di `DEFAULT_TEST_HARNESS_CONFIG`.
2. Integrare Style Lab tokens tramite `useMinimalStyleLabTokens` e garantire che i nuovi pannelli usino `StyleLabSurface`/`StyleLabStack`.
3. Collegare `useAudioCueConfig` per riprodurre audio/haptics demo quando i componenti cambiano stato; aggiungere opzione "mute" persistita in store (PersistenceService chiave `test-roster-lab-prefs`).
4. Aggiornare telemetry: emettere `component_lab_viewed`, `component_lab_interacted` con payload {componentId, presetId, telemetryContext} via `trackTelemetryEvent`.
5. Scrivere/aggiornare test RTL per TestRosterPage assicurando: toggle render, snapshot stable, telemetry mocked, persistence key usata.
6. Documentare in file JSDoc come aggiungere nuovi componenti al lab harness.
7. Safeguard suite e evidence log.

OPERAZIONI VIETATE
- Vietato modificare MinimalGameplayPage.
- Vietato introdurre componenti duplicati: usare quelli reali o pass-through wrappers.
- Vietato hardcodare copy/valori: usare config/test harness data.

ASSUNZIONI
- Componenti target esportano versioni isolabili (NightThreatHUD, ExpeditionList, MinimalGameOverModal).
- Audio cues già definiti in `useAudioCueConfig`.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/TestRosterPage.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media: ping solo se un componente manca di props isolabili.

KANBAN COMPLETION
1. Stato → "Completato".
2. Evidence `test-results/iv-clp-003-<data>.log` (include screenshot opzionale del lab harness).

NOTE
- Aggiornare `IMPLEMENTED_PLAN.md` se il lab harness diventa ufficiale.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-003-<data>.log
```

### IV-CLP-004 – Minimal Promotion Guard & Evidence Hooks

```text
AGENTE
Promotion-Guardian – Tooling & Safeguard Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate`, `idle-village-task`, e `guardian-mandate`. Questo prompt costruisce tooling che certifica il passaggio Lab → Minimal con log automatici.

OBIETTIVO
Implementare uno script "promotion guard" che raccoglie output di lint/test/build + screenshot/screencap e aggiorna automaticamente `IMPLEMENTED_PLAN.md` e `test-results/minimal-vertical-slice-<feature>-<date>.log` quando un componente lab viene promosso in Minimal Gameplay.

PROMPT READINESS
FILE TARGET
- [nuovo] scripts/idleVillage/minimalPromotionGuard.ts
- [nuovo] scripts/idleVillage/__tests__/minimalPromotionGuard.test.ts
- [esistente] package.json (aggiungere script npm)
- [esistente] test-results/.gitkeep (usare per output)
- [esistente] docs/IMPLEMENTED_PLAN.md

STYLE LAB PRESET (per qualsiasi lavoro UI)
- Preset: -
- Overrides/Tokens: -

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – Sezione "Promotion into Minimal Gameplay" + "Validation & Evidence" richiede guard + evidence pipeline.

DIPENDENZE
- Può eseguire in parallelo con IV-CLP-002 e IV-CLP-003 (nessuna modifica file condivisi).

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-004`.
1. Creare script Node/TS che accetta `--featureId=<id>` e: (a) esegue lint/test/build/kanban commands in sequenza; (b) raccoglie output in `test-results/minimal-vertical-slice-<featureId>-<timestamp>.log`; (c) genera JSON summary con pass/fail.
2. Integrare capture opzionale (flag `--screenshot=<path>`) per allegare PNG/MP4 generati manualmente (script deve copiare/citare il file nel log).
3. Aggiornare `docs/IMPLEMENTED_PLAN.md` aggiungendo una sezione "Promotion Guard Runs" con tabella {featureId, date, evidence log path} e collegare il nuovo script.
4. Scrivere test per il guard (mock exec) verificando: comandi eseguiti in ordine, log file creato, JSON summary generato, doc update string presente.
5. Aggiungere npm script `"component-lab:promote": "tsx scripts/idleVillage/minimalPromotionGuard.ts"`.
6. Safeguard suite per il nuovo tooling.

OPERAZIONI VIETATE
- Vietato saltare uno dei comandi guardia (lint/test/build/kanban).
- Vietato modificare MinimalGameplayPage.
- Vietato sovrascrivere log esistenti (usare timestamp).

ASSUNZIONI
- `execa` o child_process disponibile.
- Docs possono essere aggiornati programmaticamente (append).

REGRESSION SAFEGUARDS
- `npm run lint -- scripts/idleVillage`
- `npm run test -- scripts/idleVillage/__tests__/minimalPromotionGuard.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia alta.

KANBAN COMPLETION
1. Stato → "Completato".
2. Evidence `test-results/iv-clp-004-<data>.log`.

NOTE
- Suggerire nel README come integrare il guard nella CI.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-004-<data>.log
```


### IV-CLP-321 – Test Harness Style Lab Polish

```text
AGENTE
Harness-Polisher – Idle Village Test Surface Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` e `idle-village-task`. Applica tutte le "Domain Non-Negotiables" (Style Lab provider, config-first, telemetry, PersistenceService). Operare solo sotto `/src/ui/idleVillage/**`, documentando i TODO richiesti e mantenendo /test come laboratorio senza toccare MinimalGameplayPage.

OBIETTIVO
Raffinare `TestRosterPage` per mostrare residenti canonici (Character Manager), allineare layout/typography/background ai token Style Lab e ripristinare l'overlay circolare basata su WorkerCard. Documentare TODO per i futuri controlli Style Lab (color filters, typography scale, density, motion).

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/TestRosterPage.tsx
- [esistente] src/ui/idleVillage/components/WorkerCard.tsx
- [esistente] src/ui/idleVillage/components/PgCard.tsx
- [esistente] src/ui/idleVillage/components/VillageRosterSection.tsx
- [esistente] src/ui/idleVillage/hooks/useMinimalStyleLabTokens.ts
- [esistente] src/ui/idleVillage/residentName.ts
- [esistente] tests/unit/idleVillage/TestRosterPage.test.tsx (creare se mancante)
- [nuovo/opzionale] test-results/iv-clp-321-<data>.log (evidence)

STYLE LAB PRESET
- Preset: Minimal Frontier (`src/ui/styleLab/presets/minimalFrontier.ts`)
- Overrides: `minimalGameplayConfig.ui.tokens` via `useMinimalStyleLabTokens`

DATO DI ORIGINE
- Checkpoint regressioni Test Harness (MG-TEST-ACTION, MG-MINIMAL-ROSTER)
- Documento `.windsurf/plans/style-lab-flexibility-1a9890.md`

DIPENDENZE
- MG-TEST-ACTION completato
- MG-MINIMAL-ROSTER completato

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-321` → Kanban "In corso".
1. Verifica pipeline residenti in TestRosterPage: usare solo `loadResidentsFromCharacterManager` (fallback documentato) con telemetry e refresh event.
2. Rifinisci UI con `StyleLabSurface/StyleLabStack`, agganciando `useMinimalStyleLabTokens` per background/typography/radius e inserendo TODO per controlli futuri (color, typography scale, density, motion) come commenti/config placeholder.
3. Ripristina overlay circolare (WorkerCard nel `DragOverlay` + preview DOM in `PgCard`) applicando tokens Style Lab e registrando telemetry `drag_overlay_rendered`.
4. Aggiorna/crea `tests/unit/idleVillage/TestRosterPage.test.tsx` per coprire residenti canonici mock, wrapper Style Lab, overlay circolare.
5. Inserisci TODO per scrollbar styling futuro (Style Lab friendly) e accessibilità/motion toggle.
6. Safeguard suite + evidence log.

OPERAZIONI VIETATE
- Non modificare MinimalGameplayPage o store minimal.
- Nessun componente duplicato: riusare WorkerCard/VillageRosterSection.
- Niente valori hardcoded: tutto da config/tokens.

ASSUNZIONI
- Character Manager snapshot disponibile (fallback solo documentato).
- Style Lab tokens estendibili via `useMinimalStyleLabTokens`.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/TestRosterPage.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media; ping solo per gap strutturali nei componenti Style Lab.

KANBAN COMPLETION
1. Stato → "Completato".
2. Evidence `test-results/iv-clp-321-<data>.log` con safeguard output + TODO.

NOTE
- Riportare nella risposta finale la "Config-first reference" (config + componenti usati).
- Eventuali screenshot nel log sono benvenuti.

EVIDENCE LOG
- test-results/iv-clp-321-<data>.log
```

| Prompt ID/Descrizione | Stato | Data | Agente | Note |
| --- | --- | --- | --- | --- |
| IV-CLP-321 – Test Harness Style Lab Polish | Completato | 2026-02-16 | Cascade | Evidence: test-results/iv-clp-321-2026-02-16.log – Safeguards passate, TODO scrollbar/motion pending tokens |
| IV-FIX-DRAG-001 – TestRoster Drag QA Hardening | In corso | Cascade | 2026-02-25 | Evidence: test-results/iv-fix-drag-001-<data>.log (drag overlay + invalid drop Playwright evidence) |

### IV-FIX-DRAG-001 – TestRoster Drag QA Hardening

```text
AGENTE
Idle Village Drag QA Engineer

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` seguito da `idle-village-task`. Non attendere conferme ulteriori: il prompt è approvato. Applica filosofia config-first, Style Lab provider, PersistenceService e telemetry obbligatoria. Segui le `QA/test-route-drag-guidelines.md` per ogni verifica su `/test`.

OBIETTIVO
Correggere il drag overlay della `/test` route affinché mostri il ritratto corretto allineato al cursore, impedire assegnazioni su drop non validi, e introdurre test Playwright “IRL” che coprano offset visivo e drop invalidi.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/PgCard.tsx
- [esistente] src/ui/idleVillage/TestRosterPage.tsx
- [esistente] src/ui/idleVillage/components/CustomDragOverlay.tsx
- [esistente] src/ui/idleVillage/components/WorkerCard.tsx (consultazione se servono props aggiuntive)
- [esistente] tests/e2e/idleVillage/testRosterPgCards.spec.ts
- [esistente] src/docs/docs/QA/test-route-drag-guidelines.md (consultazione)
- [nuovo/opzionale] test-results/iv-fix-drag-001-<data>.log (evidence)

STYLE LAB PRESET
- Usa Minimal Frontier come preset principale; qualsiasi valore estetico deve provenire dai tokens Style Lab o config esistente. Nessun colore hardcodato.

DIPENDENZE
- Verifica che IV-CLP-321 risulti Completato (già in tabella). Nessuna dipendenza aperta.

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-FIX-DRAG-001` → impostare Kanban su "In corso" con data/assignee.
1. In `PgCard.tsx`, integra `useResidentDragPreview` per ottenere `dragImageRef` e chiama `event.activatorEvent?.dataTransfer?.setDragImage(...)` centrando il canvas sul cursore (usa size dal hook); rimuovi offset residui.
2. In `TestRosterPage.tsx`, aggiorna `handleDragEnd` e `ScenarioPanelApi.assignResident` per:
   - leggere `event.over?.data.current?.slotId`,
   - verificare `dropState === 'valid'` prima di assegnare,
   - rispettare lo slot target, senza fallback automatici quando il drop è invalido,
   - mantenere click-to-assign sequenziale (slot liberi ordinati) solo quando non è specificato uno slot.
3. Rafforza la validazione slot riusando `useResidentSlotController`/`attemptAssignment`; aggiungi logging telemetry `test_roster_invalid_drop_rejected` quando un drop viene scartato.
4. Aggiorna `CustomDragOverlay`/`WorkerCard` solo se servono props aggiuntive per l’allineamento (es. dimensioni). Evita duplicazione di logica.
5. Scrivi due test Playwright in `tests/e2e/idleVillage/testRosterPgCards.spec.ts`:
   - **Drag offset**: trascina un residente reale con `page.mouse`, misura distanza tra cursore e `[data-pg-drag-preview="true"]`, assicurati < 8px.
   - **Invalid drop**: trascina un residente su slot non compatibile o area vuota e verifica che nessuna assegnazione avvenga (`data-slot-assignment` invariato) e che il feedback invalid venga mostrato.
6. Allinea i test ai requisiti “IRL” (no eventi sintetici), salvando eventuali trace/screenshot per evidence.
7. Documenta TODO per futuri controlli Style Lab/motion se durante il lavoro emergono gap (commenti `TODO(IV-CLP)`).
8. Safeguard suite + evidence log (vedi sotto) e aggiorna Kanban a "Completato" con riferimento al log.

OPERAZIONI VIETATE
- Vietato usare eventi drag HTML5 personalizzati fuori da `dnd-kit`.
- Vietato hardcodare ID slot o stats: leggere tutto dai config/store.
- Vietato saltare Playwright reale o sostituirlo con mock.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage tests/e2e/idleVillage/testRosterPgCards.spec.ts`
- `npm run test -- tests/e2e/idleVillage/testRosterPgCards.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

EVIDENCE LOG
- `test-results/iv-fix-drag-001-<date>.log`

NOTE
- Includere nella risposta finale la **Config-first reference** (config/hook/componenti riusati).
- Allegare nel log riferimenti a trace Playwright (path file) e screenshot, seguendo `QA/test-route-drag-guidelines.md`.
```


### IV-CLP-201 – Night Threat HUD Extraction & Fixture Prep

```text
AGENTE
Component-Extractor – Idle Village Sandbox Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate`, quindi `idle-village-task`. Allinea l’esecuzione con il template intake (IV-CLP-101) e con il tooling dependency map (IV-CLP-002). Ogni cambiamento deve restare config-first e documentato.

OBIETTIVO
Estrarre la Night Threat HUD dal VillageSandbox in moduli riusabili (`src/ui/idleVillage/components/nightThreat`) e preparare fixture deterministiche per il lab harness.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/nightThreat/NightThreatHUD.tsx (se manca, creare scaffolding conforme al componente sandbox)
- [esistente] src/ui/idleVillage/VillageSandbox.tsx
- [esistente] src/ui/idleVillage/hooks/useMapContext.ts
- [esistente] scripts/idleVillage/rosterHarnessQASnapshot.ts
- [esistente] tests/unit/idleVillage/nightThreatHUD.test.tsx (creare nuovo file se inesistente)
- [esistente] docs/IMPLEMENTED_PLAN.md

STYLE LAB PRESET (per qualsiasi lavoro UI)
- Preset: Minimal Frontier (o quello indicato nell’intake IV-CLP-101)
- Overrides/Tokens: usare mapping da `minimalGameplayConfig.ui.tokens`

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – Sezione "Extraction Checklist" & candidate Night Threat HUD.

DIPENDENZE
- IV-CLP-002 (CLI deps pronto)
- IV-CLP-101 (intake completato)

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-201`, impostare Kanban → "In corso".
1. Usare l’intake + CLI output per elencare dipendenze e confermare config necessari (globalRules, telemetry IDs).
2. Estrarre il componente Night Threat HUD in `src/ui/idleVillage/components/nightThreat`, separando view (Style Lab) e logic (hook `useNightThreatStatus`).
3. Aggiornare `VillageSandbox.tsx` per importare il nuovo modulo; non cambiare comportamento.
4. Aggiornare/creare fixture deterministic in `scripts/idleVillage/rosterHarnessQASnapshot.ts` o file dedicato per alimentare TestRoster/CLI.
5. Aggiungere test RTL/Vitest per il componente estratto (token compliance, telemetry events, config fallback).
6. Documentare in `IMPLEMENTED_PLAN.md` (sezione Component Lab) cosa è stato estratto e come usare il modulo.
7. Safeguard suite e evidence log.

OPERAZIONI VIETATE
- Vietato introdurre nuove config inline: estendere `minimalGameplayConfig` se servono dati.
- Vietato rimuovere fallback sandbox prima che i test passino.
- Vietato modificare MinimalGameplayPage.

ASSUNZIONI
- I file sandbox contengono già il markup HUD.
- CLI dependency map fornisce l’elenco import necessario.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage`
- `npm run test -- tests/unit/idleVillage/nightThreatHUD.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media: ping solo se mancano dati nel config.

KANBAN COMPLETION
1. Stato → "Completato".
2. Evidence `test-results/iv-clp-201-<data>.log` (lint/test/build/kanban + note estrazione).

NOTE
- Allegare screenshot o GIF del componente estratto in TestRoster.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-201-<data>.log
```

### IV-CLP-202 – Expedition List Extraction & Fixture Prep

```text
AGENTE
Component-Extractor – Expedition Systems Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate` e `idle-village-task`. Usa l’intake IV-CLP-102 e il dependency mapper per assicurare transizione config-first.

OBIETTIVO
Estrarre l’Expedition List (dispatch list) in un modulo riusabile, pronta per mounting nel lab harness e successiva promozione.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/expeditions/ExpeditionList.tsx
- [nuovo] src/ui/idleVillage/components/expeditions/useExpeditionListData.ts
- [esistente] src/ui/idleVillage/VillageSandbox.tsx
- [esistente] src/balancing/config/idleVillage/questConfig.ts
- [esistente] scripts/idleVillage/expeditionFixtures.ts (creare)
- [esistente] tests/unit/idleVillage/ExpeditionList.test.tsx

STYLE LAB PRESET
- Preset: Minimal Frontier (o definito dal template)
- Tokens: config `questPanels` da MinimalGameplayConfig

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – Sezioni "Extraction Checklist" + backlog Expedition List.

DIPENDENZE
- IV-CLP-002
- IV-CLP-102

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-202`.
1. Inventariare moduli attuali dell’Expedition list (Sandbox + Map) usando CLI output.
2. Estrarre componenti/ hook (lista, card, telemetry) sotto `components/expeditions` con Style Lab tokens.
3. Sincronizzare config con `questConfig`/`MinimalGameplayConfig` estendendo i tipi se mancano campi (documentare).
4. Creare fixture deterministic `expeditionFixtures.ts` per lab/test.
5. Aggiornare sandbox/test roster a usare i nuovi moduli.
6. Aggiornare tests RTL per verificare copy, risk stripes, telemetry.
7. Documentare in IMPLEMENTED_PLAN + evidence log.

OPERAZIONI VIETATE
- Vietato duplicare config; usare trasformazioni esistenti.
- Vietato cambiare logica di spawn quest.

ASSUNZIONI
- Quest data già disponibile via config.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage`
- `npm run test -- tests/unit/idleVillage/ExpeditionList.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media.

KANBAN COMPLETION
Evidence `test-results/iv-clp-202-<data>.log`.

NOTE
- Inserire riferimento a telemetry `component_lab_expedition_list_viewed`.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-202-<data>.log
```

### IV-CLP-203 – Combat Replay UI Extraction & Fixture Prep

```text
AGENTE
Component-Extractor – Combat Replay Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate`, `idle-village-task`, e carica gli strumenti Combat (sezione QST). Basati sull’intake IV-CLP-103.

OBIETTIVO
Portare il Combat Replay UI fuori dal Sandbox in componenti modulare + hook per dati, con fixture riproducibili per Playwright baseline.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/combatReplay/CombatReplayPanel.tsx
- [nuovo] src/ui/idleVillage/components/combatReplay/useCombatReplayData.ts
- [esistente] src/ui/idleVillage/VillageSandbox.tsx
- [esistente] src/engine/game/idleVillage/TimeEngine.ts (solo lettura per tipizzare eventi)
- [esistente] tests/unit/idleVillage/CombatReplayPanel.test.tsx
- [esistente] tests/visual/idleVillage/combat-replay.spec.ts (aggiornare)

STYLE LAB PRESET
- Preset: Minimal Frontier + overlay tokens (dall’intake)

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – backlog Combat Replay.

DIPENDENZE
- IV-CLP-002
- IV-CLP-103

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-203`.
1. Creare moduli component + hook, includendo timeline, log viewer, telemetry.
2. Spostare eventuali tipi/comandi in `src/engine` se condivisi.
3. Aggiornare sandbox per usare il nuovo modulo.
4. Preparare fixture JSON con log ridotti per Playwright/visual baseline.
5. Aggiornare suite visiva (tests/visual) e Playwright se necessario.
6. Documentare nel piano + evidence log.

OPERAZIONI VIETATE
- Vietato cambiare logica engine.
- Vietato ridurre dati di telemetria.

ASSUNZIONI
- Replay già funzionante nel Sandbox.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/CombatReplayPanel.test.tsx`
- `npm run test:visual -- tests/visual/idleVillage/combat-replay.spec.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media-bassa (ping se engine types cambiano).

KANBAN COMPLETION
- Evidence `test-results/iv-clp-203-<data>.log`.

NOTE
- Allegare link al baseline visual generato.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-203-<data>.log
```

### IV-CLP-204 – Game Over Modal Extraction & Config Sync

```text
AGENTE
Component-Extractor – Game Over Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate`, `idle-village-task`. Rifatti all’intake IV-CLP-104 e agli output MinimalGameOverModal.

OBIETTIVO
Estrarre/configurare il Game Over modal dalla versione sandbox/minimal in modo che viva sotto `src/ui/idleVillage/components/gameOver` con tokens Style Lab e config-first copy.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/MinimalGameOverModal.tsx (spostare in percorso definitivo)
- [nuovo] src/ui/idleVillage/components/gameOver/GameOverModal.tsx
- [esistente] src/balancing/config/idleVillage/minimalGameplayConfig.ts
- [esistente] src/ui/idleVillage/TestRosterPage.tsx
- [esistente] tests/unit/idleVillage/GameOverModal.test.tsx

STYLE LAB PRESET
- Preset: Minimal Frontier + overrides da intake

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – candidate Game Over modal (Lab Polish & Promotion).

DIPENDENZE
- IV-CLP-001
- IV-CLP-104

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-204`.
1. Rinominare/trasferire il componente minimal nella cartella definitiva, rendendolo configurabile via `MinimalGameplayConfig.ui.gameOver`.
2. Aggiornare copy/metriche per leggere da config e non da costanti.
3. Aggiornare TestRosterPage per montare la nuova versione tramite toggle (dati di harness) e integrare telemetry `component_lab_game_over_viewed`.
4. Aggiornare tests RTL.
5. Documentare in IMPLEMENTED_PLAN + evidence log.

OPERAZIONI VIETATE
- Vietato cambiare logica di fine run.
- Vietato introdurre stile fuori Style Lab.

ASSUNZIONI
- MinimalGameOverModal già funziona ma va ricollocato.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/GameOverModal.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media.

KANBAN COMPLETION
- Evidence `test-results/iv-clp-204-<data>.log`.

NOTE
- Aggiornare doc se la modal è pronta per promozione.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-204-<data>.log
```

### IV-CLP-205 – Resource Pinball Monitor Extraction & Diagnostics

```text
AGENTE
Component-Extractor – Diagnostics Specialist

ISTRUZIONI AGENTE
Invoca `agent-execution-mandate`, `idle-village-task`. Basati sull’intake IV-CLP-105 e sulle linee guida style/motion.

OBIETTIVO
Estrarre il Resource Pinball Monitor (diagnostica risorse) in componente modulare con motion tokens Style Lab, persistence key documentata e telemetry.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/components/resourcePinball/ResourcePinballMonitor.tsx
- [nuovo] src/ui/idleVillage/components/resourcePinball/useResourcePinballTelemetry.ts
- [esistente] src/ui/idleVillage/VillageSandbox.tsx
- [esistente] scripts/idleVillage/resourcePinballFixtures.ts
- [esistente] tests/unit/idleVillage/ResourcePinballMonitor.test.tsx

STYLE LAB PRESET
- Preset: Minimal Frontier con motion tokens (definiti nell’intake)

DATO DI ORIGINE
- Documento: /.windsurf/workflows/idle-village-component-lab-plan-21fd14.md – backlog Resource Pinball Monitor.

DIPENDENZE
- IV-CLP-002
- IV-CLP-105

OPERAZIONI DA ESEGUIRE
0. `npm run prompt:check -- IV-CLP-205`.
1. Estrarre markup/logic in nuova cartella, integrando motion tokens e persistence key (da intake) per salvare preferenze.
2. Collegare telemetry `resource_pinball_event` e Reason codes.
3. Creare fixture per harness/test.
4. Aggiornare sandbox per usare il nuovo modulo.
5. Scrivere test RTL.
6. Documentare in IMPLEMENTED_PLAN + evidence log.

OPERAZIONI VIETATE
- Vietato introdurre motion CSS fuori Style Lab.
- Vietato cambiare loop di risorse.

ASSUNZIONI
- Il componente esiste già nel Sandbox.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage scripts/idleVillage`
- `npm run test -- tests/unit/idleVillage/ResourcePinballMonitor.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
Autonomia media.

KANBAN COMPLETION
- Evidence `test-results/iv-clp-205-<data>.log`.

NOTE
- Documentare persistence key nel template intake.

ANTI-STALL DIRECTIVE
Procedi autonomamente.

EVIDENCE LOG
- test-results/iv-clp-205-<data>.log
```
# WS6 Prompt Kanban

<!-- markdownlint-disable MD013 MD031 MD032 MD007 -->

Kanban dedicato esclusivamente alla linea **Minimal Gameplay**. Qualsiasi nuovo prompt deve appartenere a questa iniziativa prima di essere inserito qui.

| Prompt ID/Descrizione | Stato | Dipende da | Agente | Durata (min) | Est. (min) | Ultimo Update | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NP-106 – Idle Village Crew Scheduler Visual Debug Panel | Non assegnato | WS3 Crew Scheduler | - | - | - | - | 140 | - | - | ```text
AGENT
Vector-Idle – Scheduler Debug

OBIETTIVO
Pannello debug config-first per visualizzare stato crew scheduler in tempo reale con timeline, slot occupancy e conflict detection.

FILE TARGET
- [nuovo] src/ui/idleVillage/components/CrewSchedulerDebugPanel.tsx
- [nuovo] src/ui/idleVillage/hooks/useCrewSchedulerDebug.ts
- [nuovo] src/ui/idleVillage/config/crewSchedulerDebugConfig.ts
- [nuovo] tests/unit/idleVillage/CrewSchedulerDebug.test.tsx
- [esistente] docs/plans/ws3-theater-controller-crew-scheduler.md

DIPENDENZE
- WS3 Crew Scheduler implementation
- CrewSchedulerController

OPERAZIONI DA ESEGUIRE
1. Definire config (refresh rate, metrics, visualization mode) con Zod.
2. Implementare hook per raccogliere stato scheduler (active assignments, conflicts, timeline).
3. Creare pannello UI con timeline view, slot occupancy heatmap e conflict list.
4. Telemetria `crew_scheduler_debug_opened`.
5. Test RTL + doc completa.

OPERAZIONI VIETATE
- Vietato modificare logica scheduler.
- Nessun hardcode per colori/thresholds.
- Non bloccare render >16ms.

ASSUNZIONI
- CrewSchedulerController espone stato interno.
- Style Laboratory tokens disponibile.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage`
- `npm run test -- tests/unit/idleVillage/CrewSchedulerDebug.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

KANBAN COMPLETION
1. Stato → "Completato".
2. Evidence `test-results/np-106-crew-scheduler-debug-\<data\>.log`.

EVIDENCE LOG
- test-results/np-106-crew-scheduler-debug-\<data\>.log
```text

| MG-TEST-ROSTER-001 | WorkerPanel Test Route | Completato | 2026-02-14 | Cascade | Evidence: test-results/mg-test-roster-001-2026-02-14.log – /test route created with WorkerPanel integration, manual verification successful | - | - | 180 | 
- | - |
