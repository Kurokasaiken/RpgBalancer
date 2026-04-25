# FTUE Step Tracker Documentation

## Overview

The FTUE (First-Time User Experience) Step Tracker is a config-first analytics system designed to track completion rates, analyze user behavior through funnel analysis, and identify bottlenecks in the Punch Club tutorial flow.

## Features

- **Config-first Design**: All FTUE steps, criteria, and analysis parameters are configurable
- **Real-time Tracking**: Track step completion, interactions, and time spent
- **Funnel Analysis**: Calculate drop-off rates and identify bottlenecks
- **Export Capabilities**: JSON, CSV, and Markdown export with visualization data
- **Storage Integration**: Automatic persistence to localStorage
- **Performance Optimized**: Efficient handling of large datasets

## Architecture

### Configuration System

The tracker uses a comprehensive configuration system defined in `src/analytics/punchClub/config/ftueStepConfig.ts`:

```typescript
interface FTUEConfig {
  steps: FTUEStep[];
  analysis: {
    bottleneckThreshold: number;
    minSessionsForAnalysis: number;
    analysisTimeWindow: number;
    includeOptionalSteps: boolean;
    trackSkippedSteps: boolean;
  };
  export: {
    includeTimestamps: boolean;
    includeUserIds: boolean;
    includeDeviceInfo: boolean;
    formats: Array<'json' | 'csv' | 'markdown'>;
    generateVisualizations: boolean;
  };
  visualization: {
    chartTypes: Array<'funnel' | 'timeline' | 'heatmap' | 'bar'>;
    colorScheme: 'default' | 'accessible' | 'high-contrast';
    showStepDetails: boolean;
    showTimeMetrics: boolean;
  };
}
```

### Step Definition

Each FTUE step is defined with:

```typescript
interface FTUEStep {
  id: string;
  name: string;
  description: string;
  order: number;
  completionCriteria: Array<{
    type: 'viewed' | 'interaction' | 'time_spent' | 'sequence_complete' | 'custom_event';
    value: string | number | boolean;
    required: boolean;
  }>;
  estimatedDuration: number;
  isOptional: boolean;
  canSkip: boolean;
  highlightSelectors?: string[];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  metadata?: Record<string, unknown>;
}
```

## Usage

### Basic Setup

```typescript
import { FTUEStepTracker } from '@/analytics/punchClub/FTUEStepTracker';

// Create tracker with default configuration
const tracker = new FTUEStepTracker();

// Create tracker with custom configuration
const tracker = new FTUEStepTracker({
  config: {
    analysis: {
      bottleneckThreshold: 0.25,
      minSessionsForAnalysis: 20,
    },
  },
  userId: 'user-123',
  onEvent: (event) => console.log('FTUE Event:', event),
});
```

### Session Management

```typescript
// Start a new FTUE session
const sessionId = tracker.startSession('user-123');

// Start a specific step
tracker.startStep('welcome');

// Record interactions
tracker.recordInteraction('welcome', 'tooltip-click', {
  element: 'welcome-tooltip',
  position: 'center',
});

// Complete a step with criteria validation
const completed = tracker.completeStep('welcome', {
  viewed: true,
  timeSpent: 8000, // milliseconds
});

// Skip a step (if allowed)
tracker.skipStep('welcome', 'user-clicked-skip');

// Complete the entire FTUE
tracker.completeSession();

// Abandon the session
tracker.abandonSession('user-exited-early');
```

### Funnel Analysis

```typescript
// Perform funnel analysis
const analysis = tracker.analyzeFunnel();

console.log('Overall completion rate:', analysis.statistics.overallCompletionRate);
console.log('Bottleneck steps:', analysis.statistics.bottleneckSteps);
console.log('Biggest drop-off:', analysis.dropOffAnalysis.biggestDropOffStep);

// Get step-specific results
const welcomeResults = analysis.results.find(r => r.stepId === 'welcome');
console.log('Welcome step completion rate:', welcomeResults?.completionRate);
console.log('Average time on welcome step:', welcomeResults?.averageTimeSpent);
```

### Data Export

```typescript
// Export as JSON
const jsonData = tracker.exportData('json');
console.log(JSON.parse(jsonData));

// Export as CSV
const csvData = tracker.exportData('csv');
console.log(csvData);

// Export as Markdown report
const markdownData = tracker.exportData('markdown');
console.log(markdownData);
```

## Default FTUE Steps

The tracker comes with 8 predefined FTUE steps for Punch Club:

