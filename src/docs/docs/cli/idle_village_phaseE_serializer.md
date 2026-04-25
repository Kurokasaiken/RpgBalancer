# Idle Village Phase E Scenario Serializer CLI

## Overview

The Phase E Scenario Serializer CLI provides a comprehensive command-line interface for exporting Idle Village Phase E scenarios with support for filtering, telemetry, and multiple output formats. This tool enables designers to serialize scenarios with residents, slots, drop feedback configurations, and quest timeline data for review and analysis.

## Installation

The CLI is available as a TypeScript script in the project:

```bash
# Run the CLI directly
npx tsx scripts/idleVillage/phaseEScenarioExport.ts [options]
```

## Usage

### Basic Usage

```bash
# Export a complete scenario to Markdown
npx tsx scripts/idleVillage/phaseEScenarioExport.ts -o data/exports/idleVillage/phaseE_samples/scenario.md

# Export to JSON format
npx tsx scripts/idleVillage/phaseEScenarioExport.ts -o data/exports/idleVillage/phaseE_samples/scenario.json -f json

# Export with custom name and description
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/custom-scenario.md \
  -n "Custom Phase E Scenario" \
  -d "A custom scenario for testing"
```

### Filtering Options

```bash
# Filter by crew IDs
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/filtered-scenario.md \
  --crew-ids "resident-1,resident-2,resident-3"

# Filter by fatigue range
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/fatigue-filtered.md \
  --fatigue-min 20 \
  --fatigue-max 80

# Filter by tags
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/tag-filtered.md \
  --tag-filters "job,outdoor"

# Exclude locked slots
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/unlocked-only.md \
  --no-locked-slots
```

### Content Filtering

```bash
# Export only residents and slots
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/minimal.md \
  --no-drop-feedback \
  --no-quest-timeline \
  --no-tags

# Export only drop feedback configs
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/drop-feedback-only.md \
  --no-residents \
  --no-slots \
  --no-quest-timeline \
  --no-tags
```

### Advanced Options

```bash
# Export with verbose output
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/verbose.md \
  --verbose

# Dry run (show what would be exported without writing files)
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/dry-run.md \
  --dry-run \
  --verbose

# Export with custom metadata
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/custom-metadata.md \
  -a "Designer Name" \
  -t "test,demo,phase-e" \
  --difficulty expert
```

## Command Options

### Required Options

- `-o, --output <path>`: Output file path (required)

### Optional Options

#### Output Configuration
- `-f, --format <format>`: Output format (`json` or `markdown`, default: `markdown`)
- `-n, --name <name>`: Scenario name
- `-d, --description <description>`: Scenario description
- `-a, --author <author>`: Scenario author
- `-t, --tags <tags>`: Scenario tags (comma-separated)
- `--difficulty <level>`: Scenario difficulty (`beginner`, `intermediate`, `advanced`, `expert`, default: `intermediate`)

#### Content Filtering
- `--no-residents`: Exclude residents from export
- `--no-slots`: Exclude slots from export
- `--no-drop-feedback`: Exclude drop feedback configs from export
- `--no-quest-timeline`: Exclude quest timeline ticks from export
- `--no-tags`: Exclude tag definitions from export

#### Data Filtering
- `--crew-ids <ids>`: Filter by crew IDs (comma-separated)
- `--tag-filters <tags>`: Filter by tags (comma-separated)
- `--fatigue-min <min>`: Minimum fatigue threshold (0-100)
- `--fatigue-max <max>`: Maximum fatigue threshold (0-100)
- `--no-locked-slots`: Exclude locked slots

#### Utility Options
- `-v, --verbose`: Enable verbose output
- `--dry-run`: Show what would be exported without writing files

## Output Formats

### JSON Format

The JSON output includes the scenario data wrapped in export metadata:

```json
{
  "scenario": {
    "schemaVersion": "1.0.0",
    "id": "phase-e-scenario-1642678800000-abc123def",
    "name": "Phase E Scenario Export",
    "description": "Exported Phase E scenario with comprehensive data",
    "generatedAt": 1642678800000,
    "author": "phase-e-scenario-cli",
    "tags": [],
    "tick": {
      "current": 0,
      "total": 100,
      "durationMs": 1000
    },
    "residents": [...],
    "slots": [...],
    "dropFeedbackConfigs": [...],
    "questTimelineTicks": [...],
    "tagDefinitions": [...],
    "metadata": {...}
  },
  "exportMetadata": {
    "exportedAt": 1642678800000,
    "exportedBy": "phase-e-scenario-cli",
    "format": "json",
    "version": "1.0.0"
  }
}
```

