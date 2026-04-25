# Safeguard Monitoring

## Overview

The Global Safeguard Monitor Dashboard provides centralized visibility into safeguard suite execution across all prompts. It aggregates evidence logs from NP-099 Evidence Log Harvester and presents comprehensive status tracking with filtering, alerts, and export capabilities.

## Architecture

### Components

1. **Evidence Log Harvester (NP-099)** - Scans and parses evidence logs
2. **Safeguard Monitor Script** - Aggregates and processes evidence data
3. **Dashboard UI** - React component with filters and visualizations
4. **React Hook** - Data management and state handling

### Data Flow

```
test-results/ → Evidence Log Harvester → Safeguard Monitor Script → JSON/CSV → Dashboard UI
```

## Usage

### CLI Script

```bash
# Run safeguard monitoring
tsx scripts/coordinator/safeguardMonitor.ts run

# With custom options
tsx scripts/coordinator/safeguardMonitor.ts run \
  --dirs ./test-results,./logs \
  --prompts NP-099,KS-081 \
  --format both \
  --output ./reports/safeguard

# Validate evidence logs
tsx scripts/coordinator/safeguardMonitor.ts validate
```

### React Dashboard

```tsx
import { SafeguardMonitorDashboard } from '@/ui/tools/coordinator/SafeguardMonitorDashboard';
import { useSafeguardMonitor } from '@/ui/tools/coordinator/hooks/useSafeguardMonitor';

function SafeguardPage() {
  const { data, loading, error, runMonitor } = useSafeguardMonitor();

  return (
    <SafeguardMonitorDashboard
      initialData={data}
      onRefresh={runMonitor}
      autoRefreshInterval={30000}
    />
  );
}
```

## Configuration

### Safeguard Monitor Config

```typescript
interface SafeguardMonitorConfig {
  evidenceDirs: string[];              // Directories to scan
  promptIds?: string[];                // Filter by prompt IDs
  dateRange?: { start: Date; end: Date }; // Date filtering
  severityThresholds: {
    warning: number;                    // Warning threshold (0-100)
    critical: number;                   // Critical threshold (0-100)
  };
  outputFormat: 'json' | 'csv' | 'both'; // Export format
  outputPath?: string;                  // Custom output path
}
```

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  evidenceDirs: ['./test-results', './src/test-results', './logs'],
  severityThresholds: { warning: 30, critical: 70 },
  outputFormat: 'both',
  outputPath: './test-results/safeguard-monitor-report',
};
```

## Data Schema

### Safeguard Report

```typescript
interface SafeguardReport {
  generatedAt: number;
  version: string;
  summary: {
    totalPrompts: number;
    passed: number;
    failed: number;
    warnings: number;
    unknown: number;
    averageSeverity: number;
    worstSeverity: number;
  };
  results: SafeguardCheckResult[];
  globalIssues: string[];
  period: { start: number; end: number };
}
```

### Check Result

```typescript
interface SafeguardCheckResult {
  promptId: string;
  title: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  checks: {
    lint: CheckStatus;
    test: CheckStatus;
    build: CheckStatus;
    kanban: CheckStatus;
  };
  lastEvidence: number;
  evidencePath: string;
  severity: number;        // 0-100, higher = worse
  issues: string[];
  metadata: Record<string, unknown>;
}
```

### Individual Check Status

```typescript
interface CheckStatus {
  status: 'pass' | 'fail' | 'warning' | 'skip' | 'unknown';
  duration?: number;      // Execution time in ms
  error?: string;         // Error message if failed
  issues?: number;       // Number of issues found
  timestamp: number;     // Check timestamp
}
```

## Severity Calculation

Severity scores are calculated as follows:

- **Fail**: +25 points per failed check
- **Warning**: +10 points per warning
- **Unknown**: +5 points per unknown status
- **Long Duration**: +5 points for checks >5 seconds

Maximum severity is 100.

## Evidence Log Format

The system expects evidence logs following this pattern:

```
<safeguard-log-name>-<date>.log
```

Example content:
```
=== Lint Check ===
SUCCESS: No lint issues found
Duration: 1234ms

=== Test Check ===
FAILED: 2 tests failed
Duration: 5678ms

=== Build Check ===
SUCCESS: Build completed
Duration: 2345ms

=== Kanban Check ===
WARNING: 3 tasks overdue
Duration: 890ms
```

## Dashboard Features

### Filtering

- **Status Filter**: Show only specific statuses (pass/fail/warning/unknown)
- **Prompt ID Filter**: Search by prompt identifier
- **Date Range Filter**: Filter by evidence timestamp (today/week/month/all)

### Visualizations

- Summary cards with key metrics
- Severity progress bars
- Status badges with icons
- Detailed check breakdowns
- Issue lists with alerts

### Export

- **CSV Export**: Full report in CSV format for retrospectives
- **JSON Export**: Machine-readable format for integrations

### Telemetry

The dashboard tracks user interactions:

```typescript
// Events fired
safeguard_monitor_viewed     // Dashboard viewed
safeguard_monitor_refreshed  // Manual refresh
safeguard_monitor_exported   // Data export
```

## Safeguard Suite Integration

The monitor integrates with the standard safeguard suite:

```bash
# Run full safeguard suite
npm run lint
npm run test
npm run build:check
npm run kanban:lint

# Then run monitor
tsx scripts/coordinator/safeguardMonitor.ts run
```

## File Structure

```
scripts/coordinator/
├── safeguardMonitor.ts              # Main script
└── evidenceLogHarvester.ts          # Evidence harvesting

src/ui/tools/coordinator/
├── SafeguardMonitorDashboard.tsx    # React dashboard
└── hooks/
    └── useSafeguardMonitor.ts       # React hook

tests/unit/coordinator/
└── SafeguardMonitorDashboard.test.tsx  # Tests

docs/coordinator/
└── safeguard_monitoring.md         # This documentation
```

## Troubleshooting

### Common Issues

1. **No evidence logs found**
   - Check evidence directories in config
   - Verify log naming convention
   - Run evidence harvester validation

2. **High severity scores**
   - Review failed checks in detail
   - Check for long-running operations
   - Verify evidence log format

3. **Missing data in dashboard**
   - Confirm JSON output file exists
   - Check file permissions
   - Verify evidence log parsing

### Debug Commands

```bash
# Validate evidence logs
tsx scripts/coordinator/safeguardMonitor.ts validate --verbose

# Check specific prompts
tsx scripts/coordinator/safeguardMonitor.ts run --prompts NP-099,KS-081

# Export specific format
tsx scripts/coordinator/safeguardMonitor.ts run --format csv --output debug
```

## Performance Considerations

- Evidence harvesting processes up to 1000 files by default
- Large files (>10MB) are automatically filtered
- Dashboard auto-refresh can be disabled for performance
- CSV export is optimized for large datasets

## Security

- No file writing outside configured directories
- Evidence logs are read-only
- Output files are created in designated locations
- No external API calls or network access

## Future Enhancements

- Real-time evidence log monitoring
- Integration with CI/CD pipelines
- Historical trend analysis
- Alert notifications for failures
- Custom severity rules
- Multi-tenant support
