# STS Notebook & Troubleshooting Guide

**Date**: 2026-01-12  
**Task**: STS Notebook & Troubleshooting  
**Objective**: Comprehensive documentation and troubleshooting guide for STS Numeric Simulator with interactive examples and common issue resolution.

## 📚 Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Core Concepts](#core-concepts)
3. [Interactive Examples](#interactive-examples)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Advanced Troubleshooting](#advanced-troubleshooting)
6. [Performance Optimization](#performance-optimization)
7. [Debugging Tools](#debugging-tools)
8. [FAQ](#faq)

---

## 🚀 Quick Start Guide

### Getting Started with STS Numeric Simulator

```bash
# 1. Navigate to the STS directory
cd src/ui/tools/sts/

# 2. Key files to understand
├── STSNumericSimulator.tsx     # Main simulator component
├── hooks/
│   ├── useSTSSimulatorState.ts  # State management
│   ├── useSTSSimulatorEngine.ts # Simulation engine
│   └── useSTSTelemetryData.ts   # Telemetry data
├── components/
│   ├── STSControlBar.tsx        # Control interface
│   ├── STSCombatLog.tsx         # Combat log display
│   └── STSHandDisplay.tsx       # Hand visualization
└── config/
    ├── decks/                   # Deck configurations
    └── enemies/                 # Enemy profiles
```

### First Simulation

```typescript
// Basic setup
import { useSTSSimulatorState } from './hooks/useSTSSimulatorState';
import { useSTSSimulatorEngine } from './hooks/useSTSSimulatorEngine';

function MyFirstSimulation() {
  const { state, startSimulation, resetSimulation } = useSTSSimulatorState();
  const { handleCardSelection, handleCommand } = useSTSSimulatorEngine(state);
  
  return (
    <div>
      <button onClick={() => startSimulation('ironclad', 'guardian')}>
        Start Ironclad vs Guardian
      </button>
      <button onClick={resetSimulation}>Reset</button>
    </div>
  );
}
```

---

## 🧠 Core Concepts

### 1. Dual-Track Mana System

The STS simulator uses a dual-track mana system to avoid MTG's mana screw/flood problems:

```typescript
interface ManaReservoirState {
  // Stable track (always available)
  resonance: {
    alteration: number;
    bio: number;
    waves: number;
    entropy: number;
  };
  
  // Volatile track (temporary, decays)
  inspiration: {
    current: number;
    decayRate: number;
    maxStack: number;
  };
}
```

**Key Principles:**
- **Resonance** is your stable mana pool that regenerates each turn
- **Inspiration** is volatile bonus mana that decays over time
- Spells can cost multiple types of mana from both tracks
- No "mana screw" - you always have base resonance to work with

### 2. Intent-Based Enemy AI

Enemies use weighted intent selection rather than random actions:

```typescript
interface EnemyIntentProfile {
  id: string;
  name: string;
  intents: {
    attack: { weight: 40, baseDamage: 12, variance: 3 };
    defend: { weight: 20, blockAmount: 8, variance: 2 };
    buff: { weight: 20, type: 'strength', amount: 3 };
    special: { weight: 20, effect: 'debuff' };
  };
  reactiveModifiers: {
    lowHealth: { threshold: 0.3, defendBonus: 0.2 };
    highPlayerDamage: { threshold: 15, attackBonus: 0.1 };
  };
}
```

### 3. Agency Metrics

The simulator tracks player agency to ensure meaningful decisions:

```typescript
interface AgencyMetrics {
  turnsWithoutAction: number;
  availableActionsCount: number;
  fallbackUsed: boolean;
  agencyScore: number; // 0-100, higher = more agency
}
```

---

## 🎮 Interactive Examples

### Example 1: Basic Card Play

```typescript
// Playing a card from hand
const handleCardPlay = (cardIndex: number) => {
  const card = state.hand[cardIndex];
  
  // Check if we can afford it
  if (canAffordCard(card, state.mana)) {
    // Deduct mana
    const newMana = deductMana(state.mana, card.cost);
    
    // Apply effects
    const newState = applyCardEffects(card, state);
    
    // Remove card from hand
    const newHand = state.hand.filter((_, i) => i !== cardIndex);
    
    // Update state
    updateState({
      ...newState,
      mana: newMana,
      hand: newHand
    });
    
    // Log the action
    logAction(`Played ${card.name} for ${card.cost} mana`);
  } else {
    logError("Cannot afford this card!");
  }
};
```

### Example 2: Enemy Intent Selection

```typescript
const selectEnemyIntent = (enemyProfile: EnemyIntentProfile, playerState: PlayerState) => {
  // Apply reactive modifiers
  const modifiedWeights = applyReactiveModifiers(
    enemyProfile.intents, 
    enemyProfile.reactiveModifiers, 
    playerState
  );
  
  // Select intent based on weights
  const intent = weightedRandom(modifiedWeights);
  
  // Calculate actual values
  const result = {
    type: intent.type,
    value: calculateIntentValue(intent),
    description: generateIntentDescription(intent)
  };
  
  return result;
};
```

### Example 3: Mana Management

```typescript
const manageManaResources = (state: SimulatorState) => {
  const { resonance, inspiration } = state.mana;
  
  // Check for mana issues
  const issues = [];
  
  if (resonance.alteration < 2) {
    issues.push("Low alteration mana - consider defensive plays");
  }
  
  if (inspiration.current > inspiration.maxStack * 0.8) {
    issues.push("High inspiration stack - use it or lose it!");
  }
  
  // Calculate mana efficiency
  const efficiency = calculateManaEfficiency(state);
  
  return {
    issues,
    efficiency,
    recommendations: generateManaRecommendations(state)
  };
};
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Mana Screw" Simulation

**Problem**: Player can't cast any cards due to insufficient mana

**Root Cause**: Deck configuration has too many high-cost cards

**Solution**:
```typescript
// Check deck mana curve
const analyzeManaCurve = (deck: DeckConfig) => {
  const costs = deck.cards.map(card => calculateManaCost(card));
  const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
  
  if (avgCost > 3) {
    console.warn("High mana curve detected - consider adding low-cost cards");
    return {
      issue: "High mana curve",
      avgCost,
      recommendation: "Add more 1-2 cost cards"
    };
  }
  
  return { avgCost, status: "OK" };
};
```

**Prevention**:
```typescript
// Deck validation
const validateDeck = (deck: DeckConfig) => {
  const curveIssues = analyzeManaCurve(deck);
  const typeBalance = analyzeManaTypeBalance(deck);
  
  return {
    valid: !curveIssues.issue && !typeBalance.issue,
    issues: [curveIssues, typeBalance].filter(i => i.issue)
  };
};
```

### Issue 2: Performance Degradation

**Problem**: Simulator becomes slow after many turns

**Root Cause**: Unoptimized state updates and excessive re-renders

**Solution**:
```typescript
// Use React.memo for expensive components
const STSCombatLog = React.memo(({ logs, filters }) => {
  const filteredLogs = useMemo(() => 
    logs.filter(log => matchesFilters(log, filters)),
    [logs, filters]
  );
  
  return (
    <div className="combat-log">
      {filteredLogs.map(log => <LogEntry key={log.id} log={log} />)}
    </div>
  );
});

// Batch state updates
const batchStateUpdate = (updates: Partial<SimulatorState>) => {
  startTransition(() => {
    Object.entries(updates).forEach(([key, value]) => {
      setState(prev => ({ ...prev, [key]: value }));
    });
  });
};
```

### Issue 3: Inconsistent Randomness

**Problem**: Same seed produces different results

**Root Cause**: Multiple RNG instances or incorrect seed handling

**Solution**:
```typescript
// Centralized RNG with seed
class SeededRNG {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  weightedRandom(weights: Record<string, number>): string {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = this.next() * total;
    
    for (const [key, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) return key;
    }
    
    return Object.keys(weights)[0];
  }
}

// Use single instance
const rng = new SeededRNG(simulationSeed);
```

### Issue 4: Memory Leaks in Long Simulations

**Problem**: Memory usage grows continuously

**Root Cause**: Unbounded arrays in state or event listeners

**Solution**:
```typescript
// Limit log size
const MAX_LOG_ENTRIES = 1000;

const addLogEntry = (entry: LogEntry) => {
  setState(prev => ({
    ...prev,
    logs: [...prev.logs.slice(-MAX_LOG_ENTRIES + 1), entry]
  }));
};

// Cleanup event listeners
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Handle key press
  };
  
  window.addEventListener('keydown', handleKeyPress);
  
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, []);
```

---

## 🐛 Advanced Troubleshooting

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug mode
const DEBUG_MODE = process.env.NODE_ENV === 'development';

const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[STS DEBUG] ${message}`, data);
  }
};

