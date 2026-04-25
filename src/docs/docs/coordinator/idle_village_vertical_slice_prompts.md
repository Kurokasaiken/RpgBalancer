# Idle Village Vertical Slice Realignment - Prompts Coordinator

## Governance Workflow & Master Index Reference

### Master Index
- **Location**: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
- **Purpose**: Single source of truth for all component contracts and trusted docs
- **Trusted Docs Available**:
  - Time Engine Contract (`time_engine_trusted.md`)
  - POI Standard Contract (`poi_standard_trusted.md`) 
  - POI Detail Contract (`poi_detail_trusted.md`)
  - Day/Night Contract (`daynight_trusted.md`)

### Governance Pack
- **Location**: `idle-village-documentation-governance-pack.md`
- **Sections**: 1 (Policy ufficiale) e 4 (Procedura operativa)
- **Purpose**: Defines freeze procedures, update requirements, and evidence standards

### Execution Requirements
1. **Contract Validation**: All implementations must be validated against relevant trusted docs
2. **Master Index Reference**: Use master index to locate correct trusted docs for each component
3. **Governance Procedures**: Follow governance pack for freeze/update procedures
4. **Evidence Requirements**: Document compliance with trusted contracts in evidence logs
5. **Single Source of Truth**: Trusted docs are the authoritative source, not general documentation

### Workflow Integration
- Before execution: Consult master index for relevant trusted docs
- During execution: Validate implementation against trusted doc contracts
- After execution: Document trusted doc compliance in evidence logs
- For changes: Update trusted docs if contracts are modified

---

## IV-VSR-001: Structural Cleanup & Guardrails
```
AGENT
Idle Village Cleanup Specialist - Structural Removal

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Rimuovere tutti i riferimenti `Map*` e `Wood*` dal runtime `/minimal-gameplay` senza rompere `/test` harness.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx (VERIFICARE ESISTENZA)
- [esistente] imports e riferimenti MapMiniCard (IDENTIFICARE PRIMA)
- [esistente] runtime analysis per path `/minimal-gameplay`

STYLE LAB PRESET
- N/A (task cleanup)

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica componenti canonici
- Opzionale: /test per verificare harness non rotto

DATO DI ORIGINE
- Piano: idle-village-vertical-slice-realignment-443d6e.md Task 1

DIPENDENZE
- Nessuna (primo task)

OPERAZIONI DA ESEGUIRE
0. **Pre-Execution Guardrail**: Verificare esistenza di `MinimalGameplayPage.tsx` e identificare tutti gli import `Map*` presenti. Se file non esiste o non contiene import `Map*`, apri blocker immediato.
1. **Import Cleanup**: Rimuovere tutti gli import di componenti `Map*` e `Wood*` da MinimalGameplayPage.tsx
2. **Usage Removal**: Eliminare ogni riferimento a componenti `Map*` nel JSX e logica
3. **Runtime Verification**: Verificare che nessun import `Map*` sia presente in MinimalGameplayPage.tsx
4. **Path Isolation**: Assicurarsi che nessun componente `Map*` sia nel runtime di `/minimal-gameplay`
5. **Dependency Check**: Verificare che nessuna dipendenza diretta del path verticale attivo da `Map*`
6. **Test Harness**: Verificare che `/test` non sia rotto dal cleanup

OPERAZIONI VIETATE
- Vietato introdurre nuovi componenti custom
- Vietato spostare logica del store
- Vietato rimuovere componenti condivisi usati da `/test`
- Vietato procedere se MinimalGameplayPage.tsx non contiene import `Map*` da rimuovere

ASSUNZIONI
- Componenti `Map*` sono solo usati in MinimalGameplayPage
- `/test` harness non dipende da componenti `Map*` critici

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se `/test` si rompe

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-vsr-001-structural-cleanup-<YYYY-MM-DD>.log`
3. Report finale con: cleanup completato, build pulito, test harness OK

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, idle village plan, cleanup requirements
- Minimal impact: focus su rimozione senza aggiungere funzionalità
- Governance: fare riferimento a `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` per trusted docs
- Documentation: consultare `idle-village-documentation-governance-pack.md` per procedure

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-vsr-001-structural-cleanup-<YYYY-MM-DD>.log
```

## IV-VSR-002: Runtime Recovery of MinimalGameplayPage
```
AGENT
Idle Village Runtime Specialist - Store Alignment

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare MinimalGameplayPage a `useMinimalGameplayWithIdleVillageConfig` eliminando stato duplicato.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx (VERIFICARE ESISTENZA)
- [esistente] src/store/useMinimalGameplayWithIdleVillageConfig.ts (VERIFICARE ESISTENZA)
- [esistente] src/ui/idleVillage/hooks/useResidentDropValidation.ts (VERIFICARE ESISTENZA)

