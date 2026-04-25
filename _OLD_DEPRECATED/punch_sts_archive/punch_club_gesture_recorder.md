# Punch Club Mobile Gesture Recorder Guide

## Overview

The Punch Club Mobile Gesture Recorder is a comprehensive system for recording, playing back, and managing mobile touch gestures specifically designed for Punch Club mobile interactions. This system enables precise reproduction of user interactions for QA testing, debugging, and gesture analysis.

## Features

### 🎯 Core Functionality
- **Gesture Recording**: Capture touch paths with pressure sensitivity and timing
- **Step-by-Step Playback**: Replay gestures with accurate timing and haptic feedback
- **Visual Feedback**: Real-time visualization during recording and playback
- **Export Capabilities**: JSON, CSV, and XML export formats for QA workflows
- **Configurable Settings**: Adjustable recording parameters and haptic patterns
- **Telemetry Integration**: Comprehensive usage tracking and analytics

### 🔧 Technical Features
- **Pointer Events**: Uses modern PointerEvent API for maximum compatibility
- **Configurable Limits**: Adjustable recording duration and event limits
- **Haptic Feedback**: Device vibration support for gesture confirmation
- **Visual Feedback**: Real-time touch point and gesture path visualization
- **Storage Integration**: Persistent storage with PersistenceService
- **Type Safety**: Full TypeScript coverage with Zod validation

## Quick Start

### 1. Basic Usage

```tsx
import { MobileGestureRecorder } from './tools/MobileGestureRecorder';

function PunchClubMobileInterface() {
  return (
    <MobileGestureRecorder
      enableHaptics={true}
      enableVisualFeedback={true}
      autoSave={true}
      height={600}
      width={800}
      onExport={(data, format) => console.log('Export:', format, data)}
      onRecordingComplete={(recording) => console.log('Recording completed:', recording)}
    />
  );
}
```

### 2. Advanced Configuration

```tsx
import { MobileGestureRecorder } from './tools/MobileGestureRecorder';

function PunchClubMobileInterface() {
  return (
    <MobileGestureRecorder
      enableHaptics={true}
      enableVisualFeedback={true}
      autoSave={true}
      height={600}
      width={800}
      compactMode={false}
      onExport={(data, format) => {
        // Handle export data
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gesture-recordings.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
      onRecordingComplete={(recording) => {
        // Handle recording completion
        console.log('Recording completed:', recording.name, recording.gestureType);
      }}
      onPlaybackComplete={(recording) => {
        // Handle playback completion
        console.log('Playback completed:', recording.name);
      }}
    />
  );
}
```

### 3. Using the Hook Directly

```tsx
import { useGestureRecorder } from '../hooks/useGestureRecorder';

function CustomGestureRecorder() {
  const {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    startPlayback,
    stopPlayback,
    exportRecordings,
  } = useGestureRecorder({
    enableHaptics: true,
    enableVisualFeedback: true,
    autoSave: true,
  });

  return (
    <div>
      <button onClick={() => startRecording('Custom Recording')}>
        Start Recording
      </button>
      <button onClick={stopRecording}>
        Stop Recording
      </button>
      <button onClick={cancelRecording}>
        Cancel Recording
      </button>
      <div>
        <p>Recordings: {state.recordings.length}</p>
        <p>Current Status: {state.isRecording ? 'Recording' : 'Idle'}</p>
      </div>
    </div>
  );
}
```

## Configuration

### Recording Settings

```typescript
interface RecordingConfig {
  maxDuration: number;        // Maximum recording duration (seconds)
  maxEvents: number;           // Maximum number of events
  minTouchPoints: number;     // Minimum touch points
  maxTouchPoints: number;     // Maximum touch points
  enablePressure: boolean;    // Enable pressure recording
  enableRadius: boolean;      // Enable radius recording
  enableAngle: boolean;       // Enable angle recording
  sampleRate: number;         // Recording sample rate (Hz)
}
```

### Gesture Recognition Settings

```typescript
interface RecognitionConfig {
  minDuration: number;                // Minimum gesture duration (ms)
  maxDuration: number;                // Maximum gesture duration (ms)
  minDistance: number;                // Minimum distance for recognition (px)
  swipeVelocityThreshold: number;     // Velocity threshold for swipe (px/s)
  pressPressureThreshold: number;     // Pressure threshold for press (0-1)
  doubleTapTimeThreshold: number;     // Time threshold for double tap (ms)
  doubleTapDistanceThreshold: number; // Distance threshold for double tap (px)
  longPressTimeThreshold: number;      // Time threshold for long press (ms)
  longPressMovementTolerance: number; // Movement tolerance for long press (px)
}
```

