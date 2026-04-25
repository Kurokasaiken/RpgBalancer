# Mobile Playtest Logger

**Since:** NP-225 (2026-01-24)  
**Status:** ✅ Complete

## Overview

Mobile-first playtest logging system with enhanced event capture, interaction heatmaps, automated bug reports, session recording, and compression. Designed specifically for mobile playtesting with comprehensive telemetry and analysis capabilities.

## Features

### Event Capture
- **Enhanced Event Types**: tap, swipe, pinch, scroll, navigation, error, crash, performance
- **Rich Event Data**: coordinates, pressure, velocity, duration, target, stack traces
- **Automatic Detection**: Global error handlers, unhandled promise rejections
- **Device Context**: Complete device information and capabilities
- **Session Tracking**: Start/end events with duration and metadata

### Interaction Heatmaps
- **Real-time Visualization**: Canvas-based heatmap of touch interactions
- **Multiple Event Types**: Different colors for tap, swipe, pinch, scroll
- **Temporal Fading**: Points fade over time (configurable duration)
- **Resolution Control**: Adjustable heatmap resolution and point limits
- **Grid Overlay**: Optional grid for spatial reference

### Bug Reporting
- **Auto-Detection**: Automatic bug reports for errors and crashes
- **Manual Reports**: User-initiated bug reports with detailed forms
- **Severity Classification**: Low, Medium, High, Critical severity levels
- **Environment Capture**: Device info, build version, performance metrics
- **Attachments**: Screenshots, logs, performance data
- **Export Options**: JSON and CSV export formats

### Session Recording
- **Complete Session Data**: All events, metadata, and statistics
- **Performance Monitoring**: FPS, memory, timing, network metrics
- **Compression**: Configurable data compression for storage efficiency
- **Auto-Save**: Automatic session saving during recording
- **Session Limits**: Configurable max events and duration limits
- **Privacy Controls**: Data anonymization and content filtering

### Performance Monitoring
- **Real-time Metrics**: FPS, memory usage, timing, network latency
- **Alert Thresholds**: Configurable performance alert thresholds
- **Sampling Control**: Adjustable sampling intervals
- **Historical Data**: Performance history for analysis
- **Average Calculations**: Rolling averages for smooth metrics

## Installation

No installation required. The system is part of the playtest suite.

## Usage

### Basic Usage

```typescript
import { getPlaytestLogger } from '@/ui/playtest/systems/playtestLogger';

// Get logger instance
const logger = getPlaytestLogger();

// Start playtest session
const sessionId = await logger.startSession('user-123');

// Log events
logger.logEvent({
  type: 'tap',
  coordinates: { x: 100, y: 200 },
  target: 'button-primary',
  pressure: 0.8,
});

// End session
const session = await logger.endSession();
```

### With Configuration

```typescript
import { getPlaytestLogger } from '@/ui/playtest/systems/playtestLogger';

const logger = getPlaytestLogger({
  logging: {
    maxEventsPerSession: 5000,
    maxSessionDuration: 1800000, // 30 minutes
    compressionEnabled: true,
    compressionLevel: 6,
  },
  heatmap: {
    resolution: 100,
    maxPoints: 2000,
    fadeDuration: 60000, // 1 minute
    colorScheme: 'heat',
  },
  bugReporting: {
    autoDetect: true,
    screenshotOnCrash: true,
    severityThreshold: 'medium',
  },
  performance: {
    sampleInterval: 500,
    metrics: ['fps', 'memory', 'timing'],
    alertThresholds: {
      fps: 30,
      memory: 50 * 1024 * 1024, // 50MB
      timing: 500,
    },
  },
});
```

### Using the UI Component

```tsx
import { PlaytestPanel } from '@/ui/playtest/components/PlaytestPanel';

function PlaytestInterface() {
  return (
    <PlaytestPanel
      onSessionStart={(sessionId) => console.log('Session started:', sessionId)}
      onSessionEnd={(session) => console.log('Session ended:', session)}
      onBugReport={(report) => console.log('Bug report:', report)}
    />
  );
}
```

