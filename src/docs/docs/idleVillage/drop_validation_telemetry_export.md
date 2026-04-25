# NP-067 – Idle Village Drop Validation Telemetry Export

## Overview

The Idle Village Drop Validation Telemetry Export system provides comprehensive analytics and export capabilities for drop validation events in Phase E. It collects telemetry data from drag-and-drop operations, AI suggestions, and user interactions, then exports this data in multiple formats for analysis and reporting.

## Features

### 📊 Data Collection
- **Session Management**: Track individual user sessions with device and browser metadata
- **Event Recording**: Capture all drop validation events, feedback interactions, and AI suggestions
- **Real-time Aggregation**: Calculate metrics on-demand with caching for performance
- **Multi-source Integration**: Combine data from existing telemetry systems

### 📈 Export Formats
- **JSON**: Machine-readable format with complete data structure
- **Markdown**: Human-readable reports with formatted tables and summaries
- **CSV**: Spreadsheet-compatible format for data analysis

### 📊 Metrics and Analytics
- **Drop Validation**: Success rates, failure patterns, average times
- **Feedback Interaction**: User engagement with feedback systems
- **AI Suggestions**: Suggestion performance and accuracy metrics
- **Performance**: System performance and resource usage
- **Resident/Activity Breakdown**: Per-resident and per-activity statistics
- **Time-based Analysis**: Hourly/daily trend analysis

## Architecture

### Core Components

1. **Schema Definitions** (`dropValidationTelemetryExportSchema.ts`)
   - Zod schemas for all data structures
   - Type definitions for export configurations
   - Validation utilities and type guards

2. **Telemetry Collector** (`dropValidationTelemetryCollector.ts`)
   - Session management and event recording
   - Real-time metrics calculation with caching
   - Data aggregation and statistics
   - Export data preparation

3. **Export Functionality** (`dropValidationTelemetryExporter.ts`)
   - Multi-format export (JSON/Markdown/CSV)
   - Formatting options and customization
   - File export preparation
   - Error handling and validation

4. **Test Suite** (`DropValidationTelemetryExport.test.ts`)
   - Comprehensive unit tests for all components
   - Mock data generators for testing
   - Performance and edge case testing

## Usage Examples

### Basic Export

```typescript
import { dropValidationTelemetryCollector } from '@/ui/idleVillage/utils/dropValidationTelemetryCollector';
import { DropValidationTelemetryExporter } from '@/ui/idleVillage/utils/dropValidationTelemetryExporter';

// Create collector instance
const collector = new DropValidationTelemetryCollector();
const exporter = new DropValidationTelemetryExporter(collector);

// Create a session
const sessionId = collector.createSession('user-123');

// Record some events
collector.recordEvent({
  eventType: 'drop_operation_completed',
  timestamp: Date.now(),
  sessionId,
  villageContext: {
    residentCount: 5,
    activityCount: 10,
    currentAssignments: 3,
    day: 1,
    crisisMode: false,
  },
  data: {
    success: true,
    duration: 150,
    residentId: 'resident-001',
    activityId: 'activity-001',
  },
});

// Export to JSON
const jsonResult = await exporter.exportToJson(collector.getAggregatedMetrics());
console.log('JSON Export:', jsonResult.content);

// Export to Markdown
const mdResult = await exporter.exportToMarkdown(collector.getAggregatedMetrics());
console.log('Markdown Export:', mdResult.content);

// Export to CSV
const csvResult = await exporter.exportToCsv(collector.getAggregatedMetrics());
console.log('CSV Export:', csvResult.content);
```

### Advanced Export with Options

```typescript
// Custom export configuration
const exportConfig = {
  format: 'markdown' as const,
  includeRawEvents: false,
  includeBreakdowns: true,
  includeCharts: false,
  dateFormat: 'readable' as const,
  precision: 2,
  includeMetadata: true,
};

// Filter by time range
const timeRangeConfig = {
  ...exportConfig,
  timeRange: {
    start: Date.now() - 86400000, // 24 hours ago
    end: Date.now(),
  },
};

// Filter by event types
const eventTypeConfig = {
  ...exportConfig,
  eventTypes: ['drop_operation_completed', 'drop_feedback_shown'],
};

// Filter by session IDs
const sessionConfig = {
  ...exportConfig,
  sessionIds: ['session-1', 'session-2'],
};

// Execute export
const result = await collector.exportData(exportConfig);
```

### File Export