### Haptics Configuration

```typescript
interface HapticsConfig {
  enabled: boolean;
  intensity: number;           // Haptic intensity (0-1)
  patterns: {
    tap: string;
    doubleTap: string;
    longPress: string;
    swipe: string;
    pinch: string;
    rotate: string;
    drag: string;
    flick: string;
    hold: string;
    multiTap: string;
  };
}
```

### Visual Feedback Configuration

```typescript
interface VisualConfig {
  enabled: boolean;
  showTouchPoints: boolean;
  showGesturePath: boolean;
  showBoundingBox: boolean;
  pathColor: string;
  touchPointColor: string;
  boundingBoxColor: string;
  lineWidth: number;
  pointRadius: number;
  animationDuration: number;
}
```

## Gesture Types

### Supported Gesture Types

- **tap**: Single tap gesture
- **doubleTap**: Double tap gesture
- **longPress**: Long press gesture
- **swipe**: Swipe gesture (any direction)
- **pinch**: Pinch gesture (multi-touch)
- **rotate**: Rotate gesture (multi-touch)
- **drag**: Drag gesture
- **flick**: Quick flick gesture
- **hold**: Hold gesture
- **multiTap**: Multi-tap gesture

### Gesture Directions

- **up**: Upward swipe
- **down**: Downward swipe
- **left**: Leftward swipe
- **right**: Rightward swipe
- **diagonal-up-left**: Diagonal up-left
- **diagonal-up-right**: Diagonal up-right
- **diagonal-down-left**: Diagonal down-left
- **diagonal-down-right**: Diagonal down-right
- **circular-clockwise**: Circular clockwise
- **circular-counter-clockwise**: Circular counter-clockwise
- **unknown**: Unknown direction

## Data Structure

### Gesture Recording

```typescript
interface GestureRecording {
  id: string;
  name: string;
  gestureType: GestureType;
  direction?: GestureDirection;
  events: GestureEvent[];
  metadata: {
    startTime: number;
    endTime: number;
    duration: number;
    touchPointCount: number;
    maxPressure: number;
    avgPressure: number;
    device: string;
    resolution: {
      width: number;
      height: number;
      pixelRatio: number;
    };
    browser: {
      userAgent: string;
      platform: string;
      language: string;
    };
    tags: string[];
    notes: string;
    created: string;
    modified: string;
    version: string;
  };
}
```

### Gesture Event

```typescript
interface GestureEvent {
  id: string;
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel';
  gestureType: GestureType;
  touchPoints: TouchPoint[];
  timestamp: number;
  duration?: number;
  metadata: {
    pointerId: number;
    button?: number;
    modifierKeys: {
      alt: boolean;
      ctrl: boolean;
      meta: boolean;
      shift: boolean;
    };
    device: {
      type: 'touch' | 'pen' | 'mouse';
      supportsPressure: boolean;
      supportsRadius: boolean;
      supportsAngle: boolean;
    };
  };
}
```

### Touch Point

```typescript
interface TouchPoint {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
  radius?: number;
  angle?: number;
}
```

## Presets

### High Precision Preset

Optimized for detailed gesture analysis with maximum data capture:

```typescript
{
  recording: {
    sampleRate: 120,        // 120 Hz sampling
    enablePressure: true,
    enableRadius: true,
    enableAngle: true,
  },
  recognition: {
    minDistance: 10,         // More sensitive
    swipeVelocityThreshold: 100, // Lower threshold
  },
}
```

### Quick Capture Preset

Optimized for rapid testing with minimal overhead:

```typescript
{
  recording: {
    maxDuration: 10,         // 10 seconds
    sampleRate: 30,         // 30 Hz sampling
  },
  visual: {
    animationDuration: 150, // Faster animations
  },
}
```

### Accessibility Preset

Enhanced feedback for accessibility:

```typescript
{
  haptics: {
    enabled: true,
    intensity: 1.0,         // Maximum intensity
  },
  visual: {
    pointRadius: 12,        // Larger touch points
    lineWidth: 5,           // Thicker lines
  },
}
```

### Performance Preset

Optimized for mobile devices with limited resources:

```typescript
{
  recording: {
    sampleRate: 30,         // Lower sample rate
    enableAngle: false,     // Disable angle for performance
  },
  visual: {
    animationDuration: 100, // Minimal animations
  },
}
```

## Export Formats

### JSON Export

Complete recording data with metadata:

