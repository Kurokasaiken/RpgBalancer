# Session Duration Analytics - NP-178

**Status**: ✅ Complete  
**Date**: 2026-01-23  
**Agent**: Helios-PC – Session Analytics

## Overview

Session Duration Analytics provides comprehensive analytics for Punch Club gameplay sessions with duration segmentation, retention metrics (D1, D7, D30), and export capabilities. The system follows a config-first design with privacy compliance and flexible aggregation options.

## Features

### Duration Buckets

Sessions are automatically categorized into duration buckets:

- **Micro Session** (0-5 min): Very short sessions, possible bounces
- **Short Session** (5-15 min): Quick play sessions
- **Medium Session** (15-30 min): Standard play sessions
- **Long Session** (30-60 min): Extended play sessions
- **Marathon Session** (60+ min): Very long play sessions

### Analytics Segments

Predefined segments for user analysis:

- **Mobile Users**: Users playing on mobile devices
- **Desktop Users**: Users playing on desktop
- **New Users**: Users in their first 7 days
- **Returning Users**: Users who have returned after 7+ days
- **Power Users**: High engagement users (10+ sessions, 20+ min avg)
- **Weekend Players**: Users who primarily play on weekends

### Retention Metrics

Comprehensive retention tracking:

- **D1 Retention**: Day 1 retention rate
- **D7 Retention**: Day 7 retention rate
- **D30 Retention**: Day 30 retention rate
- **Churn Rate**: Inverse of retention (100 - retention)
- **Cohort Analysis**: Retention by install date cohort
- **Segment Retention**: Retention broken down by user segments

### Aggregation

Flexible aggregation with multiple options:

- **Time Windows**: Hour, Day, Week, Month
- **Group By**: Device type, day of week, hour of day, custom fields
- **Metrics**: Session count, unique users, duration statistics
- **Filters**: Segment-based filtering for targeted analysis

### Export Capabilities

Multiple export formats with configurable options:

- **JSON Export**: Complete analytics data with metadata
- **CSV Export**: Tabular data for spreadsheet analysis
- **Chart Data**: Pre-formatted data for visualization
- **Raw Sessions**: Optional inclusion of raw session data

### Privacy Compliance

Built-in privacy features:

- **User ID Anonymization**: Hash-based anonymization
- **PII Field Exclusion**: Automatic filtering of sensitive data
- **Minimum Cohort Size**: Privacy threshold for small cohorts
- **Compliance Validation**: Automatic privacy checks

## Architecture

### Config-First Design

All analytics parameters are configurable via `sessionAnalyticsConfig.ts`:

```typescript
interface SessionAnalyticsConfig {
  durationBuckets: DurationBucket[];
  segments: AnalyticsSegment[];
  retention: RetentionConfig;
  aggregation: AggregationConfig;
  export: ExportConfig;
  privacy: PrivacyConfig;
}
```

### Core Components

1. **sessionAnalyticsConfig.ts**: Configuration and utility functions
2. **SessionDurationAnalytics.ts**: Main analytics engine
3. **SessionDurationAnalytics.test.ts**: Comprehensive test suite

### Data Flow

```
Session Events → SessionTaggingPipeline → SessionDurationAnalytics
                                                    ↓
                                          Aggregation + Retention
                                                    ↓
                                          Export (JSON/CSV/Charts)
```

## Usage

### Basic Usage

```typescript
import { SessionDurationAnalytics } from '@/analytics/punchClub/SessionDurationAnalytics';

const analytics = new SessionDurationAnalytics();

// Add session data
const session: SessionData = {
  sessionId: 'session1',
  userId: 'user1',
  startTime: Date.now() - 30 * 60 * 1000,
  endTime: Date.now(),
  duration: 30 * 60 * 1000,
  deviceType: 'mobile',
  appVersion: '1.0.0',
  dayOfWeek: 0,
  hourOfDay: 0,
  isWeekend: false,
};

analytics.addSession(session);
```

### Aggregated Analytics

