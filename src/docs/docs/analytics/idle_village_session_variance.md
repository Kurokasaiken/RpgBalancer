# Idle Village Session Variance Monitor

**Since:** NP-053 – Idle Village Session Variance Monitor  
**Status:** ✅ Complete  
**Last Updated:** 2026-01-20

## Overview

The Session Variance Monitor is a comprehensive analytics system for tracking and analyzing session duration variance across desktop and mobile platforms in Idle Village. It provides real-time monitoring, alerting, and cross-platform reporting capabilities.

## Features

### 🎯 Core Capabilities
- **Real-time Session Tracking**: Monitor session durations as they happen
- **Cross-Platform Analysis**: Compare desktop vs mobile session patterns
- **Variance Detection**: Automatic identification of session duration outliers
- **KPI Monitoring**: Track against configurable targets and thresholds
- **Alert System**: Real-time notifications for variance issues
- **Export Capabilities**: JSON, CSV, and Markdown report generation

### 📊 Dashboard Components
- **Session Variance Widget**: Compact Active HUD widget with real-time updates
- **Platform Distribution**: Visual breakdown of desktop vs mobile sessions
- **Bucket Analysis**: Short/Medium/Long session categorization
- **Trend Charts**: Session duration over time visualization
- **Alert Panel**: Active alerts with severity indicators

### 🔧 Configuration System
- **Bucket Definitions**: Configurable session duration categories
- **KPI Targets**: Platform and bucket distribution targets
- **Alert Thresholds**: Customizable variance and outlier detection
- **Processing Settings**: Batch sizes, refresh intervals, data limits
- **UI Preferences**: Chart types, display options, refresh rates

## Architecture

### File Structure
```
src/ui/idleVillage/
├── config/
│   └── sessionVarianceConfig.ts          # Configuration & types
├── hooks/
│   └── useSessionVariance.ts              # Main React hook
├── components/
│   └── SessionVarianceWidget.tsx          # Dashboard widget
scripts/idleVillage/
└── sessionVarianceReport.ts              # CLI reporting tool
tests/unit/idleVillage/
└── SessionVarianceWidget.test.tsx        # Unit tests
docs/analytics/
└── idle_village_session_variance.md       # Documentation
```

### Data Flow
1. **Session Collection**: Mobile playtest logs + desktop session data
2. **Processing**: Real-time aggregation and statistics calculation
3. **Storage**: Async persistence via PersistenceService
4. **Analysis**: Variance calculation and alert generation
5. **Visualization**: Widget dashboard with charts and metrics
6. **Export**: CLI tool for cross-platform reports

## Configuration

### Session Buckets
```typescript
buckets: {
  short: {
    name: 'Short Sessions',
    minDuration: 0,
    maxDuration: 300,        // 5 minutes
    description: 'Quick play sessions under 5 minutes'
  },
  medium: {
    name: 'Medium Sessions', 
    minDuration: 300,
    maxDuration: 1800,       // 30 minutes
    description: 'Standard play sessions between 5-30 minutes'
  },
  long: {
    name: 'Long Sessions',
    minDuration: 1800,
    maxDuration: Infinity,   // 30+ minutes
    description: 'Extended play sessions over 30 minutes'
  }
}
```

### KPI Targets
```typescript
kpiTargets: {
  targetStdDev: 420,                    // 7 minutes
  maxVariance: 176400,                   // 420²
  targetBucketDistribution: {
    short: 0.3,      // 30%
    medium: 0.5,     // 50% 
    long: 0.2       // 20%
  },
  targetPlatformDistribution: {
    desktop: 0.6,    // 60%
    mobile: 0.4     // 40%
  },
  maxPlatformDivergence: 0.15,           // 15%
  minSessionDuration: 30,                // 30 seconds
  maxSessionDuration: 7200               // 2 hours
}
```

### Alert Thresholds
```typescript
alerts: {
  enabled: true,
  thresholds: {
    varianceThreshold: 0.2,             // 20% above target
    outlierThreshold: 2.0,               // 2 standard deviations
    bucketImbalanceThreshold: 0.1,       // 10% deviation
    platformDivergenceThreshold: 0.15    // 15% divergence
  },
  cooldown: 300000                       // 5 minutes
}
```

## Usage

### React Hook Integration
```typescript
import { useSessionVariance } from '@/ui/idleVillage/hooks/useSessionVariance';

function MyComponent() {
  const variance = useSessionVariance({
    // Custom configuration
    processing: {
      refreshInterval: 5000,  // 5 seconds
      enableRealTime: true
    }
  });

  return (
    <div>
      <p>Total Sessions: {variance.statistics.totalSessions}</p>
      <p>Avg Duration: {variance.statistics.averageDuration}s</p>
      <p>Std Dev: {variance.statistics.standardDeviation}s</p>
      
      {variance.alerts.map(alert => (
        <div key={alert.id}>{alert.message}</div>
      ))}
    </div>
  );
}
```

### Widget Component
```typescript
import { SessionVarianceWidget } from '@/ui/idleVillage/components/SessionVarianceWidget';

function Dashboard() {
  return (
    <SessionVarianceWidget
      size="normal"
      showPlatforms={true}
      showBuckets={true}
      showAlerts={true}
      refreshInterval={10000}
      className="my-widget"
    />
  );
}
```

### CLI Report Generation
```bash
# Generate table report
npx tsx scripts/idleVillage/sessionVarianceReport.ts \
  -i data/mobile-playtest.log \
  -f table \
  -v

# Export JSON report
npx tsx scripts/idleVillage/sessionVarianceReport.ts \
  -i data/desktop-sessions.json \
  -f json \
  -o report.json

# Cross-platform comparison
npx tsx scripts/idleVillage/sessionVarianceReport.ts \
  -i data/combined-sessions.json \
  -f markdown \
  --compare \
  --alerts
```