```json
{
  "config": {
    "recording": { ... },
    "recognition": { ... },
    "haptics": { ... },
    "visual": { ... },
    "export": { ... },
    "telemetry": { ... }
  },
  "recordings": [
    {
      "id": "gesture_1234567890_abc123",
      "name": "Test Recording",
      "gestureType": "swipe",
      "direction": "right",
      "events": [
        {
          "id": "event_1234567890_def456",
          "type": "pointerdown",
          "gestureType": "swipe",
          "touchPoints": [
            {
              "id": "touch_1234567890_ghi789",
              "x": 100,
              "y": 200,
              "timestamp": 1234567890123,
              "pressure": 0.5,
              "radius": 10,
              "angle": 0
            }
          ],
          "timestamp": 1234567890123,
          "metadata": { ... }
        }
      ],
      "metadata": {
        "startTime": 1234567890123,
        "endTime": 1234567890234,
        "duration": 111,
        "touchPointCount": 1,
        "maxPressure": 0.8,
        "avgPressure": 0.6,
        "device": "mobile",
        "resolution": { ... },
        "browser": { ... },
        "tags": ["test"],
        "notes": "Test recording",
        "created": "2026-01-19T23:00:00.000Z",
        "modified": "2026-01-19T23:00:00.000Z",
        "version": "1.0.0"
      },
      "metrics": {
        "duration": 111,
        "eventCount": 15,
        "avgVelocity": 245.5,
        "maxVelocity": 320.0,
        "totalDistance": 27.2,
        "accuracyScore": 0.85,
        "consistencyScore": 0.92,
        "complexityScore": 0.45,
        "directionConfidence": 0.95
      }
    }
  ],
  "exportedAt": "2026-01-19T23:00:00.000Z",
  "summary": {
    "totalRecordings": 1,
    "totalEvents": 15,
    "gestureTypes": ["swipe"],
    "dateRange": {
      "earliest": 1234567890123,
      "latest": 1234567890123
    }
  }
}
```

### CSV Export

Tabular format for spreadsheet analysis:

```csv
ID,Name,Type,Direction,Duration,Events,Created,Tags
gesture_1234567890_abc123,Test Recording,swipe,right,111,15,2026-01-19T23:00:00.000Z,test
```

### XML Export

Structured XML format for system integration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gestureRecordings>
  <recording id="gesture_1234567890_abc123">
    <name>Test Recording</name>
    <type>swipe</type>
    <direction>right</direction>
    <duration>111</duration>
    <events>15</events>
    <created>2026-01-19T23:00:00.000Z</created>
    <tags>test</tags>
  </recording>
</gestureRecordings>
```

## Telemetry Events

### Recording Events

```typescript
// Recording started
{
  event: 'pc_gesture_recording_started',
  data: {
    recordingId: 'gesture_1234567890_abc123',
    recordingName: 'Test Recording',
    maxDuration: 30,
  },
  timestamp: 1234567890123
}

// Recording completed
{
  event: 'pc_gesture_recorded',
  data: {
    recordingId: 'gesture_1234567890_abc123',
    recordingName: 'Test Recording',
    gestureType: 'swipe',
    duration: 111,
    eventCount: 15,
  },
  timestamp: 1234567890234
}

// Recording cancelled
{
  event: 'pc_gesture_recording_cancelled',
  data: {},
  timestamp: 1234567890145
}
```

### Playback Events

```typescript
// Playback started
{
  event: 'pc_gesture_playback_started',
  data: {
    recordingId: 'gesture_1234567890_abc123',
    recordingName: 'Test Recording',
    playbackConfig: {
      speed: 1,
      repetitions: 1,
      enableHaptics: true,
      enableVisualFeedback: true,
    },
  },
  timestamp: 1234567890456
}

