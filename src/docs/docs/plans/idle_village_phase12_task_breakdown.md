# Phase 12: Idle Incremental RPG - Task Breakdown

**Status:** Planning  
**Type:** Task Sequencing  
**Based on:** idle_village_plan.md

---

## Overview

Questo documento suddivide la Phase 12 in task sequenziali e gestibili. Ogni task è progettato per essere completato in 1-3 giorni di lavoro dipendenti dalla complessità.

---

## Macro-Fasi Principali

### FASE 1: Core Systems (12.1 - 12.5)
- Time & Activity Engine
- Characters & Roster Integration  
- Jobs & Worker Placement
- Quest System
- Combat Integration

### FASE 2: Risk & Consequence Systems (12.6 - 12.8)
- Injury & Death System
- Village Map & Expansion
- Economy System

### FASE 3: UI/UX & Integration (12.9 - 12.10)
- Village Meta Screen
- Testing & Documentation

### FASE 4: Advanced Features (12.11 - 12.20)
- POI System, Analytics, Automation, etc.

---

## Task Dettagliati

### FASE 1: Core Systems

#### Phase 12.1 - Time & Activity Engine (3-4 giorni)

**12.1.1 - Audit e Refactoring TimeEngine** (1 giorno)
- [ ] Analizzare `advanceTime` per identificare hardcoded `fatigueGain = 10`
- [ ] Spostare `fatigueGain` in `activity.metadata.fatigueGain`
- [ ] Creare `ActivityMetadataConfig` per valori default
- [ ] Test unitari per verificare che il comportamento rimanga invariato

**12.1.2 - Sandbox Engine Service** (1 giorno)
- [ ] Estrarre loop di ticking da `IdleVillageMapPage` in `SandboxEngine`
- [ ] Creare `SandboxEngine.tick()` con configurazione intervallo
- [ ] Integrare `VillageSandbox` per usare `SandboxEngine`
- [ ] Test di integrazione per verificare sincronizzazione

**12.1.3 - Trial of Fire Integration** (1 giorno)
- [ ] Collegare `resolveActivityOutcome` al loop principale di Sandbox
- [ ] Implementare hero bonus calculation in `advanceTime`
- [ ] Test per verificare che Trial of Fire si attivi correttamente
- [ ] Documentation update per nuovo flusso

**12.1.4 - Performance & Telemetry** (1 giorno)
- [ ] Ottimizzare `tickIdleVillage` per performance con molti residenti
- [ ] Aggiungere telemetry events per timing metrics
- [ ] Implementare debounce per update frequenti
- [ ] Benchmark con 50+ residenti

#### Phase 12.2 - Characters & Roster Integration (2-3 giorni)

**12.2.1 - Character Manager Integration** (1 giorno)
- [ ] Audit di `bootstrapResidentsFromCharacters()` (canonical pipeline)
- [ ] Implementare fallback per roster vuoto
- [ ] Aggiungere telemetry per character load events
- [ ] Test con character manager vuoto e popolato

**12.2.2 - Housing Cap System** (1 giorno)
- [ ] Estendere `VillageState` con `housingCap`
- [ ] Implementare `canRecruitResident()` check
- [ ] Creare UI components per housing status
- [ ] Test per verificare limiti recruitment

**12.2.3 - Food Consumption Integration** (1 giorno)
- [ ] Collegare costi cibo a `residentCount`
- [ ] Implementare `applyFoodConsumption()` in `advanceTime`
- [ ] Aggiungere warning per cibo insufficiente
- [ ] UI indicators per food status

#### Phase 12.3 - Jobs & Worker Placement (3-4 giorni)

**12.3.1 - Jobs Config Expansion** (1 giorno)
- [ ] Audit di `jobsConfig.ts` per valori hardcoded
- [ ] Estendere `JobDefinition` con `slotModifiers`
- [ ] Aggiungere `statScaling` configuration
- [ ] Test per validare config-driven behavior

**12.3.2 - Job Resolution Engine** (1 giorno)
- [ ] Rifattorizzare `resolveJob` per usare config values
- [ ] Implementare slot modifiers in reward calculation
- [ ] Aggiungere variability basata su stats
- [ ] Unit tests per tutte le job types

**12.3.3 - Worker Placement UI** (1 giorno)
- [ ] Integrare `useResidentSlotController` con jobs
- [ ] Implementare drag & drop per job assignments
- [ ] Aggiungere visual feedback per job compatibility
- [ ] Test E2E per complete assignment flow

**12.3.4 - Fatigue System Integration** (1 giorno)
- [ ] Collegare `fatigueGain` da job config
- [ ] Implementare `exhausted` state handling
- [ ] Aggiungere recovery mechanics
- [ ] UI indicators per resident fatigue

#### Phase 12.4 - Quest System (6-7 giorni)

**12.4.1 - Quest Config Enhancement** (1 giorno)
- [ ] Estendere `QuestDefinition` con outcome profiles
- [ ] Implementare `dangerRating` e `level` mapping
- [ ] Aggiungere `rewardVariance` configuration
- [ ] Test per validare quest generation