```typescript
// Export to file (simulated)
const fileResult = await exporter.exportToFile(
  collector.getAggregatedMetrics(),
  'json',
  'drop-validation-telemetry-2026-01-20.json'
);

if (fileResult.success) {
  console.log(`Export successful: ${fileResult.fileSize} bytes in ${fileResult.duration}ms`);
} else {
  console.error('Export failed:', fileResult.error);
}
```

### CLI Integration

```typescript
// CLI script example
import { dropValidationTelemetryCollector } from '@/ui/idleVillage/utils/dropValidationTelemetryCollector';
import { DropValidationTelemetryExporter } from '@/ui/idleVillage/utils/dropValidationTelemetryExporter';

async function main() {
  const collector = dropValidationTelemetryCollector;
  const exporter = new DropValidationTelemetryExporter(collector);
  
  // Get current metrics
  const metrics = collector.getAggregatedMetrics();
  
  // Export to all formats
  const formats = ['json', 'markdown', 'csv'] as const;
  
  for (const format of formats) {
    const result = await exporter.export(metrics, format);
    
    if (result.success) {
      const fileName = `drop-validation-telemetry-${Date.now()}.${format}`;
      // In real implementation, save to file system here
      console.log(`Exported to ${fileName}`);
      console.log(`Size: ${result.fileSize} bytes`);
    } else {
      console.error(`Failed to export ${format}:`, result.error);
    }
  }
}

// Run CLI
main().catch(console.error);
```

## Data Structure

### Export Schema

```typescript
interface DropValidationTelemetryExport {
  metadata: {
    exportedAt: string;
    version: string;
    source: string;
    collectionPeriod: {
      startTimestamp: number;
      endTimestamp: number;
      duration: number;
      eventCount: number;
      eventsPerSecond: number;
    };
  };
  sessionSummary: {
    totalSessions: number;
    sessionDurations: {
      average: number;
      min: number;
      max: number;
    };
    uniqueUsers: number;
  };
  metrics: {
    dropValidation: DropValidationMetrics;
    feedbackInteraction: FeedbackInteractionMetrics;
    aiSuggestions: AISuggestionMetrics;
    performance: PerformanceMetrics;
  };
  residentBreakdown: ResidentMetrics[];
  activityBreakdown: ActivityMetrics[];
  timeBreakdown: TimeBasedSummary[];
  rawEvents?: UnifiedTelemetryEvent[];
  exportStats: {
    totalEvents: number;
    eventsExported: number;
    fileSize: number;
    exportDuration: number;
  };
}
```

### Key Metrics

#### Drop Validation Metrics
- **Total Drops**: Number of drop operations attempted
- **Success Rate**: Percentage of successful drops
- **Average Drop Time**: Mean time to complete drop operation
- **Validation Failures**: Breakdown of validation rule failures
- **Most Common Failure**: Most frequent validation failure type

#### Feedback Interaction Metrics
- **Total Feedback Shown**: Number of feedback events displayed
- **Interaction Rate**: Percentage of feedback that users interacted with
- **Average Time to Interact**: Mean time from feedback display to user action
- **Feedback Type Breakdown**: Distribution of feedback types (valid/invalid/warning/blocked)

#### AI Suggestion Metrics
- **Total Suggestions**: Number of AI suggestions generated
- **Acceptance Rate**: Percentage of suggestions accepted by users
- **Average Confidence**: Mean confidence score of suggestions
- **Accuracy Metrics**: Prediction accuracy rates for success and outcomes

#### Performance Metrics
- **Average Validation Time**: Mean time to validate drop operation
- **Average Suggestion Time**: Mean time to generate AI suggestions
- **Memory Usage**: Memory consumption during operations
- **Cache Hit Rate**: Effectiveness of caching mechanisms
- **Error Rate**: Percentage of operations that failed

## API Reference

### DropValidationTelemetryCollector

#### Constructor
```typescript
new DropValidationTelemetryCollector()
```

#### Methods

##### `createSession(userId?, metadata?)`
Creates a new telemetry session and returns the session ID.

##### `recordEvent(event)`
Records a telemetry event to the session and global collection.

##### `endSession(sessionId)`
Ends a session with the given ID.

##### `getActiveSessions()`
Returns array of currently active sessions.

##### `getSession(sessionId)`
Retrieves a session by ID.

##### `getAggregatedMetrics()`
Calculates and returns aggregated metrics with caching.

