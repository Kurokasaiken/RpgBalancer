## Sessione – 2025-12-06

### 🔭 Focus
- Collegare il Balancer a contesti di scenario configurabili (context weights / expected value).
- Definire l’ossatura del layer tattico (Phase 11) in modalità config-first.
- Aggiungere superfici di test dedicate per archetipi e scenari.

### ✅ Progressi Principali

- **Scenario Context Weights & Expected Value**
  - Creato `src/balancing/contextWeights.ts` con 4 scenari di riferimento (duel, swarm, boss, 5v5) e relativi moltiplicatori di efficacia per le stat.
  - Creato `src/balancing/expectedValue.ts` con helper puri per:
    - applicare i moltiplicatori di scenario a uno `StatBlock`/mappa di stat,
    - calcolare il power per singolo scenario,
    - generare mappe `ScenarioType → power` riusabili in UI/test.
  - Tutte le formule continuano a passare dal motore di balancing (`calculateItemPower`), nessun numero magico duplicato.

- **Scenario Simulation Runner**
  - Aggiunto `src/balancing/scenario/ScenarioSimulationRunner.ts` come servizio dedicato per lanciare simulazioni sugli scenari definiti.
  - Creato `src/balancing/scenario/eliteScenarios.ts` con scenari preconfigurati riusabili per analisi Monte Carlo e regression.

- **Archetype Testing Lab (UI)**
  - Nuova pagina `src/ui/balancing/ArchetypeTestingLab.tsx` per:
    - selezionare due archetipi dal `ArchetypeRegistry` e un budget tier,
    - far girare matchup Monte Carlo con parametri controllabili (iterations, turn limit, spell opzionali),
    - vedere risultati aggregati (win rate, summary) in stile Gilded Observatory.
  - Sezione aggiuntiva per **Counterpick Validation** basata su `balance_config.counterMatrix`, con tabella di esito per ogni matchup atteso.

- **Tactical Layer – Planning & Debug UI**
  - Creato piano dedicato `docs/plans/tactical_missions_plan.md` (Phase 11: Tactical Engagement Missions), allineato al MASTER_PLAN.
  - Definiti gli obiettivi di Phase 11: tactical layer XCOM-like sopra il GridCombat, config-first (`tacticalConfig`, `TacticalTypes`, mission runner, AP engine, FoW, UI dedicata).
  - Aggiunta `src/ui/tactical/TacticalDebugPage.tsx` come superficie di debug per il layer tattico e l’integrazione con gli scenari.

### 🧪 Testing & Qualità
- Aggiunto `src/balancing/__tests__/ScenarioExpectedValue.test.ts` per validare multipliers ed expected value sugli scenari.
- Aggiornato `tests/ui.spec.ts` per includere le nuove pagine/superfici rilevanti.
- Verificato che le nuove funzioni riusano i moduli di balancing esistenti senza introdurre logica duplicata in UI.

### 🎯 Prossimi Step Suggeriti
- Impostare come primo obiettivo di gioco un **idle 1v1** basato sul combat engine esistente.
- Integrare gli `SCENARIO_CONFIGS` nella UI di analisi (tabella/heatmap) per visualizzare il power per scenario di archetipi e item.
- Estendere il `ScenarioSimulationRunner` con export JSON/CSV per analisi esterne.
- Iniziare l’implementazione dei tipi runtime tattici (`TacticalTypes.ts`) e dello skeleton `tacticalConfig.ts` come da piano di Phase 11.