1. **Welcome** - Introduction to Punch Club Light
2. **Gym Shift** - Learn about day phase and worker assignment
3. **Worker Assignment** - Learn how to assign workers
4. **Rest Phase** - Learn about evening phase and fatigue
5. **Underground Bout** - Learn about night phase and combat
6. **First Bout** - Experience first combat
7. **Results Reward** - Learn about reward system
8. **Completion** - Complete FTUE and start journey

## Completion Criteria

### Viewed
```typescript
{ type: 'viewed', value: true, required: true }
```
Validated when `eventData.viewed === true`

### Interaction
```typescript
{ type: 'interaction', value: 'gym-shift-card', required: true }
```
Validated when `eventData.interaction === 'gym-shift-card'`

### Time Spent
```typescript
{ type: 'time_spent', value: 10, required: true } // 10 seconds
```
Validated when `eventData.timeSpent >= 10000` (milliseconds)

### Sequence Complete
```typescript
{ type: 'sequence_complete', value: true, required: true }
```
Validated when `eventData.sequenceComplete === true`

### Custom Event
```typescript
{ type: 'custom_event', value: 'worker_assigned', required: true }
```
Validated when `eventData.customEvent === 'worker_assigned'`

## Event Types

The tracker emits the following event types:

- `ftue_started` - User started the FTUE
- `ftue_completed` - User completed the entire FTUE
- `ftue_abandoned` - User abandoned the FTUE
- `step_started` - User started a specific step
- `step_completed` - User completed a step successfully
- `step_failed` - Step failed to complete (missing criteria)
- `step_skipped` - User skipped a step
- `step_interaction` - User interacted with step elements

## Funnel Analysis

### Metrics Calculated

For each step:
- **Reached Users**: Number of users who reached this step
- **Completed Users**: Number of users who completed this step
- **Drop-off Users**: Users who abandoned at this step
- **Completion Rate**: `completedUsers / reachedUsers`
- **Drop-off Rate**: `droppedOffUsers / reachedUsers`
- **Average Time Spent**: Mean time spent on step
- **Median Time Spent**: Median time spent on step
- **Funnel Position**: Percentage of users who reached this step

### Overall Statistics
- **Total Sessions**: Number of FTUE sessions
- **Completed Sessions**: Sessions that completed all steps
- **Abandoned Sessions**: Sessions that were abandoned
- **Overall Completion Rate**: `completedSessions / totalSessions`
- **Average Time to Complete**: Mean time to complete FTUE
- **Bottleneck Steps**: Steps with drop-off rate above threshold

### Drop-off Analysis
- **Biggest Drop-off Step**: Step with highest drop-off rate
- **Total Drop-off Rate**: Overall drop-off across entire funnel
- **Drop-off Points**: Detailed drop-off information per step

## Configuration Options

### Analysis Configuration
```typescript
analysis: {
  bottleneckThreshold: 0.3,        // Drop-off rate > 30% = bottleneck
  minSessionsForAnalysis: 10,     // Minimum sessions for analysis
  analysisTimeWindow: 24,         // Hours of data to analyze
  includeOptionalSteps: true,      // Include optional steps
  trackSkippedSteps: true,        // Track skipped steps
}
```

### Export Configuration
```typescript
export: {
  includeTimestamps: true,         // Include timestamps in exports
  includeUserIds: false,          // Include user IDs (privacy)
  includeDeviceInfo: true,         // Include device information
  formats: ['json', 'csv'],        // Export formats
  generateVisualizations: true,    // Generate visualization data
}
```

### Visualization Configuration
```typescript
visualization: {
  chartTypes: ['funnel', 'bar'],   // Chart types to generate
  colorScheme: 'default',          // Color scheme for charts
  showStepDetails: true,           // Show detailed step information
  showTimeMetrics: true,           // Show time-based metrics
}
```

## Performance Considerations

### Memory Usage
- Events are stored in memory for active sessions
- Historical data is persisted to localStorage
- Large datasets are handled efficiently with streaming exports

### Storage Limits
- localStorage quota is monitored
- Data is compressed when possible
- Old sessions can be pruned based on time window

### Analysis Performance
- Funnel analysis uses efficient algorithms
- Time window filtering reduces computation
- Bottleneck detection is optimized for large datasets

## Integration Examples

### React Component Integration