##### `exportData(config)`
Exports data according to the provided configuration.

##### `getStats()`
Returns collector statistics and status.

##### `clearData()`
Clears all collected data and resets the collector.

### DropValidationTelemetryExporter

#### Constructor
```typescript
new DropValidationTelemetryExporter(collector: DropValidationTelemetryCollector)
```

#### Methods

##### `exportToJson(data, options?)`
Exports data to JSON format.

##### `exportToMarkdown(data, options?)`
Exports data to Markdown format.

##### `exportToCsv(data, options?)`
Exports data to CSV format.

##### `export(data, format, options?)`
Auto-detects format and exports accordingly.

##### `exportToFile(data, format, filePath, options?)`
Prepares file export (simulated).

## Configuration Options

### Export Options

```typescript
interface ExportOptions {
  includeRawEvents?: boolean;
  includeBreakdowns?: boolean;
  includeCharts?: boolean;
  dateFormat?: 'iso' | 'readable';
  precision?: number;
  includeMetadata?: boolean;
}
```

### Export Configuration

```typescript
interface ExportConfig {
  format: 'json' | 'markdown' | 'csv';
  includeRawEvents?: boolean;
  timeRange?: {
    start?: number;
    end?: number;
  };
  eventTypes?: DropFeedbackEventType[];
  sessionIds?: string[];
  maxEvents?: number;
  sortOrder?: 'asc' | 'desc';
  groupBy?: 'session' | 'resident' | 'activity' | 'hour' | 'day';
}
```

## Integration Examples

### React Component Integration

```typescript
import { useEffect, useState } from 'react';
import { dropValidationTelemetryCollector } from '@/ui/idleVillage/utils/dropValidationTelemetryCollector';
import { DropValidationTelemetryExporter } from '@/ui/idleVillage/utils/dropValidationTelemetryExporter';

export function DropValidationAnalytics() {
  const [sessionId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    // Create session on mount
    if (!sessionId) {
      const id = dropValidationTelemetryCollector.createSession();
      setSessionId(id);
    }
    
    // Update metrics periodically
    const interval = setInterval(() => {
      const currentMetrics = dropValidationTelemetryCollector.getAggregatedMetrics();
      setMetrics(currentMetrics);
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [sessionId]);
  
  const exportData = async (format: 'json' | 'markdown' | 'csv') => {
    if (!sessionId) return;
    
    const exporter = new DropValidationTelemetryExporter(dropValidationTelemetryCollector);
    const result = await exporter.exportData({
      format,
      includeBreakdowns: true,
      includeMetadata: true,
    });
    
    return result;
  };
  
  return {
    sessionId,
    metrics,
    exportData,
  };
}
```

### CLI Script

```typescript
#!/usr/bin/env tsx

import { dropValidationTelemetryCollector } from '@/ui/idleVillage/utils/dropValidationTelemetryCollector';
import { DropValidationTelemetryExporter } from '@/ui/idleVillage/utils/dropValidationTelemetryExporter';

async function main() {
  const collector = dropValidationTelemetryCollector;
  const exporter = new DropValidationTelemetryExporter(collector);
  
  console.log('📊 Drop Validation Telemetry Export');
  console.log('================================');
  
  // Get current statistics
  const stats = collector.getStats();
  console.log(`Active Sessions: ${stats.activeSessions.length}`);
  console.log(`Total Events: ${stats.totalEvents}`);
  
  if (stats.totalEvents === 0) {
    console.log('No telemetry data to export.');
    return;
  }
  
  // Get metrics
  const metrics = collector.getAggregatedMetrics();
  console.log('\n📊 Key Metrics:');
  console.log(`  • Drop Success Rate: ${metrics.dropValidation.successRate.toFixed(1)}%`);
  console.log(`  • Feedback Interaction Rate: ${metrics.feedbackInteraction.interactionRate.toFixed(1)}%`);
  console.log(`  • AI Suggestion Acceptance Rate: ${metrics.aiSuggestions.acceptanceRate.toFixed(1)}%`);
  console.log(`  • Average Drop Time: ${metrics.dropValidation.averageDropTime.toFixed(1)}ms`);
  
  // Export to all formats
  const formats = ['json', 'markdown', 'csv'] as const;
  
  for (const format of formats) {
    console.log(`\n📄 Exporting to ${format.toUpperCase()}...`);
      const result = await exporter.exportData({ format });
      
      if (result.success) {
        const fileName = `drop-validation-telemetry-${new Date().toISOString().split('T')[0]}.${format}`;
        console.log(`✅ Exported: ${fileName}`);
        console.log(`   Size: ${result.fileSize} bytes`);
        console.log(`   Duration: ${result.duration}ms`);
      } else {
        console.error(`❌ Failed to export ${format}: ${result.error}`);
      }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
```

