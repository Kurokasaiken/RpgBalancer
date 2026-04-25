# Idle Village Progression System – Implementation Plan

**Status:** Prioritario  
**Creato:** 2026-01-15  
**Dipendenze:** Phase 12 Idle Village (parziale), Config-Driven Balancer (Phase 10)  
**Effort stimato:** 3-4 giorni (24-32 ore)

---

## 1. Executive Summary

Questo piano definisce l'implementazione di un sistema di **progressione config-first** per Idle Village che copre:

- **XP & Level Progression**: curve esponenziali configurabili per residenti
- **Reward Scaling**: job/quest con min/max + multiplier per livello
- **Risk/Difficulty Scaling**: dangerRating dinamico con injury/death probability
- **Economy Loop**: food upkeep, gold flow, materials scaling

⚠️ **Registry Alignment (GM-MP):** Ogni moltiplicatore o delta deve essere rappresentato come `GameplayModifier` registrato in [`docs/plans/idle_village_modifiers_plan.md`](./idle_village_modifiers_plan.md). Questo piano descrive formule base; l’applicazione di buff/debuff (es. bonus quest, consumabili) avviene solo tramite modifier con `scope`, `operation` e `sourceConfigId` espliciti.

L'obiettivo è rendere il gameplay **testabile end-to-end** con parametri modificabili da UI senza toccare codice.

---

## 2. Gap Analysis: Stato Attuale vs Modello Target

### 2.1 Cosa esiste già (config-first)

| Area | File | Stato |
|------|------|-------|
| Resources | `defaultConfig.ts` | ✅ gold, food, materials, xp definiti |
| Activities | `defaultConfig.ts` | ✅ jobs/quest con `rewards[]`, `dangerRating`, `level` |
| Injury Tiers | `globalRules.injuryTiers` | ✅ light/moderate/severe con recovery e multipliers |
| Death Rules | `globalRules.deathRules` | ✅ base chance + danger multiplier |
| Variance | `variance.difficultyCategories/rewardCategories` | ✅ min/max multiplier con weight |
| XP Formula | `globalRules.questXpFormula` | ⚠️ Solo `level * 10`, non esponenziale |

### 2.2 Gap critici da colmare

| Gap | Descrizione | Priorità |
|-----|-------------|----------|
| **G1** | Manca `LevelProgressionConfig` per residenti (XP curve esponenziale) | 🔴 Alta |
| **G2** | Reward scaling non usa formule parametriche (oggi `amountFormula: '5'` hardcoded) | 🔴 Alta |
| **G3** | Risk scaling non calcola `EffectivePower` party vs quest | 🔴 Alta |
| **G4** | Job duration/reward non scala con `jobLevel` | 🟡 Media |
| **G5** | Manca engine per calcolo outcome multipli (perfect/success/partial/fail/deadly) | 🔴 Alta |
| **G6** | Telemetria progressione assente (time-to-level, reward/risk ratio) | 🟡 Media |

---

## 3. Modello Matematico Target

### 3.1 XP Progression (Resident Level)

Formula esponenziale con parametri config-first:

```typescript
interface LevelProgressionConfig {
  baseXp: number;           // XP per level 1→2 (default: 100)
  growthFactor: number;     // Moltiplicatore per livello (default: 1.15)
  maxLevel: number;         // Cap opzionale (default: 50)
}

// xpForLevel(L) = floor(baseXp * growthFactor^(L-1))
```

**Modifier Pipeline:** `QuestResolver` calcola reward/risk base e poi applica bucket di modifier in ordine `GLOBAL→SESSION→LOCATION→QUEST→RESIDENT` come definito nella spec. Non è consentito inserire percentuali inline; ogni riferimento deve puntare a `GameplayModifier.id` (es. `mod_quest_fog_of_dread`).

```ts
const harvestFestivalBuff: GameplayModifier = {
  id: 'mod_festival_harvest_gold',
  statId: 'stat_reward_gold',
  scope: 'SESSION',
  operation: 'MULT',
  value: 0.2, // +20% gold durante l'evento
  owner: { type: 'system', id: 'seasonal_event', label: 'Harvest Festival' },
  sourceConfigId: 'events.harvest_festival.session_modifiers',
};
```

**Esempio valori (growthFactor=1.15):**

| Level | XP Required | Cumulative |
|-------|-------------|------------|
| 1→2 | 100 | 100 |
| 5→6 | 174 | 749 |
| 10→11 | 350 | 2,030 |
| 20→21 | 1,175 | 8,137 |

### 3.2 Job Reward Scaling

