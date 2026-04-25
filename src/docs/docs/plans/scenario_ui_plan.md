# Scenario Configuration UI - Implementation Plan

## Overview

Extend the Balancer UI with **context-specific configuration cards** for each combat scenario (Duel, Swarm, Boss, 5v5). Each card allows tuning:
- Expected combat duration (turns)
- Stat effectiveness multipliers for that scenario
- Only shows stats **relevant** to that scenario

---

## 1. Data Model

### TypeScript Interfaces

```typescript
// src/balancing/contextWeights.ts
export enum ScenarioType {
    DUEL_1V1 = 'duel_1v1',
    TEAMFIGHT_5V5 = 'teamfight_5v5',
    SWARM_1VMANY = 'swarm_1vMany',
    BOSS_1V1_LONG = 'boss_1v1_long'
}

export interface ScenarioConfig {
    type: ScenarioType;
    name: string;
    icon: string; // Emoji
    description: string;
    
    // Combat parameters
    expectedTurns: number;
    enemyCount: number;
    enemyAvgHP: number;
    
    // Stat effectiveness (multipliers relative to base weight)
    statEffectiveness: Partial<Record<keyof StatBlock, number>>;
    
    // Which stats to display in UI
    relevantStats: (keyof StatBlock)[];
}

export const SCENARIO_CONFIGS: Record<ScenarioType, ScenarioConfig> = {
    [ScenarioType.DUEL_1V1]: {
        type: ScenarioType.DUEL_1V1,
        name: "Duello 1v1",
        icon: "⚔️",
        description: "Combattimento standard tra due singoli avversari. Baseline per il bilanciamento.",
        
        expectedTurns: 8,
        enemyCount: 1,
        enemyAvgHP: 100,
        
        statEffectiveness: {
            damage: 1.0,      // Baseline
            aoe: 0.0,         // No value
            lifesteal: 1.0,
            regen: 1.0,
            armor: 1.0
        },
        
        relevantStats: ['damage', 'lifesteal', 'regen', 'armor', 'critChance']
    },
    
    [ScenarioType.SWARM_1VMANY]: {
        type: ScenarioType.SWARM_1VMANY,
        name: "Sciame",
        icon: "🐝",
        description: "Combattimento contro molti nemici deboli. AoE domina, sustain poco rilevante.",
        
        expectedTurns: 4,
        enemyCount: 15,
        enemyAvgHP: 30,
        
        statEffectiveness: {
            damage: 0.5,      // ↓ Overkill su singoli nemici
            aoe: 5.0,         // ↑↑↑ BRILLA
            lifesteal: 1.5,   // ↑ Più target = più healing
            regen: 0.4,       // ↓ Combattimento rapido
            armor: 0.8        // ↓ Meno impatto
        },
        
        relevantStats: ['aoe', 'damage', 'lifesteal', 'armor', 'speed']
    },
    
    [ScenarioType.BOSS_1V1_LONG]: {
        type: ScenarioType.BOSS_1V1_LONG,
        name: "Boss Fight",
        icon: "👹",
        description: "Combattimento lungo contro un nemico singolo molto forte. Sustain e % damage brillano.",
        
        expectedTurns: 25,
        enemyCount: 1,
        enemyAvgHP: 2000,
        
        statEffectiveness: {
            damage: 1.3,      // ↑ Sustained DPS important
            aoe: 0.0,         // No value
            lifesteal: 2.5,   // ↑↑↑ BRILLA (lungo combattimento)
            regen: 3.0,       // ↑↑↑ BRILLA (molti turni)
            percentDamage: 10.0, // ↑↑↑ DOMINA (huge HP pool)
            armor: 1.2        // ↑ Survive longer
        },
        
        relevantStats: ['damage', 'percentDamage', 'lifesteal', 'regen', 'armor', 'resistance']
    },
    
    [ScenarioType.TEAMFIGHT_5V5]: {
        type: ScenarioType.TEAMFIGHT_5V5,
        name: "Team Fight 5v5",
        icon: "👥",
        description: "Combattimento di squadra. AoE forte, sustain medio.",
        
        expectedTurns: 6,
        enemyCount: 5,
        enemyAvgHP: 100,
        
        statEffectiveness: {
            damage: 0.8,      // ↓ Single-target meno rilevante
            aoe: 2.5,         // ↑↑ FORTE
            lifesteal: 1.3,   // ↑ Più opportunità healing
            regen: 0.9,       // ~ Combattimenti medi
            armor: 1.1        // ↑ Team focus fire
        },
        
        relevantStats: ['aoe', 'damage', 'armor', 'critChance', 'lifesteal']
    }
};
```

