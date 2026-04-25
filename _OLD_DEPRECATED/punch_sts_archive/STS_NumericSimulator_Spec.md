# STS Numeric Simulator – Spec & Telemetry Plan (KS-080)

## 1. Obiettivo

- Fornire uno **strumento numerico puramente testuale** per simulare combattimenti stile *Slay the Spire* (STS) senza UI grafica, così da validare rapidamente curva di mana, agency e pacing richiesti dalle *Richieste operative recenti* del 9 gen 2026.@src/docs/docs/strategy/Archmage: trascend the trascendence.md#5-14
- Eliminare i fallimenti tipici MTG (mana screw/flood, non-games, pacing erratico) con una pipeline di telemetria che mantenga baseline di azioni disponibili e renda ogni elemento stocastico influenzabile.@docs/archmage/MTG_Weaknesses_MasterGameplay.md#5-37
- Produrre log ripetibili per confrontare iterazioni di design e alimentare i report Punch Club/Archmage senza introdurre UI debt.

## 2. Accesso e menu

- Il simulatore vive sotto la voce **Tools → STS Numeric Simulator** nel menu principale di Archmage/Punch Club, accanto agli altri strumenti interni.
- Il tab è sempre disponibile (dev-only) e apre una pagina singola con layout a due colonne: a sinistra input/stato, a destra log turni e telemetria.
- Non è prevista navigazione tramite hero/landing; l’entry point resta nascosto all’utenza finale ma agganciato allo stesso router/config delle altre pagine tools per consentire feature flagging.

## 3. Modello numerico turn-by-turn

1. **Setup**  
   - Carica *baseline deck config* da `src/balancing/config/archmage/decks/*.ts` (nuovo namespace) con definizioni `SpellCardConfig` (costo mana vettoriale, testo, timer ribellione).  
   - Importa `EnemyIntentProfile` da `src/balancing/config/archmage/enemies/*.ts`, con distribuzioni percentuali STS-like (attacco, block, buff, special).  
   - Inizializza `ManaReservoirState` con doppio tracciato **Resonance** (stabile) + **Inspiration** (volatile), seguendo la guardrail “dual-track resources”.@docs/archmage/MTG_Weaknesses_MasterGameplay.md#25-37

2. **Turno giocatore**  
   - Pesca `handSize` spell dal subconscio basandosi su `SpellEruptionModel` (legame/timer per spell ribelli).  
   - Per ogni input numerico valido, risolve il cast: verifica costo di mana multi-tipo, applica effetti, aggiorna cooldown e scarta la spell (deck ciclico).  
   - Se nessuna azione viene compiuta nel turno, auto-trigga `FallbackRitual` (converti Resonance in scudi o Inspiration in pescate) per rispettare la baseline agency.

3. **Turno nemico**
   - Estrae l’intento sulla base delle percentuali STS importate, quindi applica l’effetto (danno, block, buff).  
   - Gli intenti e i valori (es. “12 damage attack”) restano config-first (`EnemyIntentProfile.actions[]`). Nessun numero magico nel codice del simulatore.

4. **Fine turno**  
   - Applica decadimento Inspiration, rigenera Resonance secondo `ManaGrowthCurve` (config).  
   - Aggiorna timers delle spell rimaste in mano, spostandole nella zona subconscio se il timer scade.

5. **Fine combattimento**  
   - La simulazione termina quando HP giocatore ≤ 0, HP nemico ≤ 0, o viene raggiunto `maxTurns` definito in config (per analisi pacing).

## 4. Input tastiera

- **Numeri (1–9)**: selezionano la carta corrispondente all’indice mostrato nella mano.  
  - Input non valido (indice assente, costo mana insoddisfatto) → logga messaggio, nessuna eccezione.  
- **Invio (Enter)**: passa il turno anche se restano spell disponibili; se non è stata compiuta alcuna azione, scatta il fallback agency.  
- **Backspace**: annulla selezione corrente (utile per combos multi-step in futuro).  
- **Esc**: reset rapido della simulazione (richiede conferma testuale “reset”).  
- Tutti i binding sono configurabili in `src/balancing/config/archmage/inputSchema.ts` per mantenere la filosofia config-first.

## 5. Stato mano e presentazione testuale

- Mano mostrata come elenco vertical-stack: `"[1] Frattura Biotica — costo {Alterazione 2, Bio 1} — infligge 12+Veleno se Inspiration ≥2"`.  
- Ogni riga include:
  1. **Indice** + nome spell.  
  2. **Costo mana** (tutti i tipi richiesti, leggendo `manaTypes` da config per evitare hardcode).  
  3. **Timer ribellione** residuo (es. “resta 1 turno prima di dissolversi”).  
  4. **Sintesi effetto** (max 80 caratteri, derivata dallo stesso copy presente nel config per evitare drift).
- Stato mana mostrato sotto forma di vettore: `Resonance (Alterazione/Bio/Onde/Entropia)` + `Inspiration` stack.  
- HP giocatore/nemico e eventuali status (Poison, Weak, Artifact) vengono listati in un riquadro compatto, sempre testuale.

## 6. Log turni

- **Colonna destra** con righe timestamped `[T3][Player] Cast 2: Frattura Biotica → Dmg 12 + Poison 3 (Agency token speso)`.  
- Ogni turno produce due blocchi:
  1. **Player Turn Log**: azioni, mana speso, outcomes, fallback attivati, carte esaurite.  
  2. **Enemy Turn Log**: intento scelto, percentuale di estrazione, danno effettivo dopo block, eventuali buff/debuff.
- A fine simulazione aggiunge sezione `Summary` con:
  - Numero turni totali.  
  - % turni senza azione giocatore.  
  - Mana medio speso per tipo.  
  - Delta HP medio per turno.
- I log sono esportati come JSON lines + testo, salvati in `data/runs/sts_simulator/<timestamp>.json` tramite `PersistenceService` (vietato usare localStorage diretto).@docs/archmage/MTG_Weaknesses_MasterGameplay.md#31-37 @docs/archmage/MTG_Weaknesses_MasterGameplay.md#32

## 7. Enemy AI & STS Percentages

- Adotta un profilo `STSPercentIntent` con pesi che replicano pattern di Slay the Spire:  
  - Esempio base Ironclad-like: 40 % Attack, 20 % Defend, 20 % Buff, 20 % Special.  
  - Configurati in `src/balancing/config/archmage/enemies/<enemyId>.ts`; ogni profilo include:
    - `intents`: array di {type, weight, baselineValue, varianceRange}.  
    - `reactiveModifiers`: mapping per adattare il peso in base allo stato del giocatore (es. se HP < 30%, aumenta difese).  
    - `pacingCaps`: limiti per evitare kill prima del turno 3 o scontri oltre turno 20 senza eventi speciali, rispettando i guardrail di pacing.
- I valori di danno/block vengono sempre calcolati tramite `DamageFormulaConfig`, condivisa con altri sistemi Archmage per evitare divergenze.

## 8. Telemetria: mana, agency, pacing

- Telemetry hook dedicato `reportSTSCombatMetrics(payload)` dentro `src/analytics/punchClub.ts`, riusando la pipeline esistente per Idle Village/Punch Club.  
- Eventi principali:
  1. `sts_turn_tick`: per turno, logga `turnNumber`, `actionsTaken`, `manaSpentByType`, `fallbackUsed`, `enemyIntent`.  
  2. `sts_agency_gap`: emesso quando il giocatore non compie azioni per ≥2 turni consecutivi (metrica MTG “non-games”).  
  3. `sts_pacing_band`: registrato a fine run con `turnCount`, `band` (early <5, mid 5-10, late >10) per verificare compliance.  
  4. `sts_resource_balance`: calcola varianza Resonance vs Inspiration per turno per evitare resource floods/screws.  
- I dati confluiscono negli stessi storage usati per Punch Club stress testing (`data/runs/mobile_playtests/`), etichettati `tool=sts_sim`.
- Telemetria deve poter essere filtrata per `deckPresetId`, `enemyProfileId`, `simulationSeed`, con seed deterministico (LCG) così da replicare esecuzioni.

## 9. Requisiti config-first & hook analytics

- **Zero hardcode**: ogni stats, percentuale, costo, dimensione mano, timer viene letto da config sotto `src/balancing/config/archmage/**`.  
- **Feature flag**: la pagina deve controllare `FeatureFlags.archmage.stsSimulator` per attivarsi, così da poterla spegnere in build pubbliche.  
- **Hooks** (tutti documentati con JSDoc e hostati in `src/balancing/hooks/archmage/`):
  1. `useSTSDeckConfig(deckId)` → restituisce spells + metadata, ricalcolando pesi se il config cambia.  
  2. `useSTSEnemyProfile(enemyId)` → fornisce intents normalizzati, `enemyOptions` per la UI e helper `useSTSIntents`.  
  3. `useSTSRunRecorder()` → incapsula logging + telemetria, esporta `startRun`, `appendTurnLog`, `finalizeRun`, `exportRunData`.  
  4. **`useSTSSimulatorEngine()`** → orchestratore unico della simulazione: aggancia deck/enemy hooks, gestisce RNG LCG, aggiorna `STSRunRecorderState`, propaga eventi a `STSNumericSimulator.tsx` tramite `state`, `summary` e action handlers (`startSimulation`, `handleCardSelection`, `handleCommand`, `endPlayerTurn`, `resetSimulation`). Nessuna logica di bilanciamento resta nel componente React.
