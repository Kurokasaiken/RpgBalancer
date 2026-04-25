# Runtime Component Alignment Plan
**Phase**: Runtime/Component Alignment Guided by Trusted Docs  
**Status**: Draft  
**Created**: 2026-04-22  
**Author**: Cascade  

## Executive Summary

Transition from page-first development to component-first alignment using trusted docs as source of truth. This plan transforms the consolidated documentation into an operational runtime execution plan with maximum parallelism and zero collision guarantees.

## A. Runtime Dependency Map

### 1. Time Engine Alignment
**Trusted Doc**: `src/docs/docs/idle_village/trusted/time_engine_trusted.md`  
**Primary Runtime Files**:
- `src/engine/game/idleVillage/TimeEngine.ts` (core engine)
- `src/store/useMinimalGameplay.ts` (React hook integration)
- `src/ui/idleVillage/hooks/useMinimalGameplay.ts` (UI hook)

**Verification Harness**:
- `/minimal-gameplay` (primary)
- `/test` (integration via TestRosterPage)

**Key Contracts**:
- `VillageState` interface
- `IdleVillageConfig` dependency
- Time progression API
- Resource management API

### 2. Roster / Drag Alignment
**Trusted Doc**: Not yet created (implicit from TimeEngine + ActivityCapsule contracts)  
**Primary Runtime Files**:
- `src/ui/idleVillage/TestRosterPage.tsx` (drag & drop harness)
- `src/ui/idleVillage/components/DragContext.tsx` (drag system)
- `src/ui/idleVillage/components/DraggableWorker.tsx` (draggable entities)
- `src/engine/game/idleVillage/statMatching.ts` (validation logic)

**Verification Harness**:
- `/test` (primary TestRosterPage)
- `/minimal-gameplay` (secondary integration)

**Key Contracts**:
- Drag & drop validation flow
- Stat requirement matching
- Assignment API
- Visual feedback system

### 3. POI Standard Alignment
**Trusted Doc**: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md`  
**Primary Runtime Files**:
- `src/ui/idleVillage/components/ActivityCapsule.tsx` (core component)
- `src/ui/idleVillage/skins/activityCapsuleSkinConfig.ts` (skin configuration)
- `src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts` (skin implementation)

**Verification Harness**:
- Dedicated POI page (to be created)
- `/minimal-gameplay` (ActivityCapsule examples)
- `/test` (TestRosterPage integration)

**Key Contracts**:
- ActivityCapsule props interface
- Skin configuration API
- Progress tracking API
- Collect functionality

### 4. POI Detail Alignment
**Trusted Doc**: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`  
**Primary Runtime Files**:
- `src/ui/idleVillage/components/PoiDetailSkinWrapper.tsx` (detail wrapper)
- `src/ui/idleVillage/skins/activityCapsuleDetail/` (detail skins)

**Verification Harness**:
- Dedicated POI Detail page (to be created)

**Key Contracts**:
- Detail wrapper API
- Enhanced information display
- Integration with standard POI

### 5. Day/Night Alignment
**Trusted Doc**: `src/docs/docs/idle_village/trusted/daynight_trusted.md`  
**Primary Runtime Files**:
- `src/ui/idleVillage/daynight/` (day/night system - to be identified)

**Verification Harness**:
- Dedicated Day/Night page (to be created)

**Key Contracts**:
- Time-based visual modifiers
- Event system integration
- Visual state management

## B. Runtime Task Plan

### Wave 1: Core Engine Alignment (Component-First)

#### Task 1: Time Engine Runtime Alignment
**ID**: RT-TIME-001  
**Trusted Contract**: TimeEngine Contract  
**Target Files**:
- [esistente] `src/engine/game/idleVillage/TimeEngine.ts` (VERIFY)
- [esistente] `src/store/useMinimalGameplay.ts` (ALIGN)
- [esistente] `src/ui/idleVillage/hooks/useMinimalGameplay.ts` (ALIGN)

**Verification Harness**: `/minimal-gameplay`  
**Acceptance Criteria**:
- TimeEngine.ts follows trusted contract exactly
- useMinimalGameplay hooks expose contract API correctly
- All time progression APIs work as specified
- Resource management matches trusted definitions
- No hardcoded values - all from IdleVillageConfig

**Operations Vietate**:
- Vietato modificare TimeEngine.ts core logic (solo verify/align)
- Vietato aggiungere nuove API non nel trusted doc
- Vietato hardcodare valori di dominio

**Dipendenze**: Nessuna (primo task)

---