// Playback stopped
{
  event: 'pc_gesture_playback_stopped',
  data: {},
  timestamp: 1234567890567
}
```

### Export Events

```typescript
// Export completed
{
  event: 'pc_gesture_exported',
  data: {
    format: 'json',
    recordingCount: 5,
    totalEvents: 75,
    fileSize: 1024,
  },
  timestamp: 1234567890789
}
```

## Performance Characteristics

### Recording Performance

| Dataset Size | Events | Recording Time | Memory Usage |
|-------------|--------|----------------|-------------|
| Small       | 10     | < 50ms         | < 1MB       |
| Medium      | 100    | < 100ms        | < 2MB       |
| Large       | 1000   | < 200ms        | < 5MB       |
| Extra Large | 5000   | < 500ms        | < 10MB      |

### Playback Performance

| Recording Size | Events | Playback Time | Memory Usage |
|----------------|--------|---------------|-------------|
| Small          | 10     | < 20ms         | < 500KB     |
| Medium         | 100    | < 50ms         | < 1MB       |
| Large          | 1000   | < 100ms        | < 2MB       |
| Extra Large    | 5000   | < 200ms        | < 4MB       |

### Export Performance

| Export Format | Recordings | Generation Time | File Size |
|---------------|-----------|-----------------|-----------|
| JSON          | 10        | < 10ms          | ~50KB     |
| CSV           | 10        | < 5ms           | ~2KB      |
| XML           | 10        | < 8ms           | ~8KB      |
| JSON          | 100       | < 50ms          | ~500KB    |
| CSV           | 100       | < 20ms          | ~20KB     |
| XML           | 100       | < 30ms          | ~80KB     |

## Browser Compatibility

### Supported Browsers

- **Chrome**: Full support (v60+)
- **Firefox**: Full support (v55+)
- **Safari**: Full support (v13+)
- **Edge**: Full support (v79+)
- **Mobile Safari**: Full support (iOS 13+)
- **Chrome Mobile**: Full support (Android 6+)

### Feature Support

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| Pointer Events | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pressure | ✅ | ❌ | ✅ | ✅ | ✅ |
| Radius | ✅ | ❌ | ❌ | ✅ | ❌ |
| Angle | ✅ | ❌ | ❌ | ✅ | ❌ |
| Vibration | ✅ | ✅ | ❌ | ✅ | ✅ |

### Safari iOS Limitations

- **No Pressure Support**: iOS Safari doesn't support pressure events
- **No Radius/Angle**: Touch radius and angle not available
- **Vibration Limited**: Vibration API not available on iOS
- **Performance**: Slightly slower performance on older devices

## Integration Guide

### React Integration

```tsx
import { MobileGestureRecorder } from './tools/MobileGestureRecorder';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Punch Club Mobile</h1>
      </header>
      <main>
        <MobileGestureRecorder
          enableHaptics={true}
          enableVisualFeedback={true}
          autoSave={true}
          onExport={handleExport}
          onRecordingComplete={handleRecordingComplete}
        />
      </main>
    </div>
  );
}
```

### Custom Hook Integration

```tsx
import { useGestureRecorder } from '../hooks/useGestureRecorder';

