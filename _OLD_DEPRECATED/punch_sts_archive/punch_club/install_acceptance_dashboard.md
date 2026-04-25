# Punch Club Install Acceptance Dashboard

## Overview
Config-first dashboard for aggregating install prompt acceptance rates by device, region, and failure reason with ASCII heatmap visualization.

## Features
- **Segmented Analysis**: By device type and region
- **KPI Tracking**: Acceptance rate, success rate, total installs
- **ASCII Heatmap**: Visual representation of acceptance rates
- **Failure Analysis**: Top failure codes and distribution
- **Multi-Format Export**: JSON and Markdown outputs
- **Telemetry Integration**: `pc_install_dashboard_generated` events

## CLI Usage

### Basic Usage
```bash
npm run pc:install-dashboard
```

### Options
```bash
npm run pc:install-dashboard -- [options]

Options:
  --window <hours>       Time window in hours (default: 24)
  --segment <type>       Segmentation: device|region|both|none (default: both)
  --out <path>          Output path prefix
  --format <format>      Output format: json|md|both (default: both)
  --input <path>        Input JSON file with events
  --help, -h            Show help message
```

### Examples

**7-day window with device segmentation:**
```bash
npm run pc:install-dashboard -- --window 168 --segment device
```

**Custom output path:**
```bash
npm run pc:install-dashboard -- --out reports/install-2026-01 --format md
```

**Use custom input data:**
```bash
npm run pc:install-dashboard -- --input data/install-events.json
```

## ASCII Heatmap Example

```
Install Acceptance Rate Heatmap
================================================

          US      EU      APAC    LATAM   
------------------------------------------------
iOS       🟢 72%  🟢 70%  🟡 65%  🟡 62%  
Android   🟡 61%  🟡 58%  🟡 55%  🔴 48%  
Desktop   🟡 52%  🟡 50%  🔴 45%  🔴 42%  

Legend: 🟢 ≥70%  🟡 40-70%  🔴 <40%  ⚪ No data
```

## KPI Metrics

### Overall Metrics
- **Acceptance Rate**: Percentage of prompts accepted
- **Success Rate**: Percentage of accepted prompts that install successfully
- **Total Prompts**: Number of install prompts shown
- **Total Installs**: Number of successful installations

### Segment Metrics
- **Top Device**: Device with highest acceptance rate
- **Top Region**: Region with highest acceptance rate
- **Top Failure Code**: Most common installation failure

### Per-Segment Details
- Prompts shown/accepted/dismissed
- Install attempts/successes/failures
- Failure code distribution

## Programmatic Usage

```typescript
import { InstallAcceptanceDashboard } from '@/analytics/punchClub/InstallAcceptanceDashboard';

const dashboard = new InstallAcceptanceDashboard({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  segmentByDevice: true,
  segmentByRegion: true,
  minSampleSize: 10,
});

const events = [
  {
    type: 'prompt_shown',
    timestamp: Date.now(),
    device: 'iOS',
    region: 'US',
    sessionId: 'session-1',
  },
  // ... more events
];

const output = dashboard.analyze(events);

console.log(`Acceptance Rate: ${(output.kpi.overallAcceptanceRate * 100).toFixed(1)}%`);
console.log(output.heatmap);

// Export
const json = dashboard.exportJSON(output);
const markdown = dashboard.exportMarkdown(output);
```

## Event Schema

### Install Events
```typescript
{
  type: 'prompt_shown' | 'prompt_accepted' | 'prompt_dismissed' | 'install_success' | 'install_failed',
  timestamp: number,
  device: string,
  region: string,
  sessionId: string,
  failureCode?: string, // For install_failed events
}
```

### Common Failure Codes
- `NETWORK_ERROR`: Network connectivity issues
- `STORAGE_FULL`: Insufficient storage space
- `PERMISSION_DENIED`: User denied required permissions
- `UNKNOWN`: Unspecified error

## Configuration

### Dashboard Config
```typescript
{
  windowMs: number,              // Time window in milliseconds
  segmentByDevice: boolean,      // Enable device segmentation
  segmentByRegion: boolean,      // Enable region segmentation
  minSampleSize: number,         // Minimum prompts for segment inclusion
  colorPalette: {
    high: string,                // Icon for ≥70% (default: 🟢)
    medium: string,              // Icon for 40-70% (default: 🟡)
    low: string,                 // Icon for <40% (default: 🔴)
    noData: string,              // Icon for no data (default: ⚪)
  },
}
```

## Output Formats

### JSON Output
Complete structured data with all metrics, segments, and configuration.

### Markdown Output
Human-readable report with:
- KPI summary table
- ASCII heatmap
- Detailed segment breakdown table

## Telemetry

**Event**: `pc_install_dashboard_generated`

**Payload**:
```typescript
{
  timestamp: number,
  overallAcceptanceRate: number,
  overallSuccessRate: number,
  totalPromptsShown: number,
  segmentCount: number,
}
```

## Best Practices

1. **Sample Size**: Use at least 10 prompts per segment for reliable metrics
2. **Time Window**: 24-hour window for daily reports, 7-day for weekly trends
3. **Segmentation**: Use "both" for detailed analysis, "device" or "region" for focused insights
4. **Failure Analysis**: Monitor top failure codes to identify systemic issues
5. **Regional Differences**: Compare regions to optimize localization strategies

## Integration with NP-138

The dashboard uses the harness log structure from NP-138 for event tracking:
- Event timestamps align with harness log format
- Session IDs match harness session tracking
- Failure codes follow harness error taxonomy

## Performance

- **Analysis Time**: <100ms for 10,000 events
- **Memory Usage**: <10MB for typical datasets
- **Export Time**: <10ms for JSON/Markdown generation