```typescript
// Get aggregated analytics
const aggregated = analytics.getAggregatedAnalytics({
  timeWindow: 'day',
  groupBy: ['device_type', 'day_of_week'],
  filters: [
    { field: 'device_type', operator: 'equals', value: 'mobile' }
  ],
});

// Results include:
// - sessionCount
// - uniqueUsers
// - avgDuration, medianDuration, p95Duration
// - durationBuckets distribution
// - segments breakdown
```

### Retention Analysis

```typescript
// Calculate retention metrics
const retention = analytics.calculateRetention();

console.log('D1 Retention:', retention.overallRetention.d1);
console.log('D7 Retention:', retention.overallRetention.d7);
console.log('D30 Retention:', retention.overallRetention.d30);

// Retention by segment
console.log('Mobile D7:', retention.retentionBySegment.mobile_users.d7);
console.log('Power Users D30:', retention.retentionBySegment.power_users.d30);
```

### Chart Generation

```typescript
// Generate chart data for visualization
const durationChart = analytics.generateChartData('duration_distribution');
const retentionChart = analytics.generateChartData('retention_curve');
const sessionsChart = analytics.generateChartData('sessions_over_time');

// Use with charting library (Chart.js, Recharts, etc.)
```

### Export

```typescript
// Export as JSON
const jsonData = analytics.export('json');
const data = JSON.parse(jsonData);

// Export as CSV
const csvData = analytics.export('csv');
// Download or save to file
```

### Presets

```typescript
import { createSessionDurationAnalytics } from '@/analytics/punchClub/SessionDurationAnalytics';

// Default preset
const analytics = createSessionDurationAnalytics('default');

// Mobile-focused preset (hourly aggregation, device grouping)
const mobileAnalytics = createSessionDurationAnalytics('mobile_focused');

// Retention-focused preset (extended tracking days)
const retentionAnalytics = createSessionDurationAnalytics('retention_focused');
```

## Configuration

### Duration Buckets

Customize duration buckets in config:

```typescript
durationBuckets: [
  {
    id: 'micro',
    name: 'Micro Session',
    minMinutes: 0,
    maxMinutes: 5,
    color: '#ef4444',
    description: 'Very short sessions',
  },
  // ... more buckets
]
```

### Segments

Define custom segments:

```typescript
segments: [
  {
    id: 'high_value_users',
    name: 'High Value Users',
    description: 'Users with high engagement and retention',
    filters: [
      { field: 'total_sessions', operator: 'greater_than', value: 20 },
      { field: 'avg_session_duration', operator: 'greater_than', value: 30 },
    ],
  },
]
```

### Retention Tracking

Configure retention tracking:

```typescript
retention: {
  trackingDays: [1, 3, 7, 14, 30, 60, 90],
  minSessionsForRetention: 1,
  cohortSizeDays: 1,
}
```

### Privacy Settings

Configure privacy compliance:

```typescript
privacy: {
  anonymizeUserIds: true,
  minCohortSize: 5,
  excludePiiFields: ['user_email', 'user_name', 'ip_address'],
}
```

## Integration

### With Session Tagging Pipeline

```typescript
import { getSessionTaggingPipeline } from '@/analytics/sessionTaggingPipeline';
import { SessionDurationAnalytics } from '@/analytics/punchClub/SessionDurationAnalytics';

const pipeline = getSessionTaggingPipeline();
const analytics = new SessionDurationAnalytics();

// When session ends
const metrics = pipeline.endSession();
if (metrics) {
  analytics.addSession({
    sessionId: metrics.sessionId,
    userId: 'user_id',
    startTime: metrics.startTime,
    endTime: metrics.endTime || Date.now(),
    duration: metrics.duration || 0,
    deviceType: 'mobile',
    appVersion: '1.0.0',
    dayOfWeek: 0,
    hourOfDay: 0,
    isWeekend: false,
    metrics,
  });
}
```

### With Telemetry Pipeline

```typescript
import { trackTelemetryEvent } from '@/analytics/punchClub';

// Track analytics export
trackTelemetryEvent('analytics_export', {
  format: 'json',
  sessionCount: analytics.getSessionCount(),
  uniqueUsers: analytics.getUniqueUserCount(),
  timestamp: Date.now(),
});
```

