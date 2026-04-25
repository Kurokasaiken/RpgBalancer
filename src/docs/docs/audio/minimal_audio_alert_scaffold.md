# Minimal Audio Alert Scaffold

This document describes the Minimal Audio Alert Scaffold for providing audio feedback in Minimal Gameplay, including configuration, usage patterns, and integration guidelines.

## Overview

The Minimal Audio Alert Scaffold provides a lightweight, config-first audio alert system for Minimal Gameplay. It supports warning and injury sound alerts with lazy loading, throttling to prevent alert spam, and comprehensive telemetry integration.

## Architecture

### Core Components

- **`minimalAlerts.ts`**: Main implementation with configuration and playback logic
- **Web Audio API**: Browser-native audio processing for low-latency playback
- **Lazy Loading**: Audio assets loaded on-demand to minimize initial bundle size
- **Throttling System**: Prevents rapid alert spam with configurable cooldown periods

### Data Flow

```mermaid
graph TD
    A[Game Event] --> B{Alert Type?}
    B -->|Warning| C[playMinimalAlert('warning')]
    B -->|Injury| D[playMinimalAlert('injury')]
    C --> E{Throttled?}
    D --> E
    E -->|Yes| F[Emit Throttled Telemetry]
    E -->|No| G[Load Audio Asset]
    G --> H[Decode Audio Buffer]
    H --> I[Create Audio Nodes]
    I --> J[Apply Volume & Play]
    J --> K[Emit Success Telemetry]
    F --> L[End]
    K --> L
```

## Configuration

### Default Configuration

```typescript
const defaultMinimalAudioAlertConfig = {
  warningSound: 'minimal/placeholder.wav',
  injurySound: 'minimal/placeholder.wav',
  volume: 0.7,
  throttleMs: 3000, // 3 seconds between alerts
};
```

### Configuration Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `warningSound` | `string` | Path to warning sound asset | `'minimal/placeholder.wav'` |
| `injurySound` | `string` | Path to injury sound asset | `'minimal/placeholder.wav'` |
| `volume` | `number` | Global volume (0.0 - 1.0) | `0.7` |
| `throttleMs` | `number` | Minimum time between alerts (ms) | `3000` |

### Runtime Configuration

```typescript
import { configureMinimalAlerts } from '@/audio/idleVillage/minimalAlerts';

// Configure with custom settings
configureMinimalAlerts({
  volume: 0.5,
  throttleMs: 2000,
  warningSound: 'game/warning-chime.wav',
  injurySound: 'game/injury-alert.wav',
});

// Reset to defaults
import { resetMinimalAlertConfig } from '@/audio/idleVillage/minimalAlerts';
resetMinimalAlertConfig();
```

## Usage

### Basic Alert Playback

```typescript
import { playMinimalAlert } from '@/audio/idleVillage/minimalAlerts';

// Play warning sound
await playMinimalAlert('warning');

// Play injury sound
await playMinimalAlert('injury');
```

### Integration with Game Events

```typescript
// In game event handler
function handlePlayerWarning() {
  // Update game state
  updatePlayerStatus('warning');

  // Play audio alert
  playMinimalAlert('warning').catch(error => {
    console.warn('Failed to play warning alert:', error);
  });
}

function handlePlayerInjury() {
  // Update game state
  updatePlayerHealth(damage);

  // Play audio alert
  playMinimalAlert('injury').catch(error => {
    console.warn('Failed to play injury alert:', error);
  });
}
```

### Error Handling

```typescript
try {
  await playMinimalAlert('warning');
} catch (error) {
  // Handle audio playback failure
  console.warn('Audio alert failed:', error);

  // Fallback to visual notification
  showVisualAlert('Warning!');
}
```

## Audio Assets

### Asset Organization

Audio assets should be placed in `public/assets/audio/` with the following structure:

```
public/assets/audio/
├── minimal/
│   ├── placeholder.wav    # Default placeholder
│   └── ...
├── game/
│   ├── warning-chime.wav
│   ├── injury-alert.wav
│   └── ...
└── ui/
    ├── success.wav
    └── error.wav
```

### Asset Requirements

- **Format**: WAV, MP3, OGG (Web Audio API compatible)
- **Sample Rate**: 44.1kHz recommended for quality
- **Channels**: Mono or stereo
- **Duration**: 1-3 seconds for alerts
- **Size**: Keep under 100KB per asset for web performance