STYLE LAB PRESET
- N/A (task runtime alignment)

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica drag/drop flow

DATO DI ORIGINE
- Piano: idle-village-vertical-slice-realignment-443d6e.md Task 2

DIPENDENZE
- IV-VSR-001 completato (cleanup strutturale)

OPERAZIONI DA ESEGUIRE
0. **Pre-Execution Guardrail**: Verificare esistenza di `useMinimalGameplayWithIdleVillageConfig.ts`, `useResidentDropValidation.ts`, e `MinimalGameplayPage.tsx`. Se qualsiasi file manca o non è il target canonico, apri blocker immediato. Non improvvisare sostituti.
1. **Store Integration**: Sostituire logiche locali con `useMinimalGameplayWithIdleVillageConfig`
2. **Drag Context**: Allineare drag/drop a `validateDrop` + `startActivity` dallo store
3. **State Cleanup**: Rimuovere `slotAssignments` locale e stato duplicato
4. **Validation Integration**: Integrare `useResidentDropValidation` correttamente
5. **Activity Flow**: Assicurarsi che startActivity usi solo store APIs

OPERAZIONI VIETATE
- Vietato introdurre logiche custom per startActivity
- Vietato modificare IdleVillageConfig
- Vietato mantenere stato locale duplicato
- Vietato procedere se i file target non esistono o non sono canonici
- Vietato improvvisare sostituti per hook/componenti mancanti

ASSUNZIONI
- `useMinimalGameplayWithIdleVillageConfig` espone APIs necessarie
- `validateDrop` e `startActivity` sono disponibili dallo store

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx`
- `npm run test -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se store APIs insufficienti

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-vsr-002-runtime-recovery-<YYYY-MM-DD>.log`
3. Report finale con: store alignment completato, drag/drop funzionante

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, store architecture, runtime requirements
- Store-first: tutte le operazioni devono passare dallo store
- Governance: fare riferimento a `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` per trusted docs
- Documentation: consultare `idle-village-documentation-governance-pack.md` per procedure
- Contract validation: verificare implementazione contro trusted docs Time Engine e POI

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-vsr-002-runtime-recovery-<YYYY-MM-DD>.log
```

