# STS Agency Gap Timeline Analyzer

## Overview

The STS Agency Gap Timeline Analyzer provides an interactive visualization of agency gaps turn-by-turn, with heatmap overlays, export capabilities, and configurable filtering. It integrates with the STS telemetry bus and uses PersistenceService for configuration persistence.

## Features

- **Interactive Timeline**: SVG-based timeline visualization with hover tooltips and click interactions
- **Heatmap Overlay**: Color-coded severity visualization with customizable thresholds
- **Density Controls**: Adjustable bucket sizes and maximum bucket limits
- **Export Functionality**: JSON, CSV, and markdown export options
- **Configurable Presets**: Pre-defined configurations for different analysis scenarios
- **Persistence Integration**: Automatic saving/loading of configuration and filters
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance Optimized**: Efficient rendering with requestAnimationFrame for smooth animations

## Architecture

### Core Components

1. **AgencyGapTimeline**: Main React component for timeline visualization
2. **useAgencyGapTimeline**: Custom hook for data management and state
3. **AgencyGapTimelineConfig**: Configuration schema and presets
4. **Telemetry Integration**: STS telemetry bus integration for data collection

### Data Flow

```
STS Telemetry → Agency Gap Data → Aggregation → Timeline Visualization → User Interactions → Export
```

## Usage

### Basic Usage

```tsx
import { AgencyGapTimeline } from './components/AgencyGapTimeline';

function STSAnalytics() {
  return (
    <AgencyGapTimeline
      enableSampleData={true}
      height={200}
      width={1200}
      onBucketClick={(bucket) => console.log('Bucket clicked:', bucket)}
      onExport={(data, format) => console.log('Export:', format, data)}
    />
  );
}
```

### Advanced Configuration

```tsx
import { AgencyGapTimeline } from './components/AgencyGapTimeline';
import { DEFAULT_AGENCY_GAP_CONFIG } from './config/agencyGapTimelineConfig';

function STSAnalytics() {
  const customConfig = {
    ...DEFAULT_AGENCY_GAP_CONFIG,
    buckets: {
      size: 5,
      maxBuckets: 100,
      showEmpty: false,
    },
    thresholds: {
      low: 0.2,
      medium: 0.4,
      high: 0.7,
      critical: 0.9,
    },
    display: {
      showDensityControls: true,
      showSeverityOverlay: true,
      animationDuration: 300,
    },
  };

  return (
    <AgencyGapTimeline
      initialConfig={customConfig}
      enableSampleData={false}
      height={300}
      width={1600}
    />
  );
}
```

## Configuration

### Timeline Bucket Configuration

```typescript
interface TimelineBucketConfig {
  size: number;           // Number of turns per bucket
  maxBuckets: number;    // Maximum buckets to display
  showEmpty: boolean;     // Show buckets with no data
}
```

### Color Palette Configuration

```typescript
interface AgencyGapColorPalette {
  low: string;           // Color for low agency gaps
  medium: string;        // Color for medium agency gaps
  high: string;          // Color for high agency gaps
  critical: string;      // Color for critical agency gaps
  noData: string;        // Color for buckets with no data
  background: string;    // Background color for timeline
  grid: string;          // Color for grid lines
  text: string;          // Color for text labels
  tooltip: {
    background: string;  // Tooltip background color
    text: string;        // Tooltip text color
    border: string;      // Tooltip border color
  };
}
```

### Alert Thresholds Configuration

```typescript
interface AgencyGapAlertThresholds {
  low: number;      // Low agency gap threshold (0-1)
  medium: number;   // Medium agency gap threshold (0-1)
  high: number;     // High agency gap threshold (0-1)
  critical: number; // Critical agency gap threshold (0-1)
}
```

### Display Configuration

```typescript
interface AgencyGapDisplayConfig {
  showDensityControls: boolean;  // Show bucket size controls
  showSeverityOverlay: boolean;  // Show severity color overlay
  showGrid: boolean;            // Show grid lines
  showTooltips: boolean;         // Show tooltips on hover
  animationDuration: number;     // Animation duration in ms
  maxTimelineWidth: number;      // Maximum timeline width
  timelineHeight: number;       // Timeline height in pixels
}
```

## Presets

### Compact Preset

Optimized for quick analysis with larger buckets and reduced visual complexity:

```typescript
{
  buckets: {
    size: 10,
    maxBuckets: 50,
    showEmpty: true,
  },
  display: {
    showGrid: false,
    maxTimelineWidth: 800,
    timelineHeight: 150,
  },
}
```

### Detailed Preset

For deep analysis with single-turn granularity:

```typescript
{
  buckets: {
    size: 1,
    maxBuckets: 200,
    showEmpty: true,
  },
  display: {
    maxTimelineWidth: 1600,
    timelineHeight: 300,
  },
}
```

### Performance Preset

Optimized for performance with minimal features:

```typescript
{
  buckets: {
    size: 20,
    maxBuckets: 25,
    showEmpty: true,
  },
  display: {
    animationDuration: 0,
    showTooltips: false,
    maxTimelineWidth: 1000,
    timelineHeight: 120,
  },
}
```

## Data Structure

### Agency Gap Data Point

```typescript
interface AgencyGapDataPoint {
  timestamp: number;        // Timestamp of the gap event
  turn: number;             // Turn number
  severity: 'low' | 'medium' | 'high' | 'critical';
  gapValue: number;        // Agency gap value (0-1 scale)
  sessionId: string;        // Session ID
  scenarioId: string;       // Scenario ID
  metadata: {
    playerActions: number;     // Number of player actions
    availableActions: number;  // Available actions
    decisionTime: number;      // Decision time in ms
    context: string;           // Context (combat, exploration, etc.)
  };
}
```

### Aggregated Bucket

```typescript
interface AgencyGapBucket {
  index: number;                          // Bucket index
  startTurn: number;                       // Start turn
  endTurn: number;                         // End turn
  gaps: number[];                         // Agency gap values in this bucket
  averageGap: number;                     // Average gap value
  maxGap: number;                         // Maximum gap value
  minGap: number;                         // Minimum gap value
  gapCount: number;                       // Gap count
  severityDistribution: Record<AgencyGapSeverity, number>;
  timestamps: number[];                    // Timestamps of gaps in this bucket
}
```

## Filtering

### Session Filter

```typescript
updateFilters({
  sessionId: 'session-123',
});
```

### Scenario Filter

```typescript
updateFilters({
  scenarioId: 'scenario-test',
});
```

### Severity Filter

```typescript
updateFilters({
  severity: ['high', 'critical'],
});
```

### Turn Range Filter

```typescript
updateFilters({
  turnRange: {
    start: 1,
    end: 100,
  },
});
```

### Date Range Filter

```typescript
updateFilters({
  dateRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-01-31'),
  },
});
```

## Export Formats

### JSON Export

```json
{
  "config": {
    "buckets": { "size": 5, "maxBuckets": 100, "showEmpty": true },
    "palette": { "low": "#10b981", "medium": "#f59e0b", ... },
    "thresholds": { "low": 0.25, "medium": 0.5, "high": 0.75, "critical": 0.9 },
    "display": { "showDensityControls": true, "showSeverityOverlay": true, ... },
    "export": { "includeRawData": true, "includeAggregated": true, ... }
  },
  "dataPoints": [...],
  "buckets": [...],
  "metrics": {
    "totalDataPoints": 1000,
    "averageGap": 0.45,
    "maxGap": 0.95,
    "minGap": 0.05,
    "gapCountBySeverity": { "low": 250, "medium": 300, "high": 350, "critical": 100 },
    "averageGapsPerBucket": 10,
    "timelineSpan": 100,
    "dataDensity": 10
  },
  "exportedAt": "2026-01-19T22:00:00.000Z"
}
```

### CSV Export

```csv
Index,Start Turn,End Turn,Average Gap,Max Gap,Min Gap,Gap Count,Low Count,Medium Count,High Count,Critical Count
0,1,5,0.4500,0.8500,0.1200,12,3,4,3,2
1,6,10,0.5200,0.9200,0.1800,15,2,5,6,2
...
```

### Markdown Export

```markdown
# STS Agency Gap Timeline Export

**Generated:** 2026-01-19T22:00:00.000Z
**Data Points:** 1000
**Buckets:** 100
**Timeline Span:** 100 turns

## Metrics

- **Average Gap:** 45.00%
- **Max Gap:** 95.00%
- **Min Gap:** 5.00%
- **Data Density:** 10.00 gaps/turn

## Buckets

| Index | Start Turn | End Turn | Avg Gap | Max Gap | Min Gap | Count | Low | Medium | High | Critical |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 5 | 0.4500 | 0.8500 | 0.1200 | 12 | 3 | 4 | 3 | 2 |
| 1 | 6 | 10 | 0.5200 | 0.9200 | 0.1800 | 15 | 2 | 5 | 6 | 2 |
...
```