### Markdown Format

The Markdown output provides a human-readable report with tables and sections:

```markdown
# Phase E Scenario Export

**Description:** Exported Phase E scenario with comprehensive data
**Generated:** 2022-01-20T12:00:00.000Z
**Author:** phase-e-scenario-cli
**Version:** 1.0.0

## Scenario Metadata

- **Difficulty:** intermediate
- **Estimated Runtime:** 15 minutes
- **Tags:** None
- **Export Source:** manual

## Tick Information

- **Current Tick:** 0
- **Total Ticks:** 100
- **Duration:** 1000ms

## Residents (10)

| ID | Name | Status | Fatigue | HP | Tags |
|----|------|--------|----------|----|------|
| resident-1 | Resident 1 | available | 25% | 80/100 | strength, perception |
| ...

## Slots (8)

| ID | Activity | Crew | Max | Locked | Tags |
|----|----------|------|-----|--------|------|
| slot-1 | Forest Work | 1/2 | 2 | ✓ | village_job, outdoor |
| ...

## Drop Feedback Configs (8)

| Slot ID | State | Compatibility | Validation Message |
|---------|-------|---------------|-------------------|
| slot-1 | ✅ valid | 85.0% | Validation for Forest Work |
| ...

## Quest Timeline Ticks (15)

| Tick | Quest | Status | Progress | Priority | Type | Time Remaining |
|-----|-------|--------|----------|----------|------|----------------|
| 10 | Quest 1 | 🔄 active | 50.0% | normal | side | 50 |
| ...

## Tag Definitions (6)

- **Job** (job) - activity_type: Job activities
- **Outdoor** (outdoor) - location: Outdoor activities
- ...

---
*Generated by Phase E Scenario Exporter v1.0.0*
```

## Data Structure

### Residents

Each resident includes:
- Basic info (ID, name, status, fatigue, HP)
- Stat tags and hero status
- Survival statistics
- Optional stat snapshot with detailed values

### Slots

Each slot includes:
- Activity information and tags
- Crew capacity and current occupants
- Stat requirements for assignment
- Lock status and location coordinates

### Drop Feedback Configs

Each drop feedback config includes:
- Slot ID and validation state
- Compatibility score (0-1)
- Validation message and visual feedback
- Detailed validation results
- Last validation timestamp

### Quest Timeline Ticks

Each quest timeline tick includes:
- Tick number and quest information
- Status and progress
- Priority and quest type
- Time remaining and resource requirements
- Participating residents and location

## Telemetry

The CLI automatically generates telemetry data for each export:

```typescript
{
  eventType: 'phase_e_scenario_exported',
  timestamp: 1642678800000,
  scenarioId: 'phase-e-scenario-1642678800000-abc123def',
  format: 'json' | 'markdown',
  exportSource: 'manual' | 'auto' | 'test',
  filterCriteria: {
    crewIds?: string[],
    tagFilters?: string[],
    fatigueMin?: number,
    fatigueMax?: number,
    includeLockedSlots?: boolean
  },
  exportStats: {
    residentCount: number,
    slotCount: number,
    tagCount: number,
    dropFeedbackConfigCount: number,
    questTimelineTickCount: number,
    fileSizeBytes?: number,
    exportDurationMs: number
  },
  metadata: {
    schemaVersion: string,
    difficulty: string,
    estimatedRuntimeMinutes: number,
    requiredFeatures: string[]
  }
}
```

## Performance Metrics

The CLI tracks and reports:

- **Export Duration**: Time taken to generate and write the export
- **File Size**: Size of the exported file in bytes
- **Bundle Size**: Total number of items exported
- **Item Counts**: Breakdown of each data type

Example output:

```
📋 Export Summary:
   Format: MARKDOWN
   File size: 45.67 KB
   Export time: 125ms
   Bundle size: 39 items (10 residents, 8 slots, 8 drop feedback configs, 15 quest ticks, 6 tags)
```

## Integration Examples

### CI/CD Pipeline

```bash
#!/bin/bash
# Export scenarios for automated testing
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/ci-test-scenario.json \
  -f json \
  -n "CI Test Scenario" \
  -a "CI Pipeline" \
  --difficulty intermediate \
  --verbose
```