## IV-VSR-003: POI Standardization (wood/gold/XP)
```
AGENT
Idle Village POI Specialist - ActivityCapsule Integration

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Identificare 3 activityId canonici e implementare POI ActivityCapsule-based.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx (VERIFICARE ESISTENZA)
- [esistente] src/balancing/config/idleVillage/defaultConfig.ts (VERIFICARE ESISTENZA)
- [esistente] src/ui/idleVillage/components/ActivityCapsule.tsx (VERIFICARE ESISTENZA)

STYLE LAB PRESET
- Preset: Gilded Observatory (src/ui/styleLab/presets/gildedObservatory.ts)
- Overrides/Tokens: POI styling, activity capsule tokens

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica 3 POI funzionanti

DATO DI ORIGINE
- Piano: idle-village-vertical-slice-realignment-443d6e.md Task 3

DIPENDENZE
- IV-VSR-002 completato (runtime recovery)

OPERAZIONI DA ESEGUIRE
0. **Pre-Execution Guardrail**: Verificare esistenza di `DEFAULT_IDLE_VILLAGE_CONFIG`, `ActivityCapsule.tsx`, e `MinimalGameplayPage.tsx`. Verificare che config contenga activityId wood/gold/XP. Se qualsiasi file manca o config non contiene activityId richiesti, apri blocker immediato.
1. **Activity Mapping**: Identificare wood, gold, XP activityId da DEFAULT_IDLE_VILLAGE_CONFIG.activities
2. **POI Implementation**: Creare 3 ActivityCapsule con activityId mappati
3. **Drop Integration**: Collegare drop validation e startActivity ai POI
4. **Collect Flow**: Implementare collect functionality che aggiorna stato
5. **Visual Integration**: Assicurarsi che POI appaiano come veri POI non pseudo-detail

OPERAZIONI VIETATE
- Vietato hardcodare reward values
- Vietato duplicare ActivityDefinition
- Vietato aggiungere POI extra oltre wood/gold/XP
- Vietato procedere se config non contiene activityId wood/gold/XP
- Vietato improvvisare componenti POI alternativi

ASSUNZIONI
- DEFAULT_IDLE_VILLAGE_CONFIG.activities contiene wood, gold, XP definitions
- ActivityCapsule può essere usato con activityId da config

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx`
- `npm run test -- tests/unit/idleVillage/ActivityCapsule.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se activityId non trovati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-vsr-003-poi-standardization-<YYYY-MM-DD>.log`
3. Report finale con: 3 POI implementati, drop/collect funzionanti

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, ActivityCapsule docs, config-first principles
- Config-driven: tutti i POI devono usare activityId dal config
- Governance: fare riferimento a `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` per trusted docs
- Documentation: consultare `idle-village-documentation-governance-pack.md` per procedure
- Contract validation: verificare implementazione contro trusted doc POI Standard Contract

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-vsr-003-poi-standardization-<YYYY-MM-DD>.log
```

## IV-VSR-004: Detail Panel Rebinding
```
AGENT
Idle Village Detail Specialist - Panel Integration

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare `PoiDetailSkinWrapper` con dati runtime e panel estruso.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/PoiDetailSkinWrapper.tsx (VERIFICARE ESISTENZA)
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx (VERIFICARE ESISTENZA)
- [esistente] activity state e progress data (VERIFICARE DISPONIBILITÀ)

STYLE LAB PRESET
- Preset: Gilded Observatory (src/ui/styleLab/presets/gildedObservatory.ts)
- Overrides/Tokens: detail panel styling, skin-aware tokens

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica detail panel funzionante

DATO DI ORIGINE
- Piano: idle-village-vertical-slice-realignment-443d6e.md Task 4

DIPENDENZE
- IV-VSR-002 completato (runtime recovery)

OPERAZIONI DA ESEGUIRE
0. **Pre-Execution Guardrail**: Verificare esistenza di `PoiDetailSkinWrapper.tsx`, `MinimalGameplayPage.tsx`, e `ActivityCapsuleDetailSkinAware`. Se qualsiasi file manca o non è il target canonico, apri blocker immediato. Non creare sostituti.
1. **Panel Integration**: Integrare PoiDetailSkinWrapper in MinimalGameplayPage
2. **Data Binding**: Collegare panel a activity state, progress, slots, reward
3. **Time Source**: Assicurarsi che panel usi stessa fonte tempo del resto
4. **Panel Positioning**: Implementare panel "estruso dalla pagina" (sidebar/overlay)
5. **Skin-Aware Behavior**: Verificare che ActivityCapsuleDetailSkinAware funzioni correttamente

OPERAZIONI VIETATE
- Vietato creare finestre modali isolate
- Vietato clonare detail componenti
- Vietato usare overlay flottanti non connessi
- Vietato procedere se PoiDetailSkinWrapper non esiste o non è compatibile
- Vietato improvvisare componenti detail alternativi

ASSUNZIONI
- PoiDetailSkinWrapper esistente è completo e funzionante
- Activity state è disponibile dallo store
- Panel positioning può essere implementato con CSS esistente

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx`
- `npm run test -- tests/unit/idleVillage/PoiDetailSkinWrapper.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se PoiDetailSkinWrapper non è compatibile

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-vsr-004-detail-rebinding-<YYYY-MM-DD>.log`
3. Report finale con: panel funzionante, skin-aware behavior attivo

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, detail panel docs, skin system
- Integration-focused: focus su collegare componenti esistenti
- Governance: fare riferimento a `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` per trusted docs
- Documentation: consultare `idle-village-documentation-governance-pack.md` per procedure
- Contract validation: verificare implementazione contro trusted doc POI Detail Contract

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-vsr-004-detail-rebinding-<YYYY-MM-DD>.log
```