### Scheduled Export

```typescript
// Daily export at midnight
import cron from 'node-cron';
import { dropValidationTelemetryCollector } from '@/ui/idleVillage/utils/dollection';
import { DropValidationTelemetryExporter } from '@/ui/idleVillage/utils/export';

// Schedule daily export at 00:00 UTC
cron('0 0 * * * *', async () => {
  const collector = dropValidationTelemetryCollector;
  const exporter = new DropValidationTelemetryExporter(collector);
  
  const result = await exporter.exportData({
    format: 'markdown',
    includeBreakdowns: true,
    includeMetadata: true,
  });
  
  if (result.success) {
    // Save to file system
    const fileName = `daily-telemetry-${new Date().toISOString().split('T')[0]}.md`;
    // Save result.content to fileName
    console.log(`Daily export saved: ${fileName}`);
  }
});
```

## Performance Considerations

### Memory Usage
- **Event Buffering**: Events are stored in memory until export
- **Aggregation Caching**: Metrics are cached for 1 minute to avoid recalculation
- **Large Datasets**: Use filtering for large datasets to reduce memory usage

### Export Performance
- **JSON**: Fastest format, suitable for automated processing
- **Markdown**: Moderate performance, suitable for human-readable reports
- **CSV**: Slower due to string concatenation, but excellent for data analysis

### Optimization Tips
1. **Filter Early**: Apply time range and event type filters before export
2. **Disable Breakdowns**: For large datasets, consider excluding breakdowns
3. **Batch Processing**: Export multiple sessions in parallel when possible
4. **Use Streaming**: For very large datasets, consider streaming export

## Troubleshooting

### Common Issues

#### No Data Available
```typescript
if (collector.getStats().totalEvents === 0) {
  console.log('No telemetry data available for export');
  return;
}
```

#### Export Errors
```typescript
if (!result.success) {
  console.error('Export failed:', result.error);
  console.log('Check data format and configuration');
}
```

#### Performance Issues
```typescript
// For large datasets, consider:
const largeDataConfig = {
  includeRawEvents: false,
  includeBreakdowns: false,
  maxEvents: 10000, // Limit events
};
```

### Debug Mode

Enable verbose logging in the diagnostics system:

```typescript
// In development
const diagnostics = createSandboxDiagnostics('drop-validation-telemetry', {
  verbose: true,
});
```

## Best Practices

### Data Collection
1. **Session Management**: Create sessions for logical user sessions
2. **Event Consistency**: Ensure all events have required fields
3. **Timestamp Accuracy**: Use consistent timestamp formats
4. **Context Data**: Include village context for proper analysis

### Export Strategy
1. **Regular Exports**: Schedule periodic exports for continuous monitoring
2. **Format Selection**: Use JSON for automation, Markdown for reports, CSV for analysis
3. **Filtering**: Apply relevant filters to reduce export size
4. **Backup Strategy**: Keep historical data for trend analysis

### Error Handling
1. **Validation**: Always validate export data before saving
2. **Fallbacks**: Provide alternative export methods
3. **Logging**: Log export status and errors for debugging
4. **User Feedback**: Provide clear error messages and recovery options

## Integration Points

### Existing Systems
- **Drop Feedback Telemetry**: Integrates with `dropFeedbackTelemetry.ts`
- **AI Suggestion Telemetry**: Integrates with `dropAITelemetry.ts`
- **Sandbox Diagnostics**: Uses `createSandboxDiagnostics` for logging
- **Analytics System**: Compatible with existing analytics infrastructure

### Future Enhancements
- **Real-time Dashboard**: Live metrics display
- **Alert System**: Automatic notifications for issues
- **Data Visualization**: Charts and graphs for trends
- **API Integration**: REST API for remote access
- **Database Storage**: Persistent storage for historical data

---

**Last Updated:** 2026-01-20  
**Version:** 1.0.0  
**Author:** Coordinator-Bot – Analytics  
**Maintainer:** Idle Village Phase E Team

For questions or issues, please refer to the test suite or create an issue in the project repository.
