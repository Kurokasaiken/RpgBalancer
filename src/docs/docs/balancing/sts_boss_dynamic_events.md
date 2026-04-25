# STS Boss Dynamic Events Documentation

## Overview

The STS Boss Dynamic Event Kit provides a comprehensive, config-first system for creating and managing boss dynamic events in Slay the Spire simulations. This system enables designers to create complex boss behaviors including damage spikes, shield phases, minion spawns, and more through a structured configuration approach.

## Key Features

### Event Types
- **Spike Damage**: Temporary damage multipliers
- **Shield Phase**: Damage immunity periods
- **Minion Spawn**: Enemy reinforcement events
- **Enrage**: Progressive difficulty increases
- **Pattern Change**: Attack behavior modifications
- **Healing**: Boss recovery events
- **Debuff**: Player resource reduction
- **Environmental**: Arena-altering events

### Trigger Types
- **Health Threshold**: Events based on boss health percentage
- **Turn Based**: Events triggered after specific turn counts
- **Time Based**: Events triggered after elapsed time
- **Player Action**: Events responding to player behavior
- **Combo Count**: Events based on combo streaks
- **Random Chance**: Probabilistic event triggers
- **Phase Transition**: Events during boss phase changes

### Impact Types
- **Damage Spike**: Temporary damage amplification
- **Mana Drain**: Player mana reduction
- **Agency Reduction**: Player action limitation
- **Status Effect**: Temporary condition applications
- **Resource Modification**: Game resource changes
- **Behavior Change**: AI pattern alterations

## Configuration Schema

### Boss Event Structure

```typescript
interface BossEvent {
  id: string;                    // Unique event identifier
  name: string;                  // Display name
  type: BossEventType;           // Event category
  description: string;           // Event description
  
  trigger: {
    type: EventTriggerType;       // Trigger condition
    threshold?: number;           // Trigger threshold
    condition?: string;           // Custom condition
    probability?: number;         // Random chance (0-1)
    cooldown?: number;            // Cooldown in turns
    maxOccurrences?: number;      // Maximum trigger count
  };
  
  payload: {
    magnitude: number;            // Event strength
    duration?: number;            // Effect duration
    target: 'player' | 'boss' | 'both' | 'environment';
    parameters?: Record<string, any>; // Custom parameters
  };
  
  impact: {
    type: EventImpactType;        // Impact category
    manaChange?: number;          // Mana modification
    agencyChange?: number;        // Agency modification
    damageMultiplier?: number;    // Damage amplification
    statusEffects?: string[];      // Applied conditions
    resourceModifications?: Record<string, number>;
  };
  
  metadata: {
    phase?: string;               // Boss phase
    difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
    tags: string[];               // Search tags
    version: string;              // Configuration version
    created: string;              // Creation timestamp
    modified: string;             // Last modification
  };
}
```

### Configuration Structure

```typescript
interface BossEventKitConfig {
  events: BossEvent[];            // All available events
  
  globalSettings: {
    enabled: boolean;             // System enabled
    seed?: number;                 // RNG seed
    debugMode: boolean;           // Debug output
    maxEventsPerTurn: number;     // Concurrent event limit
    eventProbabilityMultiplier: number; // Probability scaling
    allowOverlappingEvents: boolean; // Event overlap permission
  };
  
  eventTypeWeights: Record<string, number>; // Event type frequency
  triggerConfig: {
    healthThresholds: number[];   // Health trigger points
    turnIntervals: number[];       // Turn trigger intervals
    timeIntervals: number[];       // Time trigger intervals
    comboThresholds: number[];     // Combo trigger levels
  };
  
  impactLimits: {
    maxManaDrainPerTurn: number;   // Mana drain limit
    maxAgencyReductionPerTurn: number; // Agency reduction limit
    maxDamageMultiplier: number;   // Damage amplification limit
    maxConcurrentStatusEffects: number; // Status effect limit
  };
}
```

## Usage Examples

### Basic Event Creation

```typescript
import { createBossEvent, BossEventType, EventTriggerType } from './BossDynamicEventKit';

const damageSpike = createBossEvent({
  name: 'Berserk Rage',
  type: BossEventType.SPIKE_DAMAGE,
  trigger: {
    type: EventTriggerType.HEALTH_THRESHOLD,
    threshold: 0.3,
    maxOccurrences: 1,
  },
  payload: {
    magnitude: 2.5,
    target: 'player',
  },
  impact: {
    type: EventImpactType.DAMAGE_SPIKE,
    damageMultiplier: 2.5,
  },
});
```