#### Task 2: Roster / Drag Runtime Alignment
**ID**: RT-ROSTER-001  
**Trusted Contract**: TimeEngine Contract (implicit) + ActivityCapsule Contract  
**Target Files**:
- [esistente] `src/ui/idleVillage/TestRosterPage.tsx` (ALIGN)
- [esistente] `src/ui/idleVillage/components/DragContext.tsx` (VERIFY)
- [esistente] `src/engine/game/idleVillage/statMatching.ts` (ALIGN)

**Verification Harness**: `/test`  
**Acceptance Criteria**:
- Drag validation flow matches trusted requirements
- Stat requirement validation works as specified
- Assignment API respects TimeEngine state
- Visual feedback system aligned with contracts
- TestRosterPage serves as proper drag harness

**Operations Vietate**:
- Vietato modificare drag system core (solo align)
- Vietato aggiungere nuovi drag behaviors non in trusted
- Vietato modificare TimeEngine state direttamente

**Dipendenze**: RT-TIME-001

---

### Wave 2: POI Component Alignment (Parallel Execution)

#### Task 3: POI Standard Runtime Alignment
**ID**: RT-POI-S-001  
**Trusted Contract**: POI Standard Contract  
**Target Files**:
- [esistente] `src/ui/idleVillage/components/ActivityCapsule.tsx` (ALIGN)
- [esistente] `src/ui/idleVillage/skins/activityCapsuleSkinConfig.ts` (ALIGN)
- [esistente] `src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts` (VERIFY)

**Verification Harness**: Dedicated POI page (CREATE)  
**Acceptance Criteria**:
- ActivityCapsule props interface matches trusted contract
- Skin configuration API follows trusted specifications
- Progress tracking works as documented
- Collect functionality matches contract definition
- Dedicated POI page serves as verification harness

**Operations Vietate**:
- Vietato modificare ActivityCapsule core behavior (solo align)
- Vietato aggiungere nuove props non nel trusted doc
- Vietato modificare skin system core

**Dipendenze**: RT-TIME-001

---

#### Task 4: POI Detail Runtime Alignment
**ID**: RT-POI-D-001  
**Trusted Contract**: POI Detail Contract  
**Target Files**:
- [esistente] `src/ui/idleVillage/components/PoiDetailSkinWrapper.tsx` (ALIGN)
- [esistente] `src/ui/idleVillage/skins/activityCapsuleDetail/` (VERIFY)

**Verification Harness**: Dedicated POI Detail page (CREATE)  
**Acceptance Criteria**:
- Detail wrapper API matches trusted contract
- Enhanced information display follows specifications
- Integration with standard POI works correctly
- Dedicated detail page serves as verification harness

**Operations Vietate**:
- Vietato modificare detail wrapper core (solo align)
- Vietato aggiungere nuove features non nel trusted
- Vietato modificare POI standard component

**Dipendenze**: RT-POI-S-001

---

#### Task 5: Day/Night Runtime Alignment
**ID**: RT-DAYN-001  
**Trusted Contract**: Day/Night Contract  
**Target Files**:
- [esistente] `src/ui/idleVillage/daynight/` (IDENTIFY + ALIGN)

**Verification Harness**: Dedicated Day/Night page (CREATE)  
**Acceptance Criteria**:
- Time-based visual modifiers work as specified
- Event system integration matches trusted contract
- Visual state management follows documented patterns
- Dedicated day/night page serves as verification harness

**Operations Vietate**:
- Vietato modificare core day/night logic (solo align)
- Vietato aggiungere nuovi visual effects non in trusted
- Vietato modificare TimeEngine time progression

**Dipendenze**: RT-TIME-001

---

### Wave 3: Integration Pages (Sequential)

#### Task 6: POI Integration Page Assembly
**ID**: RT-INT-001  
**Trusted Contract**: POI Standard + POI Detail Contracts  
**Target Files**:
- [nuovo] `src/ui/idleVillage/pages/PoiIntegrationPage.tsx` (CREATE)

**Verification Harness**: `/poi-integration` (CREATE)  
**Acceptance Criteria**:
- Integration page demonstrates POI standard + detail interaction
- Both component types work together correctly
- Page serves as integration verification harness
- No new component logic (only integration)

**Operations Vietate**:
- Vietato creare nuovi componenti (solo integration)
- Vietato modificare POI contracts
- Vietato aggiungere nuova logica di dominio

**Dipendenze**: RT-POI-S-001, RT-POI-D-001

---

#### Task 7: Drag Integration Page Assembly
**ID**: RT-INT-002  
**Trusted Contract**: TimeEngine + Roster/Drag Contracts  
**Target Files**:
- [nuovo] `src/ui/idleVillage/pages/DragIntegrationPage.tsx` (CREATE)