**12.4.2 - Effective Power Calculation** (1 giorno)
- [ ] Implementare `calculatePartyEffectivePower()`
- [ ] Integrare stat weights e tag matching
- [ ] Aggiungere difficulty normalization
- [ ] Unit tests per power calculation accuracy

**12.4.3 - Quest Outcome Distribution** (1 giorno)
- [ ] Implementare `determineQuestOutcome()` basato su power
- [ ] Integrare outcome profiles e weights
- [ ] Aggiungere randomness controllato
- [ ] Test per verificare distribution fairness

**12.4.4 - Quest Spawn System** (1 giorno)
- [ ] Implementare `spawnQuestOffersIfNeeded()`
- [ ] Aggiungere distance-based quest availability
- [ ] Integrare building prerequisites
- [ ] Test per spawn behavior

**12.4.5 - Quest UI Integration** (1 giorno)
- [ ] Integrare quest system con UI esistente
- [ ] Implementare quest card components
- [ ] Aggiungere risk assessment display
- [ ] Test E2E per quest acceptance flow

**12.4.6 - Quest Success Modal** (2 giorni)
- [ ] Progettare e implementare `QuestSuccessModal`
- [ ] Collegare `ActiveActivityHUD` / `ActivityCapsule` per mostrare la modale su quest completata
- [ ] Visualizzare dettagli outcome (status, durata, sopravvissuti, loot)
- [ ] Integrare telemetry (`quest_success_modal_shown`, `quest_rewards_collected`)
- [ ] Test RTL + snapshot della modale

**12.4.7 - Reward Application System** (2 giorni)
- [ ] Creare hook/servizio `useRewardApplication` / `rewardSystem.ts`
- [ ] Applicare ricompense al `VillageState` (risorse, XP, unlock)
- [ ] Garantire persistenza tramite `PersistenceService`
- [ ] Aggiornare Minimal Gameplay Page per usare il nuovo flusso collect → modal → rewards
- [ ] Test unitari + E2E vertical slice (collect flow)

#### Phase 12.5 - Combat Integration (3-4 giorni)

**12.5.1 - Combat Bridge Adapter** (1 giorno)
- [ ] Creare `QuestCombatAdapter`
- [ ] Implementare `buildCombatantsFromParty()`
- [ ] Collegare idle combat engine
- [ ] Test per combat integration

**12.5.2 - Combat Outcome Mapping** (1 giorno)
- [ ] Implementare `mapCombatToQuestOutcome()`
- [ ] Definire outcome minimum thresholds
- [ ] Integrare combat results con quest rewards
- [ ] Test per outcome consistency

**12.5.3 - Combat UI Integration** (1 giorno)
- [ ] Implementare combat preview in quest UI
- [ ] Aggiungere combat log display
- [ ] Integrare combat results animations
- [ ] Test E2E per combat quest flow

**12.5.4 - Combat Performance** (1 giorno)
- [ ] Ottimizzare combat calculation per multiple quests
- [ ] Implementare combat caching
- [ ] Aggiungere async combat processing
- [ ] Benchmark con multiple active quests

---

### FASE 2: Risk & Consequence Systems

#### Phase 12.6 - Injury & Death System (2-3 giorni)

**12.6.1 - Injury Levels Definition** (1 giorno)
- [ ] Definire `InjuryLevel` enum (light/moderate/severe)
- [ ] Implementare injury stat malus calculation
- [ ] Creare injury recovery time formulas
- [ ] Test per injury progression

**12.6.2 - Death Mechanics** (1 giorno)
- [ ] Implementare death probability calculation
- [ ] Collegare death a quest outcomes
- [ ] Aggiungere resident removal logic
- [ ] Test per death handling

**12.6.3 - Injured Worker Integration** (1 giorno)
- [ ] Modificare job assignment per injured residents
- [ ] Implementare reduced productivity for injured
- [ ] Aggiungere building bonuses for injured workers
- [ ] Test per injured worker efficiency

#### Phase 12.7 - Village Map & Expansion (2-3 giorni)

**12.7.1 - Map Layout System** (1 giorno)
- [ ] Implementare `VillageMapLayout` configuration
- [ ] Creare coordinate system per buildings
- [ ] Aggiungere map slot management
- [ ] Test per map rendering

**12.7.2 - Building Expansion** (1 giorno)
- [ ] Implementare `BuildingUpgrade` system
- [ ] Creare upgrade cost calculation
- [ ] Aggiungere upgrade requirements
- [ ] Test per upgrade flow

**12.7.3 - Map UI Integration** (1 giorno)
- [ ] Integrare map con UI esistente
- [ ] Implementare building placement
- [ ] Aggiungere expansion visualization
- [ ] Test E2E per map interactions

#### Phase 12.8 - Economy System (2-3 giorni)

**12.8.1 - Resource Management** (1 giorno)
- [ ] Implementare `ResourceManager`
- [ ] Creare resource production/consumption tracking
- [ ] Aggiungere resource storage limits
- [ ] Test per resource balancing

**12.8.2 - Market System** (1 giorno)
- [ ] Implementare `MarketEngine` per trading
- [ ] Creare dynamic pricing system
- [ ] Aggiungere market UI components
- [ ] Test per market transactions

