# Punch Club Log Ingest CLI Guide

## Overview

The Punch Club Log Ingest CLI is a powerful command-line tool for processing, validating, and analyzing Punch Club telemetry logs. It provides comprehensive filtering, export capabilities, and KPI calculation for playtest data analysis.

## Features

- **Log Validation**: Validate JSON line-delimited log files
- **Data Processing**: Ingest and process large log files with filtering
- **Multiple Export Formats**: JSON, CSV, and session-specific CSV exports
- **KPI Analysis**: Calculate comprehensive session and gameplay metrics
- **Flexible Filtering**: Filter by date, session ID, event type, and source
- **Progress Monitoring**: Real-time progress bars for large files
- **Evidence Logging**: Generate detailed evidence logs for compliance

## Installation

The CLI is included in the RPG Balancer project. Ensure you have Node.js 20.19.6 installed:

```bash
source ~/.nvm/nvm.sh && nvm use 20.19.6
```

## Usage

### Basic Commands

```bash
# Ingest logs from file
./scripts/cli/logIngestCLI.ts ingest -i logs.json

# Validate log file format
./scripts/cli/logIngestCLI.ts validate -i logs.json

# Calculate KPIs
./scripts/cli/logIngestCLI.ts kpi -i logs.json

# Export to CSV
./scripts/cli/logIngestCLI.ts export -i logs.json -f csv -o export.csv
```

### Advanced Options

```bash
# Filter by date range
./scripts/cli/logIngestCLI.ts ingest -i logs.json --start-date 2024-01-01 --end-date 2024-01-31

# Filter by session ID
./scripts/cli/logIngestCLI.ts ingest -i logs.json --session-id "session-123"

# Filter by event type
./scripts/cli/logIngestCLI.ts ingest -i logs.json --event-type "combat"

# Generate evidence log
./scripts/cli/logIngestCLI.ts ingest -i logs.json --evidence evidence.log

# Show progress for large files
./scripts/cli/logIngestCLI.ts ingest -i large-logs.json --progress
```

## Commands

### ingest

Process and analyze log files with optional filtering and export.

**Options:**
- `-i, --input <file>`: Input log file (JSON line-delimited)
- `-o, --output <file>`: Output file (default: stdout)
- `-f, --format <format>`: Output format: json, csv, sessions-csv
- `--start-date <date>`: Start date filter (YYYY-MM-DD or ISO timestamp)
- `--end-date <date>`: End date filter (YYYY-MM-DD or ISO timestamp)
- `--session-id <id>`: Filter by session ID
- `--event-type <type>`: Filter by event type (supports wildcards)
- `--source <source>`: Filter by source
- `--min-confidence <number>`: Minimum confidence level for tags (0-1)
- `--max-entries <number>`: Maximum entries to process
- `--sort <order>`: Sort order: asc, desc
- `--sort-field <field>`: Sort field: timestamp, eventType, sessionId
- `-v, --verbose`: Verbose output
- `--progress`: Show progress bar for large files
- `--evidence <file>`: Generate evidence log file

**Examples:**
```bash
# Basic ingestion
./scripts/cli/logIngestCLI.ts ingest -i logs.json

# With filtering and export
./scripts/cli/logIngestCLI.ts ingest -i logs.json --start-date 2024-01-01 -o results.json

# Generate evidence log
./scripts/cli/logIngestCLI.ts ingest -i logs.json --evidence test-results/evidence.log
```

### validate

Validate log file format and structure.

**Options:**
- `-i, --input <file>`: Input log file (required)
- `-v, --verbose`: Verbose output

**Examples:**
```bash
# Validate log file
./scripts/cli/logIngestCLI.ts validate -i logs.json

# Verbose validation
./scripts/cli/logIngestCLI.ts validate -i logs.json --verbose
```

### export

Export processed data in various formats.

**Options:**
- `-o, --output <file>`: Output file (default: stdout)
- `-f, --format <format>`: Output format: json, csv, sessions-csv

**Examples:**
```bash
# Export to JSON
./scripts/cli/logIngestCLI.ts export -f json -o export.json

# Export to CSV
./scripts/cli/logIngestCLI.ts export -f csv -o export.csv

# Export sessions to CSV
./scripts/cli/logIngestCLI.ts export -f sessions-csv -o sessions.csv
```

### kpi

Calculate and display comprehensive KPIs.