## Data Sources

### Mobile Playtest Logs
Expected format (JSON per line):
```json
{
  "type": "session_end",
  "data": {
    "sessionId": "mobile-12345",
    "startTime": 1640995200000,
    "endTime": 1640995800000,
    "duration": 600,
    "userId": "user-123",
    "device": "iPhone 13",
    "os": "iOS 15.0",
    "appVersion": "1.2.3"
  }
}
```

### Desktop Session Data
Expected format (JSON array):
```json
[
  {
    "id": "desktop-67890",
    "platform": "desktop",
    "startTime": 1640995200000,
    "endTime": 1640996000000,
    "duration": 800,
    "bucket": "medium",
    "userId": "user-456"
  }
]
```

## Alert Types

### High Variance Alert
**Triggered when:** Session variance exceeds target by configured threshold
**Severity:** High
**Example:** `"Session variance (8m 30s) exceeds target by 25.3%"`

### Outlier Alert  
**Triggered when:** Sessions beyond specified standard deviations
**Severity:** Medium
**Example:** `"Found 5 outlier sessions (±2.0σ)"`

### Bucket Imbalance Alert
**Triggered when:** Bucket distribution deviates from targets
**Severity:** Medium
**Example:** `"Session bucket distribution is imbalanced"`

### Platform Divergence Alert
**Triggered when:** Platform distribution shows divergence
**Severity:** Low
**Example:** `"Platform session distribution shows divergence"`

## Performance Considerations

### Data Limits
- **Max Data Points:** 10,000 sessions (configurable)
- **Batch Processing:** 100 sessions per batch
- **Refresh Interval:** 10 seconds default (configurable)
- **Memory Usage:** ~2MB for 10,000 sessions

### Optimization Features
- **Memoized Calculations:** Statistics cached until data changes
- **Incremental Updates:** Only process new/changed sessions
- **Lazy Loading:** Chart data loaded on demand
- **Cleanup:** Automatic removal of old data beyond limits

## Testing

### Unit Tests
```bash
# Run widget tests
npm run test -- tests/unit/idleVillage/SessionVarianceWidget.test.tsx

# Run hook tests  
npm run test -- tests/unit/idleVillage/useSessionVariance.test.tsx

# Run config tests
npm run test -- tests/unit/idleVillage/sessionVarianceConfig.test.tsx
```

### Mock Data Generation
```typescript
import { generateMockSessionData } from '@/ui/idleVillage/hooks/useSessionVariance';

// Generate 100 mock sessions
const mockSessions = generateMockSessionData(100);
```

### CLI Testing
```bash
# Test with sample data
npx tsx scripts/idleVillage/sessionVarianceReport.ts \
  -i test-data/sample-mobile.log \
  -f table \
  -v
```

## Integration Points

### Active HUD
The widget integrates seamlessly with the Active HUD system:
- **Compact Mode:** Minimal footprint for dashboard display
- **Real-time Updates:** Automatic refresh without user interaction
- **Alert Indicators:** Visual alerts for variance issues
- **Expandable Details:** Full analytics on demand

### PersistenceService
All data persistence uses the async PersistenceService:
- **Configuration:** User preferences and custom settings
- **Session Data:** Aggregated session information
- **Alert History:** Timestamped alert records
- **Export Settings:** Format preferences and options

### Telemetry Integration
Session variance events are tracked for analytics:
```typescript
// Example telemetry event
{
  event: 'idle_session_variance_analyzed',
  data: {
    sessionId: 'session-123',
    platform: 'mobile',
    duration: 600,
    bucket: 'medium',
    varianceContribution: 0.05,
    timestamp: Date.now()
  }
}
```

## Troubleshooting

### Common Issues

#### No Sessions Displayed
**Cause:** Empty data source or parsing errors
**Solution:** Check input file format and accessibility

#### High Memory Usage
**Cause:** Too many data points loaded
**Solution:** Reduce `maxDataPoints` in configuration

#### Missing Alerts
**Cause:** Alerts disabled or thresholds too high
**Solution:** Enable alerts and adjust threshold values

#### CLI Parse Errors
**Cause:** Invalid JSON format in input files
**Solution:** Validate input file structure and content

### Debug Mode
Enable verbose logging for troubleshooting:
```typescript
const variance = useSessionVariance({
  processing: {
    enableRealTime: true,
    verbose: true
  }
});
```

## Future Enhancements

### Planned Features
- **Predictive Analytics**: ML-based session duration prediction
- **Cohort Analysis**: User segment comparison
- **Geographic Distribution**: Regional session patterns
- **Performance Metrics**: FPS and performance correlation
- **A/B Testing**: Feature impact on session duration

### API Extensions
- **WebSocket Integration**: Real-time session streaming
- **GraphQL Support**: Efficient data querying
- **Webhook Alerts**: External alert notifications
- **Export Automation**: Scheduled report generation

## Contributing

When contributing to the Session Variance Monitor:

1. **Follow Config-First Principles**: All thresholds and settings in configuration
2. **Maintain Type Safety**: Use TypeScript interfaces for all data structures  
3. **Add Tests**: Cover new features with unit and integration tests
4. **Update Documentation**: Keep this file synchronized with changes
5. **Performance Testing**: Validate impact on large datasets

## License

This component is part of the RPG Balancer project and follows the same licensing terms.

---

**Related Documentation:**
- [RPG Balancer Philosophy](../../docs/plans/art_direction_plan.md)
- [Config-Driven Architecture](../../docs/plans/config_driven_balancer_plan.md)
- [Active HUD Integration](../../docs/plans/idle_village_plan.md)
- [Storage Testing Framework](../../docs/STORAGE_TESTING_GUIDE.md)