### Design Review Workflow

```bash
# Export comprehensive scenario for design review
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/design-review.md \
  -n "Design Review Scenario" \
  -d "Comprehensive scenario for Phase E design review" \
  -a "Design Team" \
  -t "review,phase-e,comprehensive" \
  --verbose
```

### Performance Testing

```bash
# Export minimal scenario for performance testing
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o data/exports/idleVillage/phaseE_samples/performance-test.json \
  -f json \
  --no-drop-feedback \
  --no-quest-timeline \
  --no-tags \
  --dry-run \
  --verbose
```

## Error Handling

The CLI provides clear error messages for common issues:

- **Missing required options**: `error: required option '-o, --output <path>' not specified`
- **Invalid output directory**: `Error: ENOENT: no such file or directory, mkdir 'invalid/path'`
- **Invalid fatigue range**: `Warning: Fatigue min (120) exceeds maximum (100), using max value`
- **Export failures**: `❌ Export failed: [error details]`

## Best Practices

### File Organization

Organize exports in the `data/exports/idleVillage/phaseE_samples/` directory:

```
data/exports/idleVillage/phaseE_samples/
├── basic-scenarios/
├── filtered-scenarios/
├── comprehensive-scenarios/
└── test-scenarios/
```

### Naming Conventions

Use descriptive filenames:
- `basic-residents-only.md`
- `filtered-by-fatigue-20-50.json`
- `comprehensive-with-all-fields.md`
- `performance-test-minimal.json`

### Filtering Strategy

Start broad, then filter down:
1. Export complete scenario first
2. Apply content filters (`--no-*` options)
3. Apply data filters (`--crew-ids`, `--fatigue-*`, etc.)
4. Review output and refine filters

### Performance Considerations

- Use `--dry-run` to preview exports before writing
- Use `--no-*` flags to reduce bundle size for large scenarios
- JSON format is more compact than Markdown
- Verbose mode adds minimal overhead

## Troubleshooting

### Common Issues

**Export fails with "ENOENT" error**
- Check that the output directory exists
- Use absolute paths for output files
- Ensure proper permissions on target directory

**Large file sizes**
- Use `--no-*` flags to exclude unnecessary data
- Filter by fatigue range to reduce resident count
- Use JSON format for more compact output

**Missing expected data**
- Verify filter criteria aren't too restrictive
- Check that mock data generators are working
- Use `--verbose` to see generation details

**Telemetry not recorded**
- Ensure export completes successfully
- Check that file is written to correct location
- Verify export duration is reasonable

### Debug Mode

Use `--verbose --dry-run` for debugging:

```bash
npx tsx scripts/idleVillage/phaseEScenarioExport.ts \
  -o debug-output.md \
  --verbose \
  --dry-run
```

This shows:
- Generation process details
- Filter application results
- File size estimates
- Telemetry data
- Excluded fields summary

## Integration with Other Tools

### Persistence Service

The CLI can be integrated with the PersistenceService for saving preferences:

```typescript
// Save export preferences
await persistenceService.saveData('phase-e-export-preferences', {
  defaultFormat: 'markdown',
  defaultDifficulty: 'intermediate',
  includeDropFeedback: true,
  includeQuestTimeline: true,
  verbose: false
});
```

### Scenario Runner Integration

Export scenarios can be loaded by the Scenario Runner:

```typescript
import { deserializePhaseEScenario } from '@/balancing/idleVillage/PhaseEScenarioSerializer';

// Load exported scenario
const exportedData = JSON.parse(fs.readFileSync('scenario.json', 'utf8'));
const scenario = validatePhaseEScenario(exportedData.scenario);

// Use in Scenario Runner
const runner = new ScenarioRunner(scenario);
await runner.run();
```

### Analytics Integration

Telemetry data can be sent to analytics systems:

```typescript
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

// Track export completion
trackTelemetryEvent('idle_phaseE_scenario_exported', telemetryPayload);
```

## Version History

### v1.0.0 (2025-01-19)
- Initial release
- Support for residents, slots, drop feedback configs, and quest timeline ticks
- JSON and Markdown output formats
- Comprehensive filtering options
- Telemetry integration
- CLI with verbose and dry-run modes

## Contributing

When contributing to the CLI:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for new options
4. Test with various filter combinations
5. Verify telemetry data is accurate

## License

This CLI is part of the Idle Village project and follows the same licensing terms.
