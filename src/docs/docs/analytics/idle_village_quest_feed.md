# Idle Village Quest Feed Analytics

## Overview

The Idle Village Quest Feed Analytics system provides comprehensive tracking and visualization of quest decisions, outcomes, and risk patterns over time. It includes a decision feed telemetry pipeline and an interactive timeline heatmap for analyzing quest performance patterns.

## Components

### Quest Feed Telemetry

The quest feed telemetry system captures quest-related events and decisions:

```typescript
// Quest Feed Event Types
export type QuestFeedEventType = 'quest_feed_event' | 'quest_feed_export';

// Quest Feed Event Payload
export interface QuestFeedEventPayload extends Record<string, unknown> {
  filter: string;
  sort: string;
  searchTerm?: string;
  groupByQuest: boolean;
  tags: string[];
  totalDecisions: number;
  visibleDecisions: number;
  sampleDecision?: {
    phaseId: string;
    timestamp: number;
    success: boolean;
    choice?: string;
  };
}
```

### Quest Timeline Heatmap

The timeline heatmap visualizes quest decisions over time with risk indicators and outcome markers:

```typescript
// Quest Decision Structure
export interface QuestDecision {
  id: string;
  questId: string;
  turn: number;
  timestamp: number;
  decision: string;
  outcome: QuestOutcome;
  riskLevel: QuestRiskLevel;
  residentId?: string;
  metadata?: Record<string, unknown>;
}
```

## Features

### Timeline Visualization

- **Heatmap Display**: Color-coded cells showing risk levels (low, medium, high, critical)
- **Outcome Indicators**: Circular markers showing quest outcomes (success, failure, partial_success, abandoned, pending)
- **Turn-based Organization**: Decisions grouped by turn numbers with configurable column grouping
- **Interactive Tooltips**: Hover tooltips showing detailed decision information

### Risk Analysis

- **Risk Level Calculation**: Automatic risk assessment based on configurable thresholds
- **Risk Distribution**: Statistical breakdown of risk levels across all decisions
- **Riskiest Turn Identification**: Highlights turns with highest average risk
- **Color-coded Visualization**: Gilded Observatory theme with gold/bronze risk palette

### Performance Metrics

- **Success Rate Tracking**: Overall quest success percentage
- **Decision Density**: Average decisions per turn
- **Quest Diversity**: Number of unique quests undertaken
- **Timeline Statistics**: Turn range and decision distribution

## Configuration

### Timeline Configuration

```typescript
export interface QuestTimelineConfig {
  timeline: {
    minTurn: number;
    maxTurn: number;
    turnsPerColumn: number;
    zoomLevel: number;
    showTurnNumbers: boolean;
    turnLabelFormat: 'numeric' | 'abbreviated' | 'full';
  };
  colors: {
    risk: {
      low: string;      // green-500
      medium: string;   // amber-400
      high: string;     // orange-500
      critical: string; // red-500
    };
    outcome: {
      success: string;
      failure: string;
      partial_success: string;
      abandoned: string;
      pending: string;
    };
    // ... additional color settings
  };
  // ... additional configuration options
}
```

### Risk Thresholds

```typescript
riskThresholds: {
  low: 25,      // 0-25% risk
  medium: 50,   // 26-50% risk
  high: 75,     // 51-75% risk
  critical: 90  // 76-100% risk
}
```

## Usage Examples

### Basic Timeline Heatmap

```typescript
import QuestTimelineHeatmap from '@/ui/idleVillage/components/QuestTimelineHeatmap';

function QuestAnalyticsPage() {
  const handleDecisionClick = (decision) => {
    console.log('Decision clicked:', decision);
  };

  const handleExport = (format) => {
    console.log('Export format:', format);
  };

  return (
    <QuestTimelineHeatmap
      width={800}
      height={400}
      enableInteractions={true}
      onDecisionClick={handleDecisionClick}
      onExport={handleExport}
    />
  );
}
```

### Custom Configuration

```typescript
import { useQuestTimelineData } from '@/ui/idleVillage/hooks/useQuestTimelineData';

function CustomQuestTimeline() {
  const { data, config, updateConfig } = useQuestTimelineData({
    initialConfig: {
      timeline: {
        turnsPerColumn: 10,
        zoomLevel: 1.5,
      },
      colors: {
        risk: {
          low: 'rgb(0, 255, 0)',
          critical: 'rgb(255, 0, 0)',
        },
      },
    },
  });

  const handleZoomIn = () => {
    updateConfig({
      timeline: {
        zoomLevel: Math.min(config.timeline.zoomLevel + 0.1, 3.0),
      },
    });
  };

  return (
    <div>
      <button onClick={handleZoomIn}>Zoom In</button>
      {/* Timeline component */}
    </div>
  );
}
```