**Examples:**
```bash
# Display KPIs
./scripts/cli/logIngestCLI.ts kpi -i logs.json

# KPIs with date filter
./scripts/cli/logIngestCLI.ts kpi -i logs.json --start-date 2024-01-01
```

## Log Format

The CLI expects JSON line-delimited log files with the following structure:

```json
{"timestamp": 1641894400000, "eventType": "combat_completed", "sessionId": "session-123", "payload": {"won": true, "damageDealt": 45, "damageTaken": 12}, "source": "game"}
{"timestamp": 1641894405000, "eventType": "level_up", "sessionId": "session-123", "payload": {"newLevel": 5, "experience": 1200}, "source": "game"}
{"timestamp": 1641894410000, "eventType": "tag_added", "sessionId": "session-123", "payload": {"id": "tag-456", "type": "playstyle", "name": "Aggressive", "confidence": 0.8}, "source": "auto"}
```

### Required Fields

- `timestamp`: Unix timestamp in milliseconds
- `eventType`: String identifier for the event type

### Optional Fields

- `sessionId`: Session identifier for grouping events
- `payload`: Event-specific data
- `source`: Source of the event (game, auto, manual, etc.)
- `metadata`: Additional metadata

## Supported Event Types

The CLI recognizes and processes these Punch Club event types:

- `combat_completed`: Combat results
- `level_up`: Level progression
- `experience_gained`: Experience rewards
- `money_gained`: Currency rewards
- `training_completed`: Training sessions
- `stat_points_allocated`: Stat point allocation
- `tag_added`: Session tags
- `session_started`: Session start
- `session_ended`: Session end

## Export Formats

### JSON Export

Complete structured data with metadata:

```json
{
  "metadata": {
    "exportTimestamp": 1641894400000,
    "stats": { ... },
    "kpis": { ... }
  },
  "sessions": [ ... ],
  "entries": [ ... ]
}
```

### CSV Export

Tabular event data with headers:

```csv
timestamp,eventType,sessionId,source,payload
1641894400000,combat_completed,session-123,game,"{""won"":true}"
1641894405000,level_up,session-123,game,"{""newLevel"":5}"
```

### Sessions CSV Export

Session-level metrics and summaries:

```csv
sessionId,startTime,endTime,duration,levelStart,levelEnd,experienceGained,moneyGained,combatsFought,combatsWon,combatsLost,winRate,trainingCompleted,statPointsAllocated,totalTags
session-123,1641894400000,1641895000000,600000,1,5,1200,500,10,8,2,0.8,3,2,5
```

## KPI Metrics

The CLI calculates these key performance indicators:

### Session Metrics
- Total sessions
- Average session duration
- Sessions by date

### Combat Metrics
- Total combats
- Overall win rate
- Damage dealt/taken totals

### Tag Metrics
- Total tags
- Tags by type
- Average tags per session

### Event Metrics
- Event type distribution
- Top event types
- Processing performance

## Filtering

### Date Range

Filter logs by date range using ISO timestamps or YYYY-MM-DD format:

```bash
--start-date 2024-01-01
--end-date 2024-01-31
--start-date "2024-01-01T00:00:00.000Z"
--end-date "2024-01-31T23:59:59.999Z"
```

### Session ID

Filter events from specific sessions:

```bash
--session-id "session-123"
--session-id "mobile-session-456"
```

### Event Type

Filter by event type with wildcard support:

```bash
--event-type "combat"
--event-type "level"
--event-type "tag"
```

### Source

Filter by event source:

```bash
--source "game"
--source "auto"
--source "manual"
```

## Performance

The CLI is optimized for large log files:

- **Processing Rate**: 10,000+ entries per second
- **Memory Usage**: Streaming processing for large files
- **Progress Monitoring**: Real-time progress bars
- **Error Recovery**: Graceful handling of invalid entries

## Evidence Logging

Generate comprehensive evidence logs for compliance and audit:

```bash
./scripts/cli/logIngestCLI.ts ingest -i logs.json --evidence test-results/np-076-evidence.log
```

Evidence logs include:
- Configuration used
- Processing statistics
- KPI calculations
- Error details
- Performance metrics

## Integration

### With Playtest Pipeline

```bash
# Process playtest logs
./scripts/cli/logIngestCLI.ts ingest -i playtest-logs.json --evidence test-results/playtest-evidence.log

# Export for analysis
./scripts/cli/logIngestCLI.ts export -f sessions-csv -o playtest-sessions.csv

# Generate KPI report
./scripts/cli/logIngestCLI.ts kpi -i playtest-logs.json > playtest-kpis.txt
```