**Verification Harness**: `/drag-integration` (CREATE)  
**Acceptance Criteria**:
- Integration page demonstrates drag + TimeEngine interaction
- Assignment workflows work end-to-end
- Page serves as drag verification harness
- No new drag logic (only integration)

**Operations Vietate**:
- Vietato creare nuovi drag behaviors (solo integration)
- Vietato modificare drag contracts
- Vietato aggiungere nuova logica di validazione

**Dipendenze**: RT-TIME-001, RT-ROSTER-001

---

### Wave 4: Final Assembly

#### Task 8: Minimal Gameplay Page Assembly
**ID**: RT-FINAL-001  
**Trusted Contract**: All Trusted Contracts  
**Target Files**:
- [esistente] `src/ui/idleVillage/MinimalGameplayPage.tsx` (ALIGN)

**Verification Harness**: `/minimal-gameplay` (FINAL)  
**Acceptance Criteria**:
- Final page integrates all aligned components correctly
- All component interactions work as documented
- Page serves as complete vertical slice demonstration
- No new component logic (only assembly)

**Operations Vietate**:
- Vietato creare nuovi componenti (solo assembly)
- Vietato modificare trusted contracts
- Vietato aggiungere nuova logica di dominio

**Dipendenze**: RT-INT-001, RT-INT-002, RT-DAYN-001

---

## C. Parallelization Plan

### Maximum Parallelism Configuration

**Wave 1** (Sequential - Foundation):
- RT-TIME-001 (solo) - Foundation for all other tasks

**Wave 2** (Maximum Parallelism - 3 agents):
- RT-ROSTER-001 (Agent A) - Drag alignment
- RT-POI-S-001 (Agent B) - POI standard alignment  
- RT-DAYN-001 (Agent C) - Day/night alignment
*Zero collision guarantee: Different component domains*

**Wave 2.5** (Parallel - 1 agent):
- RT-POI-D-001 (Agent B) - POI detail alignment
*Depends on RT-POI-S-001 completion*

**Wave 3** (Sequential - Integration):
- RT-INT-001 (solo) - POI integration page
- RT-INT-002 (solo) - Drag integration page

**Wave 4** (Final):
- RT-FINAL-001 (solo) - Final minimal gameplay assembly

### Collision Prevention Matrix

| Task | TimeEngine | Roster/Drag | POI-S | POI-D | Day/Night | Integration | Final |
|------|------------|-------------|-------|-------|-----------|--------------|-------|
| RT-TIME-001 | **X** | | | | | | |
| RT-ROSTER-001 | R | **X** | | | | | |
| RT-POI-S-001 | R | | **X** | | | | |
| RT-DAYN-001 | R | | | | **X** | | |
| RT-POI-D-001 | R | | R | **X** | | | |
| RT-INT-001 | R | R | R | R | R | **X** | |
| RT-INT-002 | R | R | | | R | **X** | |
| RT-FINAL-001 | R | R | R | R | R | R | **X** |

**Legend**: X = Primary target, R = Read-only dependency

## D. Executioner Prompts

### RT-TIME-001: Time Engine Runtime Alignment

```text
AGENT
Idle Village Runtime Alignment Specialist - Time Engine

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare TimeEngine runtime con il trusted contract, verificando che l'implementazione corrente segua esattamente il contratto documentato.

PROMPT READINESS
FILE TARGET
- [esistente] src/engine/game/idleVillage/TimeEngine.ts (VERIFY)
- [esistente] src/store/useMinimalGameplay.ts (ALIGN)
- [esistente] src/ui/idleVillage/hooks/useMinimalGameplay.ts (ALIGN)

STYLE LAB PRESET
- N/A (task runtime alignment)

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica TimeEngine integration
- Opzionale: /test per verifica useMinimalGameplay integration

DATO DI ORIGINE
- Trusted Doc: src/docs/docs/idle_village/trusted/time_engine_trusted.md
- Piano: Runtime Component Alignment Plan - Task RT-TIME-001

DIPENDENZE
- Nessuna (primo task runtime alignment)

OPERAZIONI DA ESEGUIRE
1. **Read Trusted Contract**: Leggere time_engine_trusted.md per capire contratto esatto
2. **Verify TimeEngine.ts**: Verificare che TimeEngine.ts implementi esattamente il contratto:
   - VillageState interface match
   - IdleVillageConfig dependency
   - Time progression API
   - Resource management API
3. **Align useMinimalGameplay hooks**: Allineare hooks per esporre correttamente API del contratto
4. **Test Runtime Verification**: Verificare che /minimal-gameplay dimostri correttamente TimeEngine integration
5. **Config-First Verification**: Assicurarsi che nessun valore sia hardcoded, tutto da IdleVillageConfig
6. **Contract Compliance**: Documentare qualsiasi deviazione dal trusted contract

OPERAZIONI VIETATE
- Vietato modificare TimeEngine.ts core logic (solo verify/align)
- Vietato aggiungere nuove API non nel trusted doc
- Vietato hardcodare valori di dominio
- Vietato modificare altri componenti runtime

ASSUNZIONI
- TimeEngine.ts esiste e contiene l'implementazione corrente
- useMinimalGameplay hooks esistono e integrano TimeEngine
- Trusted contract definisce API complete e corrette

REGRESSION SAFEGUARDS
- `npm run lint -- src/engine/game/idleVillage/TimeEngine.ts`
- `npm run lint -- src/store/useMinimalGameplay.ts`
- `npm run lint -- src/ui/idleVillage/hooks/useMinimalGameplay.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se TimeEngine.ts non corrisponde al trusted contract

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-time-001-alignment-<YYYY-MM-DD>.log`
3. Report finale con: TimeEngine verificato, hooks allineati, runtime integration confermata

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Alignment only: non modificare il contratto, solo verificare compliance
- Config-first: assicurarsi che ogni valore di dominio venga da configurazione

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-time-001-alignment-<YYYY-MM-DD>.log
```