```typescript
interface JobScalingConfig {
  baseReward: number;           // Reward base (default: 50 gold)
  rewardGrowthFactor: number;   // Scaling per jobLevel (default: 1.05)
  baseDuration: number;         // Durata base in time units (default: 60)
  durationGrowthFactor: number; // Scaling durata (default: 1.02)
}

// jobReward(L) = floor(baseReward * rewardGrowthFactor^(L-1))
// jobDuration(L) = floor(baseDuration * durationGrowthFactor^(L-1))
// 
// Dopo la formula base, applicare `resolveModifiers('stat_reward_gold', resolvedReward, modifiers)`
// dove `modifiers` è la lista filtrata per job/quest scope dal Gameplay Modifier Registry.
```

### 3.3 Quest Reward/Risk Scaling

```typescript
interface QuestScalingConfig {
  // Reward range
  baseRewardMin: number;        // Min reward level 1 (default: 100)
  baseRewardMax: number;        // Max reward level 1 (default: 150)
  rewardMultiplierPerLevel: number; // Scaling (default: 1.1)
  
  // Risk range
  baseRiskMin: number;          // Min injury chance level 1 (default: 0.05)
  baseRiskMax: number;          // Max injury chance level 1 (default: 0.15)
  riskMultiplierPerLevel: number;   // Scaling (default: 1.05)
  riskCap: number;              // Max risk (default: 0.95)
  
  // Duration
  baseDuration: number;         // Base duration (default: 180)
  durationGrowthFactor: number; // Scaling (default: 1.1)
}

// questReward(L) = { min: floor(baseRewardMin * mult^(L-1)), max: floor(baseRewardMax * mult^(L-1)) }
// questRisk(L) = { min: min(baseRiskMin * mult^(L-1), riskCap), max: min(baseRiskMax * mult^(L-1), riskCap) }
```

### 3.4 Effective Power & Outcome Distribution

```typescript
interface EffectivePowerConfig {
  // Stat weights per tag (es. "edge": 1.5, "lantern": 1.2)
  statTagWeights: Record<string, number>;
  
  // Outcome thresholds (power ratio vs quest difficulty)
  outcomeThresholds: {
    perfect: number;    // >= 1.5 power ratio
    success: number;    // >= 1.0
    partial: number;    // >= 0.7
    fail: number;       // >= 0.4
    deadly: number;     // < 0.4
  };
}

// effectivePower = sum(residentStats * statTagWeights) / partySize
// powerRatio = effectivePower / questDifficulty
// outcome = threshold lookup based on powerRatio
```

---

## 3.5 Production Scaling (Buildings & Jobs)

Formula per produzione con lavoratori multipli e stat bonus:

```typescript
interface ProductionScalingConfig {
  diminishingReturnsFactor: number;     // Default: 0.8
  statMultiplierPerPoint: number;       // Default: 0.1
  applyDiminishingToFirstWorker: boolean; // Default: false
  maxStatMultiplier: number;            // Default: 3.0
}

// Per worker:
// statMultiplier = 1 + (statValue * statMultiplierPerPoint)
// statMultiplier = min(statMultiplier, maxStatMultiplier)
// diminishingMultiplier = diminishingReturnsFactor^(workerIndex - 1) if not first
// workerProduction = baseProduction * statMultiplier * diminishingMultiplier
// 
// Prima di restituire il valore finale, applica i modifier `stat_reward_food`/`stat_reward_materials`
// provenienti da scope LOCATION/RESIDENT (es. upgrade del Barracks, trait). 
```

**Esempio (Woodcutter):**

| Workers | Stat (edge) | Base | Stat Mult | Dim. Mult | Output |
|---------|-------------|------|-----------|-----------|--------|
| 1 | 5 | 3 | 1.5 | 1.0 | 4 |
| 2 | 5 | 3 | 1.5 | 0.8 | 3 |
| 3 | 5 | 3 | 1.5 | 0.64 | 2 |
| **Total** | | | | | **9 wood** |

---

## 4. Implementation Phases

### Phase P0: Production Scaling System (4h) ✅ COMPLETATO

**Obiettivo:** Implementare sistema di produzione config-first con diminishing returns e stat scaling.

**File Implementati:**

- ✅ `src/balancing/config/idleVillage/types.ts` – `ProductionScalingConfig`, `BuildingUpgrade`
- ✅ `src/balancing/config/idleVillage/defaultConfig.ts` – Risorsa `wood`, `globalRules.productionScaling`, job `job_chop_wood`
- ✅ `src/engine/game/idleVillage/ProductionEngine.ts` – `calculateProduction()`, `calculateOptimalWorkers()`, `calculateProductionRate()`
- ✅ `tests/unit/idleVillage/ProductionEngine.test.ts` – Test suite completa (16 test cases)