## Performance

### Caching

Aggregation results are cached for performance:

- Default cache duration: 5 minutes
- Configurable via `aggregation.cacheDuration`
- Cache cleared on new session data

### Optimization Tips

1. **Use appropriate time windows**: Hourly for real-time, daily for historical
2. **Limit group by fields**: Fewer fields = faster aggregation
3. **Filter early**: Apply filters before aggregation
4. **Use presets**: Optimized configurations for common use cases

## Testing

Comprehensive test suite with 60+ test cases:

```bash
# Run tests
npm run test -- tests/unit/punchClub/SessionDurationAnalytics.test.ts

# Test categories:
# - Config utilities (9 tests)
# - Core functionality (6 tests)
# - Aggregation (7 tests)
# - Retention metrics (5 tests)
# - Chart generation (3 tests)
# - Export (4 tests)
# - Presets (3 tests)
# - Privacy (2 tests)
```

## API Reference

### SessionDurationAnalytics

#### Constructor

```typescript
constructor(config?: Partial<SessionAnalyticsConfig>)
```

#### Methods

- `addSession(session: SessionData): void` - Add single session
- `addSessions(sessions: SessionData[]): void` - Add multiple sessions
- `getAggregatedAnalytics(config?: Partial<AggregationConfig>): AggregatedAnalytics[]` - Get aggregated data
- `calculateRetention(): RetentionAnalysis` - Calculate retention metrics
- `generateChartData(type: ChartType): ChartData` - Generate chart data
- `export(format: 'json' | 'csv'): string` - Export analytics
- `clear(): void` - Clear all data
- `getSessionCount(): number` - Get total sessions
- `getUniqueUserCount(): number` - Get unique users
- `updateConfig(config: Partial<SessionAnalyticsConfig>): void` - Update configuration

### Utility Functions

- `getDurationBucket(minutes: number): DurationBucket | null`
- `matchesSegment(session: Record<string, unknown>, segment: AnalyticsSegment): boolean`
- `calculateRetentionRate(cohortSize: number, returnedUsers: number): number`
- `anonymizeUserId(userId: string): string`
- `formatDuration(minutes: number): string`
- `getTimeWindowStart(timestamp: number, window: TimeWindow): number`
- `calculatePercentile(values: number[], percentile: number): number`
- `validatePrivacyCompliance(data: Record<string, unknown>, config: SessionAnalyticsConfig): ValidationResult`

## Future Enhancements

### Phase 2 Features

1. **Real-time Dashboard**: Live analytics dashboard with auto-refresh
2. **Predictive Analytics**: Churn prediction and LTV estimation
3. **A/B Testing**: Session-based experiment analysis
4. **Funnel Analysis**: Multi-step conversion tracking
5. **Cohort Comparison**: Compare cohorts across time periods
6. **Custom Metrics**: User-defined calculated metrics
7. **Alerts**: Threshold-based notifications for key metrics
8. **Data Warehouse Integration**: Export to BigQuery, Snowflake, etc.

### Technical Improvements

1. **Streaming Analytics**: Process sessions in real-time
2. **Distributed Processing**: Handle large-scale data
3. **Machine Learning**: Automated segment discovery
4. **GraphQL API**: Flexible query interface
5. **WebSocket Updates**: Real-time metric updates

## Troubleshooting

### Common Issues

**Issue**: Retention metrics show 0%
- **Cause**: Insufficient data or cohort size below minimum
- **Solution**: Add more sessions or reduce `minCohortSize`

**Issue**: Aggregation is slow
- **Cause**: Too many sessions or complex grouping
- **Solution**: Use filters, increase cache duration, or reduce time window

**Issue**: Privacy validation fails
- **Cause**: PII fields in session data
- **Solution**: Remove PII fields or update `excludePiiFields` config

**Issue**: Chart data is empty
- **Cause**: No sessions in selected time range
- **Solution**: Verify session data and time window configuration

## Support

For issues or questions:

1. Check test suite for usage examples
2. Review config documentation
3. Verify privacy compliance settings
4. Check telemetry diagnostics logs

## License

Part of RPG Balancer project - Internal use only