### Placeholder Assets

The system includes placeholder assets for development:

- `minimal/placeholder.wav`: Default beep sound
- Used when custom assets are not available

## Throttling

### Throttling Logic

The system prevents alert spam by enforcing minimum time intervals between alerts:

```typescript
// Configuration
throttleMs: 3000  // 3 seconds between any alerts

// Behavior
await playMinimalAlert('warning'); // Plays immediately
await playMinimalAlert('injury');  // Throttled if < 3s since last alert
```

### Throttling Rules

1. **Global Throttling**: Applies to all alert types
2. **Last-Win Policy**: Most recent alert type takes precedence
3. **Telemetry**: Throttled alerts emit telemetry for analysis
4. **Configurable**: Throttle time adjustable via configuration

### Bypass Throttling

```typescript
// Temporarily reduce throttle for urgent alerts
configureMinimalAlerts({ throttleMs: 500 });

// Play urgent alert (bypasses normal throttling)
await playMinimalAlert('injury');

// Restore normal throttling
configureMinimalAlerts({ throttleMs: 3000 });
```

## Telemetry Integration

### Automatic Telemetry Events

The scaffold emits telemetry for all operations:

#### Successful Playback
```json
{
  "eventType": "minimal_audio_alert_played",
  "type": "warning",
  "assetPath": "game/warning-chime.wav",
  "volume": 0.7,
  "duration": 2.5,
  "throttled": false
}
```

#### Throttled Alerts
```json
{
  "eventType": "minimal_audio_alert_throttled",
  "type": "warning",
  "throttleMs": 3000,
  "timeSinceLastAlert": 1500
}
```

#### Failed Playback
```json
{
  "eventType": "minimal_audio_alert_failed",
  "type": "injury",
  "error": "Network error",
  "throttled": false
}
```

#### Configuration Changes
```json
{
  "eventType": "minimal_audio_alerts_configured",
  "warningSound": "game/warning-chime.wav",
  "injurySound": "game/injury-alert.wav",
  "volume": 0.8,
  "throttleMs": 2000
}
```

### Telemetry Usage

- **Performance Monitoring**: Track alert success/failure rates
- **User Experience**: Monitor throttling frequency
- **Asset Optimization**: Identify problematic audio files
- **Configuration Tuning**: Analyze volume and timing preferences

## Web Audio API Integration

### Audio Context Management

The system manages Web Audio API contexts automatically:

```typescript
// Lazy initialization
const context = new AudioContext();

// Audio graph construction
Source → Gain Node → Destination
```

### Browser Compatibility

- **Modern Browsers**: Full Web Audio API support
- **Legacy Browsers**: Falls back to webkitAudioContext
- **Mobile**: Respects user interaction requirements

### Performance Considerations

- **Lazy Loading**: Audio contexts created on-demand
- **Resource Cleanup**: Proper disposal of audio resources
- **Memory Management**: Audio buffers cached but manageable
- **Battery Impact**: Minimal due to short alert durations

## Testing Strategy

### Unit Testing

```typescript
import { playMinimalAlert, configureMinimalAlerts } from '../minimalAlerts';

// Mock Web Audio API
vi.mock('Web Audio API classes');

// Test alert playback
it('should play warning alert', async () => {
  await playMinimalAlert('warning');
  expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
});

// Test throttling
it('should throttle rapid alerts', async () => {
  await playMinimalAlert('warning');
  await playMinimalAlert('warning'); // Should be throttled
  expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('minimal_audio_alert_throttled', ...);
});
```

### Integration Testing

```typescript
// Test with real audio assets
describe('Audio Asset Loading', () => {
  it('should load and decode audio files', async () => {
    // Mock fetch with real audio data
    mockFetch.mockResolvedValue(createMockAudioResponse());

    await playMinimalAlert('warning');
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
  });
});
```

### Browser Testing

- **Chrome/Edge**: Full Web Audio API support
- **Firefox**: Web Audio API with minor differences
- **Safari**: webkitAudioContext fallback
- **Mobile**: Touch interaction requirements

## Error Handling

### Audio Loading Errors

```typescript
try {
  await playMinimalAlert('warning');
} catch (error) {
  // Handle network or decode errors
  console.error('Audio loading failed:', error);
}
```

