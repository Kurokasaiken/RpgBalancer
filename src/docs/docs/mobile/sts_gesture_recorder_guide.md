# STS Mobile Gesture Recorder Guide

## Overview

The STS Mobile Gesture Recorder is a comprehensive system for recording, playing back, and managing mobile touch gestures for QA testing of the STS (Slay the Spire) mobile interface. This system enables precise reproduction of user interactions for automated testing and debugging.

## Features

### 🎯 Core Functionality
- **Gesture Recording**: Capture touch paths with pressure sensitivity and timing
- **Step-by-Step Playback**: Replay gestures with accurate timing and pressure
- **Visual Overlay**: Real-time visualization during recording and playback
- **Pack Management**: Import/export gesture packs with security validation
- **CLI Tools**: Command-line interface for batch operations and telemetry

### 🔧 Technical Features
- **Pointer Events**: Uses modern PointerEvent API for maximum compatibility
- **Configurable Limits**: Adjustable recording duration and point limits
- **Security**: Signed gesture packs to prevent unauthorized loading
- **Storage**: LocalStorage persistence with automatic backup
- **Telemetry**: Comprehensive usage tracking and analytics

## Quick Start

### 1. Enable QA Mode

```typescript
import { GestureRecorder } from '@/ui/tools/sts/mobile/gestureRecorder';

function STSMobileInterface() {
  const [qaEnabled, setQAEnabled] = useState(false);
  
  return (
    <div>
      {/* Toggle QA mode */}
      <button onClick={() => setQAEnabled(!qaEnabled)}>
        {qaEnabled ? 'Disable QA' : 'Enable QA'}
      </button>
      
      {/* Gesture Recorder - only visible when QA enabled */}
      <GestureRecorder 
        enableQA={qaEnabled}
        onRecordingComplete={(recording) => {
          console.log('Recording completed:', recording);
        }}
        onPackExported={(pack) => {
          console.log('Pack exported:', pack);
        }}
      />
    </div>
  );
}
```

### 2. Record a Gesture

1. **Enable QA Mode** - Toggle the QA switch in the interface
2. **Name Your Gesture** - Enter a descriptive name (e.g., "card_swipe_right")
3. **Start Recording** - Click "Start Recording" button
4. **Perform Gesture** - Execute the touch gesture on the screen
5. **Stop Recording** - Click "Stop Recording" or wait for auto-stop

### 3. Playback and Export

```typescript
// Play back a recorded gesture
const { playGesture, isPlaying } = useGestureRecorder();

// Play with custom speed
playGesture(recording, targetElement, { speed: 0.5 });

// Export as signed pack
const pack = exportPack('My Test Pack', 'Collection of swipe gestures');
```

## CLI Usage

### Installation

The CLI tool is located at `scripts/stsTelemetry/gesturePackCLI.ts`:

```bash
# Make executable
chmod +x scripts/stsTelemetry/gesturePackCLI.ts

# Run directly
npx tsx scripts/stsTelemetry/gesturePackCLI.ts --help
```

### Commands

#### Import a Gesture Pack

```bash
# Import with validation
npx tsx scripts/stsTelemetry/gesturePackCLI.ts import pack.json --validate --sign

# Import unsigned pack (will be rejected)
npx tsx scripts/stsTelemetry/gesturePackCLI.ts import pack.json
```

#### Export Gesture Packs

```bash
# Export all recordings as JSON
npx tsx scripts/stsTelemetry/gesturePackCLI.ts export -o my-pack.json -n "My Pack"

# Export as CSV for analysis
npx tsx scripts/stsTelemetry/gesturePackCLI.ts export -f csv -o gestures.csv

# Export as Markdown documentation
npx tsx scripts/stsTelemetry/gesturePackCLI.ts export -f markdown -o gestures.md
```

#### List Available Packs

```bash
# List all packs in default directory
npx tsx scripts/stsTelemetry/gesturePackCLI.ts list

# List packs in custom directory
npx tsx scripts/stsTelemetry/gesturePackCLI.ts list --directory ./my-packs
```

#### Analyze Pack Statistics

```bash
# Analyze a specific pack
npx tsx scripts/stsTelemetry/gesturePackCLI.ts analyze pack.json

# Get detailed statistics
npx tsx scripts/stsTelemetry/gesturePackCLI.ts analyze pack.json --verbose
```

#### Validate Pack Structure