// Usage in simulation
debugLog("Turn started", { turn: state.turn, playerHP: state.player.hp });
debugLog("Card played", { card: card.name, cost: card.cost });
```

### State Inspection

Inspect current state in browser console:

```typescript
// Add global debug object
window.stsDebug = {
  getState: () => state,
  getMana: () => state.mana,
  getHand: () => state.hand,
  getEnemy: () => state.enemy,
  getLogs: () => state.logs,
  
  // Debug helpers
  printManaCurve: () => console.table(state.hand.map(c => ({
    name: c.name,
    cost: calculateManaCost(c),
    types: c.cost.manaTypes
  }))),
  
  printIntentHistory: () => console.table(state.intentHistory)
};
```

### Performance Profiling

Profile simulation performance:

```typescript
// Performance monitoring
const performanceMonitor = {
  startTurn: () => performance.now(),
  endTurn: (startTime: number) => {
    const duration = performance.now() - startTime;
    if (duration > 16) { // > 60fps
      console.warn(`Slow turn: ${duration.toFixed(2)}ms`);
    }
  }
};

// Usage
const turnStart = performanceMonitor.startTurn();
// ... turn logic ...
performanceMonitor.endTurn(turnStart);
```

---

## ⚡ Performance Optimization

### 1. Memoization

```typescript
// Memoize expensive calculations
const calculateDamage = useMemo(() => {
  return (baseDamage: number, modifiers: DamageModifiers) => {
    let damage = baseDamage;
    
    if (modifiers.strength) damage *= 1.2;
    if (modifiers.weak) damage *= 0.8;
    if (modifiers.vulnerable) damage *= 1.5;
    
    return Math.round(damage);
  };
}, []);

