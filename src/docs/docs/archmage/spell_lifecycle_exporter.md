# Archmage Spell Lifecycle Exporter

## Overview

Config-first exporter for Archmage spell lifecycle events (spawn/buff/decay/expire/cancel) with JSON/CSV export capabilities and comprehensive filtering.

## Usage

### CLI Tool

```bash
# Export spell lifecycle events
tsx scripts/archmage/spellLifecycleExport.ts export \
  --input data/spell-events.json \
  --output test-results/spell-export.json \
  --format json

# Export with filters
tsx scripts/archmage/spellLifecycleExport.ts export \
  --input data/spell-events.json \
  --format csv \
  --event-types spawn,buff \
  --spell-ids spell-1,spell-2 \
  --start-time 1000 \
  --end-time 5000

# Generate sample events for testing
tsx scripts/archmage/spellLifecycleExport.ts generate-sample \
  --output test-results/sample-spell-events.json \
  --count 100
```

### Programmatic API

```typescript
import { SpellLifecycleExporter } from '@/analytics/archmage/spellLifecycleExporter';

// Create exporter with configuration
const exporter = new SpellLifecycleExporter({
  format: 'json',
  sortBy: 'timestamp',
  sortOrder: 'asc',
  filters: {
    eventTypes: ['spawn', 'buff'],
    spellIds: ['spell-1'],
    startTimestamp: 1000,
    endTimestamp: 5000,
  },
});

// Add events
exporter.addEvents(events);

// Export
const result = exporter.export();
```

## Configuration

### Export Configuration

```typescript
{
  version: '1.0.0',              // Export format version
  format: 'json' | 'csv',        // Output format
  includeMetadata: true,         // Include event metadata
  sortBy: 'timestamp',           // Sort field
  sortOrder: 'asc',              // Sort order
  filters: {                     // Optional filters
    eventTypes: ['spawn', 'buff'],
    spellIds: ['spell-1'],
    startTimestamp: 1000,
    endTimestamp: 5000,
    minDuration: 500,
    maxDuration: 3000,
  }
}
```

### Event Types

- **spawn**: Spell is created/cast
- **buff**: Spell applies buff effect
- **decay**: Spell effect decays over time
- **expire**: Spell duration ends naturally
- **cancel**: Spell is cancelled/interrupted

## Event Schema

```typescript
{
  eventId: string;              // Unique event identifier
  eventType: EventType;         // Type of lifecycle event
  spellId: string;              // Spell identifier
  spellName: string;            // Human-readable spell name
  timestamp: number;            // Event timestamp (ms)
  duration?: number;            // Spell duration (ms)
  magnitude?: number;           // Effect magnitude
  target?: string;              // Target identifier
  metadata?: Record<unknown>;   // Additional metadata
}
```

## Export Formats

### JSON Export

```json
{
  "version": "1.0.0",
  "exportedAt": 1706091375000,
  "totalEvents": 100,
  "filteredEvents": 25,
  "events": [
    {
      "eventId": "evt-1",
      "eventType": "spawn",
      "spellId": "spell-1",
      "spellName": "Fireball",
      "timestamp": 1000,
      "duration": 2000,
      "magnitude": 50,
      "target": "enemy-1"
    }
  ],
  "config": { ... }
}
```

### CSV Export

```csv
eventId,eventType,spellId,spellName,timestamp,duration,magnitude,target
"evt-1","spawn","spell-1","Fireball","1000","2000","50","enemy-1"
"evt-2","buff","spell-2","Ice Shield","2000","3000","30","player-1"
```

## Filtering

### Event Type Filter

Filter by specific lifecycle events:

```bash
--event-types spawn,buff,decay
```

### Spell ID Filter

Filter by specific spells:

```bash
--spell-ids spell-1,spell-2,spell-3
```

### Timestamp Range

Filter events within time range:

```bash
--start-time 1000 --end-time 5000
```

### Duration Range

Filter by spell duration:

```bash
--min-duration 500 --max-duration 3000
```

## Sorting

### Sort Fields

- **timestamp**: Sort by event time
- **eventType**: Sort by event type
- **spellId**: Sort by spell identifier

### Sort Order

- **asc**: Ascending order
- **desc**: Descending order

```bash
--sort-by timestamp --sort-order desc
```

## Telemetry

Emits `archmage_spell_exported` event with:

```typescript
{
  eventType: 'archmage_spell_exported',
  timestamp: number,
  data: {
    eventCount: number,
    filteredCount: number,
    format: string,
    executionTimeMs: number,
  }
}
```

## Integration

### With NP-099 Spell Lifecycle Telemetry

The exporter integrates with the spell lifecycle telemetry system (NP-099) to export tracked events.

### With PersistenceService

All exports follow persistence rules and save to `test-results/` directory by default.

### With AM-1 Strategy Task

Supports Archmage gameplay pillars with comprehensive spell tracking and analysis.

## Examples

### Export All Events

```bash
tsx scripts/archmage/spellLifecycleExport.ts export \
  --input data/spell-events.json \
  --output test-results/all-spells.json
```

### Export Spawn Events Only

```bash
tsx scripts/archmage/spellLifecycleExport.ts export \
  --input data/spell-events.json \
  --format csv \
  --event-types spawn \
  --output test-results/spawn-events.csv
```

### Export Recent Events

```bash
tsx scripts/archmage/spellLifecycleExport.ts export \
  --input data/spell-events.json \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --output test-results/recent-spells.json
```

### Export Long-Duration Spells

```bash
tsx scripts/archmage/spellLifecycleExport.ts export \
  --input data/spell-events.json \
  --min-duration 5000 \
  --sort-by duration \
  --sort-order desc \
  --output test-results/long-spells.json
```

## Performance

- **Export Speed**: <100ms for 1000 events
- **Memory Usage**: <10MB for typical datasets
- **File Size**: ~1KB per event (JSON), ~200B per event (CSV)

## Testing

```bash
# Run unit tests
npm run test -- tests/unit/archmage/SpellLifecycleExporter.test.ts

# Generate sample data
tsx scripts/archmage/spellLifecycleExport.ts generate-sample --count 100

# Test export
tsx scripts/archmage/spellLifecycleExport.ts export \
  --input test-results/sample-spell-events.json \
  --output test-results/test-export.json
```

## Files

- `src/analytics/archmage/spellLifecycleExporter.ts` - Exporter service
- `scripts/archmage/spellLifecycleExport.ts` - CLI tool
- `tests/unit/archmage/SpellLifecycleExporter.test.ts` - Test suite
- `docs/archmage/spell_lifecycle_exporter.md` - Documentation
- `test-results/` - Export output directory

## Related Documentation

- [Archmage Gameplay Pillars](./GameplayPillars.md)
- [Spell Lifecycle Telemetry (NP-099)](../plans/archmage_spell_lifecycle_telemetry.md)
- [AM-1 Strategy Task](../strategy/archmage_vision.md)