```bash
# Validate pack format
npx tsx scripts/stsTelemetry/gesturePackCLI.ts validate pack.json

# Validate with detailed output
npx tsx scripts/stsTelemetry/gesturePackCLI.ts validate pack.json --verbose
```

## API Reference

### useGestureRecorder Hook

```typescript
import { useGestureRecorder } from '@/ui/tools/sts/mobile/hooks/useGestureRecorder';

const {
  isRecording,
  isPlaying,
  currentRecording,
  recordings,
  playbackProgress,
  startRecording,
  stopRecording,
  playGesture,
  stopPlayback,
  exportPack,
  importPack,
  deleteRecording,
  clearRecordings,
  setPlaybackSpeed,
  pausePlayback,
  resumePlayback,
} = useGestureRecorder(config, persistenceService);
```

#### Configuration Options

```typescript
interface GestureRecorderConfig {
  maxRecordingDuration?: number;  // Default: 5000ms
  maxPoints?: number;             // Default: 1000
  enablePressure?: boolean;       // Default: true
  storageKey?: string;            // Default: 'sts_gesture_recordings'
  telemetryEnabled?: boolean;     // Default: true
}
```

### Data Structures

#### Gesture Point

```typescript
interface GesturePoint {
  x: number;           // Screen X coordinate
  y: number;           // Screen Y coordinate
  pressure?: number;    // Touch pressure (0-1)
  timestamp: number;   // Time since gesture start (ms)
  type: 'start' | 'move' | 'end';
}
```

#### Gesture Recording

```typescript
interface GestureRecording {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  points: GesturePoint[];
  metadata: {
    deviceType: string;
    screenSize: { width: number; height: number };
    touchCount: number;
    totalDistance: number;
    averageSpeed: number;
    recordedAt: number;
    version: string;
  };
}
```

#### Gesture Pack

```typescript
interface GesturePack {
  id: string;
  name: string;
  description?: string;
  version: string;
  gestures: GestureRecording[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    signed: boolean;
    signature?: string;
  };
}
```

## Security Considerations

### Pack Signing

All gesture packs must be signed before import:

```typescript
// Automatic signing on export
const signedPack = exportPack('Test Pack', 'Description', { sign: true });

// Manual signing
const signature = generateSignature(packData);
pack.metadata.signed = true;
pack.metadata.signature = signature;
```

### Validation Rules

- **Unsigned packs are rejected** - Cannot load unsigned gesture packs
- **Structure validation** - All required fields must be present
- **Type validation** - Data types must match expected formats
- **Point limits** - Maximum 1000 points per gesture
- **Duration limits** - Maximum 5 seconds per gesture

## Telemetry and Analytics

### Events Tracked

```typescript
// Recording events
'recording_started'
'recording_stopped'
'recording_auto_stopped'

// Playback events
'playback_started'
'playback_stopped'
'playback_completed'

// Pack events
'pack_created'
'pack_imported'
'pack_exported'
'pack_validated'

// Error events
'recording_error'
'playback_error'
'validation_error'
```

### Usage Analytics

The system tracks:
- Recording frequency and duration
- Most common gesture patterns
- Pack import/export statistics
- Error rates and types
- Device and screen size distribution

## Troubleshooting

### Common Issues

#### Recording Not Starting

```typescript
// Check QA mode is enabled
if (!enableQA) {
  console.error('Gesture recording requires QA mode to be enabled');
}

// Check recording name
if (!recordingName.trim()) {
  console.error('Recording name cannot be empty');
}
```

#### Playback Not Working

```typescript
// Ensure target element is provided
if (!targetElement) {
  console.error('Playback requires a target element');
}

// Check if already playing
if (isPlaying) {
  console.warn('Already playing a gesture');
}
```

#### Pack Import Failed

```typescript
// Check if pack is signed
if (!pack.metadata.signed) {
  console.error('Cannot import unsigned pack');
}

// Validate pack structure
const validation = validatePack(pack);
if (!validation.valid) {
  console.error('Pack validation failed:', validation.errors);
}
```

### Performance Tips

1. **Limit Recording Duration** - Use shorter recordings for better performance
2. **Reduce Point Density** - Adjust recording sensitivity to capture fewer points
3. **Clear Old Recordings** - Regularly clean up unused recordings
4. **Use Playback Speed** - Speed up playback for faster testing cycles

## Integration Examples

### Automated Testing