// Memoize filtered logs
const filteredLogs = useMemo(() => {
  return logs.filter(log => 
    (!filter.turn || log.turn === filter.turn) &&
    (!filter.type || log.type === filter.type)
  );
}, [logs, filter]);
```

### 2. Virtual Scrolling

For large combat logs:

```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedCombatLog = ({ logs, height = 400 }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <LogEntry log={logs[index]} />
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={logs.length}
      itemSize={30}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. Lazy Loading

Load heavy components on demand:

```typescript
const LazySTSTelemetry = React.lazy(() => 
  import('./STSTelemetryDashboard')
);

// Usage with Suspense
<Suspense fallback={<div>Loading telemetry...</div>}>
  <LazySTSTelemetry data={telemetryData} />
</Suspense>
```

---

## 🛠️ Debugging Tools

### 1. Simulation Inspector

```typescript
// Development-only inspector
const SimulationInspector = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded-lg max-w-2xl mx-auto mt-8">
        <h3>Simulation Inspector</h3>
        <pre>{JSON.stringify(state, null, 2)}</pre>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </div>
    </div>
  );
};
```

### 2. Event Logger

```typescript
// Comprehensive event logging
const eventLogger = {
  log: (event: string, data: any) => {
    const entry = {
      timestamp: Date.now(),
      event,
      data,
      stackTrace: new Error().stack
    };
    
    setState(prev => ({
      ...prev,
      debugEvents: [...prev.debugEvents.slice(-100), entry]
    }));
  },
  
  export: () => {
    const blob = new Blob([JSON.stringify(state.debugEvents, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sts-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

### 3. State Diff Viewer

```typescript
// Compare state changes
const StateDiffViewer = ({ previous, current }) => {
  const diff = calculateStateDiff(previous, current);
  
  return (
    <div className="state-diff">
      <h4>State Changes</h4>
      {diff.map(change => (
        <div key={change.path} className={`diff-${change.type}`}>
          <span className="path">{change.path}:</span>
          <span className="old">{change.oldValue}</span>
          <span className="new">{change.newValue}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## ❓ FAQ

### Q: How do I add a new deck configuration?

**A**: Create a new file in `src/balancing/config/archmage/decks/`:

```typescript
// src/balancing/config/archmage/decks/customDeck.ts
export const customDeck: DeckConfig = {
  id: 'custom',
  name: 'Custom Strategy',
  description: 'A custom deck for testing',
  cards: [
    {
      id: 'custom-card-1',
      name: 'Custom Strike',
      cost: { alteration: 1, bio: 1 },
      effect: 'Deal 8 damage',
      type: 'attack'
    },
    // ... more cards
  ],
  metadata: {
    author: 'Your Name',
    version: '1.0.0',
    tags: ['custom', 'testing']
  }
};
```

### Q: How do I debug enemy AI behavior?

**A**: Use the intent inspector:

```typescript
// Add to your component
const EnemyIntentInspector = () => {
  const lastIntent = state.enemy.lastIntent;
  
  return (
    <div className="enemy-intent-inspector">
      <h4>Last Enemy Intent</h4>
      <p>Type: {lastIntent.type}</p>
      <p>Weight: {lastIntent.weight}</p>
      <p>Value: {lastIntent.value}</p>
      <p>Reasoning: {lastIntent.reasoning}</p>
      
      <h4>All Intent Weights</h4>
      {Object.entries(state.enemy.intentWeights).map(([type, weight]) => (
        <div key={type}>
          {type}: {weight} ({(weight * 100).toFixed(1)}%)
        </div>
      ))}
    </div>
  );
};
```

### Q: How do I optimize simulation performance?

**A**: Follow these optimization strategies:

1. **Use React.memo** for expensive components
2. **Implement virtual scrolling** for large lists
3. **Batch state updates** to reduce re-renders
4. **Use useMemo** for expensive calculations
5. **Limit log size** to prevent memory leaks
6. **Profile and optimize** slow operations

### Q: How do I create custom enemy profiles?

**A**: Create a new enemy profile:

```typescript
// src/balancing/config/archmage/enemies/customEnemy.ts
export const customEnemy: EnemyProfile = {
  id: 'custom',
  name: 'Custom Guardian',
  hp: 50,
  intents: {
    attack: { weight: 50, baseDamage: 15, variance: 4 },
    defend: { weight: 15, blockAmount: 10, variance: 3 },
    buff: { weight: 20, type: 'strength', amount: 4 },
    special: { weight: 15, effect: 'poison', amount: 3 }
  },
  reactiveModifiers: {
    lowHealth: { threshold: 0.25, defendBonus: 0.3 },
    highPlayerHP: { threshold: 0.8, attackBonus: 0.2 }
  },
  pacing: {
    minTurns: 5,
    maxTurns: 20,
    difficulty: 'medium'
  }
};
```

### Q: How do I troubleshoot mana calculation issues?

**A**: Use the mana calculator:

```typescript
const ManaCalculator = ({ state }) => {
  const availableMana = calculateAvailableMana(state.mana);
  const cardCosts = state.hand.map(card => calculateManaCost(card));
  const affordableCards = cardCosts.filter(cost => 
    canAfford(cost, availableMana)
  );
  
  return (
    <div className="mana-calculator">
      <h4>Mana Analysis</h4>
      <div>Available: {JSON.stringify(availableMana)}</div>
      <div>Hand Costs: {JSON.stringify(cardCosts)}</div>
      <div>Affordable: {affordableCards.length}/{state.hand.length}</div>
      
      <h4>Efficiency Score</h4>
      <div>{calculateManaEfficiency(state).toFixed(2)}%</div>
    </div>
  );
};
```

---

## 📚 Additional Resources

### Documentation Links
- [STS Numeric Simulator Spec](./STS_NumericSimulator_Spec.md)
- [STS Telemetry Dashboard](./STS_Telemetry_Dashboard.md)
- [STS Documentation Audit](./STS_Documentation_Audit.md)

### Code References
- [Simulator Engine](../../src/balancing/hooks/archmage/useSTSSimulatorEngine.ts)
- [State Management](../../src/balancing/hooks/archmage/useSTSSimulatorState.ts)
- [Telemetry System](../../src/balancing/hooks/archmage/useSTSTelemetryData.ts)

### Configuration Files
- [Deck Configurations](../../src/balancing/config/archmage/decks/)
- [Enemy Profiles](../../src/balancing/config/archmage/enemies/)
- [Mana System](../../src/balancing/config/archmage/manaConfig.ts)

---

## 🎯 Next Steps

1. **Run the examples**: Try the interactive examples in your development environment
2. **Customize configurations**: Create your own decks and enemy profiles
3. **Monitor performance**: Use the debugging tools to optimize your simulations
4. **Extend functionality**: Add new features based on your specific needs
5. **Contribute**: Share your configurations and improvements with the team

---

**Last Updated**: 2026-01-12  
**Maintainer**: Cascade  
**Version**: 1.0.0