**12.8.3 - Economic Balance** (1 giorno)
- [ ] Implementare economic balance calculations
- [ ] Aggiungere inflation/deflation mechanics
- [ ] Creare economic indicators
- [ ] Test per economic stability

---

### FASE 3: UI/UX & Integration

#### Phase 12.9 - UI/UX Village Meta Screen (4-5 giorni)

**12.9.1 - Main Layout Implementation** (1 giorno)
- [ ] Implementare layout principale a 3 colonne
- [ ] Creare responsive design per desktop/mobile
- [ ] Integrare Style Laboratory tokens
- [ ] Test per layout responsiveness

**12.9.2 - Roster Integration** (1 giorno)
- [ ] Integrare `VillageRosterSection` nella meta screen
- [ ] Implementare drag & drop functionality
- [ ] Aggiungere resident status indicators
- [ ] Test E2E per roster interactions

**12.9.3 - Map Integration** (1 giorno)
- [ ] Integrare village map nella meta screen
- [ ] Implementare interactive map elements
- [ ] Aggiungere building status indicators
- [ ] Test per map interactions

**12.9.4 - Activity Queue UI** (1 giorno)
- [ ] Implementare activity queue visualization
- [ ] Creare progress indicators
- [ ] Aggiungere activity management controls
- [ ] Test per queue management

**12.9.5 - Event Log System** (1 giorno)
- [ ] Implementare event log display
- [ ] Creare filtering and search
- [ ] Aggiungere event detail views
- [ ] Test per log functionality

---

### FASE 4: Advanced Features

#### Phase 12.10 - Testing & Documentation (2-3 giorni)

**12.10.1 - Unit Test Suite** (1 giorno)
- [ ] Creare unit tests per tutti i nuovi sistemi
- [ ] Implementare test coverage reporting
- [ ] Aggiungere integration tests
- [ ] Verificare coverage > 80%

**12.10.2 - E2E Test Suite** (1 giorno)
- [ ] Creare E2E tests per tutti i flussi principali
- [ ] Implementare visual regression testing
- [ ] Aggiungere performance testing
- [ ] Test per cross-browser compatibility

**12.10.3 - Documentation Update** (1 giorno)
- [ ] Aggiornare tutta la documentazione tecnica
- [ ] Creare user guides per nuove features
- [ ] Implementare API documentation
- [ ] Test per documentation accuracy

---

## Task Dependencies

### Critical Path
```
12.1.1 → 12.1.2 → 12.1.3 → 12.1.4
     ↓
12.2.1 → 12.2.2 → 12.2.3
     ↓
12.3.1 → 12.3.2 → 12.3.3 → 12.3.4
     ↓
12.4.1 → 12.4.2 → 12.4.3 → 12.4.4 → 12.4.5
     ↓
12.5.1 → 12.5.2 → 12.5.3 → 12.5.4
     ↓
12.6.1 → 12.6.2 → 12.6.3
     ↓
12.7.1 → 12.7.2 → 12.7.3
     ↓
12.8.1 → 12.8.2 → 12.8.3
     ↓
12.9.1 → 12.9.2 → 12.9.3 → 12.9.4 → 12.9.5
     ↓
12.10.1 → 12.10.2 → 12.10.3
```

### Parallel Work Opportunities
- **UI Development** può iniziare dopo 12.3.1 (jobs base)
- **Testing** può iniziare in parallelo con development
- **Documentation** può essere aggiornata continuamente

---

## Time Estimates

| Phase | Days | Notes |
|-------|------|-------|
| 12.1 - Time Engine | 3-4 | Core system, high priority |
| 12.2 - Characters | 2-3 | Integration work |
| 12.3 - Jobs | 3-4 | Complex UI integration |
| 12.4 - Quests | 6-7 | Include success modal + reward engine |
| 12.5 - Combat | 3-4 | Integration with existing systems |
| 12.6 - Injury/Death | 2-3 | Risk mechanics |
| 12.7 - Village Map | 2-3 | UI heavy |
| 12.8 - Economy | 2-3 | Balance critical |
| 12.9 - UI/UX | 4-5 | Major UI work |
| 12.10 - Testing | 2-3 | Quality assurance |

**Total Estimated Time: 28-41 giorni**

---

## Success Criteria

### Per Ogni Task
- [ ] Codice implementato e funzionante
- [ ] Test unitari passanti
- [ ] Documentazione aggiornata
- [ ] Code review completata

### Per Ogni Phase
- [ ] Tutti i task completati
- [ ] Integration tests passanti
- [ ] Performance benchmarks raggiunti
- [ ] User acceptance testing

### Per il Progetto Completo
- [ ] Vertical slice giocabile
- [ ] Tutti i sistemi integrati
- [ ] Documentazione completa
- [ ] Deploy ready

---

## Next Steps

1. **Iniziare con Phase 12.1.1** - Audit TimeEngine
2. **Setup environment** per development e testing
3. **Establish communication** protocols per il team
4. **Create progress tracking** system
5. **Begin implementation** seguendo la sequenza definita

---

*Questo documento sarà aggiornato regolarmente con progressi e modifiche ai task.*
