# Drop Feedback Heatmap

## Overview

Interactive heatmap visualization for analyzing drop feedback telemetry across Idle Village Phase E slots. Provides density analysis, hotspot identification, and export capabilities for JSON/Markdown reports.

## Architecture

### Components

1. **DropFeedbackHeatmap.tsx** - Main React component with interactive UI
2. **useDropFeedbackHeatmap.ts** - Hook for data aggregation and management
3. **dropFeedbackHeatmapConfig.ts** - Config-first color gradients and display options

### Data Flow

```
dropFeedbackTelemetry events
         ↓
   PersistenceService (sessionStorage)
         ↓
   useDropFeedbackHeatmap hook
         ↓
   Aggregation by slot + filters
         ↓
   DropFeedbackHeatmap UI
         ↓
   Export (JSON/Markdown)
```

## Configuration

### Heatmap Config Structure

```typescript
interface DropFeedbackHeatmapConfig {
  gradients: {
    valid: HeatmapGradientConfig;
    invalid: HeatmapGradientConfig;
    warning: HeatmapGradientConfig;
    blocked: HeatmapGradientConfig;
    combined: HeatmapGradientConfig;
  };
  buckets: HeatmapBucketConfig[];
  display: {
    showValues: boolean;
    showLegend: boolean;
    cellSize: number;
    cellGap: number;
    borderRadius: number;
    fontSize: number;
  };
  export: {
    includeASCII: boolean;
    exportDir: string;
  };
}
```

### Style Laboratory Colors

All gradients use Style Laboratory color tokens:

- **Valid**: green-100 → green-600
- **Invalid**: red-100 → red-600
- **Warning**: amber-100 → amber-600
- **Blocked**: slate-100 → slate-600
- **Combined**: gray-100 → gray-800

### Bucket Thresholds

| Bucket | Range | Label | Color |
|--------|-------|-------|-------|
| 1 | 0-1 | None | gray-100 |
| 2 | 1-5 | Low | green-200 |
| 3 | 5-20 | Medium | amber-400 |
| 4 | 20-50 | High | red-400 |
| 5 | 50+ | Critical | red-600 |

## Usage

### Basic Implementation

```typescript
import { DropFeedbackHeatmap } from '@/ui/idleVillage/analytics/DropFeedbackHeatmap';

function AnalyticsPage() {
  return (
    <DropFeedbackHeatmap
      onViewed={() => console.log('Heatmap viewed')}
      onExport={(format) => console.log(`Exported as ${format}`)}
    />
  );
}
```

### With Custom Config

```typescript
const customConfig = {
  display: {
    cellSize: 80,
    showValues: true,
    showLegend: true,
  },
};

<DropFeedbackHeatmap config={customConfig} />
```

### With Filters

```typescript
const filters = {
  feedbackTypes: ['invalid', 'warning'],
  dateRange: {
    start: Date.now() - 86400000, // Last 24 hours
    end: Date.now(),
  },
  minEventCount: 5,
};

<DropFeedbackHeatmap initialFilters={filters} />
```

## Hook API

### useDropFeedbackHeatmap

```typescript
const {
  dataset,           // Aggregated heatmap data
  loading,           // Loading state
  error,             // Error state
  addEvent,          // Add telemetry event
  clearEvents,       // Clear all events
  refreshData,       // Reload from storage
  exportJSON,        // Export to JSON string
  exportMarkdown,    // Export to Markdown string
} = useDropFeedbackHeatmap(filters);
```

### Dataset Structure

```typescript
interface HeatmapDataset {
  slots: Map<string, SlotFeedbackData>;
  stats: {
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    warningEvents: number;
    blockedEvents: number;
    uniqueSlots: number;
    dateRange: { start: number; end: number };
  };
  hotspots: Array<{
    slotId: string;
    invalidCount: number;
    percentage: number;
  }>;
}
```

## Features

### Interactive Heatmap

- **Color-coded cells** based on feedback density
- **Hover tooltips** with detailed breakdown
- **Click interactions** for drill-down analysis
- **Responsive grid** layout with configurable cell size

### Filtering System

- **Feedback type filter**: valid, invalid, warning, blocked, combined
- **Date range filter**: filter events by timestamp
- **Slot ID filter**: focus on specific slots
- **Minimum count filter**: hide low-activity slots

### Statistics Dashboard

Real-time statistics display:
- Total events count
- Breakdown by feedback type
- Unique slots count
- Date range coverage

### Hotspot Analysis

Automatically identifies top 10 invalid feedback hotspots:
- Ranked by invalid event count
- Percentage of total invalid events
- Sortable table view

### Export Capabilities

#### JSON Export

```json
{
  "metadata": {
    "exportTimestamp": 1706097600000,
    "filters": {}
  },
  "stats": {
    "totalEvents": 150,
    "validEvents": 80,
    "invalidEvents": 50,
    "warningEvents": 15,
    "blockedEvents": 5
  },
  "slots": [...],
  "hotspots": [...]
}
```

#### Markdown Export