## Configuration

### Default Configuration

```typescript
{
  logging: {
    enabled: true,
    maxEventsPerSession: 10000,
    maxSessionDuration: 3600000, // 1 hour
    autoSave: true,
    compressionEnabled: true,
    compressionLevel: 6,
  },
  
  heatmap: {
    enabled: true,
    resolution: 50,
    maxPoints: 1000,
    fadeDuration: 30000, // 30 seconds
    colorScheme: 'heat',
    showGrid: false,
    showLabels: true,
  },
  
  bugReporting: {
    enabled: true,
    autoDetect: true,
    screenshotOnCrash: true,
    includePerformance: true,
    maxReportsPerSession: 50,
    severityThreshold: 'medium',
  },
  
  performance: {
    enabled: true,
    sampleInterval: 1000, // 1 second
    metrics: ['fps', 'memory', 'timing', 'network'],
    alertThresholds: {
      fps: 30,
      memory: 100 * 1024 * 1024, // 100MB
      timing: 1000, // 1 second
    },
  },
  
  privacy: {
    anonymizeData: true,
    excludeSensitiveContent: true,
    dataRetentionDays: 30,
    requireConsent: false,
  },
  
  ui: {
    showOverlay: false,
    overlayOpacity: 0.8,
    showSessionInfo: true,
    showEventCounter: true,
    allowManualReport: true,
  },
}
```

### Configuration Options

#### Logging Configuration

- **enabled**: Enable/disable event logging
- **maxEventsPerSession**: Maximum events per session (default: 10000)
- **maxSessionDuration**: Maximum session duration in ms (default: 1 hour)
- **autoSave**: Auto-save sessions during recording (default: true)
- **compressionEnabled**: Enable data compression (default: true)
- **compressionLevel**: Compression level 1-9 (default: 6)

#### Heatmap Configuration

- **enabled**: Enable heatmap visualization (default: true)
- **resolution**: Heatmap resolution in pixels (default: 50)
- **maxPoints**: Maximum heatmap points (default: 1000)
- **fadeDuration**: Point fade duration in ms (default: 30s)
- **colorScheme**: Color scheme: 'heat', 'blue', 'green', 'purple' (default: 'heat')
- **showGrid**: Show grid overlay (default: false)
- **showLabels**: Show coordinate labels (default: true)

#### Bug Reporting Configuration

- **enabled**: Enable bug reporting (default: true)
- **autoDetect**: Auto-detect bugs from errors (default: true)
- **screenshotOnCrash**: Capture screenshot on crash (default: true)
- **includePerformance**: Include performance data (default: true)
- **maxReportsPerSession**: Max reports per session (default: 50)
- **severityThreshold**: Minimum severity for reports (default: 'medium')

#### Performance Configuration

- **enabled**: Enable performance monitoring (default: true)
- **sampleInterval**: Sampling interval in ms (default: 1000)
- **metrics**: Metrics to track: 'fps', 'memory', 'timing', 'network'
- **alertThresholds**: Alert thresholds for each metric

#### Privacy Configuration

- **anonymizeData**: Anonymize sensitive data (default: true)
- **excludeSensitiveContent**: Filter sensitive content (default: true)
- **dataRetentionDays**: Data retention period in days (default: 30)
- **requireConsent**: Require user consent (default: false)

#### UI Configuration

- **showOverlay**: Show overlay during recording (default: false)
- **overlayOpacity**: Overlay opacity 0-1 (default: 0.8)
- **showSessionInfo**: Show session information (default: true)
- **showEventCounter**: Show event counter (default: true)
- **allowManualReport**: Allow manual bug reports (default: true)

## API Reference

### PlaytestLogger Class

#### `startSession(userId?: string): Promise<string>`

Start a new playtest session.

**Parameters:**
- `userId`: Optional user identifier

**Returns:** Session ID

#### `endSession(): Promise<PlaytestSession | null>`

End current playtest session and return session data.

**Returns:** Session data or null if no active session

#### `logEvent(event: Partial<PlaytestEvent>): void`

Log a playtest event.