### Configuration Loading

```typescript
import { DEFAULT_BOSS_EVENT_KIT_CONFIG, validateBossEventKitConfig } from './BossDynamicEventKit';

// Load and validate configuration
const config = validateBossEventKitConfig(DEFAULT_BOSS_EVENT_KIT_CONFIG);

// Filter events by difficulty
const hardEvents = config.events.filter(event => 
  event.metadata.difficulty === 'hard'
);
```

### Event Triggering

```typescript
import { canEventTrigger, calculateEventProbability } from './BossDynamicEventKit';

const context = {
  bossHealth: 0.4,           // 40% health
  currentTurn: 15,
  comboCount: 3,
  playerMana: 0.7,
  playerAgency: 0.8,
  activeEvents: ['enraged'],
  elapsedTime: 450,
};

// Check if event can trigger
if (canEventTrigger(event, context)) {
  // Calculate trigger probability
  const probability = calculateEventProbability(event, config);
  
  // Apply event if RNG succeeds
  if (Math.random() <= probability) {
    applyEventImpact(event);
  }
}
```

## CLI Simulator

The boss event simulator provides deterministic testing of event configurations.

### Basic Usage

```bash
# Run basic simulation
npx tsx scripts/sts/bossEventSimulator.ts --seed 12345 --turns 20

# Filter by event types
npx tsx scripts/sts/bossEventSimulator.ts --seed 12345 --event-types spike_damage,shield_phase

# Filter by difficulty
npx tsx scripts/sts/bossEventSimulator.ts --seed 12345 --difficulty hard

# Generate markdown report
npx tsx scripts/sts/bossEventSimulator.ts --seed 12345 --format markdown --output report.md

# Debug mode
npx tsx scripts/sts/bossEventSimulator.ts --seed 12345 --debug
```

### Output Formats

#### JSON Output
```json
{
  "metadata": {
    "seed": 12345,
    "turns": 20,
    "totalEvents": 8,
    "successfulEvents": 7,
    "failedEvents": 1
  },
  "summary": {
    "averageManaPerTurn": 0.65,
    "averageAgencyPerTurn": 0.72,
    "totalManaDrain": 0.3,
    "totalAgencyReduction": 0.15,
    "mostCommonEventType": "spike_damage"
  },
  "events": [...],
  "recommendations": [...]
}
```

#### Markdown Output
```markdown
# STS Boss Event Simulation Report

## Metadata
- **Seed**: 12345
- **Turns Simulated**: 20
- **Total Events**: 8
- **Success Rate**: 87.5%

## Summary
- **Average Mana Per Turn**: 0.65
- **Average Agency Per Turn**: 0.72
- **Total Mana Drain**: 30%
- **Total Agency Reduction**: 15%

## Recommendations
- Event configuration appears well-balanced
- Consider reducing mana drain frequency
```

## Preset Configurations

### Easy Difficulty
- **Damage Spike**: 1.5x multiplier at 50% health
- **Minion Spawn**: 1 weak minion at 75% health
- **Lower trigger probabilities**
- **Longer cooldowns**

### Normal Difficulty
- **Damage Spike**: 2x multiplier at 25% health
- **Shield Phase**: 3-turn immunity at 50% health
- **Minion Spawn**: 2 standard minions at 75% health
- **Enrage**: 1.5x multiplier after 10 turns
- **Random Mana Drain**: 20% chance

### Hard Difficulty
- **Damage Spike**: 3x multiplier at 75% health
- **Extended Shield Phase**: 5-turn immunity with regeneration
- **Elite Minion Spawn**: 3 elite minions at 60% health
- **Early Enrage**: 1.75x multiplier after 5 turns
- **Frequent Mana Drain**: 25% every 2 turns
- **Agency Reduction**: 15% random chance

### Extreme Difficulty
- **Catastrophic Damage Spike**: 5x multiplier at 90% health
- **Ultimate Shield Phase**: 7-turn immunity with regeneration
- **Boss Minion Swarm**: 5 boss minions at 50% health
- **Berserk Rage**: 2x multiplier after 3 turns
- **Constant Mana Drain**: 30% every turn
- **Constant Agency Reduction**: 25% every turn
- **Pattern Change**: Unpredictable attack patterns

## Integration Guide

### Scenario Runner Integration