### RT-ROSTER-001: Roster / Drag Runtime Alignment

```text
AGENT
Idle Village Runtime Alignment Specialist - Roster & Drag

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare roster e drag system con i trusted contracts, verificando che il drag & drop funzioni correttamente con TimeEngine state.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/TestRosterPage.tsx (ALIGN)
- [esistente] src/ui/idleVillage/components/DragContext.tsx (VERIFY)
- [esistente] src/engine/game/idleVillage/statMatching.ts (ALIGN)

STYLE LAB PRESET
- N/A (task runtime alignment)

TEST ROUTE QA
- Obbligatorio: /test per verifica TestRosterPage drag harness
- Opzionale: /minimal-gameplay per verifica drag integration

DATO DI ORIGINE
- Trusted Doc: src/docs/docs/idle_village/trusted/time_engine_trusted.md (implicit)
- Piano: Runtime Component Alignment Plan - Task RT-ROSTER-001

DIPENDENZE
- RT-TIME-001 deve essere completato (TimeEngine allineato)

OPERAZIONI DA ESEGUIRE
1. **Read Trusted Contracts**: Leggere TimeEngine e ActivityCapsule contracts per capire integration requirements
2. **Verify Drag System**: Verificare che DragContext.tsx implementi correttamente il drag flow:
   - Validation flow matches trusted requirements
   - Visual feedback system aligned
   - Event handling follows contract
3. **Align statMatching.ts**: Allineare logica di validazione con i contratti trusted:
   - Stat requirement validation
   - Assignment API integration
   - TimeEngine state respect
4. **Align TestRosterPage**: Allineare TestRosterPage per servire come proper drag harness:
   - Demonstrate drag workflows
   - Integration with TimeEngine
   - Proper validation feedback
5. **Test Drag Integration**: Verificare che /test dimostri correttamente drag & drop functionality
6. **Contract Integration**: Assicurarsi che drag system rispetti TimeEngine state contracts

OPERAZIONI VIETATE
- Vietato modificare drag system core (solo align)
- Vietato aggiungere nuovi drag behaviors non in trusted
- Vietato modificare TimeEngine state direttamente
- Vietato creare nuovi componenti di drag

ASSUNZIONI
- TestRosterPage esiste e contiene implementazione drag
- DragContext.tsx contiene sistema drag corrente
- statMatching.ts contiene logica di validazione
- TimeEngine alignment completato da RT-TIME-001

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx`
- `npm run lint -- src/ui/idleVillage/components/DragContext.tsx`
- `npm run lint -- src/engine/game/idleVillage/statMatching.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se drag system non è allineabile

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-roster-001-alignment-<YYYY-MM-DD>.log`
3. Report finale con: Drag system verificato, TestRosterPage allineato, integration confermata

NOTE
- Seguire filosofia governance: trusted docs guidano l'allineamento
- Integration focus: drag system deve integrarsi correttamente con TimeEngine
- Harness role: TestRosterPage deve servire come verification harness

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-roster-001-alignment-<YYYY-MM-DD>.log
```

---

## Next Steps

1. **Insert prompts in Kanban** following KS-005 workflow
2. **Begin Wave 1** with RT-TIME-001 execution
3. **Prepare Wave 2** parallel execution setup
4. **Monitor progress** and adjust as needed

## Success Metrics

- All runtime files aligned with trusted contracts
- Zero hardcoded domain values
- Component-first development established
- Maximum parallelism achieved without collisions
- Final `/minimal-gameplay` page as complete vertical slice demonstration
