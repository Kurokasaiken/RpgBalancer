# Idle Village Crew Scheduler Export CLI

## Overview

The Crew Scheduler Export CLI provides powerful tools for exporting crew scheduler state data in JSON and CSV formats. It supports filtering by slot, resident, and timeframe, making it ideal for analysis, debugging, and reporting.

## Features

- **Multiple Export Formats**: JSON and CSV output
- **Advanced Filtering**: Filter by activity slot, resident ID, and timeframe
- **Timeline Data**: Complete assignment timeline with actions and reasons
- **Rejection Tracking**: Detailed rejection reasons and factors
- **Statistics**: Comprehensive export statistics and analytics
- **Telemetry Integration**: Automatic telemetry emission for monitoring
- **Compression Support**: Optional file compression for large exports
- **Configurable Output**: Pretty-print JSON and custom output paths

## Installation

The CLI is available as a TypeScript script in the project:

```bash
# Run directly with tsx
npx tsx scripts/idleVillage/crewSchedulerExport.ts

# Or use npm script (if configured)
npm run scheduler:export
```

## Usage

### Basic Export

```bash
# Export all scheduler data to JSON
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --format json \
  --output data/exports/idleVillage/crew_scheduler/export.json
```

### Filtered Exports

```bash
# Export specific slot data
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --format json \
  --slot forest-work \
  --output exports/forest_assignments.json

# Export specific resident data
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --format json \
  --resident resident-1 \
  --output exports/resident_1_assignments.json

# Export data from last week
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --format json \
  --timeframe week \
  --output exports/weekly_assignments.json
```

### CSV Export

```bash
# Export to CSV format
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --format csv \
  --output exports/assignments.csv \
  --timeframe today
```

### Advanced Options

```bash
# Export with pretty printing and compression
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --format json \
  --output exports/compressed_export.json.gz \
  --pretty \
  --compress \
  --timeframe 2024-01-01,2024-01-31
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--format` | `-f` | Output format (json|csv) | `json` |
| `--output` | `-o` | Output file path | `data/exports/idleVillage/crew_scheduler/export.json` |
| `--slot` | `-s` | Filter by activity slot | - |
| `--resident` | `-r` | Filter by resident ID | - |
| `--timeframe` | `-t` | Filter by timeframe | - |
| `--compress` | `-c` | Compress output file | `false` |
| `--pretty` | `-p` | Pretty print JSON | `false` |

## Timeframe Formats

The `--timeframe` option supports several formats:

### Predefined Periods
- `today` - Current day (midnight to now)
- `week` - Last 7 days
- `month` - Last 30 days

### Date Range
- `YYYY-MM-DD,YYYY-MM-DD` - Custom date range
  - Example: `2024-01-01,2024-01-31`

## Export Data Structure

### JSON Format

```json
{
  "metadata": {
    "exportTime": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "totalAssignments": 150,
    "filters": {
      "format": "json",
      "slot": "forest-work",
      "timeframe": "week"
    },
    "exportDuration": 1250
  },
  "config": {
    "priorityWeights": { ... },
    "seeding": { ... },
    "thresholds": { ... }
  },
  "queue": [
    {
      "id": "assignment-123",
      "residentId": "resident-1",
      "activityId": "forest-work",
      "priorityScore": 85.5,
      "factors": {
        "statTagMatch": 0.8,
        "fatigue": 0.3,
        "questUrgency": 5,
        "specialization": 0.7,
        "difficulty": 0.4
      },
      "timestamp": 1705123456789
    }
  ],
  "residents": { ... },
  "activities": { ... },
  "timeline": [
    {
      "timestamp": 1705123456789,
      "residentId": "resident-1",
      "activityId": "forest-work",
      "action": "assigned",
      "priorityScore": 85.5,
      "factors": { ... }
    }
  ],
  "rejections": [
    {
      "timestamp": 1705123456789,
      "residentId": "resident-2",
      "activityId": "mining-operation",
      "reason": "fatigue_threshold",
      "factors": { ... }
    }
  ],
  "statistics": {
    "totalAssignments": 150,
    "totalRejections": 25,
    "averagePriorityScore": 78.9,
    "mostActiveResident": "resident-1",
    "mostRequestedActivity": "forest-work",
    "rejectionRate": 0.167,
    "timeRange": {
      "start": 1704528000000,
      "end": 1705132800000
    }
  }
}
```

### CSV Format

CSV exports contain timeline data with the following columns:

| Column | Description |
|--------|-------------|
| `timestamp` | Assignment timestamp |
| `residentId` | Resident identifier |
| `activityId` | Activity identifier |
| `action` | Action type (assigned/completed/cancelled) |
| `reason` | Action reason (if applicable) |
| `priorityScore` | Calculated priority score |
| `statTagMatch` | Stat match factor |
| `fatigue` | Fatigue level |
| `questUrgency` | Quest urgency |
| `specializationBonus` | Specialization bonus |
| `difficultyBonus` | Difficulty bonus |