```markdown
# Drop Feedback Heatmap Report

**Generated**: 2026-01-24T12:00:00.000Z

## Statistics

- **Total Events**: 150
- **Valid**: 80 (53.3%)
- **Invalid**: 50 (33.3%)
- **Warning**: 15 (10.0%)
- **Blocked**: 5 (3.3%)

## Top Invalid Hotspots

| Rank | Slot ID | Invalid Count | Percentage |
| --- | --- | --- | --- |
| 1 | forest-work | 25 | 50.0% |
| 2 | mining | 15 | 30.0% |
```

## Telemetry

### Events Emitted

#### iv_drop_heatmap_viewed

Emitted when heatmap is rendered with data:

```typescript
{
  eventType: 'iv_drop_heatmap_viewed',
  data: {
    totalEvents: 150,
    uniqueSlots: 12,
    filters: {...},
    timestamp: 1706097600000
  }
}
```

#### iv_drop_heatmap_exported

Emitted when data is exported:

```typescript
{
  eventType: 'iv_drop_heatmap_exported',
  data: {
    format: 'json' | 'markdown',
    timestamp: 1706097600000
  }
}
```

## ASCII Representation

The heatmap can generate ASCII representations for CLI reports:

```
    Forest  Mining  Cooking Quest
Slot1  ███     ▓▓▓     ░░░     ▒▒▒
Slot2  ▓▓▓     ███     ▒▒▒     ░░░
Slot3  ░░░     ▒▒▒     ███     ▓▓▓
```

Legend:
- `█` = High density (75-100%)
- `▓` = Medium-high (50-75%)
- `▒` = Medium-low (25-50%)
- `░` = Low (0-25%)
- ` ` = No events

## Integration with Theater Mini-Cards

The heatmap dataset can be integrated with Theater mini-cards to show feedback density indicators:

```typescript
import { useDropFeedbackHeatmap } from '@/ui/idleVillage/hooks/useDropFeedbackHeatmap';

function TheaterMiniCard({ activityId }) {
  const { dataset } = useDropFeedbackHeatmap();
  const slotData = dataset.slots.get(activityId);
  
  const feedbackIndicator = slotData ? (
    <div className="feedback-indicator">
      {slotData.invalidCount > 10 && <WarningIcon />}
      <span>{slotData.totalCount} events</span>
    </div>
  ) : null;
  
  return (
    <div className="theater-mini-card">
      {/* Card content */}
      {feedbackIndicator}
    </div>
  );
}
```

## Performance Considerations

### Data Aggregation

- Uses `useMemo` for expensive calculations
- Filters applied before aggregation
- Map-based storage for O(1) slot lookups

### Memory Management

- Events stored in sessionStorage (cleared on tab close)
- Configurable event retention limits
- Automatic cleanup of old events

### Rendering Optimization

- Virtual scrolling for large datasets
- Memoized cell rendering
- Debounced filter updates

## Testing

### Unit Tests

```bash
npm run test -- tests/unit/idleVillage/DropFeedbackHeatmap.test.tsx
```

Test coverage includes:
- Hook initialization and data loading
- Event aggregation by slot
- Feedback type counting
- Validation rule tracking
- Filtering (type, date, slot, count)
- Hotspot identification
- Export functionality (JSON, Markdown)
- Component rendering
- User interactions

### Integration Testing

The heatmap integrates with:
- `dropFeedbackTelemetry.ts` for event emission
- `sandboxDiagnostics` for telemetry logging
- Phase E map config for slot definitions

## KPIs

### Top Invalid Hotspots

Primary KPI: Identify slots with highest invalid feedback rates

**Target**: < 10% invalid rate per slot
**Alert**: > 25% invalid rate indicates UX issue

### Feedback Distribution

Monitor balance across feedback types:
- **Valid**: 60-80% (healthy)
- **Invalid**: < 15% (acceptable)
- **Warning**: 5-10% (informative)
- **Blocked**: < 5% (edge cases)

### Slot Coverage

Track unique slots receiving feedback:
- **Target**: 100% of active slots
- **Alert**: < 80% coverage indicates missing instrumentation

## Troubleshooting

### No Data Displayed

**Cause**: No telemetry events recorded

**Solution**:
1. Verify `dropFeedbackTelemetry` is emitting events
2. Check sessionStorage for `iv_drop_feedback_events`
3. Ensure Phase E drop feedback is active

### Incorrect Aggregation

**Cause**: Events missing `activityId`

**Solution**:
1. Verify telemetry payload includes `activityId`
2. Check for 'unknown' slot in dataset
3. Update event emission to include slot identifier

### Export Not Working

**Cause**: Browser blocking file downloads

**Solution**:
1. Check browser console for errors
2. Verify blob creation and URL generation
3. Ensure user interaction triggered export

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Historical trend analysis
- [ ] Comparative heatmaps (before/after)
- [ ] Drill-down to individual events
- [ ] Custom color schemes
- [ ] PDF export with charts
- [ ] Integration with analytics dashboard
- [ ] Automated anomaly detection
- [ ] Slack/Discord notifications for hotspots

## References

- **Telemetry**: `src/ui/idleVillage/utils/dropFeedbackTelemetry.ts`
- **Phase E Plan**: `docs/plans/idle_village_plan.md`
- **Style Laboratory**: `src/styles/color-palette.css`
- **Config Pattern**: `docs/philosophy.md`