### Data Export

```typescript
import { useQuestTimelineData } from '@/ui/idleVillage/hooks/useQuestTimelineData';

function QuestDataExport() {
  const { exportData } = useQuestTimelineData();

  const exportJSON = () => {
    const jsonData = exportData('json');
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quest-timeline-data.json';
    a.click();
  };

  const exportCSV = () => {
    const csvData = exportData('csv');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quest-timeline-data.csv';
    a.click();
  };

  return (
    <div>
      <button onClick={exportJSON}>Export JSON</button>
      <button onClick={exportCSV}>Export CSV</button>
    </div>
  );
}
```

## Telemetry Events

### Quest Timeline Events

```typescript
// Timeline viewed
{
  eventType: 'quest_timeline_heatmap_viewed',
  data: {
    decisionCount: 150,
    turnRange: { min: 1, max: 50 },
    riskDistribution: { low: 45, medium: 60, high: 35, critical: 10 },
    outcomeDistribution: { success: 90, failure: 30, partial_success: 20, abandoned: 5, pending: 5 },
    configSource: 'saved',
  }
}

// Data loaded
{
  eventType: 'quest_timeline_data_loaded',
  data: {
    decisionCount: 150,
    performance: {
      loadTime: 45,
      renderTime: 12,
    },
  }
}

// Export completed
{
  eventType: 'quest_timeline_exported',
  data: {
    decisionCount: 150,
    format: 'json',
  }
}
```

## Data Schema

### Quest Decision Schema

```typescript
export interface QuestDecision {
  id: string;                    // Unique decision identifier
  questId: string;              // Quest identifier
  turn: number;                 // Turn number when decision was made
  timestamp: number;            // Unix timestamp
  decision: string;             // Decision description
  outcome: QuestOutcome;        // Decision outcome
  riskLevel: QuestRiskLevel;    // Risk assessment
  residentId?: string;          // Resident who made decision
  metadata?: {                  // Additional decision data
    riskValue: number;          // Numerical risk value (0-100)
    duration: number;            // Decision duration in ms
    difficulty: string;         // Quest difficulty
    rewards?: Record<string, unknown>; // Quest rewards
  };
}
```

### Outcome Types

```typescript
export type QuestOutcome = 
  | 'success'          // Quest completed successfully
  | 'failure'          // Quest failed
  | 'partial_success'  // Partial completion
  | 'abandoned'        // Quest abandoned
  | 'pending';         // Quest in progress
```

### Risk Levels

```typescript
export type QuestRiskLevel = 
  | 'low'       // 0-25% risk
  | 'medium'    // 26-50% risk
  | 'high'      // 51-75% risk
  | 'critical'; // 76-100% risk
```

## Performance Considerations

### Data Optimization

- **Virtualization**: Enable virtual scrolling for large datasets
- **Debouncing**: Debounce user interactions to prevent excessive re-renders
- **Memoization**: Cache expensive calculations and aggregations
- **Lazy Loading**: Load data in chunks for very large timelines

### Rendering Performance

- **Canvas Optimization**: Use efficient canvas rendering techniques
- **Batch Operations**: Group multiple updates into single render cycles
- **Memory Management**: Clear unused data and event listeners
- **Animation Performance**: Use requestAnimationFrame for smooth animations

### Configuration Guidelines

```typescript
// Recommended settings for optimal performance
const performanceConfig = {
  performance: {
    maxDecisionsPerColumn: 50,    // Limit decisions per column
    enableVirtualization: true,    // Enable for large datasets
    debounceDelay: 50,              // Debounce user interactions
  },
  interaction: {
    interactionDebounce: 100,      // Debounce zoom/pan operations
    animationDuration: 200,         // Keep animations short
  },
};
```

## Integration Points

### PersistenceService Integration

```typescript
// Configuration persistence
await saveData('idle_village_quest_timeline_config', config);

// Decision data persistence
await saveData('idle_village_quest_decisions', decisions);

// Load saved data
const savedConfig = await loadData('idle_village_quest_timeline_config');
const savedDecisions = await loadData('idle_village_quest_decisions');
```

### Quest Feed Integration