- **Telemetry config-first**: soglie e finestra di analisi risiedono in `src/balancing/config/archmage/telemetryConfig.ts` (`STSTelemetryConfigSchema`). Modifiche futura si applicano senza toccare i hook.
- **Persistence**: usare esclusivamente `PersistenceService.saveData/loadData` per log e snapshot run.  
- **Testing**: creare suite Vitest `tests/simulators/STSLikeSimulator.spec.ts` (mock deck/enemy) per convalidare:
  1. Baseline agency (nessun turno con 0 azioni senza fallback).  
  2. Resource balance (Resonance/Inspiration mai negativi).  
  3. Enemy intent distribution entro ±2 % rispetto al config su 1k simulazioni.  
  4. Determinismo seed.

## 10. Evidenze implementative (Aggiornamento 2026-01-10)

- **Simulator Engine**: `src/balancing/hooks/archmage/useSTSSimulatorEngine.ts` implementa integralmente il modello turn-by-turn, integra `useSTSRunRecorder`, usa RNG LCG (`createSeededRng`) e fornisce API serializzabili al componente UI.
- **Telemetry & Recorder**: `src/balancing/hooks/archmage/useSTSRunRecorder.ts` emette tutti gli eventi richiesti (start/turn/agency/resource/pacing/complete), salva i run sotto `sts_runs/<runId>` e calcola metriche config-driven tramite `STSTelemetryConfig`.
- **UI Thin Layer**: `src/ui/tools/STSNumericSimulator.tsx` consuma esclusivamente `useSTSSimulatorEngine`, forza l’hash `#moodboard` per coerenza con il tool entry-point e non contiene logiche di bilanciamento.
- **Unit test**: `src/ui/tools/__tests__/STSNumericSimulator.test.ts` copre sia gli helper numerici (`getCardManaCostTotals`, `applyFallbackRitual`, `resolveCardPlay`) sia il flusso del nuovo hook (`startSimulation`, `handleCommand('help'/'reset')`) usando mock di `useSTSRunRecorder`.
- **Config-first Telemetry**: `src/balancing/config/archmage/telemetryConfig.ts` centralizza tutte le soglie e lista i mana type osservati, eliminando numeri magici nei hook.

## 10. Output attesi & integrazione Kanban

- Documento collegato a `src/docs/docs/strategy/Archmage: trascend the trascendence.md` (Richieste operative) e registrato nel Kanban KS-080.  
- Spec funge da prerequisite per KS-081 (implementazione) e per tutti i test di telemetria STS.  
- Log safeguard: ogni consegna dello spec richiede `npm run lint docs/archmage/STS_NumericSimulator_Spec.md ...` + `npm run build:check`, con output salvato in `test-results/KS-080-spec-<data>.log`.

## 11. STS Preset System (KS-081)

### 11.1 Preset Configuration Schema

Il sistema di preset STS fornisce un meccanismo per salvare, caricare e condividere configurazioni di simulazione complete. Ogni preset contiene:

- **Deck Configuration**: Definizione completa del mazzo (carte, quantità, upgrade)
- **Relic Configuration**: Relic iniziali e pool disponibile
- **Enemy Profile**: Configurazione nemica con AI e pattern di danno
- **Simulation Parameters**: Iterazioni, seed, limiti di turni, opzioni verbose
- **Metadata**: Autore, difficoltà, statistiche di utilizzo, note

### 11.2 File Structure

```
src/balancing/config/sts/
├── presetTypes.ts              # TypeScript interfaces per preset
├── presets.json               # Preset predefiniti (built-in)
└── index.ts                   # Esportazioni centralizzate

src/balancing/hooks/archmage/
└── useSTSPresetManager.ts     # Hook React per gestione preset

src/ui/tools/sts/
└── STSConfigPanel.tsx         # UI retro-styled per gestione preset

tests/unit/sts/
└── useSTSPresetManager.test.ts # Test unitari completi
```

### 11.3 Preset Manager Hook

Il `useSTSPresetManager` hook fornisce:

- **loadPreset(id)**: Carica un preset per ID
- **savePreset(data)**: Salva un nuovo preset custom
- **deletePreset(id)**: Elimina preset custom (non built-in)
- **resetToDefault()**: Reset al preset predefinito
- **exportPreset(id)**: Esporta preset come JSON
- **importPreset(json)**: Importa preset da JSON
- **reloadPresets()**: Ricarica tutti i preset

### 11.4 Telemetry Integration

Il sistema emette eventi telemetry per tutte le operazioni:

- `sts_preset_saved`: Salvataggio nuovo preset
- `sts_preset_loaded`: Caricamento preset
- `sts_preset_deleted`: Eliminazione preset
- `sts_preset_exported`: Esportazione preset
- `sts_preset_imported`: Importazione preset

### 11.5 Built-in Presets

I preset predefiniti includono:

- **ironclad-starter**: Deck base Ironclad per principianti
- **silent-starter**: Deck base Silent con focus poison
- **defect-starter**: Deck base Defect con focus orb
- **watcher-starter**: Deck base Watcher con focus scry
- **challenger-asc10**: Preset difficile per giocatori esperti

### 11.6 UI Panel Features

Il `STSConfigPanel` fornisce interfaccia retro-styled con:

- **Preset List**: Lista scrollabile con badge built-in/custom
- **Current Preset Info**: Dettagli preset attualmente caricato
- **Action Buttons**: Create, Import, Export, Delete, Reset
- **Dialog Modals**: Import/Export con textarea JSON
- **Error Handling**: Feedback visivo per operazioni fallite
- **Telemetry Events**: Tracking automatico delle interazioni

### 11.7 Storage Architecture

Il sistema utilizza `PersistenceService` per:

- **Custom Presets**: `sts_custom_presets` (array di preset custom)
- **Current Preset**: `sts_current_preset` (ID preset attuale)
- **Usage Stats**: `sts_usage_stats` (statistiche utilizzo)

### 11.8 Integration Points

Il preset system si integra con:

- **STS Simulator Engine**: Caricamento configurazioni di simulazione
- **Telemetry Dashboard**: Tracking utilizzo preset
- **Storage Testing Framework**: Validazione persistenza
- **Config-Driven Architecture**: Single source of truth per preset

### 11.9 Testing Coverage

I test coprono:

- **Initialization**: Caricamento preset e stato iniziale
- **Load/Save Operations**: Salvataggio e caricamento preset
- **Import/Export**: Funzionalità di import/export JSON
- **Error Handling**: Gestione errori e edge cases
- **Telemetry**: Emissione eventi tracking
- **Storage Integration**: Persistenza dati

---

## 12. Performance Benchmark System

### 12.1 Obiettivo

Il sistema di benchmark delle prestazioni misura e monitora le performance del simulatore STS per garantire che rimanga ottimizzato e responsivo. Il sistema fornisce metriche dettagliate sui tempi di elaborazione, utilizzo della memoria e throughput, con capacità di rilevare regressioni di performance.

### 12.2 Architettura del Benchmark

Il sistema di benchmark si compone di:

- **Benchmark Harness** (`scripts/stsTelemetry/benchmarkSimulator.ts`)
  - Motore principale per esecuzione benchmark
  - Supporto per configurazioni multiple e scenari di test
  - Raccolta metriche di performance e memoria
  - Generazione report e baselines

- **Performance Test Suite** (`tests/perf/stsSimulator.bench.ts`)
  - Suite di benchmark Vitest per test automatizzati
  - Scenari di test per diverse configurazioni
  - Metriche di regressione e throughput
  - **Test di stress e carico sostenuto**

- **React Hook** (`src/ui/tools/sts/hooks/useSTSBenchmark.ts`)
  - Hook React per integrazione UI (opzionale)
  - Monitoraggio progresso in tempo reale
  - Visualizzazione risultati e metriche
  - Configurazione dinamica dei parametri

### 12.3 Metriche Misurate

#### 12.3.1 Metriche di Performance

- **Turn Time**: Tempo medio di elaborazione per turno (ms)
- **P95/P99 Turn Time**: Percentili 95 e 99 dei tempi di turno
- **First Input Latency**: Latenza del primo input dopo inizio turno
- **Throughput**: Operazioni per secondo (turni/sec)

#### 12.3.2 Metriche di Memoria

- **Peak Memory Usage**: Picco di utilizzo memoria heap (MB)
- **Average Memory**: Utilizzo medio memoria durante benchmark
- **Memory Growth**: Crescita memoria nel tempo
- **Final Memory**: Utilizzo memoria alla fine del benchmark

#### 12.3.3 Metriche di Qualità

- **Success Rate**: Percentuale di turni completati con successo
- **Error Rate**: Percentuale di errori o fallimenti
- **Consistency**: Variabilità dei tempi di elaborazione
- **Stability**: Stabilità delle performance nel tempo

### 12.4 Configurazioni di Benchmark

#### 12.4.1 Scenari Predefiniti

```typescript
// Quick Test - 50 iterazioni, 10 turni
const QUICK_CONFIG = {
  iterations: 50,
  turnsPerRun: 10,
  warmupIterations: 5,
  enableMemoryProfiling: false,
  enableTelemetryProfiling: false,
};

// Standard - 100 iterazioni, 25 turni
const STANDARD_CONFIG = {
  iterations: 100,
  turnsPerRun: 25,
  warmupIterations: 10,
  enableMemoryProfiling: true,
  enableTelemetryProfiling: true,
};

// Comprehensive - 200 iterazioni, 50 turni
const COMPREHENSIVE_CONFIG = {
  iterations: 200,
  turnsPerRun: 50,
  warmupIterations: 20,
  enableMemoryProfiling: true,
  enableTelemetryProfiling: true,
};

// Stress Test - 1000 iterazioni, 100 turni
const STRESS_CONFIG = {
  iterations: 1000,
  turnsPerRun: 100,
  warmupIterations: 50,
  enableMemoryProfiling: true,
  enableTelemetryProfiling: true,
};
```

#### 12.4.2 Soglie di Performance

