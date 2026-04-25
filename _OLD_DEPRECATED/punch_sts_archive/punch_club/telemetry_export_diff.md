# Punch Club Telemetry Export Differential CLI

## Overview

CLI tool for comparing two Punch Club telemetry export files and generating detailed diff reports in HTML, Markdown, and JSON formats.

## Usage

```bash
# Basic comparison
tsx scripts/punchClub/telemetryExportDiff.ts export1.json export2.json

# With custom config
tsx scripts/punchClub/telemetryExportDiff.ts export1.json export2.json --config custom-config.json

# Specify output format
tsx scripts/punchClub/telemetryExportDiff.ts export1.json export2.json --format html,markdown,json
```

## Configuration

### Default Config

```typescript
{
  fields: ['sessionId', 'timestamp', 'eventType', 'userId', 'ftueStep', ...],
  tolerances: [
    { fieldPath: 'sessionDuration', tolerance: 0.05, severity: 'warning' },
    { fieldPath: 'stamina', tolerance: 0.1, severity: 'info' },
  ],
  ignoreFields: ['timestamp', '_id', 'createdAt', 'updatedAt'],
  strictMode: false,
  outputFormats: ['html', 'markdown', 'json']
}
```

### Tolerance Configuration

- **tolerance**: Percentage variance allowed (0.0 - 1.0)
- **severity**: `critical` | `warning` | `info`
- **fieldPath**: Dot notation path to field (e.g., `combatResult.damage`)

## Output Formats

### HTML Report

Interactive HTML with:
- Summary statistics
- Field-by-field comparison
- Color-coded severity levels
- Expandable diff sections

### Markdown Report

Human-readable Markdown with:
- Executive summary
- Detailed findings table
- Code blocks for JSON diffs

### JSON Summary

Machine-readable JSON with:
- Structured diff data
- Severity counts
- Field-level changes

## Examples

### Sample Output

```markdown
# Telemetry Export Diff Report

## Summary
- Total Fields: 45
- Differences Found: 12
- Critical: 2
- Warnings: 7
- Info: 3

## Critical Differences

### sessionDuration
- File 1: 1234ms
- File 2: 5678ms
- Variance: 360% (exceeds 5% tolerance)
```

## Telemetry

Emits `pc_telemetry_diff_run` event with:
- File paths
- Diff count
- Severity breakdown
- Execution time

## Integration

### Storage Testing Framework

Uses Storage Testing Framework for validation:
- Data integrity checks
- Schema validation
- Performance benchmarks

### CI/CD Pipeline

Can be integrated into CI for regression detection:
```bash
npm run telemetry:diff -- baseline.json current.json
```

## Implementation Details

- **Schema Comparison**: Zod validation
- **Value Comparison**: Deep equality with tolerance
- **Output Generation**: Template-based rendering
- **Telemetry**: Event emission with diagnostics

## Files

- `scripts/punchClub/telemetryExportDiff.ts` - CLI implementation
- `src/analytics/punchClub/telemetryDiffConfig.ts` - Configuration
- `tests/unit/punchClub/TelemetryExportDiff.test.ts` - Test suite
- `test-results/punchClub/` - Output directory