```typescript
// Test suite with gesture replay
describe('Mobile Card Interactions', () => {
  it('should swipe card right', async () => {
    const gesture = loadGesture('card_swipe_right');
    await playGesture(gesture, cardElement);
    
    expect(cardElement.classList.contains('swiped-right')).toBe(true);
  });
  
  it('should tap card to select', async () => {
    const gesture = loadGesture('card_tap_select');
    await playGesture(gesture, cardElement);
    
    expect(cardElement.classList.contains('selected')).toBe(true);
  });
});
```

### CI/CD Integration

```bash
# Export test gestures
npx tsx scripts/stsTelemetry/gesturePackCLI.ts export \
  -n "Test Suite Gestures" \
  -o test-gestures.json \
  --sign

# Validate in CI
npx tsx scripts/stsTelemetry/gesturePackCLI.ts validate test-gestures.json
```

## Best Practices

### Recording Guidelines

1. **Use Descriptive Names** - Clear, consistent naming conventions
2. **Record in Context** - Capture gestures in realistic usage scenarios
3. **Test Variations** - Record multiple variations of the same gesture
4. **Document Purpose** - Include descriptions explaining gesture intent

### Pack Management

1. **Version Control** - Use semantic versioning for packs
2. **Regular Backups** - Export and backup important gesture collections
3. **Security First** - Always sign packs before distribution
4. **Validation** - Validate packs before import in production

### Testing Strategy

1. **Comprehensive Coverage** - Cover all critical user interactions
2. **Edge Cases** - Include boundary conditions and error scenarios
3. **Performance Testing** - Monitor playback performance
4. **Cross-Device Testing** - Test on different screen sizes

## Future Enhancements

### Planned Features

- **Video Export** - Convert gestures to animated GIF/MP4
- **Cloud Storage** - Sync gesture packs across devices
- **AI Analysis** - Automatic gesture pattern recognition
- **Multi-Touch** - Support for complex multi-finger gestures
- **Performance Metrics** - Detailed timing and accuracy analysis

### API Extensions

```typescript
// Future: Video export
await exportPackAsVideo(pack, 'gestures.mp4', {
  fps: 30,
  resolution: '1080p',
  showTouchPoints: true,
});

// Future: Cloud sync
await syncPackToCloud(pack, {
  provider: 'aws-s3',
  encryption: true,
});

// Future: AI analysis
const analysis = await analyzeGesturePatterns(pack, {
  detectAnomalies: true,
  suggestOptimizations: true,
});
```

## Support and Contributing

### Getting Help

- **Documentation**: Check this guide and inline code comments
- **Examples**: See `src/ui/tools/sts/mobile/examples/` for sample implementations
- **Tests**: Review `tests/unit/sts/` for usage patterns

### Contributing

1. **Code Style**: Follow project ESLint configuration
2. **Tests**: Add unit tests for new features
3. **Documentation**: Update this guide for API changes
4. **Security**: Maintain pack signing and validation standards

---

*Last updated: 2026-01-19*
*Version: 1.0.0*
  );
}
```

### 2. Record a Gesture

1. **Enable QA Mode** - Toggle the QA switch
2. **Enter Gesture Name** - Type a descriptive name (e.g., "card-drag-to-play")
3. **Start Recording** - Click "Start Recording" or press `Ctrl+R`
4. **Perform Gesture** - Execute the touch interaction on screen
5. **Stop Recording** - Click "Stop Recording" or wait for auto-stop

### 3. Playback and Testing

```typescript
import { useGestureRecorder } from '@/ui/tools/sts/hooks/useGestureRecorder';