---

## 2. UI Components

### ScenarioCard Component

```typescript
// src/ui/scenario/ScenarioCard.tsx
import React from 'react';
import { CardWrapper } from '../components/CardWrapper';
import { SmartInput } from '../components/SmartInput';
import { ScenarioConfig, ScenarioType } from '../../balancing/contextWeights';

interface ScenarioCardProps {
    config: ScenarioConfig;
    stats: StatBlock;
    onConfigChange: (type: ScenarioType, updates: Partial<ScenarioConfig>) => void;
    onParamChange: (param: keyof StatBlock, value: number) => void;
    lockedParam: LockedParameter;
    onLockToggle: (param: LockedParameter) => void;
    onResetParam: (param: string) => void;
    onResetCard: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
    config,
    stats,
    onConfigChange,
    onParamChange,
    lockedParam,
    onLockToggle,
    onResetParam,
    onResetCard
}) => {
    return (
        <CardWrapper
            title={`${config.icon} ${config.name}`}
            color="text-cyan-400"
            onReset={onResetCard}
            tooltip={config.description}
        >
            {/* SCENARIO PARAMETERS */}
            <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-cyan-900">
                <h4 className="text-xs font-bold text-cyan-300 mb-2">
                    📊 Parametri Scenario
                </h4>
                
                {/* Expected Turns */}
                <div className="mb-2">
                    <label className="text-xs text-gray-400">
                        ⏱️ Turni Attesi
                    </label>
                    <input
                        type="range"
                        min={1}
                        max={50}
                        value={config.expectedTurns}
                        onChange={(e) => onConfigChange(config.type, {
                            expectedTurns: parseInt(e.target.value)
                        })}
                        className="w-full"
                    />
                    <span className="text-sm font-bold text-cyan-400">
                        {config.expectedTurns} turni
                    </span>
                </div>
                
                {/* Enemy Count */}
                <div className="mb-2">
                    <label className="text-xs text-gray-400">
                        👾 Numero Nemici
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={50}
                        value={config.enemyCount}
                        onChange={(e) => onConfigChange(config.type, {
                            enemyCount: parseInt(e.target.value)
                        })}
                        className="w-full bg-gray-900 text-cyan-400 px-2 py-1 rounded"
                    />
                </div>
                
                {/* Enemy HP */}
                <div>
                    <label className="text-xs text-gray-400">
                        ❤️ HP Medio Nemici
                    </label>
                    <input
                        type="number"
                        min={10}
                        max={5000}
                        step={10}
                        value={config.enemyAvgHP}
                        onChange={(e) => onConfigChange(config.type, {
                            enemyAvgHP: parseInt(e.target.value)
                        })}
                        className="w-full bg-gray-900 text-cyan-400 px-2 py-1 rounded"
                    />
                </div>
            </div>
            
            {/* STAT EFFECTIVENESS */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-cyan-300 mb-2">
                    ⚡ Efficacia Stat (Multiplier vs Baseline)
                </h4>
                
                {config.relevantStats.map(statKey => {
                    const effectiveness = config.statEffectiveness[statKey] || 1.0;
                    const paramDef = PARAM_DEFINITIONS[statKey];
                    
                    return (
                        <div key={statKey} className="bg-gray-800 p-2 rounded">
                            {/* Stat Name + Multiplier */}
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-300">
                                    {paramDef?.name || statKey}
                                </span>
                                <span className={`text-sm font-bold ${
                                    effectiveness > 1.5 ? 'text-green-400' :
                                    effectiveness > 1.0 ? 'text-yellow-400' :
                                    effectiveness < 0.5 ? 'text-red-400' :
                                    'text-gray-400'
                                }`}>
                                    {effectiveness.toFixed(1)}x
                                    {effectiveness > 1.5 && ' ★★★'}
                                    {effectiveness > 1.0 && effectiveness <= 1.5 && ' ★'}
                                </span>
                            </div>
                            
                            {/* Effectiveness Slider */}
                            <input
                                type="range"
                                min={0}
                                max={10}
                                step={0.1}
                                value={effectiveness}
                                onChange={(e) => onConfigChange(config.type, {
                                    statEffectiveness: {
                                        ...config.statEffectiveness,
                                        [statKey]: parseFloat(e.target.value)
                                    }
                                })}
                                className="w-full"
                            />
                            
                            {/* Current Stat Value (read-only display) */}
                            <div className="text-xs text-gray-500 mt-1">
                                Valore corrente: {stats[statKey]}
                                {' '}
                                (Effective: {(stats[statKey] * effectiveness).toFixed(1)})
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardWrapper>
    );
};
```