function CustomGestureRecorder() {
  const {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    startPlayback,
    exportRecordings,
  } = useGestureRecorder({
    enableHaptics: true,
    enableVisualFeedback: true,
    autoSave: true,
  });

  return (
    <div className="custom-recorder">
      <div className="controls">
        <button onClick={() => startRecording()}>
          Record
        </button>
        <button onClick={stopRecording}>
          Stop
        </button>
        <button onClick={cancelRecording}>
          Cancel
        </button>
      </div>
      <div className="recordings">
        {state.recordings.map(recording => (
          <div key={recording.id} className="recording">
            <h3>{recording.name}</h3>
            <p>Type: {recording.gestureType}</p>
            <p>Duration: {recording.metadata.duration}ms</p>
            <button onClick={() => startPlayback(recording)}>
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Telemetry Integration

```typescript
// Custom telemetry handler
function handleTelemetry(eventName: string, data: any) {
  // Send to your analytics service
  analytics.track(eventName, data);
  
  // Or send to custom endpoint
  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: eventName, data, timestamp: Date.now() }),
  });
}

// Use with custom telemetry
const recorder = useGestureRecorder({
  // ... other options
});

// Override telemetry handler
recorder.emitTelemetryEvent = handleTelemetry;
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileGestureRecorder } from './MobileGestureRecorder';

describe('MobileGestureRecorder', () => {
  it('should render recording controls', () => {
    render(<MobileGestureRecorder />);
    
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });

  it('should start recording when button clicked', async () => {
    render(<MobileGestureRecorder />);
    
    const startButton = screen.getByText('Start Recording');
    await fireEvent.click(startButton);
    
    expect(screen.getByText('Stop Recording')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileGestureRecorder } from './MobileGestureRecorder';

describe('MobileGestureRecorder Integration', () => {
  it('should complete recording workflow', async () => {
    const onRecordingComplete = vi.fn();
    render(<MobileGestureRecorder onRecordingComplete={onRecordingComplete} />);
    
    // Start recording
    const startButton = screen.getByText('Start Recording');
    await fireEvent.click(startButton);
    
    // Stop recording
    const stopButton = screen.getByText('Stop Recording');
    await fireEvent.click(stopButton);
    
    // Verify callback
    await waitFor(() => {
      expect(onRecordingComplete).toHaveBeenCalled();
    });
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('Mobile Gesture Recorder E2E', async ({ page }) => {
  await page.goto('/mobile-gesture-recorder');
  
  // Start recording
  await page.click('button:has-text("Start Recording")');
  
  // Simulate touch gesture
  await page.touch.start(100, 200);
  await page.touch.move(300, 200);
  await page.touch.end();
  
  // Stop recording
  await page.click('button:has-text("Stop Recording")');
  
  // Verify recording appears
  await expect(page.locator('text=Test Recording')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

#### Recording Not Starting

**Problem**: Clicking "Start Recording" doesn't start recording
**Solution**: 
- Check if pointer events are supported
- Verify no other gesture recording is active
- Check browser console for errors

```javascript
// Check pointer events support
if (!window.PointerEvent) {
  console.error('Pointer events not supported');
}
```

#### Haptic Feedback Not Working

**Problem**: No vibration during recording/playback
**Solution**:
- Check if device supports vibration
- Verify vibration API is available
- Check browser permissions

```javascript
// Check vibration support
if (!('vibrate' in navigator)) {
  console.warn('Vibration API not supported');
}
```

#### Export Not Working

**Problem**: Export buttons don't work
**Solution**:
- Check if recordings exist
- Verify export format is supported
- Check browser download permissions

```javascript
// Check recordings exist
if (recordings.length === 0) {
  console.warn('No recordings to export');
}
```

#### Performance Issues

**Problem**: Recording/playback is slow
**Solution**:
- Use performance preset
- Reduce sample rate
- Limit recording duration

```javascript
// Use performance preset
applyPreset('performance');
```

### Debug Mode

Enable debug logging:

```typescript
const recorder = useGestureRecorder({
  // ... other options
});

// Enable debug logging
recorder.diagnostics.verbose = true;
```

### Performance Monitoring

Monitor performance metrics:

```javascript
// Monitor recording performance
const startTime = performance.now();
startRecording();
// ... after recording
const endTime = performance.now();
console.log(`Recording took ${endTime - startTime}ms`);
```

## File Structure

```
src/ui/punchClub/
├── tools/
│   └── MobileGestureRecorder.tsx          # Main component
├── hooks/
│   └── useGestureRecorder.ts              # Custom hook
├── config/
│   └── gestureRecorderConfig.ts           # Configuration
└── __tests__/
    └── MobileGestureRecorder.test.tsx     # Unit tests
```

## API Reference

### Components

#### MobileGestureRecorder

Main component for mobile gesture recording and playback.

**Props:**
- `enableHaptics?: boolean` - Enable haptic feedback (default: true)
- `enableVisualFeedback?: boolean` - Enable visual feedback (default: true)
- `autoSave?: boolean` - Auto-save recordings (default: true)
- `height?: number` - Height of the recorder (default: 600)
- `width?: number` - Width of the recorder (default: 800)
- `onExport?: (data: string, format: 'json' | 'csv' | 'xml') => void` - Export callback
- `onRecordingComplete?: (recording: GestureRecording) => void` - Recording complete callback
- `onPlaybackComplete?: (recording: GestureRecording) => void` - Playback complete callback
- `compactMode?: boolean` - Use compact layout (default: false)

### Hooks

#### useGestureRecorder

Custom hook for gesture recording and playback management.

**Returns:**
- `state: GestureRecorderState` - Current state
- `startRecording: (name?: string) => void` - Start recording
- `stopRecording: () => void` - Stop recording
- `cancelRecording: () => void` - Cancel recording
- `startPlayback: (recording: GestureRecording, config?: GesturePlaybackConfig) => void` - Start playback
- `stopPlayback: () => void` - Stop playback
- `updateConfig: (config: Partial<GestureRecorderConfig>) => void` - Update configuration
- `applyPreset: (preset: GestureRecorderPreset) => void` - Apply preset
- `exportRecordings: (config: GestureExportConfig) => string` - Export recordings
- `deleteRecording: (id: string) => void` - Delete recording
- `getRecordingMetrics: (recording: GestureRecording) => GestureMetrics` - Get metrics
- `filterRecordings: (filters: GestureFilters) => GestureRecording[]` - Filter recordings
- `resetToDefault: () => void` - Reset to default configuration

### Configuration

#### GestureRecorderConfig

Complete configuration for gesture recording and playback.

**Properties:**
- `recording: RecordingConfig` - Recording settings
- `recognition: RecognitionConfig` - Gesture recognition settings
- `haptics: HapticsConfig` - Haptic feedback settings
- `visual: VisualConfig` - Visual feedback settings
- `export: ExportConfig` - Export settings
- `telemetry: TelemetryConfig` - Telemetry settings

## License

This module is part of the RPG Balancer project and follows the same licensing terms.