## IV-VSR-005: Day/Night Grammar Alignment
```
AGENT
Idle Village UI Specialist - Day/Night Integration

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare DayNightActionCard a grammatica ActivityCapsule con Style Lab tokens.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/map/actionCards/DayNightActionCard.tsx (VERIFICARE ESISTENZA)
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx (VERIFICARE ESISTENZA)
- [esistente] src/ui/styleLab/hooks/useStyleLabTokens.ts (VERIFICARE ESISTENZA)

STYLE LAB PRESET
- Preset: Gilded Observatory (src/ui/styleLab/presets/gildedObservatory.ts)
- Overrides/Tokens: day/night styling, action card tokens

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica day/night integration

DATO DI ORIGINE
- Piano: idle-village-vertical-slice-realignment-443d6e.md Task 5

DIPENDENZE
- IV-VSR-002 completato (runtime recovery)

OPERAZIONI DA ESEGUIRE
0. **Pre-Execution Guardrail**: Verificare esistenza di `DayNightActionCard.tsx`, `useStyleLabTokens.ts`, e `MinimalGameplayPage.tsx`. Se qualsiasi file manca o non è il target canonico, apri blocker immediato. Non improvvisare componenti alternativi.
1. **Style Lab Integration**: Integrare DayNightActionCard con useStyleLabTokens
2. **Visual Grammar**: Allineare styling a ActivityCapsule (halo, progress)
3. **Time Source**: Collegare day/night a stessa fonte tempo del resto
4. **Timer Removal**: Eliminare eventuali timer locali da DayNightActionCard
5. **Global Rules Alignment**: Assicurarsi coerenza con globalRules e palette

OPERAZIONI VIETATE
- Vietato mantenere timer locali
- Vietato creare componenti special-case
- Vietato hardcodare colori o icone
- Vietato procedere se DayNightActionCard non esiste o non è modificabile
- Vietato improvvisare componenti day/night alternativi

ASSUNZIONI
- DayNightActionCard esistente può essere modificato
- useStyleLabTokens fornisce tokens necessari
- Store time source è accessibile

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/map/actionCards/DayNightActionCard.tsx`
- `npm run test -- tests/unit/idleVillage/DayNightActionCard.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se Style Lab tokens insufficienti

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-vsr-005-daynight-alignment-<YYYY-MM-DD>.log`
3. Report finale con: day/night integrato, stile coerente

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, Style Lab docs, visual coherence requirements
- Token-driven: tutti gli stili devono venire da Style Lab
- Governance: fare riferimento a `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` per trusted docs
- Documentation: consultare `idle-village-documentation-governance-pack.md` per procedure
- Contract validation: verificare implementazione contro trusted doc Day/Night Contract

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-vsr-005-daynight-alignment-<YYYY-MM-DD>.log
```

## IV-VSR-006: Tick & Time Binding Hardening
```
AGENT
Idle Village Time Specialist - Single Source Binding

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Garantire singola fonte tempo, resistere tick multipli, eliminare drift.

PROMPT READINESS
FILE TARGET
- [esistente] src/store/useMinimalGameplayWithIdleVillageConfig.ts (VERIFICARE ESISTENZA)
- [esistente] src/ui/idleVillage/hooks/useSandboxTimingBridge.ts (VERIFICARE ESISTENZA)
- [esistente] componenti progress e completion (IDENTIFICARE TARGET)

STYLE LAB PRESET
- N/A (task time system)

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica time binding stabile

DATO DI ORIGINE
- Piano: idle-village-vertical-slice-realignment-443d6e.md Task 6

DIPENDENZE
- IV-VSR-002, IV-VSR-003, IV-VSR-004, IV-VSR-005 completati

OPERAZIONI DA ESEGUIRE
0. **Pre-Execution Guardrail**: Verificare esistenza di `useMinimalGameplayWithIdleVillageConfig.ts`, `useSandboxTimingBridge.ts`, e componenti progress target. Se qualsiasi file manca o non è il target canonico, apri blocker immediato.
1. **Single Source**: Verificare che tutti i componenti leggano da useMinimalGameplayWithIdleVillageConfig
2. **Timer Audit**: Eliminare tutti i timer locali (setTimeout/interval) non orchestrati
3. **Tick Resistance**: Testare che completion/collect resistano a tick multipli
4. **Drift Prevention**: Implementare safegard contro scheduleTimeout nesting
5. **Time Bridge**: Assicurarsi che useSandboxTimingBridge sia correttamente integrato