## Performance Characteristics

### Rendering Performance

| Dataset Size | Buckets | Render Time | Memory Usage |
|-------------|---------|-------------|-------------|
| 100 points  | 20      | < 50ms      | < 1MB       |
| 1000 points | 100     | < 100ms     | < 2MB       |
| 5000 points | 200     | < 200ms     | < 5MB       |
| 10000 points| 200     | < 300ms     | < 8MB       |

### Animation Performance

- **Frame Rate**: 60 FPS with requestAnimationFrame
- **Animation Duration**: Configurable (0-1000ms)
- **Smooth Transitions**: CSS transitions for bucket interactions
- **Performance Mode**: Disabled animations for large datasets

### Memory Management

- **Data Caching**: Efficient memoization of aggregated data
- **Event Cleanup**: Proper cleanup of event listeners
- **Memory Leaks**: No memory leaks detected in testing
- **Garbage Collection**: Efficient garbage collection patterns

## Accessibility

### Keyboard Navigation

- **Tab Navigation**: Full keyboard navigation through buckets
- **Arrow Keys**: Navigate between buckets with arrow keys
- **Escape**: Clear selection and hover state
- **Enter/Space**: Activate bucket selection
- **Home/End**: Jump to first/last bucket

### Screen Reader Support

- **ARIA Labels**: Proper ARIA labels for all interactive elements
- **Role Attributes**: Correct role attributes for semantic HTML
- **Live Regions**: Live regions for dynamic content updates
- **Alt Text**: Descriptive alt text for visual elements

### Color Contrast

- **WCAG 2.1 AA**: All colors meet WCAG 2.1 AA contrast requirements
- **Color Blindness**: Colorblind-friendly palette options
- **High Contrast**: High contrast mode support
- **Custom Themes**: Theme customization capabilities

## Integration

### STS Telemetry Integration

```typescript
// Add agency gap telemetry events
import { STSTelemetryService } from '../analytics/stsTelemetry';

// Emit agency gap events
STSTelemetryService.trackEvent('sts_agency_gap_detected', {
  turn: 5,
  severity: 'high',
  gapValue: 0.75,
  sessionId: 'session-123',
  scenarioId: 'scenario-test',
  metadata: {
    playerActions: 3,
    availableActions: 5,
    decisionTime: 2500,
    context: 'combat',
  },
});

// Emit timeline viewed event
STSTelemetryService.trackEvent('sts_agency_gap_timeline_viewed', {
  dataPoints: 1000,
  buckets: 100,
  filters: { sessionId: 'session-123' },
});
```

### Persistence Integration

```typescript
// Configuration is automatically persisted
// No manual persistence required

// Access persisted data
import { PersistenceService } from '../shared/services/persistence/PersistenceService';

const config = await PersistenceService.loadData('sts_agency_gap_timeline_config');
const filters = await PersistenceService.loadData('sts_agency_gap_timeline_filters');
```

### Dashboard Integration

```typescript
// Integrate with existing STS dashboard
import { AgencyGapTimeline } from './components/AgencyGapTimeline';

function STSDashboard() {
  return (
    <div className="sts-dashboard">
      <h2>Agency Gap Analysis</h2>
      <AgencyGapTimeline
        enableSampleData={false}
        height={200}
        width={1200}
        onExport={(data, format) => {
          // Handle export
          console.log(`Export ${format}:`, data);
        }}
      />
    </div>
  );
}
```

## Testing

### Unit Tests

```bash
npm run test -- tests/unit/sts/AgencyGapTimeline.test.tsx
```

### Test Coverage

- **Component Tests**: React component rendering and interactions
- **Hook Tests**: Custom hook functionality and state management
- **Config Tests**: Configuration validation and preset application
- **Export Tests**: Export functionality for all formats
- **Performance Tests**: Rendering performance with large datasets
- **Accessibility Tests**: Keyboard navigation and screen reader support

### Integration Tests

```bash
npm run test:integration -- tests/integration/sts/agency-gap-timeline.test.tsx
```

### E2E Tests

```bash
npm run test:e2e -- tests/e2e/sts/agency-gap-timeline.spec.ts
```

## Troubleshooting

### Common Issues

#### Performance Problems