### Playback Errors

```typescript
// Audio context suspended (common on mobile)
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}
```

### Fallback Strategies

1. **Silent Failure**: Continue game without audio
2. **Visual Fallback**: Show visual alerts when audio fails
3. **Progressive Enhancement**: Audio as enhancement, not requirement

## Configuration Patterns

### Environment-Based Configuration

```typescript
const audioConfig = {
  development: {
    volume: 0.3,
    warningSound: 'dev/placeholder.wav',
  },
  production: {
    volume: 0.7,
    warningSound: 'game/warning-chime.wav',
  },
};

configureMinimalAlerts(audioConfig[process.env.NODE_ENV]);
```

### User Preference Integration

```typescript
// Load user preferences
const userPrefs = loadUserPreferences();

configureMinimalAlerts({
  volume: userPrefs.audio.masterVolume * userPrefs.audio.alertVolume,
  throttleMs: userPrefs.audio.alertThrottleMs,
});
```

### Game State Adaptation

```typescript
function updateAlertConfig(gameState) {
  const config = {
    volume: gameState.isPaused ? 0.3 : 0.7,
    throttleMs: gameState.difficulty === 'hard' ? 1000 : 3000,
  };

  configureMinimalAlerts(config);
}
```

## Performance Guidelines

### Bundle Size

- **Lazy Loading**: Audio assets not included in initial bundle
- **Code Splitting**: Audio utilities in separate chunk
- **Asset Optimization**: Compressed audio formats

### Runtime Performance

- **Throttling**: Prevents audio processing overhead
- **Caching**: Audio buffers cached after first load
- **Cleanup**: Audio contexts disposed when not needed

### Memory Usage

- **Buffer Management**: Audio buffers released after use
- **Context Limits**: Single AudioContext instance
- **Asset Limits**: Reasonable file size limits

## Future Enhancements

### Planned Features

1. **Spatial Audio**: 3D positioning for alerts
2. **Audio Themes**: Multiple alert sound sets
3. **Volume Fading**: Smooth volume transitions
4. **Alert Queues**: Prioritized alert scheduling
5. **Offline Support**: Cached audio for offline play

### Extension Points

- **Custom Alert Types**: Extensible alert type system
- **Audio Filters**: Reverb, echo effects
- **Crossfade**: Smooth transitions between alerts
- **Playlist Support**: Sequential alert playback

## Troubleshooting

### Common Issues

#### "AudioContext not allowed" errors
**Cause**: Browser security restrictions on audio playback
**Solution**: Ensure user interaction before playing audio

#### Throttling too aggressive
**Cause**: throttleMs too high for game pacing
**Solution**: Adjust throttleMs based on game requirements

#### Audio not playing on mobile
**Cause**: Mobile browsers require user gesture
**Solution**: Play audio after first user interaction

#### Memory leaks
**Cause**: Audio buffers not released
**Solution**: Call cleanupMinimalAlerts() on game shutdown

### Debug Mode

Enable debug logging:

```typescript
// In minimalAlerts.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[MinimalAudioAlerts]', message, data);
}
```

## API Reference

### Functions

#### `playMinimalAlert(type)`
Play an audio alert with throttling and telemetry.

**Parameters:**
- `type`: `'warning'` | `'injury'`

**Returns:** `Promise<void>`

#### `configureMinimalAlerts(overrides)`
Configure audio alert settings.

**Parameters:**
- `overrides`: `Partial<MinimalAudioAlertConfig>`

#### `getMinimalAlertConfig()`
Get current configuration.

**Returns:** `MinimalAudioAlertConfig`

#### `resetMinimalAlertConfig()`
Reset configuration to defaults.

#### `cleanupMinimalAlerts()`
Clean up audio resources.

### Types

#### `MinimalAudioAlertType`
```typescript
type MinimalAudioAlertType = 'warning' | 'injury';
```

#### `MinimalAudioAlertConfig`
```typescript
interface MinimalAudioAlertConfig {
  warningSound: string;
  injurySound: string;
  volume: number;
  throttleMs: number;
}
```

## Related Documentation

- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Minimal Gameplay Telemetry](../../analytics/telemetry_integration.md)
- [Asset Management](../../assets/audio_asset_guidelines.md)
