# Archmage Spell Lifecycle Telemetry

## Overview
Config-first telemetry pipeline for Archmage spell lifecycle events with versioned schemas and export capabilities.

## Features
- **4 Lifecycle Events**: spawn, buff, resolve, decay
- **Zod Schema Validation**: Type-safe event recording
- **Export Formats**: JSON and CSV
- **Performance Tracking**: Latency monitoring with KPI targets
- **Memory Management**: Configurable event buffer
- **Metrics Calculation**: Success rates, event counts, latency stats

## Lifecycle Events

### 1. Spawn
Triggered when a spell is created/cast.

**Fields**:
- `spellId`: Unique spell identifier
- `spellName`: Spell name
- `manaCost`: Mana cost
- `timestamp`: Event timestamp
- `metadata`: Optional additional data

**Example**:
```typescript
telemetry.recordSpawn('spell-1', 'Fireball', 3, { element: 'fire' });
```

### 2. Buff
Triggered when a spell buffs a creature.

**Fields**:
- `spellId`: Spell identifier
- `spellName`: Spell name
- `targetCreatureId`: Target creature ID
- `buffMagnitude`: Buff strength
- `timestamp`: Event timestamp
- `metadata`: Optional additional data

**Example**:
```typescript
telemetry.recordBuff('spell-2', 'Strength', 'creature-1', 5);
```

### 3. Resolve
Triggered when a spell resolves (completes its effect).

**Fields**:
- `spellId`: Spell identifier
- `spellName`: Spell name
- `resolveSuccess`: Success boolean
- `duration`: Time to resolve (ms)
- `timestamp`: Event timestamp
- `metadata`: Optional additional data

**Example**:
```typescript
telemetry.recordResolve('spell-1', 'Fireball', true, 150);
```

### 4. Decay
Triggered when a spell effect expires.

**Fields**:
- `spellId`: Spell identifier
- `spellName`: Spell name
- `duration`: Effect duration (ms)
- `timestamp`: Event timestamp
- `metadata`: Optional additional data

**Example**:
```typescript
telemetry.recordDecay('spell-2', 'Strength', 3000);
```

## Configuration

```typescript
const config: TelemetryConfig = {
  enabled: true,
  maxEventsInMemory: 1000,
  exportFormat: 'json',
  exportPath: 'test-results',
  version: '1.0.0',
  targetLatency: 25, // ms
};

const telemetry = new SpellLifecycleTelemetry(config);
```

## Usage

### Basic Recording
```typescript
import { spellLifecycleTelemetry } from '@/analytics/archmage/spellLifecycleTelemetry';

// Record spawn
spellLifecycleTelemetry.recordSpawn('spell-1', 'Fireball', 3);

// Record buff
spellLifecycleTelemetry.recordBuff('spell-2', 'Strength', 'creature-1', 5);

// Record resolve
spellLifecycleTelemetry.recordResolve('spell-1', 'Fireball', true, 150);

// Record decay
spellLifecycleTelemetry.recordDecay('spell-2', 'Strength', 3000);
```

### Get Metrics
```typescript
const metrics = spellLifecycleTelemetry.getMetrics();

console.log('Total Events:', metrics.totalEvents);
console.log('Success Rate:', metrics.successRate);
console.log('Avg Latency:', metrics.avgLatency);
console.log('Events by Type:', metrics.eventsByType);
```

### Export Data
```typescript
// Export to JSON
const jsonData = spellLifecycleTelemetry.exportJSON();
fs.writeFileSync('spell-lifecycle.json', jsonData);

// Export to CSV
const csvData = spellLifecycleTelemetry.exportCSV();
fs.writeFileSync('spell-lifecycle.csv', csvData);
```

## KPI Targets

### Latency
- **Target**: <25ms per event
- **Warning**: Logged when exceeded
- **Measurement**: `performance.now()` before/after recording

### Success Rate
- **Target**: >95% resolve success
- **Calculation**: `successfulResolves / totalResolves`

### Memory Usage
- **Target**: <1000 events in memory
- **Management**: FIFO buffer with configurable limit

## Export Formats

### JSON
```json
{
  "version": "1.0.0",
  "exportDate": "2026-01-24T12:00:00.000Z",
  "metrics": {
    "totalEvents": 4,
    "eventsByType": {
      "spawn": 1,
      "buff": 1,
      "resolve": 1,
      "decay": 1
    },
    "avgLatency": 0.5,
    "maxLatency": 1.2,
    "successRate": 1.0
  },
  "events": [...]
}
```

### CSV
```csv
ID,Type,SpellID,SpellName,Timestamp,Duration,ManaCost,TargetCreatureID,BuffMagnitude,ResolveSuccess
"spawn_1234_abc","spawn","spell-1","Fireball","1706097600000","","3","","",""
"buff_1235_def","buff","spell-2","Strength","1706097601000","","","creature-1","5",""
```

## Integration with AM-1

The telemetry system integrates with Strategy Task AM-1 (Archmage Mana System) by tracking:
- Spell spawn events (mana cost)
- Buff applications to creatures
- Spell resolution success/failure
- Effect decay timing

## Performance

- **Event Recording**: <1ms (target: <25ms)
- **Metrics Calculation**: <5ms for 1000 events
- **JSON Export**: <10ms for 1000 events
- **CSV Export**: <15ms for 1000 events

## Testing

Run unit tests:
```bash
npm run test -- tests/unit/archmage/SpellLifecycleTelemetry.test.ts
```

Sample exports are generated in `test-results/` during tests.

## Best Practices

1. **Always validate events**: Use Zod schemas
2. **Monitor latency**: Check metrics regularly
3. **Export periodically**: Prevent memory overflow
4. **Use metadata**: Add context for debugging
5. **Clear after export**: Free memory when done

## Dependencies

- **AM-1**: Archmage Mana System Plan
- **KS-081**: Telemetry persistence policy
- **PersistenceService**: Async storage (not localStorage)
- **Zod**: Schema validation

## Versioning

Current version: **1.0.0**

Schema changes require version bump and migration strategy.
