# Archmage Spell Lifecycle Incident Monitor

**NP-144** – Oracle-Archmage Spell Monitor  
**Status**: ✅ Complete  
**Priority**: 140

## Overview

Config-first monitor that analyzes Archmage spell lifecycle telemetry and automatically detects incidents based on configurable thresholds. Generates detailed reports in JSON and Markdown formats.

## Features

- **5 Incident Types**: Automatic detection of spell lifecycle issues
- **Configurable Thresholds**: Window size and severity per incident type
- **CLI Tool**: Command-line interface with flexible options
- **Report Generation**: JSON and Markdown output formats
- **Telemetry Integration**: Emits `archmage_spell_lifecycle_incident_detected` events
- **Summary Statistics**: Incident counts by severity level

## Incident Types

### 1. Spell Cast Failure
**Threshold**: 10% failure rate  
**Window**: Last 100 resolve events  
**Severity**: High

Detects when spell resolution failures exceed acceptable thresholds.

### 2. Mana Overflow
**Threshold**: 5% high mana cost rate  
**Window**: Last 50 spawn events  
**Severity**: Medium

Detects excessive mana consumption patterns.

### 3. Spell Timeout
**Threshold**: 5000ms average duration  
**Window**: Last 20 resolve events  
**Severity**: High

Detects spells taking too long to resolve.

### 4. Acceptance Rate Drop
**Threshold**: Below 90% success rate  
**Window**: Last 100 resolve events  
**Severity**: Critical

Detects when spell acceptance rate falls below KPI targets.

### 5. High Latency
**Threshold**: 25ms average event latency  
**Window**: Last 50 events  
**Severity**: Medium

Detects performance issues in event processing.

## CLI Usage

### Basic Usage
```bash
tsx scripts/archmage/spellLifecycleIncidentMonitor.ts
```

### Custom Window and Threshold
```bash
tsx scripts/archmage/spellLifecycleIncidentMonitor.ts --window 200 --threshold 0.15
```

### Output Formats
```bash
# JSON only
tsx scripts/archmage/spellLifecycleIncidentMonitor.ts --output json

# Markdown only
tsx scripts/archmage/spellLifecycleIncidentMonitor.ts --output markdown

# Both formats (default)
tsx scripts/archmage/spellLifecycleIncidentMonitor.ts --output both
```

### Help
```bash
tsx scripts/archmage/spellLifecycleIncidentMonitor.ts --help
```

## Configuration

### Default Thresholds
```typescript
{
  spell_cast_failure: { threshold: 0.1, window: 100, severity: 'high' },
  mana_overflow: { threshold: 0.05, window: 50, severity: 'medium' },
  spell_timeout: { threshold: 5000, window: 20, severity: 'high' },
  acceptance_rate_drop: { threshold: 0.9, window: 100, severity: 'critical' },
  high_latency: { threshold: 25, window: 50, severity: 'medium' },
}
```

### Custom Configuration
```typescript
import { SpellLifecycleAnalyzer } from '@/archmage/spellLifecycleAnalyzer';

const analyzer = new SpellLifecycleAnalyzer({
  thresholds: {
    spell_cast_failure: {
      threshold: 0.15,
      window: 200,
      severity: 'medium',
    },
  },
  enableTelemetry: true,
});
```

## Programmatic Usage

```typescript
import { SpellLifecycleAnalyzer } from '@/archmage/spellLifecycleAnalyzer';
import { spellLifecycleTelemetry } from '@/analytics/archmage/spellLifecycleTelemetry';

// Get events from telemetry
const events = spellLifecycleTelemetry.getEvents();

// Create analyzer
const analyzer = new SpellLifecycleAnalyzer();

// Analyze events
const incidents = analyzer.analyzeEvents(events);

// Get summary
const summary = analyzer.getSummary();

console.log(`Total Incidents: ${summary.totalIncidents}`);
console.log(`Critical: ${summary.criticalIncidents}`);
```

## Output Formats

### JSON Report
```json
{
  "timestamp": "2026-01-24T12:00:00.000Z",
  "window": 100,
  "threshold": 0.1,
  "incidents": [
    {
      "id": "incident_1706097600000_abc123",
      "timestamp": 1706097600000,
      "type": "spell_cast_failure",
      "severity": "high",
      "description": "Spell cast failure rate (15.0%) exceeded threshold (10.0%)",
      "metrics": {
        "threshold": 0.1,
        "actual": 0.15,
        "window": 100,
        "sampleSize": 100
      }
    }
  ],
  "summary": {
    "totalIncidents": 1,
    "criticalIncidents": 0,
    "highIncidents": 1,
    "mediumIncidents": 0,
    "lowIncidents": 0
  }
}
```

### Markdown Report
```markdown
# Spell Lifecycle Incident Report

**Timestamp**: 2026-01-24T12:00:00.000Z
**Window**: 100 events
**Threshold**: 10.0%

## Summary
- **Total Incidents**: 1
- **Critical**: 0
- **High**: 1
- **Medium**: 0
- **Low**: 0

## Incidents

### Incident #1: Spell Cast Failure
**Severity**: HIGH
**Description**: Spell cast failure rate (15.0%) exceeded threshold (10.0%)

**Metrics**:
- Threshold: 10.0%
- Actual: 15.0%
- Window: 100 events
- Sample Size: 100
```

## Telemetry Events

### archmage_spell_lifecycle_incident_detected

Emitted when an incident is detected.

**Payload**:
```typescript
{
  incidentId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  threshold: number;
  actual: number;
  window: number;
  timestamp: number;
}
```

## KPI Integration

- **Spell Acceptance Rate**: ≥90% (AM-1 requirement)
- **Cast Failure Rate**: <10%
- **Mana Overflow Rate**: <5%
- **Spell Timeout**: <5000ms average
- **Event Latency**: <25ms average

## Dependencies

- **AM-1**: Archmage Mana System spell telemetry
- **NP-099**: Spell Lifecycle Telemetry Planner
- **NP-135**: Evidence buffer (optional)

## Testing

Run unit tests:
```bash
npm run test -- tests/unit/archmage/SpellLifecycleIncidentMonitor.test.ts
```

## Best Practices

1. **Monitor Regularly**: Run incident monitor periodically to catch issues early
2. **Adjust Thresholds**: Tune thresholds based on actual spell performance
3. **Review Critical Incidents**: Prioritize critical severity incidents
4. **Track Trends**: Compare reports over time to identify patterns
5. **Integrate with CI**: Add to continuous integration for automated monitoring

---

**Status**: ✅ Complete  
**Evidence**: `test-results/np-144-spell-incident-monitor-2026-01-24.log`  
**Files**: 3 (analyzer, CLI, tests, docs)  
**Lines**: 750+