**Formule Implementate:**

```typescript
// calculateProduction(baseProduction, workers, config, buildingMultiplier)
// - Stat multiplier: 1 + (statValue * 0.1), capped at 3.0
// - Diminishing returns: 0.8^(workerIndex-1) starting from 2nd worker
// - Building multiplier: optional level-based scaling
// - Returns: totalProduction + per-worker breakdown
```

**Valori Default Config:**

```typescript
productionScaling: {
  diminishingReturnsFactor: 0.8,
  statMultiplierPerPoint: 0.1,
  applyDiminishingToFirstWorker: false,
  maxStatMultiplier: 3.0,
}
```

**Job Woodcutter Aggiunto:**

```typescript
job_chop_wood: {
  id: 'job_chop_wood',
  label: 'Chop Wood',
  tags: ['job', 'production', 'woodcutting'],
  dailyRewardProfile: [{ resourceId: 'wood', amountPerDay: 3 }],
  statRequirement: { anyOf: ['edge'] },
  metadata: {
    baseProduction: 3,
    scalingStatTag: 'edge',
    productionJob: true,
  }
}
```

---

### Phase P1: Level Progression Config (4h)

**Obiettivo:** Aggiungere `LevelProgressionConfig` a `GlobalRules` e implementare funzioni di calcolo XP.

**File Target:**

- `src/balancing/config/idleVillage/types.ts` – Aggiungere `LevelProgressionConfig`
- `src/balancing/config/idleVillage/defaultConfig.ts` – Valori default
- `src/engine/game/idleVillage/LevelEngine.ts` – Nuovo modulo con `xpForLevel()`, `levelFromXp()`, `xpToNextLevel()`
- `tests/unit/idleVillage/LevelEngine.test.ts` – Test suite

**Formule:**

```typescript
export function xpForLevel(level: number, config: LevelProgressionConfig): number {
  return Math.floor(config.baseXp * Math.pow(config.growthFactor, level - 1));
}

export function levelFromXp(totalXp: number, config: LevelProgressionConfig): number {
  // Inversa: L = 1 + log(totalXp/baseXp) / log(growthFactor)
  if (totalXp < config.baseXp) return 1;
  return Math.floor(1 + Math.log(totalXp / config.baseXp) / Math.log(config.growthFactor));
}

export function xpToNextLevel(currentXp: number, config: LevelProgressionConfig): number {
  const currentLevel = levelFromXp(currentXp, config);
  const nextLevelXp = xpForLevel(currentLevel + 1, config);
  return nextLevelXp - currentXp;
}
```

**Safeguard:**

- `npm run lint -- src/engine/game/idleVillage/LevelEngine.ts`
- `npm run test -- tests/unit/idleVillage/LevelEngine.test.ts`
- `npm run build:check`

---

### Phase P2: Job/Quest Scaling Config (4h)

**Obiettivo:** Sostituire reward/duration hardcoded con formule parametriche.

**File Target:**

- `src/balancing/config/idleVillage/types.ts` – Aggiungere `JobScalingConfig`, `QuestScalingConfig`
- `src/balancing/config/idleVillage/defaultConfig.ts` – Valori default in `globalRules`
- `src/engine/game/idleVillage/RewardEngine.ts` – Nuovo modulo con `calculateJobReward()`, `calculateQuestReward()`, `calculateQuestRisk()`
---

### Phase P3: Effective Power & Outcome Engine (6h)

**Obiettivo:** Implementare calcolo `EffectivePower` party e distribuzione outcome.

**File Target:**

- `src/balancing/config/idleVillage/types.ts` – Aggiungere `EffectivePowerConfig`, `OutcomeDistribution`
- `src/balancing/config/idleVillage/defaultConfig.ts` – Valori default
- `src/engine/game/idleVillage/EffectivePowerEngine.ts` – Nuovo modulo
- `src/engine/game/idleVillage/OutcomeEngine.ts` – Calcolo outcome (perfect/success/partial/fail/deadly)
- `tests/unit/idleVillage/EffectivePowerEngine.test.ts`
- `tests/unit/idleVillage/OutcomeEngine.test.ts`

**Formule:**