```typescript
import { useEffect, useState } from 'react';
import { FTUEStepTracker } from '@/analytics/punchClub/FTUEStepTracker';

function FTUEComponent() {
  const [tracker] = useState(() => new FTUEStepTracker());
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const sessionId = tracker.startSession();
    return () => {
      tracker.abandonSession();
    };
  }, []);

  const handleStepStart = (stepId: string) => {
    tracker.startStep(stepId);
    setCurrentStep(getStepOrder(stepId));
  };

  const handleStepComplete = (stepId: string, data: any) => {
    tracker.completeStep(stepId, data);
  };

  return (
    <div>
      {/* FTUE UI components */}
    </div>
  );
}
```

### Telemetry Integration

```typescript
import { FTUEStepTracker } from '@/analytics/punchClub/FTUEStepTracker';
import { dispatchTelemetry } from '@/analytics/punchClub';

const tracker = new FTUEStepTracker({
  onEvent: (event) => {
    dispatchTelemetry('ftue_step_event', {
      eventType: event.eventType,
      stepId: event.stepId,
      sessionId: event.sessionId,
      timestamp: event.timestamp,
      data: event.data,
    });
  },
});
```

## Testing

### Unit Tests

The tracker includes comprehensive unit tests covering:
- Configuration validation
- Session management
- Step tracking
- Funnel analysis
- Export functionality
- Error handling

### Integration Tests

Integration tests verify:
- Complete FTUE workflows
- Partial completion scenarios
- Large dataset performance
- Storage integration
- Export accuracy

## Best Practices

### Data Privacy
- User IDs are excluded from exports by default
- Device information is optional
- Data retention policies should be implemented

### Performance
- Use time windows for analysis to limit data size
- Prune old sessions regularly
- Monitor localStorage usage

### Configuration
- Keep step definitions simple and clear
- Use meaningful completion criteria
- Set appropriate bottleneck thresholds

### Error Handling
- Always validate step IDs before operations
- Handle storage errors gracefully
- Provide fallback for missing data

## Troubleshooting

### Common Issues

**No analysis data available**
- Check if `minSessionsForAnalysis` threshold is met
- Verify sessions are within `analysisTimeWindow`
- Ensure events are being recorded correctly

**High drop-off rates**
- Review step completion criteria
- Check if steps are too difficult
- Verify UI elements are working properly

**Storage quota exceeded**
- Reduce `analysisTimeWindow`
- Implement data pruning
- Consider server-side storage

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const tracker = new FTUEStepTracker({
  onEvent: (event) => {
    console.debug('FTUE Event:', event);
  },
});
```

## Future Enhancements

### Planned Features
- Real-time dashboard integration
- A/B testing support for FTUE variations
- Advanced segmentation analysis
- Predictive dropout detection
- Multi-language support

### Performance Improvements
- Web Workers for large dataset analysis
- IndexedDB for larger storage capacity
- Streaming analysis for real-time updates
- Data compression algorithms

## API Reference

### FTUEStepTracker Class

#### Constructor
```typescript
constructor(options: FTUETrackerOptions)
```

#### Methods
- `startSession(userId?: string): string`
- `startStep(stepId: string): boolean`
- `recordInteraction(stepId: string, interactionType: string, data?: Record<string, unknown>): boolean`
- `completeStep(stepId: string, eventData?: Record<string, unknown>): boolean`
- `skipStep(stepId: string, reason?: string): boolean`
- `completeSession(): boolean`
- `abandonSession(reason?: string): boolean`
- `getCurrentSession(): FTUESession | null`
- `getAllSessions(): FTUESession[]`
- `getAllEvents(): FTUEStepEvent[]`
- `getSessionEvents(sessionId: string): FTUEStepEvent[]`
- `analyzeFunnel(timeWindowHours?: number): FTUEFunnelAnalysis`
- `exportData(format?: 'json' | 'csv' | 'markdown'): string`
- `clearData(): void`
- `updateConfig(config: Partial<FTUEConfig>): void`
- `getConfig(): FTUEConfig`

### Convenience Functions

- `createFTUETracker(options?: FTUETrackerOptions): FTUEStepTracker`
- `analyzeFTUEData(sessions: FTUESession[], events: FTUEStepEvent[], config?: FTUEConfig): FTUEFunnelAnalysis`

## Version History

### v1.0.0 (NP-183)
- Initial implementation
- Config-first design
- Funnel analysis
- Export functionality
- Storage integration
- Comprehensive testing

---

For more information, see the source code in:
- `src/analytics/punchClub/FTUEStepTracker.ts`
- `src/analytics/punchClub/config/ftueStepConfig.ts`
- `tests/unit/punchClub/FTUEStepTracker.test.ts`