## Filtering Examples

### By Activity Slot

```bash
# Export only forest work assignments
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --slot forest \
  --output exports/forest_work.json

# Export multiple activities (use comma-separated)
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --slot mining \
  --output exports/mining_work.json
```

### By Resident

```bash
# Export specific resident's assignments
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --resident alice \
  --output exports/alice_assignments.json

# Export by resident ID pattern
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --resident resident-1 \
  --output exports/resident_1.json
```

### By Timeframe

```bash
# Today's assignments
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --timeframe today \
  --output exports/today.json

# This week's assignments
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --timeframe week \
  --output exports/this_week.json

# Custom date range
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --timeframe 2024-01-01,2024-01-31 \
  --output exports/january.json
```

### Combined Filters

```bash
# Export forest work for resident-1 from last week
npx tsx scripts/idleVillage/crewSchedulerExport.ts \
  --slot forest \
  --resident resident-1 \
  --timeframe week \
  --output exports/forest_resident_1_week.json
```

## Programmatic Usage

You can also use the export functionality programmatically:

```typescript
import { exportSchedulerData } from '@/ui/idleVillage/controllers/CrewSchedulerExporter';

const exportData = await exportSchedulerData({
  format: 'json',
  outputPath: 'my-export.json',
  slot: 'forest-work',
  timeframe: 'week'
});

console.log(`Exported ${exportData.metadata.totalAssignments} assignments`);
```

## Cron Job Setup

For automated exports, you can set up a cron job:

```bash
# Daily export at midnight
0 0 * * * cd /path/to/project && npx tsx scripts/idleVillage/crewSchedulerExport.ts --timeframe today --output "exports/daily/$(date +\%Y-\%m-\%d).json"

# Weekly export on Sunday at 2 AM
0 2 * * 0 cd /path/to/project && npx tsx scripts/idleVillage/crewSchedulerExport.ts --timeframe week --output "exports/weekly/week-$(date +\%Y-\%U).json"

# Monthly export on 1st at 3 AM
0 3 1 * * cd /path/to/project && npx tsx scripts/idleVillage/crewSchedulerExport.ts --timeframe month --output "exports/monthly/month-$(date +\%Y-\%m).json"
```

## Performance Considerations

- **Large Exports**: Use `--compress` for exports larger than 10MB
- **Memory Usage**: The CLI loads all data into memory; consider timeframe filtering for large datasets
- **File Size**: CSV exports are typically smaller than JSON exports
- **Network**: For remote storage, consider compressing before transfer

## Troubleshooting

### Common Issues

1. **"No scheduler snapshot found"**
   - Ensure the crew scheduler has run
   - Check that snapshots are enabled in config
   - Verify PersistenceService is working

2. **"Invalid timeframe format"**
   - Use supported formats: `today`, `week`, `month`, or `YYYY-MM-DD,YYYY-MM-DD`
   - Ensure date format is correct (ISO 8601)

3. **Permission denied**
   - Check write permissions for output directory
   - Ensure the directory exists or create it first

4. **Memory errors**
   - Use timeframe filtering to reduce data size
   - Consider increasing Node.js memory limit: `--max-old-space-size=4096`

### Debug Mode

Enable verbose logging by setting environment variable:

```bash
DEBUG=crew-scheduler-export npx tsx scripts/idleVillage/crewSchedulerExport.ts --format json
```

## Integration Examples

### Data Analysis

```python
import json
import pandas as pd

# Load export data
with open('export.json', 'r') as f:
    data = json.load(f)

# Convert to DataFrame for analysis
df = pd.DataFrame(data['timeline'])

# Analyze assignment patterns
resident_stats = df.groupby('residentId').agg({
    'priorityScore': ['mean', 'count'],
    'action': 'count'
})

print(resident_stats)
```

### Monitoring Dashboard

```javascript
// Load export data for dashboard
async function loadSchedulerData() {
  const response = await fetch('/api/scheduler-export');
  const data = await response.json();
  
  // Update dashboard
  updateStatistics(data.statistics);
  updateTimeline(data.timeline);
  updateRejections(data.rejections);
}
```

## API Reference

### ExportOptions Interface

```typescript
interface ExportOptions {
  format: 'json' | 'csv';
  outputPath: string;
  slot?: string;
  resident?: string;
  timeframe?: string;
  compress?: boolean;
  pretty?: boolean;
}
```

### SchedulerExport Interface

```typescript
interface SchedulerExport {
  metadata: ExportMetadata;
  config: CrewSchedulerConfig;
  queue: QueuedAssignment[];
  residents: Record<string, ResidentState>;
  activities: Record<string, ActivityDefinition>;
  timeline: AssignmentTimelineEntry[];
  rejections: RejectionEntry[];
  statistics: ExportStatistics;
}
```

## Version History

- **v1.0.0** (NP-018): Initial implementation with JSON/CSV export, filtering, and telemetry

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Consult the main crew scheduler documentation
4. Check telemetry logs for export errors