---

## 3. Integration with Balancer

### Update Balancer.tsx

```typescript
// src/ui/Balancer.tsx additions

import { ScenarioCard } from './scenario/ScenarioCard';
import { SCENARIO_CONFIGS, ScenarioType } from '../balancing/contextWeights';

// Add to state
const [scenarioConfigs, setScenarioConfigs] = useState(SCENARIO_CONFIGS);

// Handler
const handleScenarioConfigChange = (
    type: ScenarioType,
    updates: Partial<ScenarioConfig>
) => {
    setScenarioConfigs(prev => ({
        ...prev,
        [type]: { ...prev[type], ...updates }
    }));
};

// In JSX, add new section AFTER existing cards:
<div className="mt-6">
    <h3 className="text-lg font-bold text-cyan-400 mb-4">
        🎯 Configurazione Scenari
    </h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.values(scenarioConfigs).map(config => (
            <ScenarioCard
                key={config.type}
                config={config}
                stats={stats}
                onConfigChange={handleScenarioConfigChange}
                onParamChange={handleParamChange}
                lockedParam={lockedParam}
                onLockToggle={handleLockToggle}
                onResetParam={handleResetParam}
                onResetCard={() => {
                    // Reset to defaults
                    setScenarioConfigs(prev => ({
                        ...prev,
                        [config.type]: SCENARIO_CONFIGS[config.type]
                    }));
                }}
            />
        ))}
    </div>
</div>
```

---

## 4. Persistence

```typescript
// Save/Load scenario configs
const SCENARIO_STORAGE_KEY = 'balancer_scenarios';

// On mount
useEffect(() => {
    const saved = localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (saved) {
        try {
            setScenarioConfigs(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load scenario configs');
        }
    }
}, []);

// Auto-save
useEffect(() => {
    localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(scenarioConfigs));
}, [scenarioConfigs]);
```

---

## 5. Visual Mockup