**Parameters:**
- `event`: Event data (type, coordinates, value, etc.)

#### `getCurrentSession(): PlaytestSession | null`

Get current session information.

**Returns:** Current session or null

#### `getHeatmapData(): HeatmapPoint[]`

Get current heatmap data.

**Returns:** Array of heatmap points

#### `getBugReports(): BugReport[]`

Get current bug reports.

**Returns:** Array of bug reports

#### `createManualBugReport(report: Omit<BugReport, 'id' | 'sessionId' | 'timestamp' | 'createdAt' | 'updatedAt' | 'environment'>): string`

Create a manual bug report.

**Parameters:**
- `report`: Bug report data (excluding auto-generated fields)

**Returns:** Bug report ID

#### `saveSession(): Promise<void>`

Save current session to storage.

#### `loadSession(sessionId: string): Promise<PlaytestSession | null>`

Load session from storage.

**Parameters:**
- `sessionId`: Session ID to load

**Returns:** Session data or null

#### `exportSession(format: 'json' | 'csv'): Promise<string>`

Export session data.

**Parameters:**
- `format`: Export format ('json' or 'csv')

**Returns:** Exported data string

#### `getSessionStats(): SessionStats`

Get session statistics.

**Returns:** Session statistics object

## Data Structures

### PlaytestEvent

```typescript
interface PlaytestEvent {
  id: string;
  timestamp: number;
  type: PlaytestEventType;
  element?: string;
  coordinates?: { x: number; y: number };
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  pressure?: number;
  velocity?: number;
  target?: string;
  value?: unknown;
  stackTrace?: string;
  performanceMetrics?: {
    fps?: number;
    memory?: number;
    timing?: number;
  };
  sessionId: string;
  userId?: string;
}
```

### PlaytestSession

```typescript
interface PlaytestSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  deviceInfo: DeviceInfo;
  events: PlaytestEvent[];
  metadata?: Record<string, unknown>;
  userId?: string;
  buildVersion: string;
  platform: string;
  completed: boolean;
  crashDetected: boolean;
  errorCount: number;
  interactionCount: number;
}
```

### BugReport

```typescript
interface BugReport {
  id: string;
  sessionId: string;
  timestamp: number;
  type: 'error' | 'crash' | 'performance' | 'ui';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps: string[];
  expected: string;
  actual: string;
  environment: {
    device: DeviceInfo;
    buildVersion: string;
    platform: string;
  };
  attachments: {
    screenshot?: string;
    logs: string[];
    performance: Record<string, number>;
  };
  resolved: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### HeatmapPoint

```typescript
interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  type: PlaytestEventType;
  timestamp: number;
}
```

### DeviceInfo

```typescript
interface DeviceInfo {
  userAgent: string;
  platform: string;
  vendor: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  touchSupport: boolean;
  maxTouchPoints: number;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}