### With CI/CD

```bash
#!/bin/bash
# Validate log files
./scripts/cli/logIngestCLI.ts validate -i latest-logs.json

# Process and generate evidence
./scripts/cli/logIngestCLI.ts ingest -i latest-logs.json --evidence test-results/$(date +%Y-%m-%d)-evidence.log

# Export for analytics
./scripts/cli/logIngestCLI.ts export -f json -o analytics/latest-export.json
```

## Troubleshooting

### Common Issues

**"Input file not found"**
- Check file path and permissions
- Use absolute paths if needed

**"Invalid entry: Missing required fields"**
- Ensure each JSON line has timestamp and eventType
- Check for malformed JSON

**"No data to export"**
- Run ingest command first
- Check if filters are too restrictive

**Performance Issues**
- Use `--progress` for large files
- Consider `--max-entries` for testing
- Check available memory

### Debug Mode

Use verbose mode for detailed debugging:

```bash
./scripts/cli/logIngestCLI.ts ingest -i logs.json --verbose
```

## Examples

### Complete Playtest Analysis

```bash
# Step 1: Validate logs
./scripts/cli/logIngestCLI.ts validate -i playtest-2024-01-15.json

# Step 2: Process with evidence
./scripts/cli/logIngestCLI.ts ingest -i playtest-2024-01-15.json \
  --evidence test-results/np-076-playtest-2024-01-15.log \
  --progress

# Step 3: Generate KPI report
./scripts/cli/logIngestCLI.ts kpi -i playtest-2024-01-15.json > playtest-kpis-2024-01-15.txt

# Step 4: Export for spreadsheet analysis
./scripts/cli/logIngestCLI.ts export -f sessions-csv -o playtest-sessions-2024-01-15.csv

# Step 5: Export raw data for deep analysis
./scripts/cli/logIngestCLI.ts export -f json -o playtest-raw-2024-01-15.json
```

### Mobile vs Desktop Analysis

```bash
# Mobile sessions
./scripts/cli/logIngestCLI.ts ingest -i logs.json --source "mobile" -o mobile-sessions.json
./scripts/cli/logIngestCLI.ts kpi -i logs.json --source "mobile" > mobile-kpis.txt

# Desktop sessions
./scripts/cli/logIngestCLI.ts ingest -i logs.json --source "desktop" -o desktop-sessions.json
./scripts/cli/logIngestCLI.ts kpi -i logs.json --source "desktop" > desktop-kpis.txt
```

### Combat Analysis

```bash
# Filter combat events only
./scripts/cli/logIngestCLI.ts ingest -i logs.json --event-type "combat" -o combat-only.json

# Export combat data
./scripts/cli/logIngestCLI.ts export -f csv -o combat-data.csv

# Generate combat KPIs
./scripts/cli/logIngestCLI.ts kpi -i logs.json --event-type "combat" > combat-kpis.txt
```

## API Reference

### LogProcessingOptions

```typescript
interface LogProcessingOptions {
  startDate?: number;
  endDate?: number;
  sessionId?: string;
  eventType?: string;
  source?: string;
  minConfidence?: number;
  maxEntries?: number;
  sortOrder?: 'asc' | 'desc';
  sortField?: 'timestamp' | 'eventType' | 'sessionId';
}
```

### ProcessingStats

```typescript
interface ProcessingStats {
  totalEntries: number;
  processedEntries: number;
  invalidEntries: number;
  filteredEntries: number;
  sessionsFound: number;
  tagsFound: number;
  processingTimeMs: number;
  errors: string[];
}
```

### KPIs

```typescript
interface KPIs {
  totalSessions: number;
  averageSessionDuration: number;
  totalCombats: number;
  overallWinRate: number;
  totalTags: number;
  tagsByType: Record<string, number>;
  eventTypes: Record<string, number>;
  sessionsByDate: Record<string, number>;
  averageTagsPerSession: number;
  topEventTypes: Array<{ type: string; count: number }>;
}
```

## Contributing

When adding new features to the CLI:

1. Update this documentation
2. Add examples for new commands
3. Update the API reference
4. Test with sample data
5. Update evidence log format if needed

## License

This CLI is part of the RPG Balancer project and follows the same licensing terms.