```typescript
export function calculateEffectivePower(
  party: ResidentState[],
  config: EffectivePowerConfig
): number {
  const totalPower = party.reduce((sum, resident) => {
    const statPower = Object.entries(resident.statSnapshot).reduce((s, [tag, value]) => {
      const weight = config.statTagWeights[tag] ?? 1;
      return s + (value * weight);
    }, 0);
    return sum + statPower;
  }, 0);
  return totalPower / party.length;
}

export function determineOutcome(
  powerRatio: number,
  thresholds: EffectivePowerConfig['outcomeThresholds']
): QuestOutcome {
  if (powerRatio >= thresholds.perfect) return 'perfect';
  if (powerRatio >= thresholds.success) return 'success';
  if (powerRatio >= thresholds.partial) return 'partial';
  if (powerRatio >= thresholds.fail) return 'fail';
  return 'deadly';
}
```

**Safeguard:**

- `npm run lint -- src/engine/game/idleVillage/EffectivePowerEngine.ts src/engine/game/idleVillage/OutcomeEngine.ts`
- `npm run test -- tests/unit/idleVillage/EffectivePowerEngine.test.ts tests/unit/idleVillage/OutcomeEngine.test.ts`
- `npm run build:check`

---

### Phase P4: Quest Resolution Integration (6h)

**Obiettivo:** Integrare P1-P3 nel flusso di risoluzione quest esistente.

**File Target:**

- `src/engine/game/idleVillage/QuestResolver.ts` – Refactor per usare nuovi engine
- `src/engine/game/idleVillage/TimeEngine.ts` – Integrare XP award e level-up
- `src/ui/idleVillage/components/QuestOutcomeDisplay.tsx` – UI per mostrare outcome
- `tests/integration/idleVillage/QuestResolution.test.ts`

**Flow:**

1. `QuestResolver.resolve(quest, party)` chiama `calculateEffectivePower(party)`
2. Calcola `powerRatio = effectivePower / questDifficulty`
3. Determina `outcome` via `determineOutcome(powerRatio)`
4. Calcola `reward` via `calculateQuestReward(questLevel, outcome, config)`
5. Calcola `risk` via `calculateQuestRisk(questLevel, outcome, config)`
6. Applica injury/death basato su `risk`
7. Assegna XP ai sopravvissuti
8. Emette telemetria

**Safeguard:**

- `npm run lint -- src/engine/game/idleVillage/QuestResolver.ts`
- `npm run test -- tests/integration/idleVillage/QuestResolution.test.ts`
- `npm run build:check`

---

### Phase P5: Telemetry & Validation (4h)

**Obiettivo:** Aggiungere metriche di progressione per validare il bilanciamento.

**File Target:**

- `src/analytics/idleVillageProgression.ts` – Nuovo modulo telemetria
- `src/balancing/config/idleVillage/progressionTelemetryConfig.ts` – Config metriche
- `scripts/idleVillage/progressionReport.ts` – CLI per report

**Metriche:**

```typescript
interface ProgressionTelemetryEvent {
  eventType: 'level_up' | 'quest_completed' | 'resident_death' | 'economy_snapshot';
  data: {
    residentId?: string;
    fromLevel?: number;
    toLevel?: number;
    timeToLevelMinutes?: number;
    questId?: string;
    questLevel?: number;
    outcome?: QuestOutcome;
    rewardActual?: number;
    rewardExpected?: number;
    riskActual?: number;
    injuryOccurred?: boolean;
    deathOccurred?: boolean;
    goldBalance?: number;
    foodBalance?: number;
    timestamp: number;
  };
}
```

**Safeguard:**

- `npm run lint -- src/analytics/idleVillageProgression.ts`
- `npm run build:check`
- `npm run kanban:lint`

---

### Phase P6: UI Config Editor (4h)

**Obiettivo:** Esporre i nuovi parametri nell'editor config Idle Village.

**File Target:**

- `src/ui/idleVillage/config/ProgressionConfigEditor.tsx` – Nuovo componente
- `src/ui/idleVillage/config/IdleVillageConfigPage.tsx` – Integrare tab "Progression"
- `tests/unit/idleVillage/ProgressionConfigEditor.test.tsx`

**Features:**

- Slider per `baseXp`, `growthFactor`, `maxLevel`
- Preview curva XP (sparkline)
- Slider per reward/risk scaling
- Preview tabella reward per livello

**Safeguard:**

- `npm run lint -- src/ui/idleVillage/config/ProgressionConfigEditor.tsx`
- `npm run test -- tests/unit/idleVillage/ProgressionConfigEditor.test.tsx`
- `npm run build:check`

---

## 5. Dipendenze e Ordine