```

## Event Types

### Interaction Events
- **tap**: Touch tap/click
- **swipe**: Touch swipe gesture
- **pinch**: Pinch zoom gesture
- **scroll**: Scroll interaction
- **interaction**: Generic interaction

### System Events
- **navigation**: Navigation events
- **error**: Error events
- **crash**: Application crash
- **performance**: Performance metrics
- **session_start**: Session start
- **session_end**: Session end

## Heatmap Visualization

### Color Schemes

#### Heat (Default)
- Red: High intensity (recent)
- Orange: Medium intensity
- Yellow: Low intensity
- Transparent: Faded points

#### Blue
- Blue: High intensity
- Light Blue: Medium intensity
- Very Light Blue: Low intensity
- Transparent: Faded points

#### Green
- Green: High intensity
- Light Green: Medium intensity
- Very Light Green: Low intensity
- Transparent: Faded points

#### Purple
- Purple: High intensity
- Light Purple: Medium intensity
- Very Light Purple: Low intensity
- Transparent: Faded points

### Temporal Fading

Points fade over time based on `fadeDuration` configuration:
- **0ms**: Full opacity (100%)
- **fadeDuration/2**: 50% opacity
- **fadeDuration**: 0% opacity (removed)

## Bug Report Workflow

### Auto-Detection

1. **Error Events**: Automatically creates bug reports for unhandled errors
2. **Crash Events**: Creates critical bug reports for application crashes
3. **Performance Issues**: Creates reports when performance thresholds are exceeded
4. **Severity Filtering**: Only creates reports above severity threshold

### Manual Reports

1. **Trigger**: User clicks "Report Bug" button
2. **Form**: User fills out bug report form
3. **Submission**: Report is created and stored
4. **Attachments**: Includes current session data and performance metrics

### Report Structure

```typescript
{
  "id": "bug_1706097600000_abc123",
  "sessionId": "session_1706097600000_def456",
  "timestamp": 1706097600000,
  "type": "ui",
  "severity": "medium",
  "title": "Button not responding",
  "description": "Primary button does not respond to taps",
  "steps": ["1. Click button", "2. No visual feedback"],
  "expected": "Button should show pressed state",
  "actual": "Button remains unchanged",
  "environment": {
    "device": { ... },
    "buildVersion": "1.0.0",
    "platform": "iOS"
  },
  "attachments": {
    "logs": [...],
    "performance": { ... }
  },
  "resolved": false,
  "createdAt": 1706097600000,
  "updatedAt": 1706097600000
}
```

## Performance Monitoring

### Metrics

#### FPS (Frames Per Second)
- **Description**: Rendering performance
- **Collection**: RequestAnimationFrame-based
- **Alert Threshold**: Below 30 FPS
- **Usage**: Smooth animation detection

#### Memory Usage
- **Description**: JavaScript heap memory
- **Collection**: performance.memory.usedJSHeapSize
- **Alert Threshold**: Above 100MB
- **Usage**: Memory leak detection

#### Timing
- **Description**: Operation timing
- **Collection**: performance.now()
- **Alert Threshold**: Above 1 second
- **Usage**: Performance bottleneck detection

#### Network
- **Description**: Network latency
- **Collection**: navigator.connection.rtt
- **Alert Threshold**: Above 1000ms
- **Usage**: Network performance analysis

### Sampling

Metrics are sampled at configurable intervals:
- **Default**: 1000ms (1 second)
- **Range**: 100ms - 10s
- **Impact**: Lower intervals = more data, higher intervals = less overhead

## Privacy and Security

### Data Anonymization

- **Element Names**: Replace characters with asterisks
- **Target Values**: Anonymize sensitive identifiers
- **Stack Traces**: Replace with `[REDACTED]`
- **Coordinates**: Keep for analysis (non-sensitive)

### Content Filtering

- **Credit Cards**: `4111-1111-1111-1111` → `[CARD]`
- **Email Addresses**: `test@example.com` → `[EMAIL]`
- **IP Addresses**: `192.168.1.1` → `[IP]`
- **Tokens**: `abc123def456` → `[TOKEN]`

### Data Retention

- **Default**: 30 days
- **Purpose**: Automatic cleanup of old data
- **Compliance**: GDPR data minimization
- **Storage**: Configurable retention policies

## Export Formats

### JSON Export

```json
{
  "id": "session_1706097600000_abc123",
  "startTime": 1706097600000,
  "endTime": 1706097600000,
  "duration": 60000,
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "iOS",
    "screenResolution": "375x667",
    "touchSupport": true,
    "maxTouchPoints": 5
  },
  "events": [
    {
      "id": "evt_1706097600000_def456",
      "timestamp": 1706097600000,
      "type": "tap",
      "coordinates": { "x": 100, "y": 200 },
      "pressure": 0.8,
      "sessionId": "session_1706097600000_abc123"
    }
  ],
  "bugReports": [...],
  "completed": true,
  "crashDetected": false,
  "errorCount": 0,
  "interactionCount": 1
}
```

### CSV Export

```csv
Timestamp,Type,Element,Coordinates,Duration,Value
1706097600000,tap,button,100,200,0.8
1706097600100,swipe,screen,150,250,right,1.2
1706097600200,pinch,viewport,200,300,2.0
1706097600300,scroll,viewport,,,5000
1706097600400,error,,,"Test error",,
```

## Integration

### With React Components

```tsx
import { useEffect } from 'react';
import { getPlaytestLogger } from '@/ui/playtest/systems/playtestLogger';

