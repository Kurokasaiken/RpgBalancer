# Punch Club Session KPI Dashboard

## Overview

The Session KPI Dashboard CLI aggregates Punch Club session data from `mobilePlaytestLogger` and generates comprehensive KPI dashboards with ASCII tables, JSON/CSV export, and telemetry emission.

## Features

- **Config-First Design**: All KPI definitions, targets, and display settings configurable
- **Multiple Export Formats**: JSON, CSV, and Markdown with customizable content
- **ASCII Dashboard**: Text-based tables with bar charts for terminal viewing
- **Telemetry Integration**: Automatic emission of `pc_session_kpi_exported` events
- **Flexible Filtering**: Filter sessions by date range, device, tester, or session tags
- **KPI Status Tracking**: Automatic classification (excellent/good/warning/critical) based on targets

## Installation

The CLI is included in the RPG Balancer project. No additional installation required.

## Usage

### Basic Usage

```bash
# Generate dashboard with default settings
npm run session-kpi-dashboard

# Generate with custom configuration
npm run session-kpi-dashboard -- --config=./custom-config.json

# Export to specific formats
npm run session-kpi-dashboard -- --formats=json,csv,markdown

# Specify output directory
npm run session-kpi-dashboard -- --output=./reports
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--config=<path>` | Path to custom configuration file | Uses default config |
| `--output=<path>` | Output directory for exports | `test-results/` |
| `--formats=<list>` | Export formats (comma-separated) | `json,markdown` |

## Configuration

### Default KPI Metrics

The dashboard includes 8 predefined KPI metrics:

| Metric ID | Name | Target | Threshold | Category |
|-----------|------|--------|-----------|----------|
| `install_success_rate` | Install Success Rate | 90% | 85% | business |
| `consent_rate` | Consent Rate | 95% | 90% | engagement |
| `cold_start_time` | Cold Start Time | 3000ms | 4000ms | performance |
| `session_length` | Session Length | 15min | 10min | engagement |
| `export_validation_rate` | Export Validation Rate | 100% | 95% | technical |
| `cycle_duration_target` | Cycle Duration Target | 85% | 75% | performance |
| `tap_efficiency` | Tap Efficiency | 3 taps | 4 taps | engagement |
| `assignment_latency` | Assignment Latency | 450ms | 600ms | performance |

### Custom Configuration

Create a custom configuration file to override defaults:

```json
{
  "metrics": [
    {
      "id": "custom_metric",
      "name": "Custom Metric",
      "description": "A custom KPI metric",
      "unit": "%",
      "target": 80,
      "threshold": 70,
      "calculation": "percentage",
      "category": "performance"
    }
  ],
  "aggregation": {
    "sessionFilters": {
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-12-31"
      },
      "devices": ["iOS", "Android"],
      "testers": ["tester-1", "tester-2"]
    },
    "groupBy": "device",
    "sortBy": "value",
    "sortOrder": "desc"
  },
  "dashboard": {
    "showAsciiTable": true,
    "showBarCharts": true,
    "showTargets": true,
    "showDelta": true,
    "maxTableWidth": 100,
    "barChar": "█",
    "emptyChar": "░",
    "highlightChar": "▓"
  },
  "export": {
    "formats": ["json", "csv", "markdown"],
    "includeRawData": false,
    "includeAggregations": true,
    "includeMetadata": true,
    "filename": "custom-kpi-dashboard"
  }
}
```

### Configuration Schema

```typescript
interface SessionKPIConfig {
  metrics: KPIMetric[];
  aggregation: KPIAggregationConfig;
  dashboard: DashboardConfig;
  export: ExportConfig;
}

interface KPIMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
  target: number;
  threshold: number;
  calculation: 'average' | 'percentage' | 'sum' | 'count';
  category: 'performance' | 'engagement' | 'technical' | 'business';
}
```

## Sample Output

### ASCII Dashboard

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     PUNCH CLUB SESSION KPI DASHBOARD                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ METRIC               VALUE     TARGET    DELTA    STATUS     BAR          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Install Success Rate 85.0%     90%       -5.0%    GOOD       ████░░░░░░░  │
│ Consent Rate         100.0%    95%       +5.0%    EXCELLENT  ████████████  │
│ Cold Start Time      3000ms    3000ms    0ms      EXCELLENT  ████████████  │
│ Session Length       1.5min    15min     -13.5min WARNING    ██░░░░░░░░░░  │
│ Export Validation    100.0%    100%      0%       EXCELLENT  ████████████  │
│ Cycle Duration Target 100.0%    85%       +15.0%   EXCELLENT  ████████████  │
│ Tap Efficiency       2.5taps   3taps     -0.5taps EXCELLENT  ████████████  │
│ Assignment Latency   475ms     450ms     +25ms    GOOD       ████░░░░░░░  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### JSON Export

```json
{
  "metadata": {
    "exportedAt": "2024-01-21T10:30:00.000Z",
    "totalSessions": 25,
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-21T10:30:00.000Z"
    },
    "devices": ["iOS", "Android"],
    "testers": ["tester-1", "tester-2"]
  },
  "results": [
    {
      "metric": {
        "id": "install_success_rate",
        "name": "Install Success Rate",
        "description": "Percentage of successful PWA installations",
        "unit": "%",
        "target": 90,
        "threshold": 85,
        "calculation": "percentage",
        "category": "business"
      },
      "value": 85.0,
      "target": 90,
      "delta": -5.0,
      "status": "good",
      "samples": 25
    }
  ]
}
```