```
P1 (Level) ──┬──> P4 (Integration)
             │
P2 (Reward) ─┤
             │
P3 (Power) ──┘
             
P4 ──> P5 (Telemetry)
    │
    └──> P6 (UI)
```

**Ordine consigliato:** P1 → P2 → P3 → P4 → P5 → P6

---

## 6. Valori Default Consigliati

### 6.1 Level Progression

```typescript
levelProgression: {
  baseXp: 100,
  growthFactor: 1.15,
  maxLevel: 50,
}
```

### 6.2 Job Scaling

```typescript
jobScaling: {
  baseReward: 50,
  rewardGrowthFactor: 1.05,
  baseDuration: 60,
  durationGrowthFactor: 1.02,
}
```

### 6.3 Quest Scaling

```typescript
questScaling: {
  baseRewardMin: 100,
  baseRewardMax: 150,
  rewardMultiplierPerLevel: 1.1,
  baseRiskMin: 0.05,
  baseRiskMax: 0.15,
  riskMultiplierPerLevel: 1.05,
  riskCap: 0.95,
  baseDuration: 180,
  durationGrowthFactor: 1.1,
}
```

### 6.4 Effective Power

```typescript
effectivePower: {
  statTagWeights: {
    edge: 1.5,
    discipline: 1.3,
    lantern: 1.2,
    heart: 1.1,
    reason: 1.0,
    moth: 0.9,
  },
  outcomeThresholds: {
    perfect: 1.5,
    success: 1.0,
    partial: 0.7,
    fail: 0.4,
    deadly: 0.0,
  },
}
```

---

## 7. Tabelle di Riferimento

### 7.1 XP per Livello (growthFactor=1.15)

| Level | XP Required | Cumulative | Time to Level (est.) |
|-------|-------------|------------|----------------------|
| 1→2 | 100 | 100 | 5 min |
| 5→6 | 174 | 749 | 15 min |
| 10→11 | 350 | 2,030 | 45 min |
| 15→16 | 610 | 4,652 | 1.5 h |
| 20→21 | 1,175 | 8,137 | 3 h |
| 30→31 | 3,268 | 24,349 | 10 h |
| 40→41 | 9,100 | 68,211 | 30 h |
| 50 | 25,339 | 190,000 | 80 h |

### 7.2 Quest Reward/Risk per Livello

| Quest Level | Reward Min | Reward Max | Risk Min | Risk Max | Duration |
|-------------|------------|------------|----------|----------|----------|
| 1 | 100 | 150 | 5% | 15% | 180s |
| 3 | 121 | 182 | 6% | 17% | 218s |
| 5 | 146 | 220 | 6% | 18% | 264s |
| 7 | 177 | 266 | 7% | 20% | 320s |
| 10 | 236 | 354 | 8% | 24% | 424s |

---

## 8. Safeguard Checklist

Per ogni fase:

- [ ] `npm run lint -- <target files>`
- [ ] `npm run test -- <test files>`
- [ ] `npm run build:check`
- [ ] `npm run kanban:lint`
- [ ] Evidence log in `test-results/iv-progression-<phase>-<date>.log`

---

## 9. Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Formule troppo aggressive | Media | Alto | Test con valori estremi, cap su risk |
| Power creep a livelli alti | Media | Medio | Diminishing returns su stat weights |
| Grind eccessivo | Bassa | Alto | Telemetria time-to-level, tuning iterativo |
| Breaking change su QuestResolver | Media | Alto | Feature flag per rollback |

---

## 10. Success Metrics

| Metrica | Target | Misurazione |
|---------|--------|-------------|
| Time to Level 10 | 30-60 min | Telemetria `level_up` |
| Quest success rate (party appropriato) | 60-80% | Telemetria `quest_completed` |
| Death rate (quest high-risk) | 5-15% | Telemetria `resident_death` |
| Gold balance positivo dopo 1h | > 0 | Telemetria `economy_snapshot` |

---

## 11. Riferimenti

- [GameDesign Math: RPG Level-based Progression](https://www.davideaversa.it/blog/gamedesign-math-rpg-level-based-progression/)
- [How to balance experience gain in an RPG](https://gamedev.stackexchange.com/questions/63838/how-to-balance-experience-gain-in-an-rpg)
- Discussione AI precedente (modello config-first con formule esponenziali)
- `src/docs/docs/plans/idle_village_plan.md` – Phase 12 overview
- `src/balancing/config/idleVillage/types.ts` – Tipi esistenti
- `src/balancing/config/idleVillage/defaultConfig.ts` – Config attuale