```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Configurazione Scenari                                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ ⚔️ Duello 1v1      │  │ 🐝 Sciame           │           │
│  │ (Baseline)          │  │                     │           │
│  ├─────────────────────┤  ├  ───────────────────┤           │
│  │ 📊 Parametri:       │  │ 📊 Parametri:       │           │
│  │ ⏱️ Turni: [====] 8  │  │ ⏱️ Turni: [==] 4    │           │
│  │ 👾 Nemici: 1        │  │ 👾 Nemici: 15       │           │
│  │ ❤️ HP: 100          │  │ ❤️ HP: 30           │           │
│  ├─────────────────────┤  ├─────────────────────┤           │
│  │ ⚡ Efficacia Stat:  │  │ ⚡ Efficacia Stat:  │           │
│  │                     │  │                     │           │
│  │ Damage   1.0x       │  │ AoE      5.0x ★★★  │           │
│  │ [========]          │  │ [===================] │         │
│  │                     │  │                     │           │
│  │ Lifesteal 1.0x      │  │ Damage   0.5x       │           │
│  │ [========]          │  │ [====]              │           │
│  │                     │  │                     │           │
│  │ Regen    1.0x       │  │ Lifesteal 1.5x ★    │           │
│  │ [========]          │  │ [===========]       │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │ 👹 Boss Fight       │  │ 👥 Team 5v5         │           │
│  │                     │  │                     │           │
│  ├─────────────────────┤  ├─────────────────────┤           │
│  │ 📊 Parametri:       │  │ 📊 Parametri:       │           │
│  │ ⏱️ Turni: [======] 25│ │ ⏱️ Turni: [===] 6   │           │
│  │ 👾 Nemici: 1        │  │ 👾 Nemici: 5        │           │
│  │ ❤️ HP: 2000         │  │ ❤️ HP: 100          │           │
│  ├─────────────────────┤  ├─────────────────────┤           │
│  │ ⚡ Efficacia Stat:  │  │ ⚡ Efficacia Stat:  │           │
│  │                     │  │                     │           │
│  │ %Damage  10.0x ★★★  │  │ AoE      2.5x ★★    │           │
│  │ [===================]│ │ [===============]   │           │
│  │                     │  │                     │           │
│  │ Regen    3.0x ★★★   │  │ Damage   0.8x       │           │
│  │ [=================] │  │ [======]            │           │
│  │                     │  │                     │           │
│  │ Lifesteal 2.5x ★★★  │  │ Armor    1.1x ★     │           │
│  │ [===============]   │  │ [=========]         │           │
│  └─────────────────────┘  └─────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Data Model (2-3 hours)
- [ ] Create `src/balancing/contextWeights.ts`
- [ ] Define `ScenarioType` enum
- [ ] Define `ScenarioConfig` interface
- [ ] Create `SCENARIO_CONFIGS` with 4 scenarios
- [ ] Add TypeScript types

### Phase 2: UI Component (4-5 hours)
- [ ] Create `src/ui/scenario/ScenarioCard.tsx`
- [ ] Implement scenario parameters section
- [ ] Implement stat effectiveness sliders
- [ ] Add visual indicators (★★★ for strong stats)
- [ ] Add tooltips with descriptions

### Phase 3: Integration (2-3 hours)
- [ ] Update `Balancer.tsx` state management
- [ ] Add scenario config handlers
- [ ] Integrate `ScenarioCard` into UI grid
- [ ] Add persistence (localStorage)
- [ ] Add export/import for scenario configs

### Phase 4: Styling & Polish (1-2 hours)
- [ ] Color code effectiveness (green/yellow/red)
- [ ] Add scenario icons (emojis)
- [ ] Responsive layout
- [ ] Hover effects
- [ ] Accessibility (ARIA labels)

### Phase 5: Documentation (1 hour)
- [ ] Update user guide
- [ ] Add inline help tooltips
- [ ] Create example configurations

**Total Estimated Time**: 10-14 hours

---

## 7. File Structure

```
src/
├── balancing/
│   ├── contextWeights.ts         # NEW - Scenario configs
│   └── expectedValue.ts          # NEW - Calculate EV across scenarios
├── ui/
│   ├── Balancer.tsx              # MODIFIED - Add scenario cards
│   └── scenario/
│       ├── ScenarioCard.tsx      # NEW - Main card component
│       └── EffectivenessSlider.tsx # NEW - Reusable slider component
└── types/
    └── scenarios.ts              # NEW - Shared types
```

---

## 8. Benefits

✅ **Visual Control**: Easy to see which stats shine where  
✅ **Intuitive**: Sliders + star ratings make it clear  
✅ **Flexible**: Modify turn count and effectiveness on the fly  
✅ **Focused**: Only shows relevant stats per scenario  
✅ **Persistent**: Configs saved to localStorage  
✅ **Exportable**: Can share configurations via JSON

---

## 9. Future Enhancements

- [ ] **Scenario Templates**: Presets for common encounter types
- [ ] **Auto-Calculate**: Derive effectiveness from simulations
- [ ] **Comparison View**: Side-by-side scenario comparison
- [ ] **Weighted Average**: Show "overall" weight considering scenario mix
- [ ] **Simulation Runner**: Test builds across all scenarios from UI

---

## Next Steps

1. Implement Phase 1 (Data Model)
2. Create Phase 2 (UI Component)
3. Integrate Phase 3 (Balancer)
4. Polish Phase 4 (Styling)
5. Document Phase 5

**Ready for implementation!**