OPERAZIONI VIETATE
- Vietato introdurre timer manuali
- Vietato bypassare store tick
- Vietato usare delta fittizi o clock locali
- Vietato procedere se time source components non esistono
- Vietato improvvisare time bridge alternativi

ASSUNZIONI
- useMinimalGameplayWithIdleVillageConfig espone time source completa
- useSandboxTimingBridge gestisce correttamente tick
- Nessun componente richiede timer indipendenti

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/hooks/useSandboxTimingBridge.ts`
- `npm run test -- tests/unit/idleVillage/useSandboxTimingBridge.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se time source insufficiente

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-vsr-006-time-binding-<YYYY-MM-DD>.log`
3. Report finale con: time binding stabile, nessun drift

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, time system docs, tick resistance requirements
- Single-source: solo una fonte di tempo per tutto il sistema
- Governance: fare riferimento a `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` per trusted docs
- Documentation: consultare `idle-village-documentation-governance-pack.md` per procedure
- Contract validation: verificare implementazione contro trusted doc Time Engine Contract

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-vsr-006-time-binding-<YYYY-MM-DD>.log
```

## IV-VSR-007: Visual Coherence & Skin Consistency
```
AGENT
Idle Village Style Specialist - Style Lab Integration

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Applicare Style Lab tokens, rimuovere override manuali, garantire coerenza Gilded Observatory.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx (VERIFICARE ESISTENZA)
- [esistente] src/ui/styleLab/hooks/useStyleLabTokens.ts (VERIFICARE ESISTENZA)
- [esistente] ActivityCapsule skin config (VERIFICARE DISPONIBILITÀ)

STYLE LAB PRESET
- Preset: Gilded Observatory (src/ui/styleLab/presets/gildedObservatory.ts)
- Overrides/Tokens: visual coherence tokens, palette completa

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica stile coerente

DATO DI ORIGINE
- Piano: idle-village-vertical-slice-realignment-443d6e.md Task 7

DIPENDENZE
- IV-VSR-003, IV-VSR-004, IV-VSR-005, IV-VSR-006 completati

OPERAZIONI DA ESEGUIRE
0. **Pre-Execution Guardrail**: Verificare esistenza di `useStyleLabTokens.ts`, `MinimalGameplayPage.tsx`, e Gilded Observatory preset. Se qualsiasi file manca o preset non è disponibile, apri blocker immediato.
1. **Token Integration**: Applicare useStyleLabTokens a tutti i componenti
2. **Override Removal**: Eliminare CSS inline e colori hardcodati
3. **Palette Consistency**: Assicurarsi coerenza con Gilded Observatory rules
4. **Typography**: Applicare font family e sizes da Style Lab
5. **Asset Cleanup**: Rimuovere asset legacy (Wood-themed, debug overlays)

OPERAZIONI VIETATE
- Vietato aggiungere CSS inline o override arbitrarie
- Vietato usare asset legacy
- Vietato hardcodare colori o font
- Vietato procedere se Style Lab tokens non disponibili
- Vietato improvvisare styling system alternativi

ASSUNZIONI
- useStyleLabTokens fornisce tutti i tokens necessari
- Gilded Observatory preset è completo e stabile
- Componenti possono essere stilizzati via tokens

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se tokens insufficienti

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/iv-vsr-007-visual-coherence-<YYYY-MM-DD>.log`
3. Report finale con: stile coerente, Gilded Observatory rispettato

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, Style Lab docs, visual coherence requirements
- Token-driven: tutto lo stile deve venire da Style Lab
- Governance: fare riferimento a `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` per trusted docs
- Documentation: consultare `idle-village-documentation-governance-pack.md` per procedure
- Contract validation: verificare implementazione contro trusted docs POI Standard e POI Detail tokens

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/iv-vsr-007-visual-coherence-<YYYY-MM-DD>.log
```