```typescript
import { BossEventSimulator } from './BossDynamicEventKit';

class ScenarioRunner {
  private eventSimulator: BossEventSimulator;
  
  constructor(config: BossEventKitConfig) {
    this.eventSimulator = new BossEventSimulator({
      seed: config.globalSettings.seed || Date.now(),
      turns: 30,
      bossMaxHealth: 100,
      playerMaxMana: 100,
      playerMaxAgency: 100,
      debugMode: config.globalSettings.debugMode,
    });
  }
  
  async runScenario(scenario: Scenario): Promise<SimulationReport> {
    // Configure simulator with scenario-specific settings
    this.eventSimulator.updateConfig(scenario.eventConfig);
    
    // Run simulation
    const report = this.eventSimulator.runSimulation();
    
    // Apply telemetry
    await this.recordTelemetry(report);
    
    return report;
  }
  
  private async recordTelemetry(report: SimulationReport): Promise<void> {
    // Record sts_boss_event_simulated telemetry
    await this.telemetryService.record('sts_boss_event_simulated', {
      seed: report.metadata.seed,
      totalEvents: report.metadata.totalEvents,
      successRate: report.metadata.successfulEvents / report.metadata.totalEvents,
      averageManaPerTurn: report.summary.averageManaPerTurn,
      averageAgencyPerTurn: report.summary.averageAgencyPerTurn,
      mostCommonEventType: report.summary.mostCommonEventType,
    });
  }
}
```

### Persistence Service Integration

```typescript
import { PersistenceService } from './PersistenceService';

class BossEventConfigManager {
  constructor(private persistenceService: PersistenceService) {}
  
  async saveConfig(config: BossEventKitConfig): Promise<void> {
    await this.persistenceService.saveData('boss-event-config', config);
  }
  
  async loadConfig(): Promise<BossEventKitConfig> {
    const saved = await this.persistenceService.loadData('boss-event-config');
    return saved || DEFAULT_BOSS_EVENT_KIT_CONFIG;
  }
  
  async exportConfig(format: 'json' | 'yaml'): Promise<string> {
    const config = await this.loadConfig();
    
    if (format === 'json') {
      return JSON.stringify(config, null, 2);
    } else {
      // Convert to YAML format
      return this.convertToYaml(config);
    }
  }
  
  async importConfig(data: string, format: 'json' | 'yaml'): Promise<void> {
    let config: BossEventKitConfig;
    
    if (format === 'json') {
      config = JSON.parse(data);
    } else {
      config = this.parseFromYaml(data);
    }
    
    // Validate configuration
    const validatedConfig = validateBossEventKitConfig(config);
    
    // Save validated configuration
    await this.saveConfig(validatedConfig);
  }
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { BossEventSimulator } from './BossDynamicEventKit';

describe('BossEventSimulator', () => {
  it('should simulate basic boss events', () => {
    const simulator = new BossEventSimulator({
      seed: 12345,
      turns: 10,
      bossMaxHealth: 100,
      playerMaxMana: 100,
      playerMaxAgency: 100,
      debugMode: false,
    });
    
    const report = simulator.runSimulation();
    
    expect(report.metadata.totalEvents).toBeGreaterThan(0);
    expect(report.metadata.successfulEvents).toBeGreaterThanOrEqual(0);
    expect(report.summary.averageManaPerTurn).toBeGreaterThanOrEqual(0);
    expect(report.summary.averageAgencyPerTurn).toBeGreaterThanOrEqual(0);
  });
  
  it('should produce deterministic results with same seed', () => {
    const options = {
      seed: 12345,
      turns: 10,
      bossMaxHealth: 100,
      playerMaxMana: 100,
      playerMaxAgency: 100,
      debugMode: false,
    };
    
    const simulator1 = new BossEventSimulator(options);
    const simulator2 = new BossEventSimulator(options);
    
    const report1 = simulator1.runSimulation();
    const report2 = simulator2.runSimulation();
    
    expect(report1.metadata.totalEvents).toBe(report2.metadata.totalEvents);
    expect(report1.summary.averageManaPerTurn).toBe(report2.summary.averageManaPerTurn);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ScenarioRunner } from './ScenarioRunner';

describe('Boss Event Integration', () => {
  it('should integrate with scenario runner', async () => {
    const runner = new ScenarioRunner(DEFAULT_BOSS_EVENT_KIT_CONFIG);
    
    const scenario = {
      name: 'Test Scenario',
      eventConfig: {
        ...DEFAULT_BOSS_EVENT_KIT_CONFIG,
        globalSettings: {
          ...DEFAULT_BOSS_EVENT_KIT_CONFIG.globalSettings,
          seed: 12345,
        },
      },
    };
    
    const report = await runner.runScenario(scenario);
    
    expect(report.metadata.totalEvents).toBeGreaterThan(0);
    expect(report.summary.mostCommonEventType).toBeTruthy();
  });
});
```