function GesturePlayback() {
  const { recordings, playGesture, isPlaying } = useGestureRecorder();
  
  const handlePlayGesture = async (gesture) => {
    console.log('Playing gesture:', gesture.name);
    await playGesture(gesture);
  };
  
  return (
    <div>
      <h3>Recorded Gestures ({recordings.length})</h3>
      {recordings.map(gesture => (
        <div key={gesture.id}>
          <span>{gesture.name}</span>
          <button 
            onClick={() => handlePlayGesture(gesture)}
            disabled={isPlaying}
          >
            Play
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### useGestureRecorder Hook

```typescript
const {
  // State
  isRecording,
  isPlaying,
  currentRecording,
  recordings,
  playbackProgress,
  
  // Recording actions
  startRecording,
  stopRecording,
  
  // Playback actions
  playGesture,
  stopPlayback,
  
  // Storage actions
  saveRecording,
  loadRecordings,
  deleteRecording,
  clearRecordings,
  
  // Pack actions
  exportPack,
  importPack,
} = useGestureRecorder(options);
```

#### Options

```typescript
interface UseGestureRecorderOptions {
  maxRecordingDuration?: number; // Default: 10000ms (10s)
  maxPoints?: number;           // Default: 1000
  enablePressure?: boolean;     // Default: true
  autoSave?: boolean;           // Default: false
}
```

#### Data Types

```typescript
interface GesturePoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
  type: 'start' | 'move' | 'end';
}

interface GestureRecording {
  id: string;
  name: string;
  duration: number;
  points: GesturePoint[];
  metadata: {
    deviceInfo?: string;
    screenSize?: { width: number; height: number };
    recordedAt: number;
    version: string;
  };
}

interface GesturePack {
  id: string;
  name: string;
  description: string;
  version: string;
  gestures: GestureRecording[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    deviceInfo?: string;
    signed: boolean;
    signature?: string;
  };
}
```

### CLI Commands

#### Install CLI

```bash
# Make CLI executable
chmod +x scripts/stsTelemetry/gesturePackCLI.ts

# Run directly
npx tsx scripts/stsTelemetry/gesturePackCLI.ts --help
```

#### Available Commands

```bash
# Import a gesture pack
sts-gesture-pack import pack.json --validate --sign

# Export recordings to pack
sts-gesture-pack export --name "My Pack" --description "Test gestures"

# List all packs in directory
sts-gesture-pack list ./gesture-packs/

# Analyze pack statistics
sts-gesture-pack analyze pack.json

# Validate pack structure
sts-gesture-pack validate pack.json

# Convert to video (placeholder)
sts-gesture-pack convert pack.json --format gif --output animation.gif
```

#### CLI Options

```bash
# Import options
--output <path>     # Output directory for imported pack
--validate          # Validate pack structure
--sign              # Sign pack if unsigned
--verbose           # Verbose output

# Export options
--output <path>     # Output file path
--name <name>       # Pack name
--description <desc> # Pack description
--format <format>   # Export format (json|csv|markdown)
--sign              # Sign the pack
```

## Mobile Guide

### Device Setup

1. **Enable Touch Events** - Ensure device supports PointerEvent API
2. **QA Mode Required** - Recording only works when QA mode is enabled
3. **Screen Size** - System adapts to different screen sizes automatically
4. **Pressure Support** - Available on devices with pressure sensitivity

### Recording Best Practices

#### 1. Gesture Naming
```typescript
// Good names
"card-drag-to-play-area"
"button-tap-confirm"
"scroll-down-deck-list"
"swipe-left-discard-card"

// Avoid
"test1"
"gesture"
"asdf"
```

#### 2. Recording Environment
- **Consistent Device** - Record on same device type for testing
- **Stable Orientation** - Keep device orientation consistent
- **Clean Screen** - Avoid system notifications during recording
- **Realistic Speed** - Record at natural user interaction speed

#### 3. Gesture Types

##### Card Interactions
```typescript
// Drag card to play area
const cardDragGesture = {
  name: "card-drag-to-play-area",
  points: [
    { type: 'start', x: 50, y: 400, timestamp: 0 },
    { type: 'move', x: 100, y: 350, timestamp: 100 },
    { type: 'move', x: 150, y: 300, timestamp: 200 },
    { type: 'end', x: 200, y: 250, timestamp: 300 },
  ],
};
```

##### Button Taps
```typescript
// Quick button tap
const buttonTapGesture = {
  name: "end-turn-button-tap",
  points: [
    { type: 'start', x: 300, y: 500, timestamp: 0 },
    { type: 'end', x: 300, y: 500, timestamp: 50 },
  ],
};
```

##### Scroll Gestures
```typescript
// Scroll down gesture
const scrollGesture = {
  name: "scroll-down-deck-list",
  points: [
    { type: 'start', x: 160, y: 200, timestamp: 0 },
    { type: 'move', x: 160, y: 250, timestamp: 100 },
    { type: 'move', x: 160, y: 300, timestamp: 200 },
    { type: 'move', x: 160, y: 350, timestamp: 300 },
    { type: 'end', x: 160, y: 350, timestamp: 400 },
  ],
};
```

### Testing Workflow

#### 1. Create Test Suite
```typescript
// test-suite.json
{
  "name": "STS Mobile Test Suite",
  "description": "Core mobile interactions",
  "version": "1.0.0",
  "gestures": [
    "card-drag-to-play-area",
    "button-tap-confirm",
    "scroll-down-deck-list",
    "swipe-left-discard-card"
  ]
}
```

#### 2. Automated Testing
```typescript
async function runMobileTests() {
  const testSuite = await loadGesturePack('test-suite.json');
  const results = [];
  
  for (const gesture of testSuite.gestures) {
    try {
      await playGesture(gesture);
      await waitForAnimationComplete();
      const result = await validateGameState();
      results.push({ gesture: gesture.name, success: true, result });
    } catch (error) {
      results.push({ gesture: gesture.name, success: false, error });
    }
  }
  
  return results;
}
```

#### 3. Regression Testing
```typescript
// Compare gesture performance over time
function analyzeGesturePerformance(gesture, baseline) {
  const metrics = {
    duration: gesture.duration,
    pointCount: gesture.points.length,
    avgVelocity: calculateAverageVelocity(gesture.points),
    pressureProfile: analyzePressureProfile(gesture.points),
  };
  
  return {
    metrics,
    regression: compareWithBaseline(metrics, baseline),
    recommendations: generateRecommendations(metrics),
  };
}
```

## Security Considerations

### 1. Pack Signing
- **Unsigned Packs**: Cannot be loaded (security requirement)
- **Signature Validation**: Simple Base64 hash for development
- **Production**: Use proper cryptographic signing

### 2. Data Validation
- **Structure Validation**: All packs validated before import
- **Point Limits**: Maximum 1000 points per gesture
- **Duration Limits**: Maximum 10 seconds per recording
- **Size Limits**: Maximum 1MB per pack

### 3. Access Control
- **QA Mode Required**: Recording only when QA enabled
- **Local Storage Only**: No network transmission
- **User Consent**: Clear indication when recording

## Performance Optimization

### 1. Recording Performance
```typescript
// Optimized recording options
const optimizedOptions = {
  maxRecordingDuration: 5000,    // 5 seconds for quick gestures
  maxPoints: 500,                // Reasonable point limit
  enablePressure: false,         // Disable if not needed
  autoSave: true,                // Auto-save for convenience
};
```

### 2. Playback Performance
```typescript
// Efficient playback with throttling
const playbackOptions = {
  throttleMs: 16,               // 60fps playback
  skipIdlePoints: true,         // Skip redundant points
  pressureSmoothing: true,       // Smooth pressure changes
};
```

### 3. Storage Optimization
```typescript
// Compressed storage format
const compressedGesture = {
  ...gesture,
  points: gesture.points.map(point => ({
    x: Math.round(point.x),
    y: Math.round(point.y),
    t: Math.round(point.timestamp),
    p: point.pressure ? Math.round(point.pressure * 100) : undefined,
    type: point.type[0], // 's', 'm', 'e'
  })),
};
```

## Troubleshooting

### Common Issues

#### 1. Recording Not Starting
```typescript
// Check QA mode
if (!enableQA) {
  console.error('QA mode must be enabled to record gestures');
}

// Check device support
if (!window.PointerEvent) {
  console.error('PointerEvent API not supported');
}
```

#### 2. Playback Not Working
```typescript
// Check gesture validity
function validateGesture(gesture) {
  if (!gesture.points.length) {
    throw new Error('Gesture has no points');
  }
  
  if (gesture.points[0].type !== 'start') {
    throw new Error('Gesture must start with pointerdown');
  }
  
  if (gesture.points[gesture.points.length - 1].type !== 'end') {
    throw new Error('Gesture must end with pointerup');
  }
}
```

#### 3. Pack Import Fails
```typescript
// Check pack signature
function validatePackSignature(pack) {
  if (!pack.metadata.signed) {
    throw new Error('Pack must be signed');
  }
  
  if (!pack.metadata.signature) {
    throw new Error('Pack signature missing');
  }
}
```

### Debug Mode
```typescript
// Enable debug logging
const debugOptions = {
  verbose: true,
  logPointerEvents: true,
  logPlaybackSteps: true,
  validateAfterRecording: true,
};

// Debug console output
console.log('Gesture Recorder Debug:', {
  isRecording,
  currentPointCount: currentRecording?.points.length,
  playbackProgress,
  storageSize: localStorage.getItem('sts_gesture_recordings')?.length,
});
```

## Integration Examples

### 1. STS Mobile App Integration
```typescript
// STSMobileApp.tsx
import { GestureRecorder } from '@/ui/tools/sts/mobile/gestureRecorder';

export function STSMobileApp() {
  const [qaMode, setQaMode] = useState(false);
  
  return (
    <div className="sts-mobile-app">
      {/* Main STS Interface */}
      <STSGameInterface />
      
      {/* QA Overlay */}
      {qaMode && (
        <div className="qa-overlay">
          <GestureRecorder 
            enableQA={qaMode}
            onRecordingComplete={handleRecordingComplete}
          />
        </div>
      )}
      
      {/* QA Toggle */}
      <button 
        className="qa-toggle"
        onClick={() => setQaMode(!qaMode)}
      >
        QA: {qaMode ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
```

### 2. Automated Testing Integration
```typescript
// MobileTestRunner.tsx
import { useGestureRecorder } from '@/ui/tools/sts/hooks/useGestureRecorder';

export function MobileTestRunner() {
  const { recordings, playGesture } = useGestureRecorder();
  const [testResults, setTestResults] = useState([]);
  
  const runTestSuite = async () => {
    const results = [];
    
    for (const recording of recordings) {
      try {
        // Reset game state
        await resetGameState();
        
        // Play gesture
        await playGesture(recording);
        
        // Validate result
        const validationResult = await validateGameState();
        
        results.push({
          gesture: recording.name,
          success: validationResult.valid,
          error: validationResult.error,
          timestamp: Date.now(),
        });
      } catch (error) {
        results.push({
          gesture: recording.name,
          success: false,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }
    
    setTestResults(results);
    emitTelemetry('mobile_test_suite_completed', { results });
  };
  
  return (
    <div className="mobile-test-runner">
      <button onClick={runTestSuite}>
        Run Test Suite ({recordings.length} gestures)
      </button>
      
      <div className="test-results">
        {testResults.map(result => (
          <div key={result.timestamp} className={`test-result ${result.success ? 'success' : 'failure'}`}>
            <span>{result.gesture}</span>
            <span>{result.success ? '✅' : '❌'}</span>
            {result.error && <span className="error">{result.error}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. CI/CD Integration
```bash
# .github/workflows/mobile-gesture-tests.yml
name: Mobile Gesture Tests

on: [push, pull_request]

jobs:
  gesture-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Validate gesture packs
        run: |
          npx tsx scripts/stsTelemetry/gesturePackCLI.ts validate tests/mobile/gestures/*.json
          
      - name: Analyze gesture performance
        run: |
          npx tsx scripts/stsTelemetry/gesturePackCLI.ts analyze tests/mobile/gestures/test-suite.json
          
      - name: Run mobile tests
        run: npm run test:mobile:gestures
```

## Best Practices Summary

### ✅ Do
- Enable QA mode before recording
- Use descriptive gesture names
- Test on target devices
- Validate pack structure before import
- Sign all production packs
- Monitor pack sizes (<1MB)
- Use consistent recording environment

### ❌ Don't
- Record without QA mode enabled
- Use generic gesture names
- Mix device types in same pack
- Load unsigned packs
- Exceed recording limits
- Ignore validation errors
- Record in unstable environments

## Future Enhancements

### Planned Features
- **Video Export**: Convert gestures to animated GIF/MP4
- **Cloud Storage**: Sync gesture packs across devices
- **AI Analysis**: Automatic gesture pattern recognition
- **Performance Metrics**: Advanced analytics and insights
- **Multi-touch**: Support for complex multi-finger gestures
- **Device Profiles**: Per-device calibration and optimization

### Integration Roadmap
1. **Phase 1**: Core recording/playback functionality ✅
2. **Phase 2**: CLI tools and pack management ✅
3. **Phase 3**: Video export and analytics 🔄
4. **Phase 4**: Cloud sync and AI analysis 📋
5. **Phase 5**: Advanced multi-touch support 📋

---

## Support

For questions, issues, or feature requests:
1. Check the troubleshooting section above
2. Review the API documentation
3. Create an issue in the project repository
4. Contact the mobile QA team

**Version**: 1.0.0  
**Last Updated**: 2026-01-13  
**Compatibility**: STS Mobile v2.0+