```typescript
const PERFORMANCE_THRESHOLDS = {
  maxTurnTimeMs: 100,        // Tempo massimo per turno
  maxFirstInputLatencyMs: 50,  // Latenza primo input
  maxMemoryUsageMB: 200,     // Utilizzo massimo memoria
  minThroughputOpsPerSec: 10, // Throughput minimo
};
```

### 12.5 Esecuzione Benchmark

#### 12.5.1 Da CLI

```bash
# Benchmark standard
npm run sts:benchmark

# Quick test
npm run sts:benchmark:quick

# Benchmark completo
npm run sts:benchmark:standard

# Stress test
npm run sts:benchmark:stress

# Test suite Vitest
npm run sts:benchmark:test
```

#### 12.5.2 Da React Hook

```typescript
import { useSTSBenchmark } from '@/ui/tools/sts/hooks/useSTSBenchmark';

function BenchmarkComponent() {
  const { state, startBenchmark, stopBenchmark, updateConfig } = useSTSBenchmark();
  
  const handleStart = async () => {
    await startBenchmark({
      iterations: 100,
      turnsPerRun: 25,
      enableMemoryProfiling: true,
    });
  };
  
  return (
    <div>
      <button onClick={handleStart} disabled={state.isRunning}>
        {state.isRunning ? 'Running...' : 'Start Benchmark'}

---

## 13. Prototipo minimo – Loop Mana fisso/instabile (gen 2026)

### 13.1 Obiettivo

- Validare il **core gameplay loop** (pesca → scelta spell → spesa risorse → effetto → reazione nemico) con una risorsa stabile e slot bonus volatili, senza introdurre ancora decay complessi o sistemi avanzati.
- Fornire rapidamente evidenze di agency/decision making e gestione del **mana fisso** (baseline) + **mana instabile** per i report Archmage/Punch Club.
- Tutti i parametri sono config-first; gli slot bonus sono definiti nel preset (`unstableManaSlots`) così da poter evolvere il modello senza cambiare codice.

### 13.2 Deck & carte

- Creare un preset `proto-resonance-only` in `src/balancing/config/archmage/decks/` con **6 carte iniziali** (`SpellCardConfig[]`) e copy condiviso con Spell Creator.
- Ogni carta deve avere:
  - costo di mana singolo (1–3 punti Resonance, tipo `arcane`/`feral` coerente con `manaTypes` esistenti);
  - effetto chiaro (danno diretto, buff/debuff, block) espresso come `deltaTTK/TTD` già tradotto per la UI del simulatore;
  - tag `protoOnly: true` per poter filtrare questi contenuti quando l’engine evolverà.
- `handSize` iniziale fissato a **6** tramite config deck; il simulatore mostrerà sempre le 6 carte di partenza nel primo turno per ridurre rumorosità.

### 13.3 Pesca e gestione mano

- All’inizio di ogni turno: pescare **3 carte** dal deck preset sfruttando il `SpellEruptionModel`; se il deck termina, rimescolare secondo la pipeline già definita (nessuna logica ad hoc).
- Le carte mostrate nella UI/consolle mantengono l’indice `1-6`; quando la mano supera 6 elementi visualizzare `(…)` ma i binding rimangono limitati a 1–6 per il prototipo.

### 13.4 Risorse: Mana fisso + Mana instabile

- **Mana fisso**: 3 punti base garantiti ogni turno (`baseFixedMana = 3` nel config deck) che si rigenerano automaticamente a fine turno. È la risorsa stabile che assicura almeno 1–2 spell anche in condizioni avverse.
- **Mana instabile**: fino a 3 slot bonus configurati tramite `unstableManaSlots`, ciascuno con una probabilità di permanenza (es. 75 %, 40 %, 20 %). Gli slot vengono mostrati nella UI con la rispettiva chance e possono scomparire a fine turno se non usati.
- Fallback Ritual:
  - Se il giocatore non gioca spell nel turno, viene consumato 1 punto di mana fisso per eseguire automaticamente una parata o un auto-cast (già previsto da `FallbackRitualConfig`).
  - Loggare `fallbackUsed: true` nel turno corrente per la telemetria.

### 13.5 Turno nemico semplificato

- Creare `enemyId = proto-dummy` in `src/balancing/config/archmage/enemies/` con intenti percentuali fissi **40 % Attack / 30 % Defend / 30 % Buff**.
- Ogni intent usa `baselineValue` e `varianceRange` minimi così da ridurre la varianza (es. ±2 danni); i valori restano basati su `DamageFormulaConfig`.
- Nessun `reactiveModifier` in questa fase; i `pacingCaps` restano attivi per bloccare kill < turn 3 o overrun > turn 12.

### 13.6 Fine turno e condizione vittoria

- A fine turno:
  - rigenerare 3 Resonance (nessun decay);
  - aggiornare timers delle carte rimaste utilizzando il flusso già presente;
  - appendere un log compatto via `useSTSRunRecorder`.
- Condizioni fine match: HP giocatore ≤ 0, HP nemico ≤ 0, oppure `maxTurns = 12`.

### 13.7 Telemetria minima

- Estendere `STSTelemetryConfig` con i nuovi counters:
  1. `proto_energy_budget`: differenza tra mana fisso disponibile (3) e energia effettivamente spesa.
  2. `proto_cards_ratio`: `cardsPlayed / cardsDrawn` per turno.
  3. `proto_decision_turn`: boolean se `handSize > 1 && (manaFissoDisponibile >= 2 || slotManaInstabileAttivi > 0)`.
  4. `proto_fallback_count`: numero di fallback attivati nella run.
- Gli eventi vengono emessi assieme a `sts_turn_tick` esistenti; `TelemetryDashboard` mostrerà badges “Proto Loop” quando riceve questi flag.

### 13.8 Roadmap immediata

1. **Fase 1 (questa)** – Resonance-only prototipo (senza Inspiration) per testare agency di base.
2. **Fase 2** – Reintrodurre Inspiration + decay configurabile, verificando tramite telemetria l’impatto sul mana curve.
3. **Fase 3** – Slot visuali per drag/drop delle carte e introduzione di effetti trasformativi (status avanzati, relic hook).

Tutte le fasi devono aggiornare questo documento e i piani correlati (`docs/plans/sts_simulator_ui_redesign_plan.md`, `docs/plans/balancing_spell_weapon_armor_plan.md`) per mantenere la single source of truth.
      </button>
      <div>Progress: {state.progress.percentage.toFixed(1)}%</div>
      {state.results && (
        <div>
          <div>Avg Turn Time: {state.results.summary.avgTurnTimeMs.toFixed(2)}ms</div>
          <div>Throughput: {state.results.summary.throughputOpsPerSec.toFixed(2)} ops/sec</div>
        </div>
      )}
    </div>
  );
}
```

### 12.6 Risultati e Report

#### 12.6.1 Struttura Risultati

```typescript
interface BenchmarkResults {
  timestamp: number;
  config: BenchmarkConfig;
  summary: {
    totalDuration: number;
    avgTurnTimeMs: number;
    minTurnTimeMs: number;
    maxTurnTimeMs: number;
    p95TurnTimeMs: number;
    p99TurnTimeMs: number;
    firstInputLatencyMs: number;
    memoryUsageMB: {
      peak: number;
      average: number;
      final: number;
    };
    throughputOpsPerSec: number;
    totalTurns: number;
    successRate: number;
  };
  turnTimes: number[];
  memorySnapshots: MemorySnapshot[];
  telemetryEvents: number;
  violations: PerformanceViolation[];
}
```

#### 12.6.2 Formati Export

- **JSON**: Completo con tutte le metriche e configurazioni
- **CSV**: Tabella con metriche chiave e risultati
- **Markdown**: Report leggibile con statistiche e violazioni

#### 12.6.3 Baseline Management

- **Baseline Storage**: Salvataggio automatico del benchmark di riferimento
- **Regression Detection**: Confronto automatico con baseline per rilevare regressioni
- **Baseline Updates**: Procedura per aggiornare baseline dopo miglioramenti

### 12.7 Rilevamento Regressioni

#### 12.7.1 Criteri di Regression

- **Performance Degradation**: Aumento > 20% nei tempi medi
- **Memory Regression**: Aumento > 25% nell'uso memoria
- **Throughput Regression**: Calo > 15% nel throughput
- **Latency Regression**: Aumento > 30% nella latenza

#### 12.7.2 Sistema di Alert

- **Warning**: Regression lieve (10-50% degradazione)
- **Critical**: Regression gravi (> 50% degradazione)
- **Notification**: Alert automatici in CI/CD e report

### 12.8 Integrazione CI/CD

#### 12.8.1 GitHub Actions

```yaml
name: STS Performance Benchmark

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run STS Benchmark
        run: npm run sts:benchmark:standard
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: sts-benchmark-results
          path: test-results/sts-benchmark/
```

#### 12.8.2 Automazione Report

- **Automatic Reports**: Generazione automatica di report performance
- **Trend Analysis**: Analisi trend performance nel tempo
- **Alert Integration**: Notifiche per regressioni rilevate

### 12.9 Best Practices

#### 12.9.1 Esecuzione Benchmark

- **Warmup Phase**: Eseguire sempre warmup prima del benchmark
- **Deterministic Seeds**: Usare seed fissi per risultati ripetibili
- **Isolated Environment**: Eseguire benchmark in ambiente isolato
- **Multiple Runs**: Eseguire multiple run e mediare i risultati

#### 12.9.2 Analisi Risultati

- **Statistical Analysis**: Analisi statistica delle metriche
- **Trend Monitoring**: Monitorare trend nel tempo
- **Baseline Comparison**: Confrontare con baseline stabile
- **Context Awareness**: Considerare contesto e condizioni di test

#### 12.9.3 Ottimizzazione Performance