## Performance Considerations

### Event Filtering
- Use efficient filtering for large event collections
- Cache filtered results for repeated access
- Consider lazy loading for complex event configurations

### Simulation Performance
- Limit maximum turns for performance
- Use deterministic RNG for reproducible results
- Implement early termination for defeated bosses

### Memory Usage
- Avoid deep copying large event configurations
- Use object pooling for frequent event creation
- Clean up event history after simulation completion

## Best Practices

### Configuration Design
- Use descriptive event names and IDs
- Include comprehensive metadata
- Tag events for easy filtering
- Version configurations properly

### Event Balance
- Test event configurations across difficulty levels
- Monitor event frequency and impact
- Adjust probability multipliers for balance
- Consider player progression curves

### Testing Strategy
- Test deterministic behavior with fixed seeds
- Validate edge cases (empty events, extreme values)
- Test integration with scenario runner
- Include performance benchmarks

### Documentation
- Document event intentions and expected behaviors
- Include examples for each event type
- Provide configuration guidelines
- Maintain change logs for event modifications

## Troubleshooting

### Common Issues

#### Events Not Triggering
- Check trigger conditions and thresholds
- Verify probability multipliers
- Ensure event is enabled in configuration
- Check for cooldown conflicts

#### Simulation Performance
- Reduce maximum turns for testing
- Disable debug mode for production
- Filter events to reduce complexity
- Check for infinite loops in custom conditions

#### Configuration Validation
- Ensure all required fields are present
- Validate numeric ranges (probabilities 0-1)
- Check for circular dependencies
- Verify event type consistency

### Debug Mode

Enable debug mode for detailed simulation information:

```typescript
const simulator = new BossEventSimulator({
  seed: 12345,
  turns: 10,
  debugMode: true, // Enable debug output
});
```

Debug mode provides:
- Event trigger details
- RNG seed information
- Turn-by-turn state changes
- Event application results

## Future Enhancements

### Planned Features
- **Visual Event Editor**: GUI for event configuration
- **Event Templates**: Reusable event patterns
- **Advanced Triggers**: Complex condition support
- **Event Chains**: Sequential event triggering
- **Dynamic Difficulty**: Adaptive event scaling

### Integration Opportunities
- **Telemetry Dashboard**: Real-time event monitoring
- **AI Balancing**: Automated event tuning
- **Player Analytics**: Event impact analysis
- **Community Sharing**: Event configuration exchange

## API Reference

### Core Classes

#### BossEventSimulator
```typescript
class BossEventSimulator {
  constructor(options: SimulationOptions);
  runSimulation(): SimulationReport;
  updateConfig(config: BossEventKitConfig): void;
}
```

#### BossEventConfigManager
```typescript
class BossEventConfigManager {
  constructor(persistenceService: PersistenceService);
  saveConfig(config: BossEventKitConfig): Promise<void>;
  loadConfig(): Promise<BossEventKitConfig>;
  exportConfig(format: 'json' | 'yaml'): Promise<string>;
  importConfig(data: string, format: 'json' | 'yaml'): Promise<void>;
}
```

### Utility Functions

#### Event Validation
```typescript
validateBossEvent(event: unknown): BossEvent;
validateBossEventKitConfig(config: unknown): BossEventKitConfig;
```

#### Event Filtering
```typescript
getEventsByType(events: BossEvent[], type: BossEventType): BossEvent[];
getEventsByPhase(events: BossEvent[], phase: string): BossEvent[];
getEventsByDifficulty(events: BossEvent[], difficulty: string): BossEvent[];
```

#### Event Logic
```typescript
calculateEventProbability(event: BossEvent, config: BossEventKitConfig): number;
canEventTrigger(event: BossEvent, context: EventTriggerContext): boolean;
```

## Conclusion

The STS Boss Dynamic Event Kit provides a powerful, flexible system for creating sophisticated boss behaviors in Slay the Spire simulations. With its config-first approach, comprehensive testing framework, and deterministic simulation capabilities, it enables designers to create engaging and balanced boss encounters while maintaining code quality and performance.

The system is designed to be extensible, testable, and maintainable, following RPG Balancer philosophy principles of configuration-driven development and comprehensive testing coverage.