## KPI Calculations

### Percentage Metrics

- **Install Success Rate**: `(sessions with successful install / total sessions) × 100`
- **Consent Rate**: `(sessions with consent tag / total sessions) × 100`
- **Export Validation Rate**: `(sessions with valid export / total sessions) × 100`
- **Cycle Duration Target**: `(sessions meeting cycle target / total sessions) × 100`

### Average Metrics

- **Cold Start Time**: Average cold start time across sessions
- **Session Length**: Average session duration in minutes
- **Tap Efficiency**: Average taps per assignment
- **Assignment Latency**: Average time to complete assignments

### Status Classification

| Status | Condition (Higher is Better) | Condition (Lower is Better) |
|--------|------------------------------|------------------------------|
| **Excellent** | `value ≥ target` | `value ≤ target` |
| **Good** | `target > value ≥ threshold` | `target < value ≤ threshold` |
| **Warning** | `threshold > value ≥ threshold × 0.8` | `threshold < value ≤ threshold × 1.2` |
| **Critical** | `value < threshold × 0.8` | `value > threshold × 1.2` |

## Telemetry

The CLI automatically emits telemetry events for each export format:

```typescript
{
  eventType: 'pc_session_kpi_exported',
  data: {
    sessionId: 'dashboard-1642771200000',
    exportFormat: 'json',
    kpiCount: 8,
    totalSessions: 25,
    avgKpiScore: 0.95,
    targetAchievement: 87.5,
    timestamp: 1642771200000,
    config: {
      metrics: [...],
      aggregation: {...}
    }
  }
}
```

## Data Sources

The CLI reads session data from `data/runs/mobile_playtests/` directory, which contains JSON files generated by `mobilePlaytestLogger.ts`.

### Required Session Data Structure

```typescript
interface MobilePlaytestLog {
  version: string;
  sessionId: string;
  sessionTag?: string;
  tester: string;
  device: string;
  cycleDurationMs: number[];
  tapsPerAssignment: number[];
  assignmentLatencyMs: number[];
  pickerCloseRate: number;
  resourceDelta: { gold: number; food: number };
  qualitativeNotes: string;
  createdAt: string;
  derivedMetrics: {
    avgCycleDurationMs: number;
    avgTapsPerAssignment: number;
    avgAssignmentLatencyMs: number;
    meetsCycleTarget: boolean;
    meetsTapTarget: boolean;
    meetsLatencyTarget: boolean;
    meetsPickerTarget: boolean;
    meetsResourceTarget: boolean;
  };
  // Optional PWA metrics
  pwaMetrics?: {
    installSuccess?: boolean;
    coldStartMs?: number;
    exportValidationPassed?: boolean;
    updateAvailable?: boolean;
  };
}
```

## Integration with PC-M3

The dashboard is designed to work with PC-M3 telemetry structure:

- **Session Tagging**: Uses `sessionTag` for consent tracking
- **PWA Metrics**: Reads `pwaMetrics` for install and performance data
- **Export Validation**: Validates telemetry export compliance

## Development

### Running Tests

```bash
# Run unit tests
npm run test -- tests/unit/punchClub/SessionKPIDashboard.test.ts

# Run with coverage
npm run test -- tests/unit/punchClub/SessionKPIDashboard.test.ts --coverage
```

### Adding New KPIs

1. Define the KPI metric in `sessionKPIConfig.ts`
2. Add calculation logic in `sessionKPIDashboard.ts`
3. Add corresponding tests
4. Update documentation

Example:

```typescript
// Add to DEFAULT_KPI_METRICS
{
  id: 'new_metric',
  name: 'New Metric',
  description: 'Description of new metric',
  unit: 'count',
  target: 100,
  threshold: 80,
  calculation: 'average',
  category: 'engagement',
}
```

## Troubleshooting

### Common Issues

1. **No Session Data Found**
   - Ensure `mobilePlaytestLogger` has generated session files
   - Check `data/runs/mobile_playtests/` directory exists
   - Verify session files have correct JSON structure

2. **Invalid Configuration**
   - Validate configuration against schema
   - Check all required fields are present
   - Ensure metric IDs are unique

3. **Export Failures**
   - Verify output directory permissions
   - Check disk space availability
   - Ensure filename is valid

### Debug Mode

Run with additional logging:

```bash
DEBUG=session-kpi-dashboard npm run session-kpi-dashboard
```

## Performance Considerations

- **Memory Usage**: CLI loads all session data into memory
- **Processing Time**: Scales linearly with number of sessions
- **File I/O**: Concurrent reads from multiple session files

For large datasets (>1000 sessions), consider:
- Using session filtering to reduce data size
- Processing in batches
- Increasing Node.js memory limit

## Security

- No external API calls
- No database connections
- Local file system access only
- Input validation with Zod schemas
- No sensitive data in logs

## License

Part of the RPG Balancer project. See project license for details.