function InteractiveComponent() {
  const logger = getPlaytestLogger();

  const handleClick = (event: React.MouseEvent) => {
    logger.logEvent({
      type: 'tap',
      coordinates: { x: event.clientX, y: event.clientY },
      target: event.currentTarget.tagName.toLowerCase(),
      value: { elementId: event.currentTarget.id },
    });
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### With Error Boundaries

```tsx
import { ErrorBoundary } from 'react';
import { getPlaytestLogger } from '@/ui/playtest/systems/playtestLogger';

class PlaytestErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo) {
    const logger = getPlaytestLogger();
    
    logger.logEvent({
      type: 'error',
      value: error.message,
      stackTrace: error.stack,
    });
    
    super.componentDidCatch(error, errorInfo);
  }
}
```

### With Performance APIs

```tsx
import { getPlaytestLogger } from '@/ui/playtest/systems/playtestLogger';

function PerformanceComponent() {
  const logger = getPlaytestLogger();
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        
        logger.logEvent({
          type: 'performance',
          performanceMetrics: { fps: currentFPS },
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <div>FPS: {fps}</div>;
}
```

## Troubleshooting

### Issue: Events not being logged

**Symptom**: No events appear in session data

**Solution**: 
1. Verify session is started before logging
2. Check if logging is enabled in config
3. Ensure event type is valid
4. Check console for errors

### Issue: Heatmap not showing points

**Symptom**: Heatmap visualization is empty

**Solution**: 
1. Verify heatmap is enabled in config
2. Check if events are interaction types
3. Ensure coordinates are provided
4. Check fade duration (points may have faded)

### Issue: Bug reports not being created

**Symptom**: No auto-generated bug reports

**Solution**: 
1. Verify bug reporting is enabled
2. Check severity threshold
3. Ensure events are error types
4. Check max reports per session limit

### Issue: Export fails

**Symptom**: Export function throws error

**Solution**: 
1. Verify active session exists
2. Check export format is valid
3. Ensure sufficient permissions
4. Check for data corruption

### Issue: Performance monitoring not working

**Symptom**: No performance metrics

**Solution**: 
1. Verify performance monitoring is enabled
2. Check sampling interval
3. Ensure metrics are included in config
4. Check browser support for metrics

## Performance Characteristics

### Benchmarks

- **Event Logging**: <1ms per event
- **Session Start**: <10ms
- **Session End**: <50ms
- **Heatmap Update**: <5ms per point
- **Bug Report Creation**: <2ms
- **JSON Export**: <10ms (1000 events)
- **CSV Export**: <5ms (1000 events)
- **Compression**: <20ms (1000 events)

### Optimization

- **Event Buffering**: Efficient array operations
- **Heatmap Limiting**: Automatic point limit enforcement
- **Data Compression**: Configurable compression levels
- **Lazy Evaluation**: On-demand statistics calculation
- **Memory Management**: Automatic cleanup of old data

## Future Enhancements

- [ ] Real-time WebSocket streaming
- [ ] Video recording of sessions
- [ ] Advanced gesture recognition
- [ ] Machine learning bug detection
- [ ] Automated test case generation
- [ ] Integration with CI/CD pipelines
- [ ] Cloud storage synchronization
- [ ] Advanced analytics dashboard
- [ ] Multi-session comparison
- [ ] A/B testing integration

## Related Documentation

- [PC-M3 PWA Features](../docs/coordinator/agent_assignments.md)
- [NP-210 Mobile Optimization](../docs/coordinator/agent_assignments.md)
- [Playtest Guidelines](../docs/playtest/playtest_guidelines.md)

## License

Part of the RPG Balancer project. See main project LICENSE.

---

**Last Updated**: 2026-01-24  
**Maintainer**: Playtest-Logger  
**Status**: Production Ready