```typescript
// Integrate with existing quest feed telemetry
import { trackQuestFeedEvent } from '@/analytics/idleVillageQuestFeed';

// Track timeline interactions
trackQuestFeedEvent({
  filter: 'all',
  sort: 'timestamp_desc',
  groupByQuest: true,
  tags: ['timeline', 'heatmap'],
  totalDecisions: decisions.length,
  visibleDecisions: visibleDecisions.length,
});
```

### Drop Feedback Integration

```typescript
// Use drop feedback colors for risk visualization
import { getRiskColor } from '@/ui/idleVillage/config/dropFeedbackConfig';

const riskColors = {
  low: getRiskColor('valid', dropFeedbackConfig),
  medium: getRiskColor('warning', dropFeedbackConfig),
  high: getRiskColor('invalid', dropFeedbackConfig),
  critical: getRiskColor('blocked', dropFeedbackConfig),
};
```

## Testing

### Unit Tests

```typescript
// Test configuration loading
test('loads configuration from storage', async () => {
  const { result } = renderHook(() => useQuestTimelineData());
  
  await waitFor(() => {
    expect(result.current.config).toBeDefined();
    expect(result.current.config.timeline.turnsPerColumn).toBe(5);
  });
});

// Test data aggregation
test('aggregates quest decisions correctly', async () => {
  const { result } = renderHook(() => useQuestTimelineData());
  
  await waitFor(() => {
    expect(result.current.data).toBeDefined();
    expect(result.current.data.stats.totalDecisions).toBeGreaterThan(0);
  });
});
```

### Component Tests

```typescript
// Test heatmap rendering
test('renders heatmap with data', async () => {
  render(<QuestTimelineHeatmap />);
  
  await waitFor(() => {
    expect(screen.getByText(/Decisions:/)).toBeInTheDocument();
    expect(screen.getByText(/Success Rate:/)).toBeInTheDocument();
  });
});

// Test export functionality
test('exports data in JSON format', async () => {
  const mockOnExport = vi.fn();
  render(<QuestTimelineHeatmap onExport={mockOnExport} />);
  
  fireEvent.click(screen.getByText('Export JSON'));
  
  expect(mockOnExport).toHaveBeenCalledWith('json');
});
```

## Troubleshooting

### Common Issues

**Timeline Not Loading**
- Check if quest decisions data is available
- Verify PersistenceService is functioning
- Check console for error messages

**Performance Issues**
- Reduce `maxDecisionsPerColumn` in configuration
- Enable virtualization for large datasets
- Increase debounce delays

**Colors Not Displaying Correctly**
- Verify color configuration is valid
- Check if config is loaded from storage
- Ensure Gilded Observatory theme colors are applied

**Export Not Working**
- Check if data is loaded before exporting
- Verify export format is supported
- Check browser download permissions

### Debug Mode

Enable verbose logging for troubleshooting:

```typescript
const { updateConfig } = useQuestTimelineData();

updateConfig({
  tooltip: {
    enabled: true,
    showDelay: 0,  // Immediate tooltips
  },
  performance: {
    enableVirtualization: false,  // Disable for debugging
  },
});
```

## Future Enhancements

### Planned Features

- **Real-time Updates**: Live quest decision streaming
- **Advanced Filtering**: Multi-criteria filtering system
- **Comparative Analysis**: Side-by-side timeline comparisons
- **Predictive Analytics**: Risk prediction based on historical patterns
- **Integration with Quest Planner**: Direct quest planning integration

### Extension Points

- **Custom Risk Models**: Pluggable risk assessment algorithms
- **Additional Visualizations**: Alternative chart types
- **Export Formats**: Support for additional export formats
- **Third-party Integrations**: External analytics platform connections

## KPI and Metrics

### Success Metrics

- **Decision Density**: Average decisions per turn (target: 2-5)
- **Success Rate**: Overall quest success percentage (target: >70%)
- **Risk Distribution**: Balanced risk level distribution
- **Timeline Coverage**: Complete turn range representation

### Performance Metrics

- **Load Time**: <100ms for typical datasets
- **Render Time**: <16ms per frame for smooth interactions
- **Memory Usage**: <50MB for large datasets
- **Export Time**: <1s for JSON/CSV exports

### User Engagement Metrics

- **Timeline Views**: Number of heatmap interactions
- **Export Usage**: Frequency of data exports
- **Filter Usage**: Most common filter combinations
- **Zoom/Pan Usage**: Interaction pattern analysis

## Documentation

- **API Reference**: Complete function and interface documentation
- **Configuration Guide**: Detailed configuration options
- **Integration Examples**: Real-world usage scenarios
- **Performance Guide**: Optimization recommendations
- **Troubleshooting Guide**: Common issues and solutions