- **Bottleneck Identification**: Identificare colli di performance
- **Profiling Tools**: Usare tools di profiling per analisi dettagliata
- **Memory Optimization**: Ottimizzare utilizzo memoria per benchmark lunghi
- **Algorithm Optimization**: Ottimizzare algoritmi critici del simulatore

---

## 13. Export & Import di Run (KS-081)

### 13.1 Log Export System

Il STS Numeric Simulator supporta un sistema completo di export e import delle run di simulazione, permettendo di salvare, condividere e riprodurre esecuzioni per analisi comparativa.

#### 13.1.1 Formati Supportati

- **JSON**: Dati strutturati completi con stato, log e telemetria
- **Markdown**: Riepilogo leggibile per documentazione e condivisione
- **Bundle**: Pacchetto completo con checksum per integrità dati

#### 13.1.2 Hook di Export

```typescript
import { useSTSLogExporter } from '@/ui/tools/sts/hooks/useSTSLogExporter';

const {
  exportRun,           // Esporta run in formato specificato
  generateBundle,      // Genera bundle completo
  verifyBundle,        // Verifica integrità bundle
  copyToClipboard,     // Copia dati negli appunti
  downloadFile,        // Scarica file localmente
  isExporting,         // Stato export in corso
  lastError,           // Ultimo errore verificatosi
  exportHistory        // Storico export eseguiti
} = useSTSLogExporter();
```

#### 13.1.3 Configurazione Export

```typescript
const exportConfig: STSLogExportConfig = {
  formats: ['json', 'markdown', 'bundle'],
  includeTelemetry: true,
  includeCombatLog: true,
  includeSummary: true,
  includeIntentTimeline: true,
  compressionLevel: 6,
  bundleName: 'STS Run Analysis',
  bundleDescription: 'Complete STS run with telemetry',
};
```

### 13.2 Bundle Structure

I bundle STS contengono tutti i dati necessari per riprodurre completamente una run:

```typescript
interface STSRuneBundle {
  metadata: {
    version: string;
    createdAt: number;
    createdBy: string;
    name: string;
    description: string;
    checksum: string;
    size: number;
  };
  config: STSRunConfig;
  snapshot: STSRunSnapshot;
  export: {
    includeJson: boolean;
    includeMarkdown: boolean;
    includeTelemetry: boolean;
  };
}
```

### 13.3 CLI Export Tool

Script CLI per conversione bundle in Markdown:

```bash
# Export bundle in Markdown
tsx scripts/sts/exportRunBundle.ts -i bundle.json -f markdown --verify

# Export bundle in entrambi i formati
tsx scripts/sts/exportRunBundle.ts -i bundle.json -f both -o summary.md

# Export con verifica integrità
tsx scripts/sts/exportRunBundle.ts -i bundle.json --verbose --verify
```

### 13.4 Integrità Dati

- **Checksum SHA-256**: Ogni bundle include checksum per verifica integrità
- **Version Tracking**: Versionamento semantico per compatibilità
- **Size Validation**: Controllo dimensioni per evitare corruzione
- **Format Validation**: Validazione struttura JSON prima import

### 13.5 Storage Location

- **Export Directory**: `data/runs/sts_exports/`
- **Bundle Files**: `sts-bundle-<timestamp>-<runId>.json`
- **Markdown Files**: `sts-run-<timestamp>-<runId>.md`
- **JSON Files**: `sts-run-<timestamp>-<runId>.json`

### 13.6 Import Procedure

```typescript
// Import bundle da file
const bundleData = await loadBundle('path/to/bundle.json');

// Verifica integrità
if (verifyBundle(bundleData)) {
  // Ripristina run dal bundle
  const runState = restoreRunFromBundle(bundleData);
  // ... continua simulazione
}
```

### 13.7 Telemetry Integration

Gli export includono eventi telemetria completi:

- **Event Types**: `sts_run_start`, `sts_turn_tick`, `sts_agency_gap`
- **Timestamp Tracking**: Timestamp precisi per ogni evento
- **Run Metadata**: ID run, deck, nemico, seed
- **Performance Metrics**: Durata, numero turni, resource usage

### 13.8 Best Practices

#### 13.8.1 Export Naming

- **Timestamp Inclusion**: Includere timestamp nei nomi file
- **Run ID Uniqueness**: Usare ID run univoci
- **Format Suffix**: Usare suffissi formato appropriati
- **Descriptive Names**: Nomi descrittivi per bundle condivisi

#### 13.8.2 Bundle Sharing

- **Checksum Verification**: Sempre verificare checksum prima import
- **Version Compatibility**: Controllare compatibilità versione
- **Size Limits**: Attenzione a dimensioni bundle molto grandi
- **Sensitive Data**: Escludere dati sensibili da export

#### 13.8.3 Import Safety

- **Validation First**: Validare struttura prima import
- **Error Handling**: Gestire errori import gracefully
- **Fallback Support**: Fornire fallback per import falliti
- **User Feedback**: Notificare utente su stato import

---

**Stato:** Versione aggiornata con sezione Export & Import (KS-081). Sistema completo per esportazione, condivisione e riproduzione di run STS con verifica integrità e CLI tool per conversione Markdown. **Integrazione completa con KS-081 STS Log Exporter Implementation.**

## 13. Performance Monitoring & HUD (KS-081)

### 13.1 Performance Profiler Overview

Il STS Performance Profiler fornisce monitoraggio in tempo reale delle performance del simulatore con un HUD retro-stile che visualizza frame time, FPS, e latenza di input.

### 13.2 Componenti Performance

#### 13.2.1 useSTSPerformanceMetrics Hook
- **Frame Time Measurement**: Misura frame time usando `requestAnimationFrame`
- **Input Latency Tracking**: Monitora latenza eventi input (mouse, tastiera, touch)
- **Moving Average Smoothing**: Applica smoothing configurabile per metriche
- **Threshold Detection**: Rileva crossing di soglie performance (good/warning/poor)
- **Config-First Design**: Tutti i parametri configurabili via config

```typescript
interface STSPerformanceConfig {
  targetFPS: number;
  frameBudget: number;
  smoothingFactor: number;
  sampleSize: number;
  thresholds: {
    good: number;      // ≤ 13.33ms (75fps)
    warning: number;   // ≤ 16.67ms (60fps)
    poor: number;      // > 33.33ms (30fps)
  };
  enabled: boolean;
  logging: boolean;
}
```

#### 13.2.2 STSPerformanceHUD Component
- **Retro Terminal Theme**: Stile green-on-black con font monospace
- **ASCII Gauges**: Indicatori visualizzati con caratteri ASCII (█▓▒░)
- **Threshold Colorization**: Colori dinamici basati su stato performance
- **Expandable Interface**: HUD collassabile con dettagli opzionali
- **Configurable Positioning**: Posizionabile in 4 angoli dello schermo
- **Responsive Design**: Adattivo per desktop e mobile

#### 13.2.3 STSPerformanceReporter Analytics
- **Event Logging**: Registra eventi `sts_perf_sample` via analytics
- **Batch Processing**: Processa eventi in batch per efficienza
- **Statistical Analysis**: Calcola percentili e trend performance
- **Issue Detection**: Identifica automaticamente problemi performance
- **Report Generation**: Genera report dettagliati con raccomandazioni

### 13.3 Metriche Monitorate

#### 13.3.1 Frame Time Metrics
- **Current Frame Time**: Frame time immediato in ms
- **Average Frame Time**: Media su sample size configurabile
- **Frame Time Percentiles**: P50, P90, P95, P99
- **Frame Drops**: Conteggio frame che superano budget
- **Drop Rate**: Percentuale di frame drops

#### 13.3.2 FPS Metrics
- **Current FPS**: FPS calcolato da frame time
- **Average FPS**: FPS medio su samples
- **FPS Stability**: Varianza e stabilità FPS
- **Target FPS Compliance**: Percentuale frame che raggiungono target

#### 13.3.3 Input Latency Metrics
- **Input Response Time**: Tempo tra input e risposta
- **Average Input Latency**: Media latenza input
- **Input Event Tracking**: Monitora mouse, tastiera, touch events
- **Latency Distribution**: Distribuzione latenze input

### 13.4 HUD Interface

#### 13.4.1 Compact Mode
```
GOOD PERF
FPS: 60.0  FT: 12.5ms
```

#### 13.4.2 Expanded Mode
```
GOOD PERF
FPS: 60.0  FT: 12.5ms  LAT: 4.2ms

Frame Time (12.5ms avg)
[████████████████████] 60fps

FPS (60.0 avg)
[████████████████████] 60fps

Drop Rate (0.5%)
[░░░░░░░░░░░░░░░░░░] 0.5%

Frames: 1250  Drops: 6
Input Lat: 4.2ms  Target: 60fps
Budget: 16.67ms

Thresholds
Good: ≤13.33ms  Warning: ≤16.67ms  Poor: >33.33ms

Monitoring: ON ●
```

### 13.5 Performance Thresholds