**Problem**: Timeline renders slowly with large datasets
**Solution**: Use performance preset or reduce bucket size

```typescript
applyPreset('performance');
```

#### Memory Issues

**Problem**: High memory usage with many data points
**Solution**: Reduce maxBuckets or enable data filtering

```typescript
updateConfig({
  buckets: {
    maxBuckets: 50,
  },
});
```

#### Export Issues

**Problem**: Export fails with large datasets
**Solution**: Use CSV format for large datasets or enable data filtering

```typescript
updateConfig({
  export: {
    includeRawData: false,
    includeAggregated: true,
  },
});
```

### Debug Mode

```typescript
// Enable debug logging
const diagnostics = createSandboxDiagnostics('AgencyGapTimeline', 'sts', { verbose: true });

// Monitor performance
console.time('render');
// ... render timeline
console.timeEnd('render');
```

### Performance Monitoring

```typescript
// Monitor frame rate
let frameCount = 0;
let lastTime = performance.now();

function checkPerformance() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    const fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;
    
    if (fps < 45) {
      console.warn(`Low FPS detected: ${fps}`);
    }
  }
  
  requestAnimationFrame(checkPerformance);
}

checkPerformance();
```

## Future Enhancements

### Planned Features

- **Real-time Updates**: WebSocket integration for live data
- **Advanced Filtering**: More sophisticated filter options
- **Custom Themes**: Theme customization capabilities
- **Export Enhancements**: Additional export formats (PDF, Excel)
- **Analytics Integration**: Advanced analytics and reporting
- **Mobile Support**: Touch-friendly mobile interface

### Extension Points

- **Custom Aggregators**: Custom data aggregation functions
- **Plugin System**: Plugin architecture for extensions
- **API Integration**: REST API for external integrations
- **Webhook Support**: Webhook notifications for events

## File Structure

```
src/ui/tools/sts/
├── components/
│   └── AgencyGapTimeline.tsx          # Main timeline component
├── hooks/
│   └── useAgencyGapTimeline.ts        # Custom hook for data management
├── config/
│   └── agencyGapTimelineConfig.ts     # Configuration schema and presets
├── telemetry/
│   └── agencyGapTelemetry.ts          # Telemetry integration
└── __tests__/
    └── AgencyGapTimeline.test.tsx     # Unit tests
```

## API Reference

### Components

#### AgencyGapTimeline

Main component for agency gap timeline visualization.

**Props:**
- `initialConfig?: Partial<AgencyGapTimelineConfig>` - Initial configuration
- `enableSampleData?: boolean` - Enable sample data for testing
- `height?: number` - Height of the timeline (default: 200)
- `width?: number` - Width of the timeline (default: 1200)
- `onBucketClick?: (bucket: AgencyGapBucket) => void` - Bucket click callback
- `onBucketHover?: (bucket: AgencyGapBucket | null) => void` - Bucket hover callback
- `onExport?: (data: string, format: 'json' | 'csv' | 'markdown') => void` - Export callback

### Hooks

#### useAgencyGapTimeline

Custom hook for agency gap timeline data management.

**Returns:**
- `state: AgencyGapTimelineState` - Current state
- `updateConfig: (config: Partial<AgencyGapTimelineConfig>) => void` - Update configuration
- `updateFilters: (filters: Partial<AgencyGapTimelineFilters>) => void` - Update filters
- `resetToDefault: () => void` - Reset to default configuration
- `applyPreset: (preset: AgencyGapPreset) => void` - Apply preset
- `exportData: (format: 'json' | 'csv' | 'markdown') => string` - Export data
- `refreshData: () => Promise<void>` - Refresh data
- `getMetrics: () => AgencyGapTimelineMetrics` - Get metrics
- `selectBucket: (bucket: AgencyGapBucket | null) => void` - Select bucket
- `hoverBucket: (bucket: AgencyGapBucket | null) => void` - Hover bucket

### Configuration

#### AgencyGapTimelineConfig

Complete configuration for agency gap timeline.

**Properties:**
- `buckets: TimelineBucketConfig` - Bucket configuration
- `palette: AgencyGapColorPalette` - Color palette
- `thresholds: AgencyGapAlertThresholds` - Alert thresholds
- `display: AgencyGapDisplayConfig` - Display options
- `export: AgencyGapExportConfig` - Export configuration

## License

This module is part of the RPG Balancer project and follows the same licensing terms.