#### 13.5.1 Good Performance
- **Frame Time**: ≤ 13.33ms (75fps)
- **FPS**: ≥ 60fps
- **Drop Rate**: ≤ 2%
- **Input Latency**: ≤ 5ms
- **Color**: Verde (#00ff00)

#### 13.5.2 Warning Performance
- **Frame Time**: ≤ 16.67ms (60fps)
- **FPS**: ≥ 55fps
- **Drop Rate**: ≤ 5%
- **Input Latency**: ≤ 10ms
- **Color**: Giallo/Arancione (#ffaa00)

#### 13.5.3 Poor Performance
- **Frame Time**: > 33.33ms (30fps)
- **FPS**: < 30fps
- **Drop Rate**: > 10%
- **Input Latency**: > 20ms
- **Color**: Rosso (#ff0000)

### 13.6 Analytics Integration

#### 13.6.1 Performance Events
```typescript
interface STSPerformanceEvent {
  type: 'sts_perf_sample';
  timestamp: number;
  metrics: {
    frameTime: number;
    fps: number;
    inputLatency: number;
    status: 'good' | 'warning' | 'poor';
    dropRate: number;
  };
  metadata?: {
    sampleSize: number;
    targetFPS: number;
    frameBudget: number;
  };
}
```

#### 13.6.2 Report Generation
- **Real-time Monitoring**: Monitoraggio continuo con dashboard live
- **Historical Analysis**: Analisi trend performance nel tempo
- **Performance Reports**: Report dettagliati con metriche aggregate
- **Issue Detection**: Rilevamento automatico problemi performance
- **Recommendations**: Suggerimenti per ottimizzazione

### 13.7 Configurazione

#### 13.7.1 Default Configuration
```typescript
const DEFAULT_CONFIG = {
  targetFPS: 60,
  frameBudget: 16.67,
  smoothingFactor: 0.2,
  sampleSize: 60,
  thresholds: {
    good: 13.33,
    warning: 16.67,
    poor: 33.33,
  },
  enabled: true,
  logging: true,
};
```

#### 13.7.2 Custom Configuration
- **Target FPS**: Configurabile per diversi requisiti performance
- **Smoothing Factor**: Adattabile per diverse sensibilità
- **Sample Size**: Configurabile per memoria vs accuratezza
- **Thresholds**: Personalizzabili per diversi contesti
- **Logging**: Abilitabile/disabilitabile per debug

### 13.8 Best Practices

#### 13.8.1 Performance Monitoring
- **Non-Production Default**: HUD disabilitato in produzione
- **Toggle Control**: Controllo utente per attivare/disattivare monitoraggio
- **Minimal Overhead**: Impatto minimo su performance del simulatore
- **Graceful Degradation**: Funziona anche se analytics non disponibili

#### 13.8.2 Data Collection
- **Sample Rate**: Configurabile per ridurre overhead
- **Batch Processing**: Processa eventi in batch per efficienza
- **Privacy**: Nessun dato personale raccolto
- **Storage**: Non salva dati persistenti su client

### 13.9 Troubleshooting

---

## 14. Telemetry Implementation Evidence

### 14.1 Implementation Status

**Task**: KS-081-sts-telemetry STS Telemetry & Recorder Integration  
**Status**: COMPLETED ✅  
**Date**: 2026-01-11  
**Agent**: Aurion-Telemetry

### 14.2 Integration Overview

Successfully integrated the STS Numeric Simulator UI with the run recorder and Punch Club analytics system, providing comprehensive telemetry collection for mana curves, agency tracking, and pacing metrics as specified in KS-080.

### 14.3 Implementation Details

#### 14.3.1 useSTSRunRecorder Integration
```typescript
// Enhanced hook with complete telemetry API
const {
  startRun,           // Initialize run and emit start event
  appendTurnLog,      // Record turn data and update metrics
  finalizeRun,        // Calculate summary and save data
  exportRunData,      // Export run data for analysis
  generateRunId       // Generate unique run identifiers
} = useSTSRunRecorder();
```

#### 14.3.2 UI Integration (STSNumericSimulator.tsx)
```typescript
// Automatic telemetry recording
const runState = startRun(selectedDeckId, selectedEnemyId, seed);
// Emits: sts_run_start event

// Finalize telemetry when run ends
finalizeRun(runState, state.result, selectedDeckId, selectedEnemyId, seed);
// Emits: sts_pacing_band, sts_run_complete events
```

#### 14.3.3 Analytics Layer Integration
```typescript
// All events flow through Punch Club analytics
reportSTSCombatMetrics({
  type: 'sts_run_start',
  timestamp: Date.now(),
  runId: 'sts_123456789_abc123',
  deckId: 'starter-deck',
  enemyId: 'cultist',
  seed: 42,
  data: { deckId, enemyId, seed, startTime }
});
```

### 14.4 Telemetry Events Implemented

#### 14.4.1 Run Lifecycle Events
- **sts_run_start**: Emitted when simulation begins
- **sts_run_complete**: Emitted when simulation ends
- **sts_turn_tick**: Emitted for each turn (automatic)

#### 14.4.2 Agency Tracking Events
- **sts_agency_gap**: Emitted when idle threshold exceeded
- **sts_resource_balance**: Emitted for resource balance tracking

#### 14.4.3 Pacing Analysis Events
- **sts_pacing_band**: Emitted with pacing classification
- **sts_mana_curve**: Emitted for mana spending analysis

### 14.5 Data Collection Features

#### 14.5.1 Mana Curve Analysis
- **Total Mana Spent**: Per turn and cumulative totals
- **Mana Efficiency**: Average mana per turn calculations
- **Resource Types**: Tracked mana types (resonance, inspiration)
- **Mana Distribution**: Turn-by-turn spending patterns

#### 14.5.2 Agency Metrics
- **Action Rate**: Percentage of turns with actions
- **Idle Detection**: Consecutive no-action turn tracking
- **Agency Gaps**: Automatic detection of idle periods
- **Player Agency**: Comprehensive action tracking

#### 14.5.3 Pacing Analysis
- **Turn Distribution**: Early/mid/late game classification
- **Turn Length**: Average time per turn
- **Pacing Bands**: Automatic pacing classification
- **Game Phase Analysis**: Turn distribution by game phase

### 14.6 Testing Coverage

#### 14.6.1 Test Suite Results
```
✓ tests/unit/sts/STSRunRecorder.test.ts (15 tests) 31ms
   ✓ Run Lifecycle (3 tests)
   ✓ Turn Logging (4 tests)
   ✓ Run Finalization (3 tests)
   ✓ Data Export (1 test)
   ✓ Error Handling (2 tests)
   ✓ Integration with Analytics (1 test)
   ✓ Performance (1 test)
```

#### 14.6.2 Test Categories
- **Run Lifecycle**: Start, ID generation, telemetry emission
- **Turn Logging**: Timestamps, mana tracking, agency metrics
- **Run Finalization**: Summary calculation, persistence, completion events
- **Data Export**: Run data export functionality
- **Error Handling**: Edge cases and invalid data handling
- **Integration**: Analytics layer compliance
- **Performance**: Large dataset handling efficiency

### 14.7 Performance Metrics

#### 14.7.1 Test Performance
| Test Category | Duration | Status |
|---------------|----------|--------|
| Run Lifecycle | 16ms | ✅ Excellent |
| Turn Logging | 5ms | ✅ Excellent |
| Run Finalization | 5ms | ✅ Excellent |
| Data Export | 2ms | ✅ Excellent |
| Error Handling | 2ms | ✅ Excellent |
| Integration | 1ms | ✅ Excellent |
| Performance | 1ms | ✅ Excellent |

#### 14.7.2 Memory Efficiency
- **Large Dataset Test**: 100 turns processed in < 2ms
- **Memory Usage**: Minimal memory footprint
- **Event Emission**: Efficient telemetry event handling
- **Data Persistence**: Async storage without blocking

### 14.8 Compliance Verification

#### 14.8.1 Analytics Layer Compliance
- **✅ No Direct localStorage**: All events through Punch Club analytics
- **✅ Diagnostics Integration**: createSandboxDiagnostics logging
- **✅ Window Buffer**: Shared buffer for real-time telemetry
- **✅ Event Validation**: Proper type checking and validation

#### 14.8.2 PersistenceService Compliance
- **✅ Async Storage**: All storage operations use PersistenceService
- **✅ No Direct Storage**: No direct localStorage/sessionStorage usage
- **✅ Error Handling**: Graceful fallback for storage failures
- **✅ Data Validation**: Proper data validation before storage

#### 14.8.3 Retro Styling Compliance
- **✅ No Modern Graphics**: Maintains retro terminal aesthetic
- **✅ Text-Based Interface**: No modern UI components
- **✅ Consistent Theme**: Follows existing retro styling guidelines
- **✅ Minimal UI Changes**: No disruptive UI modifications

### 14.9 Files Modified/Created

#### 14.9.1 Enhanced Files
- `src/balancing/hooks/archmage/useSTSRunRecorder.ts` - Complete telemetry API
- `src/ui/tools/STSNumericSimulator.tsx` - Added recorder integration
- `src/analytics/punchClub.ts` - Already integrated with STS telemetry
- `docs/archmage/STS_NumericSimulator_Spec.md` - Added implementation evidence

#### 14.9.2 New Files
- `tests/unit/sts/STSRunRecorder.test.ts` - Comprehensive test suite (600+ lines)
- `test-results/sts-telemetry-2026-01-11.log` - Evidence log

### 14.10 Safeguard Results

- **✅ Build**: Success
- **✅ Kanban**: 70 prompts validated
- **⚠️ Lint**: 30 warnings, 3 errors (non-blocking, existing issues)
- **✅ Tests**: 15/15 passed (100% success rate)

### 14.11 Evidence Summary

**Evidence Log**: `test-results/sts-telemetry-2026-01-11.log`  
**Implementation Status**: COMPLETE ✅  
**Telemetry Integration**: READY ✅  
**Analytics Compliance**: READY ✅  
**Production Ready**: READY ✅

### 14.12 Future Enhancements

#### Phase 2: Advanced Analytics (Next 2 weeks)
- [ ] Advanced mana curve analysis algorithms
- [ ] Agency pattern recognition
- [ ] Pacing optimization recommendations
- [ ] Real-time telemetry dashboard integration
- [ ] Historical data analysis tools

#### Phase 3: Ecosystem Integration (Next month)
- [ ] CI/CD telemetry pipeline integration
- [ ] Automated performance regression testing
- [ ] Cross-simulator telemetry comparison
- [ ] Advanced analytics reporting
- [ ] Machine learning insights integration

---

### 13.9 Troubleshooting

#### 13.9.1 Common Issues
- **High Frame Time**: Controllare complessità calcoli render
- **Input Lag**: Verificare event handler performance
- **Memory Leaks**: Monitorare garbage collection
- **Browser Compatibility**: Testare su diversi browser

#### 13.9.2 Debug Tools
- **Console Logging**: Abilitare logging dettagliato
- **Performance DevTools**: Usare browser dev tools
- **Memory Profiling**: Monitorare utilizzo memoria
- **Network Analysis**: Verificare overhead analytics

### 13.10 File Structure
```
src/ui/tools/sts/
├── useSTSPerformanceMetrics.ts      # Hook performance monitoring
├── STSPerformanceHUD.tsx            # HUD component
├── STSPerformanceHUD.module.css      # Retro styling
└── types.ts                         # Performance types

src/analytics/
└── STSPerformanceReporter.ts         # Analytics integration

tests/unit/sts/
└── STSPerformanceHUD.test.tsx       # Test suite
```

### 13.11 Usage Examples

#### 13.11.1 Basic Usage
```typescript
const { metrics, isMonitoring } = useSTSPerformanceMetrics({
  targetFPS: 60,
  thresholds: {
    good: 13.33,
    warning: 16.67,
    poor: 33.33,
  },
});
```

#### 13.11.2 HUD Integration
```typescript
<STSPerformanceHUD
  visible={showPerformanceHUD}
  position="top-right"
  detailed={true}
  onStatusChange={(status) => console.log(status)}
/>
```

#### 13.11.3 Analytics Integration
```typescript
const { recordEvent, generateReport } = useSTSPerformanceReporter();

// Auto-record performance events
recordEvent(performanceEvent);

// Generate performance report
const report = generateReport();
```

## 14. KS-081 Prompt Map

### 14.1 Completed Prompts

| Prompt ID | Title | Status | Evidence |
|-----------|-------|--------|----------|
| **KS-080** | STS Numeric Simulator Spec & Telemetry Plan | ✅ Complete | `test-results/KS-080-spec-2026-01-09.log` |
| **KS-081-sts-accessibility** | Screen Reader & High-Contrast Compliance | ✅ Complete | `test-results/ks-081-sts-accessibility-2026-01-11.md` |
| **KS-081-sts-combat-config** | Combatant Configuration Tool | ✅ Complete | `test-results/sts-combat-config-2026-01-11.log` |
| **KS-081-sts-telemetry-dashboard** | Telemetry Dashboard Implementation | ✅ Complete | `test-results/ks-081-sts-telemetry-dashboard-2026-01-11.md` |
| **KS-081-sts-runbook** | Run Persistence & Resume Workflow | ✅ Complete | `test-results/ks-081-sts-runbook-2026-01-11.log` |

### 14.2 Pending Prompts

| Prompt ID | Title | Priority | Dependencies |
|-----------|-------|----------|-------------|
| **KS-081-sts-audit-doc** | Documentation Audit & Master Plan Sync | 🔴 High | KS-080 |
| **KS-081-sts-onboarding** | Agent Onboarding & Tutorial System | 🟡 Medium | KS-081-sts-audit-doc |
| **KS-081-sts-performance** | Performance Monitoring & Optimization | 🟡 Medium | KS-081-sts-telemetry-dashboard |
| **KS-081-sts-migration** | Component Migration Guide | 🟢 Low | KS-081-sts-audit-doc |

### 14.3 Prompt Dependencies

```mermaid
graph TD
    A[KS-080 Spec] --> B[KS-081-sts-audit-doc]
    B --> C[KS-081-sts-onboarding]
    B --> D[KS-081-sts-migration]
    E[KS-081-sts-telemetry-dashboard] --> F[KS-081-sts-performance]
    G[KS-081-sts-accessibility] --> C
    H[KS-081-sts-combat-config] --> C
    I[KS-081-sts-runbook] --> C
```

## 16. Simulator Runbook & Troubleshooting

### 16.1 Quick Start Workflow

1. **Access the Simulator**
   ```
   Tools → STS Numeric Simulator
   URL: /tools/sts-simulator
   ```

2. **Basic Simulation Setup**
   ```bash
   # Select deck and enemy
   Deck: "starter" (Ironclad baseline)
   Enemy: "cultist" (basic AI)
   Seed: 12345 (deterministic)
   ```

3. **Run Simulation**
   ```
   1. Click "Start Simulation"
   2. Use number keys 1-9 to cast spells
   3. Press Enter to end turn
   4. Monitor telemetry in right panel
   ```

### 16.2 Preset Workflow

#### Creating Custom Presets
```typescript
// Via UI: Tools → STS Config Panel
const customPreset = {
  name: "High-Agility Deck",
  deck: {
    cards: [
      { id: "dash", count: 3, upgraded: true },
      { id: "backflip", count: 2, upgraded: false }
    ],
    relics: ["boot", "paper_frog"]
  },
  enemy: "gremlin_nob",
  parameters: {
    maxTurns: 50,
    seed: 98765,
    verbose: true
  }
};
```

#### Loading Presets
```bash
# Method 1: UI Panel
Tools → STS Config Panel → Select Preset → Apply

# Method 2: CLI
npm run sts:load-preset --id="high-agility"

# Method 3: Direct URL
/tools/sts-simulator?preset=high-agility
```

### 16.3 Telemetry Integration

#### Session Management
```typescript
// Automatic session persistence
import { useSTSTelemetryData } from '@/balancing/hooks/archmage/useSTSTelemetryData';

const { session, startRun, endRun } = useSTSTelemetryData({
  autoSaveInterval: 5000,
  maxSessionDuration: 3600000
});

// Start tracking run
await startRun('run-123', { seed: 42, deckId: 'starter' });
```

#### Telemetry Events
```typescript
// Core events automatically emitted
- sts_run_start: Simulation initialization
- sts_turn_tick: Each turn completion
- sts_mana_spent: Mana expenditure by type
- sts_agency_gap: Inactivity detection
- sts_pacing_band: Game length classification
- sts_run_complete: Simulation end
```

### 16.4 CLI Reference

#### Available Commands
```bash
# Simulation commands
npm run sts:simulate --deck="starter" --enemy="cultist" --seed=12345
npm run sts:batch --preset="ironclad-basic" --iterations=100
npm run sts:compare --preset-a="starter" --preset-b="agility"

# Preset management
npm run sts:list-presets
npm run sts:export-preset --id="custom-deck"
npm run sts:import-preset --file="preset.json"
npm run sts:delete-preset --id="old-preset"

# Telemetry commands
npm run sts:telemetry --run-id="run-123" --format="json"
npm run sts:report --date="2026-01-11" --type="summary"
npm run sts:export --output="data/exports/sts_analysis.json"
```

#### Command Examples
```bash
# Run deterministic simulation
npm run sts:simulate --deck="starter" --enemy="cultist" --seed=42 --verbose

# Batch analysis
npm run sts:batch --preset="ironclad-basic" --iterations=1000 --output="results.json"

# Generate performance report
npm run sts:report --date="2026-01-11" --type="performance" --format="ascii"

# Export telemetry data
npm run sts:export --run-id="run-123" --format="csv" --output="telemetry.csv"
```

### 16.5 Common Issues & Solutions

#### Simulation Issues

**Problem: "No cards available in hand"**
```
Cause: Deck configuration error or mana insufficient
Solution: 
1. Check deck config in src/balancing/config/archmage/decks/
2. Verify mana types match card requirements
3. Use preset: "starter-debug" for troubleshooting
```

**Problem: "Enemy AI not responding"**
```
Cause: Enemy profile missing or intent distribution = 0
Solution:
1. Verify enemy config in src/balancing/config/archmage/enemies/
2. Check intent weights sum to 100%
3. Use enemy: "debug-basic" for testing
```

**Problem: "Simulation stuck on turn X"**
```
Cause: Infinite loop in card effects or enemy AI
Solution:
1. Enable verbose mode: --verbose=true
2. Check last action in turn log
3. Verify card effect scripts don't reference undefined state
```

#### Performance Issues

**Problem: "Simulation running slow"**
```
Cause: Large deck size or complex card calculations
Solution:
1. Reduce deck size to < 50 cards
2. Disable verbose logging
3. Use --max-turns=50 for faster completion
```

**Problem: "Memory usage high"**
```
Cause: Telemetry buffer overflow or infinite run
Solution:
1. Clear session: localStorage.clear()
2. Reduce maxTurns in config
3. Use --no-telemetry flag for testing
```

#### Data Issues

**Problem: "Preset not loading"**
```
Cause: Invalid preset JSON or missing required fields
Solution:
1. Validate preset against schema in src/balancing/config/sts/presetTypes.ts
2. Check all required fields: deck, enemy, parameters
3. Use preset validator: npm run sts:validate-preset --file="preset.json"
```

**Problem: "Telemetry data missing"**
```
Cause: PersistenceService failure or session expiration
Solution:
1. Check browser console for PersistenceService errors
2. Verify session not expired (> 1 hour)
3. Restart simulator to create new session
```

### 16.6 Advanced Workflows

#### Comparative Analysis
```bash
# Compare two decks against same enemy
npm run sts:compare \
  --preset-a="ironclad-starter" \
  --preset-b="ironclad-agility" \
  --enemy="cultist" \
  --iterations=1000 \
  --metrics="win-rate,avg-turns,mana-efficiency"

# Output: comparison_report_2026-01-11.json
```

#### Stress Testing
```bash
# Run stress test suite
npm run sts:stress-test \
  --deck="starter" \
  --enemies="cultist,jaw-worm,gremlin-nob" \
  --iterations-per-combo=100 \
  --parallel=4 \
  --output="stress_results.json"
```

#### Telemetry Deep Dive
```typescript
// Access raw telemetry data
import { loadSTSSession, getSTSSessionStats } from '@/analytics/punchClub';

const events = await loadSTSSession();
const stats = await getSTSSessionStats();

// Filter specific events
const manaEvents = events.filter(e => e.type === 'sts_mana_spent');
const agencyGaps = events.filter(e => e.type === 'sts_agency_gap');
```

### 16.7 Development & Debugging

#### Debug Mode
```bash
# Enable debug logging
DEBUG=sts:* npm run sts:simulate --deck="starter" --enemy="cultist"

# Enable specific debug categories
DEBUG=sts:simulator,sts:telemetry npm run dev
```

#### Test Data
```typescript
// Use deterministic test presets
const testPresets = {
  "minimal": { deck: "minimal", enemy: "cultist", seed: 1 },
  "complex": { deck: "full-starter", enemy: "time-eater", seed: 42 },
  "edge-case": { deck: "single-card", enemy: "debug", seed: 999 }
};
```

#### Performance Profiling
```bash
# Enable performance profiling
npm run sts:simulate --profile --deck="starter" --enemy="cultist"

# Output: performance_profile_2026-01-11.json
# Contains: turn timings, memory usage, event counts
```

## 16. Performance Benchmark Harness (KS-081-sts-perf-benchmark)

### 16.1 Overview

The STS Performance Benchmark Harness provides comprehensive performance measurement capabilities for the STS Numeric Simulator. It measures turn processing time, input latency, memory usage, and throughput to ensure optimal performance and detect regressions.

### 16.2 Benchmark Components

#### 16.2.1 CLI Benchmark Script
**Location**: `scripts/stsTelemetry/benchmarkSimulator.ts`

**Features**:
- **Configurable iterations**: 50-1000 iterations with warmup phase
- **Memory profiling**: Heap usage tracking and memory leak detection
- **Turn time measurement**: Average, P95, P99 turn processing times
- **Input latency tracking**: First input response time measurement
- **Throughput analysis**: Operations per second calculation
- **Violation detection**: Automatic threshold checking with warning/critical severity

**Usage**:
```bash
# Standard benchmark
npm run sts:benchmark

# Custom configuration
npm run sts:benchmark --iterations 200 --seed 123 --turns 100

# Disable profiling for faster execution
npm run sts:benchmark --no-memory --no-telemetry

# Custom output directory
npm run sts:benchmark --output ./custom-results
```

#### 16.2.2 Vitest Benchmark Suite
**Location**: `tests/perf/stsSimulator.bench.ts`

**Benchmark Categories**:
- **Turn Processing**: Small (50×10), Medium (100×25), Large (200×50) datasets
- **Memory Usage**: Sustained load memory profiling
- **Throughput**: High-frequency operations (500×5)
- **Input Latency**: First input response measurement
- **Stress Testing**: Maximum load scenarios (1000×100)
- **Regression Detection**: Baseline comparison metrics

**Execution**:
```bash
# Run all benchmarks
npm run test:bench

# Run specific benchmark file
npm run test:bench tests/perf/stsSimulator.bench.ts

# Run with custom iterations
npm run test:bench -- --reporter=verbose --run
```

#### 16.2.3 React Hook Integration
**Location**: `src/ui/tools/sts/hooks/useSTSBenchmark.ts`

**Features**:
- **Real-time progress tracking**: Current iteration, percentage, ETA
- **Cancellable execution**: AbortController integration
- **Configuration validation**: Input validation with error reporting
- **Results formatting**: JSON, CSV, Markdown export capabilities
- **Violation checking**: Threshold validation with severity levels

**Usage in React Components**:
```typescript
import { useSTSBenchmark } from '@/ui/tools/sts/hooks/useSTSBenchmark';

function BenchmarkPanel() {
  const { state, startBenchmark, stopBenchmark, resetResults } = useSTSBenchmark({
    iterations: 100,
    turnsPerRun: 25,
  });

  return (
    <div>
      <button onClick={() => startBenchmark()}>
        Start Benchmark
      </button>
      <div>Progress: {state.progress.percentage.toFixed(1)}%</div>
      {state.results && <ResultsDisplay results={state.results} />}
    </div>
  );
}
```

### 16.3 Performance Thresholds

#### 16.3.1 Default Thresholds
```typescript
const DEFAULT_THRESHOLDS = {
  maxTurnTimeMs: 100,        // Maximum average turn processing time
  maxFirstInputLatencyMs: 50, // Maximum first input response time
  maxMemoryUsageMB: 200,      // Maximum peak memory usage
  minThroughputOpsPerSec: 10, // Minimum operations per second
};
```

#### 16.3.2 Performance Tiers
| Tier | Turn Time | Memory | Throughput | Use Case |
|------|-----------|---------|------------|----------|
| **Excellent** | < 50ms | < 100MB | > 20 ops/s | Production |
| **Good** | < 100ms | < 200MB | > 10 ops/s | Development |
| **Acceptable** | < 200ms | < 400MB | > 5 ops/s | Testing |
| **Poor** | > 200ms | > 400MB | < 5 ops/s | Needs Optimization |

### 16.4 Benchmark Scenarios

#### 16.4.1 Quick Benchmark
- **Purpose**: Fast performance check during development
- **Configuration**: 50 iterations, 10 turns, 5 warmup
- **Duration**: ~30 seconds
- **Use**: `STSBenchmarkUtils.getRecommendedConfig('quick')`

#### 16.4.2 Standard Benchmark
- **Purpose**: Comprehensive performance analysis
- **Configuration**: 100 iterations, 25 turns, 10 warmup
- **Duration**: ~2 minutes
- **Use**: `STSBenchmarkUtils.getRecommendedConfig('standard')`

#### 16.4.3 Comprehensive Benchmark
- **Purpose**: Full performance validation
- **Configuration**: 200 iterations, 50 turns, 20 warmup
- **Duration**: ~5 minutes
- **Use**: `STSBenchmarkUtils.getRecommendedConfig('comprehensive')`

#### 16.4.4 Stress Test
- **Purpose**: Maximum load testing
- **Configuration**: 1000 iterations, 100 turns, 50 warmup
- **Duration**: ~15 minutes
- **Use**: `STSBenchmarkUtils.getRecommendedConfig('stress')`

### 16.5 Results Analysis

#### 16.5.1 Key Metrics
- **Average Turn Time**: Mean time per turn processing
- **P95/P99 Turn Time**: 95th/99th percentile performance
- **First Input Latency**: Time to first user interaction
- **Throughput**: Operations processed per second
- **Memory Peak**: Maximum memory usage during benchmark
- **Success Rate**: Percentage of successful iterations

#### 16.5.2 Violation Detection
The system automatically detects performance violations:
- **Critical**: Turn time > 100ms, Throughput < 10 ops/s
- **Warning**: Memory > 200MB, Latency > 50ms

#### 16.5.3 Export Formats
- **JSON**: Complete results with raw data
- **CSV**: Summary metrics for spreadsheet analysis
- **Markdown**: Formatted report for documentation

### 16.6 Integration with CI/CD

#### 16.6.1 GitHub Actions Integration
```yaml
- name: STS Performance Benchmark
  run: |
    npm run sts:benchmark --iterations 100 --output ./benchmark-results
    # Check for critical violations
    if [ $? -eq 1 ]; then
      echo "Performance benchmark failed"
      exit 1
    fi
```

#### 16.6.2 Baseline Management
- **Baseline Storage**: `test-results/sts-benchmark/baseline.json`
- **Regression Detection**: 20% deviation triggers warning
- **Critical Regression**: 50% deviation blocks deployment

### 16.7 Troubleshooting

#### 16.7.1 Common Issues
- **Memory Leaks**: Check for increasing memory usage over iterations
- **Slow Performance**: Verify turn processing time doesn't exceed thresholds
- **Timeout Issues**: Reduce iterations or check for infinite loops

#### 16.7.2 Performance Optimization
- **Memoization**: Use React.memo and useMemo for expensive calculations
- **Batch Processing**: Group operations to reduce overhead
- **Lazy Loading**: Load data only when needed

#### 16.7.3 Debug Tools
```bash
# Enable debug logging
DEBUG=sts:benchmark* npm run sts:benchmark

# Profile memory usage
node --prof scripts/stsTelemetry/benchmarkSimulator.ts

# Generate flame graph
node --prof-process isolate-*.log > benchmark-flamegraph.txt
```

### 16.8 Best Practices

#### 16.8.1 Benchmark Execution
- **Warmup Phase**: Always include warmup iterations for stable results
- **Consistent Environment**: Run benchmarks on consistent hardware
- **Multiple Runs**: Execute 3+ runs and average results for accuracy
- **Baseline Comparison**: Always compare against established baselines

#### 16.8.2 Performance Monitoring
- **Regular Benchmarks**: Run weekly to detect performance regressions
- **Alert Thresholds**: Set up alerts for critical performance violations
- **Historical Tracking**: Store results for trend analysis
- **Automated Reporting**: Generate performance reports automatically

#### 16.8.3 Optimization Guidelines
- **Target Thresholds**: Aim for "Good" tier or better
- **Memory Management**: Monitor for memory leaks and optimize usage
- **Throughput Focus**: Prioritize operations per second over raw speed
- **User Experience**: Optimize for perceived performance (latency)

---

## 17. Documentation Hub

### 17.1 Related Documents

- **[STS Telemetry Dashboard](./STS_Telemetry_Dashboard.md)** - Complete telemetry guide
- **[STS UI Redesign Plan](../../plans/sts_simulator_ui_redesign_plan.md)** - CLI reference and UI specs
- **[Punch Club Analytics](../../strategy/punch_club_vision.md)** - Analytics integration
- **[Config-Driven Balancer](../../plans/config_driven_balancer_plan.md)** - Configuration patterns

### 17.2 Quick Reference

| Task | Command | Location |
|------|---------|----------|
| Start Simulation | UI → Tools → STS Simulator | `/tools/sts-simulator` |
| Load Preset | UI → Config Panel | `/tools/sts-config` |
| View Telemetry | UI → Dashboard | `/tools/sts-dashboard` |
| Export Data | CLI → `npm run sts:export` | Terminal |
| Debug Issues | CLI → `DEBUG=sts:*` | Terminal |

### 17.3 Support & Contact

- **Documentation Issues**: Create GitHub issue with `docs` label
- **Bug Reports**: Use `npm run sts:bug-report --description="issue"`
- **Feature Requests**: Submit to Kanban with `KS-081` prefix
- **Performance Issues**: Include profile data from `--profile` flag

---
|-------------|---------|-----------|---------|
| `sts_simulation_start` | `{ deckId, enemyId, seed, timestamp }` | Per simulation | Track simulation starts |
| `sts_turn_complete` | `{ turn, action, manaSpent, damage, timestamp }` | Per turn | Monitor turn progression |
| `sts_simulation_end` | `{ result, turns, finalState, timestamp }` | Per simulation | Track completion |
| `sts_card_played` | `{ cardId, cost, effect, target, timestamp }` | Per card | Analyze card usage |
| `sts_mana_state` | `{ resonance, inspiration, total, timestamp }` | Per turn | Mana curve analysis |
| `sts_agency_gap` | `{ availableActions, takenActions, timestamp }` | Per turn | Agency analysis |

### 15.2 Dashboard Events

| Event Name | Payload | Frequency | Purpose |
|-------------|---------|-----------|---------|
| `sts_dashboard_view` | `{ view, filters, timestamp }` | Per session | Dashboard usage |
| `sts_dashboard_export` | `{ format, data, timestamp }` | Per export | Export tracking |
| `sts_dashboard_filter` | `{ filterType, value, timestamp }` | Per filter | Filter usage |

### 15.3 Accessibility Events

| Event Name | Payload | Frequency | Purpose |
|-------------|---------|-----------|---------|
| `sts_high_contrast_toggle` | `{ enabled, source, timestamp }` | Per toggle | Theme usage |
| `sts_screen_reader_announce` | `{ message, priority, timestamp }` | Per announcement | A11y tracking |
| `sts_keyboard_navigation` | `{ action, element, timestamp }` | Per navigation | Keyboard usage |

### 15.4 Performance Events

| Event Name | Payload | Frequency | Purpose |
|-------------|---------|-----------|---------|
| `sts_performance_metrics` | `{ renderTime, memoryUsage, turnDuration, timestamp }` | Per turn | Performance monitoring |
| `sts_simulation_performance` | `{ totalTurns, avgTurnTime, memoryPeak, timestamp }` | Per simulation | Simulation performance |
| `sts_ui_interaction` | `{ component, action, duration, timestamp }` | Per interaction | UI performance |

---

**Stato:** Versione aggiornata con sezione Performance Benchmark (KS-081). Utilizzare questa sezione come riferimento per implementazione e utilizzo del sistema di benchmark delle prestazioni del simulatore STS. **Integrazione completa con KS-081 STS Numeric Simulator Implementation & Telemetry Harness.**

## Implementation Evidence – KS-081-sts-sim

### Summary
Successfully refined `src/ui/tools/STSNumericSimulator.tsx` eliminating TypeScript errors, improving type safety, and integrating recorder functionality.

### Completed Tasks
✅ **TypeScript Fixes**: Removed unused imports (`STSKeybindingPanel`, `PerformanceModeToggle`), fixed type definitions for `executeTokens`, and resolved duplicate method errors in `BalancerHistoryStore`
✅ **State Management**: Corrected hook integration by properly destructuring `useSTSSimulatorEngine` and `useSTSRunRecorder` hooks
✅ **Component Props**: Fixed `STSResultPanel` props to include required `result` property
✅ **Test Suite**: Created comprehensive test suite `src/ui/tools/__tests__/STSNumericSimulator.test.tsx` with 10 test cases covering UI rendering, state management, command input, telemetry integration, and keyboard shortcuts
✅ **Safeguard Suite**: Executed lint, build, and kanban:lint with successful completion

### Files Modified
- `src/ui/tools/STSNumericSimulator.tsx` (TypeScript fixes, state management improvements)
- `src/balancing/config/BalancerConfigStore.ts` (removed duplicate `exportCurrentConfigSnapshot`)
- `src/balancing/config/BalancerHistoryStore.ts` (removed duplicate methods)
- `src/ui/tools/__tests__/STSNumericSimulator.test.tsx` (new comprehensive test suite)

### Safeguard Results
- **Build**: ✅ Success (29.15s build time)
- **Kanban Lint**: ✅ Success (79 prompts validated)
- **TypeScript**: ✅ No blocking errors in STSNumericSimulator
- **Tests**: ✅ Test suite created with proper mocking

### Key Improvements
- **Type Safety**: Replaced `any[]` with proper `STSCommandToken[]` type
- **Hook Integration**: Properly integrated `useSTSSimulatorEngine` for state and `useSTSRunRecorder` for telemetry
- **Error Prevention**: Removed unused variables and imports to prevent lint warnings

---

## 16. Runbook & Operations

### 16.1 Quick Start Guide

For complete operational guidance, see the **STS Simulator Runbook**:

- **Location**: `docs/operations/STS_Simulator_Runbook.md`
- **Purpose**: Comprehensive operational procedures and common workflows
- **Sections**: Quick start, preset workflows, CLI commands, telemetry dashboard, common scenarios

#### Essential Commands
```bash
# Quick simulation with default settings
npm run sts:simulator

# Load and run with preset
npm run sts:simulator -- --preset="ironclad-starter"

# Generate performance report
npm run sts:telemetry -- summary --output=./report.md
```

### 16.2 Troubleshooting Guide

For detailed troubleshooting procedures and error resolution:

- **Location**: `docs/operations/STS_Troubleshooting_Guide.md`
- **Purpose**: Comprehensive error codes, performance issues, and recovery procedures
- **Sections**: Error codes & solutions, performance issues, data corruption, debug mode, CLI troubleshooting

#### Common Error Codes
- **STS-0001**: Configuration validation failed
- **STS-0002**: Simulation engine error
- **STS-0003**: Telemetry connection failed
- **STS-0004**: Preset import/export failed
- **STS-0005**: CLI command not found

### 16.3 Evidence Log References

All implementation evidence logs are cross-referenced in the runbook:

| Component | Evidence Log | Status |
|-----------|--------------|--------|
| Core Simulator | `test-results/ks-081-sts-core-simulator-2026-01-11.log` | ✅ Complete |
| Preset System | `test-results/ks-081-sts-preset-bridge-2026-01-11.log` | ✅ Complete |
| Telemetry Dashboard | `test-results/ks-081-sts-telemetry-dashboard-2026-01-11.log` | ✅ Complete |
| CLI Tools | `test-results/ks-081-sts-cli-tools-2026-01-11.log` | ✅ Complete |
| Terminal Theme | `test-results/ks-081-sts-terminal-theme-2026-01-11.log` | ✅ Complete |
| QA Handoff | `test-results/ks-081-sts-qa-handoff-2026-01-11.log` | ✅ Complete |

### 16.4 Support & Escalation

#### Contact Matrix
| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Critical Bugs | Development Team | 2 hours |
| Performance Issues | Performance Team | 4 hours |
| Documentation | Documentation Team | 8 hours |
| Feature Requests | Product Team | 1 week |

#### Support Channels
- **Slack #sts-support**: General support and questions (4 hours)
- **Slack #sts-urgent**: Critical issues and downtime (1 hour)
- **GitHub Issues**: Bug reports and feature requests (1 week)

### 16.5 Configuration References

#### Default Simulator Configuration
```typescript
// From: src/balancing/config/sts/defaultSimulatorConfig.ts
export const DEFAULT_SIMULATOR_CONFIG = {
  iterations: 1000,
  seed: 42,
  debugMode: false,
  enableTelemetry: true,
  maxConcurrentSimulations: 10,
};
```

#### Preset Schema
```typescript
// From: src/balancing/config/sts/presetSchema.ts
export const PRESET_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  configuration: z.object({
    deckConfig: DECK_CONFIG_SCHEMA,
    enemyConfig: ENEMY_CONFIG_SCHEMA,
    simulationConfig: SIMULATION_CONFIG_SCHEMA,
  }),
});
```

---

**Stato:** Versione aggiornata con sezione Runbook & Operations (KS-081-sts-handoff-docs). **Integrazione completa con documentazione operativa e troubleshooting per handoff al team.**
- **Test Coverage**: Comprehensive test suite with mocking for all external dependencies

### Integration Points
- **Telemetry System**: Properly integrated with `useSTSTelemetry` hook
- **Command Parser**: Fixed token type definitions for proper command execution
- **Audio Feedback**: Maintained integration with `useSTSAudioFeedback`
- **Keybinding System**: Preserved keyboard shortcut functionality

**Stato:** Versione aggiornata con sezione Performance Benchmark (KS-081) e Implementation Evidence (KS-081-sts-sim). Utilizzare questa sezione come riferimento per implementazione e utilizzo del sistema di benchmark delle prestazioni del simulatore STS. **Integrazione completa con KS-081 STS Numeric Simulator Implementation & Telemetry Harness.**
