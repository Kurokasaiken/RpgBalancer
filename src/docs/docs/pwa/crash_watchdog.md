# Punch Club PWA Crash Loop Auto-Recover

## Overview

The Punch Club PWA Crash Loop Auto-Recover system monitors application crashes and implements automatic recovery strategies to prevent crash loops in the Progressive Web App environment. This system ensures application stability and provides a seamless user experience even when unexpected errors occur.

## Features

### 🔍 Crash Detection
- **Automatic Monitoring**: Detects JavaScript errors and unhandled promise rejections
- **Service Worker Monitoring**: Tracks service worker crashes and controller changes
- **Session Tracking**: Associates crashes with unique session IDs for better analysis
- **Time Window Analysis**: Evaluates crash patterns within configurable time windows

### 🛡️ Recovery Strategies
- **Cache Clearing**: Clears application cache to resolve corruption issues
- **Service Worker Reset**: Unregisters and re-registers the service worker
- **Full Reset**: Complete application reset including localStorage and cache
- **Progressive Recovery**: Attempts least invasive recovery first

### 📊 Telemetry & Monitoring
- **Real-time Events**: Emits telemetry events for crash detection and recovery
- **Service Worker Integration**: Sends telemetry to service worker for coordinated recovery
- **Crash Statistics**: Provides detailed crash history and recovery metrics
- **Session Analytics**: Tracks crash patterns across user sessions

## Configuration

### Default Configuration

```typescript
const DEFAULT_CRASH_WATCHDOG_CONFIG = {
  maxCrashes: 3,              // Maximum crashes allowed
  timeWindowMs: 120000,       // 2 minutes time window
  recoveryCooldownMs: 60000,  // 1 minute cooldown after recovery
  autoRecover: true,          // Enable automatic recovery
};
```

### Configuration Schema

```typescript
interface CrashWatchdogConfig {
  maxCrashes: number;         // 1-10 crashes allowed
  timeWindowMs: number;        // 30s-5min evaluation window
  recoveryCooldownMs: number; // 10s-5min cooldown period
  autoRecover: boolean;       // Enable/disable auto-recovery
}
```

## Usage

### Basic Setup

```typescript
import { createCrashWatchdog, setupGlobalErrorHandling } from '@/pwa/CrashWatchdog';

// Create watchdog instance
const watchdog = createCrashWatchdog({
  maxCrashes: 3,
  timeWindowMs: 120000,
  autoRecover: true,
});

// Setup global error handling
setupGlobalErrorHandling(watchdog);
```

### Advanced Configuration

```typescript
import { CrashWatchdog, setupServiceWorkerMonitoring } from '@/pwa/CrashWatchdog';

const watchdog = new CrashWatchdog({
  maxCrashes: 5,
  timeWindowMs: 300000,  // 5 minutes
  recoveryCooldownMs: 120000,  // 2 minutes
  autoRecover: true,
});

// Setup service worker monitoring
setupServiceWorkerMonitoring(watchdog);

// Get crash statistics
const stats = watchdog.getCrashStats();
console.log('Crash statistics:', stats);
```

### Manual Recovery

```typescript
// Trigger manual recovery
const result = await watchdog.manualRecovery('clear_cache');
if (result.success) {
  console.log('Recovery successful:', result.action);
} else {
  console.error('Recovery failed:', result.error);
}

// Reset watchdog state
await watchdog.reset();
```

## Recovery Actions

### 1. Cache Clearing (`clear_cache`)
- Clears all application caches
- Preserves essential service worker caches
- Least invasive recovery option
- **Use Case**: Cache corruption, stale data

### 2. Service Worker Reset (`reset_sw`)
- Unregisters current service worker
- Clears all caches
- Re-registers service worker
- **Use Case**: Service worker corruption, update issues

### 3. Full Reset (`full_reset`)
- Clears all caches and localStorage
- Resets service worker
- Reloads the application
- **Use Case**: Complete application corruption

## Telemetry Events

### Crash Detection Events

```typescript
// Crash recorded
window.dispatchEvent(new CustomEvent('pc_sw_crash_loop', {
  detail: {
    type: 'crash_recorded',
    timestamp: 1641894400000,
    sessionId: 'session_1641894400_abc123',
    data: {
      sessionId: 'session_1641894400_abc123',
      crashCount: 2,
      error: 'ReferenceError: foo is not defined',
    },
  },
}));
```

### Recovery Events

```typescript
// Recovery success
window.dispatchEvent(new CustomEvent('pc_sw_crash_loop', {
  detail: {
    type: 'recovery_success',
    timestamp: 1641894400000,
    sessionId: 'session_1641894400_abc123',
    data: {
      action: 'clear_cache',
      duration: 1500,
      sessionId: 'session_1641894400_abc123',
    },
  },
}));

// Recovery failure
window.dispatchEvent(new CustomEvent('pc_sw_crash_loop', {
  detail: {
    type: 'recovery_failed',
    timestamp: 1641894400000,
    sessionId: 'session_1641894400_abc123',
    data: {
      action: 'reset_sw',
      duration: 3000,
      error: 'Service worker registration failed',
      sessionId: 'session_1641894400_abc123',
    },
  },
}));
```

### Service Worker Events

```typescript
// Service worker controller changed
window.dispatchEvent(new CustomEvent('pc_sw_crash_loop', {
  detail: {
    type: 'sw_controller_changed',
    timestamp: 1641894400000,
    sessionId: 'session_1641894400_abc123',
    data: {
      sessionId: 'session_1641894400_abc123',
    },
  },
}));
```

## Integration with Service Worker

The crash watchdog integrates with the Punch Club service worker to provide coordinated recovery:

### Service Worker Message Handling

```typescript
// Crash recovery reset
serviceWorker.active.postMessage({
  type: 'PWA_CRASH_RECOVERY_RESET',
  data: { timestamp: Date.now() },
});

// Telemetry forwarding
serviceWorker.active.postMessage({
  type: 'PWA_CRASH_WATCHDOG_TELEMETRY',
  data: telemetryPayload,
});
```

### Service Worker Recovery Events

```typescript
// Recovery completed
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PWA_CRASH_RECOVERY_COMPLETED') {
    console.log('Service worker recovery completed');
  }
});

// Recovery failed
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PWA_CRASH_RECOVERY_FAILED') {
    console.error('Service worker recovery failed:', event.data.error);
  }
});
```

## Storage Keys

The watchdog uses localStorage for persistence:

| Key | Purpose | Format |
|-----|---------|--------|
| `pc_crash_events` | Crash history | JSON array of CrashEvent |
| `pc_last_recovery` | Last recovery attempt | JSON RecoveryResult |
| `pc_watchdog_state` | Watchdog state | JSON state object |

## Crash Statistics

### Get Current Statistics

```typescript
const stats = watchdog.getCrashStats();

console.log('Total crashes:', stats.totalCrashes);
console.log('Crashes in window:', stats.crashesInWindow);
console.log('Is recovering:', stats.isRecovering);
console.log('Last crash:', stats.lastCrash);
console.log('Last recovery:', stats.lastRecovery);
```

### Statistics Interface

```typescript
interface CrashStatistics {
  totalCrashes: number;        // Total crashes in current window
  crashesInWindow: number;     // Crashes within time window
  lastCrash?: CrashEvent;      // Most recent crash
  isRecovering: boolean;        // Currently recovering
  lastRecovery?: RecoveryResult; // Last recovery attempt
}
```

## Best Practices

### Configuration Guidelines

1. **Time Window**: Set appropriate time window based on app complexity
   - Simple apps: 1-2 minutes
   - Complex apps: 3-5 minutes

2. **Crash Threshold**: Balance between sensitivity and stability
   - Conservative: 5 crashes
   - Aggressive: 2-3 crashes

3. **Recovery Cooldown**: Prevent rapid recovery loops
   - Minimum: 30 seconds
   - Recommended: 1-2 minutes

### Error Handling

```typescript
// Wrap critical operations in try-catch
try {
  // Critical application code
  await criticalOperation();
} catch (error) {
  // Let watchdog handle the error
  throw error; // Re-throw to trigger watchdog
}
```

### Service Worker Integration

```typescript
// Monitor service worker health
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // Service worker changed, might indicate recovery
  console.log('Service worker controller changed');
});
```

## Testing

### Unit Tests

The system includes comprehensive unit tests covering:

- Crash detection and recording
- Recovery logic and actions
- Telemetry event emission
- Configuration validation
- Edge cases and error handling

### Manual Testing

1. **Simulate Crash Loop**:
   ```javascript
   // Trigger multiple errors
   for (let i = 0; i < 4; i++) {
     setTimeout(() => {
       throw new Error(`Test crash ${i}`);
     }, i * 1000);
   }
   ```

2. **Monitor Recovery**:
   ```javascript
   // Listen for recovery events
   window.addEventListener('pc_sw_crash_loop', (event) => {
     console.log('Crash watchdog event:', event.detail);
   });
   ```

## Performance Considerations

### Memory Usage
- Crash events are automatically cleaned up outside time window
- localStorage usage is minimal (< 1KB for typical usage)
- Event listeners are properly managed

### CPU Impact
- Minimal CPU overhead for crash detection
- Recovery actions are asynchronous
- Telemetry emission is non-blocking

### Network Impact
- No network requests for crash detection
- Service worker communication is local
- Recovery actions work offline

## Troubleshooting

### Common Issues

1. **Watchdog Not Triggering**:
   - Check `autoRecover` configuration
   - Verify crash threshold is reached
   - Ensure time window is appropriate

2. **Recovery Failing**:
   - Check service worker registration
   - Verify cache permissions
   - Review localStorage quota

3. **Telemetry Not Working**:
   - Verify event listener setup
   - Check service worker communication
   - Ensure custom events are supported

### Debug Mode

```typescript
// Enable debug logging
const watchdog = new CrashWatchdog({
  maxCrashes: 1,  // Lower threshold for testing
  timeWindowMs: 30000,  // Shorter window for testing
  autoRecover: true,
});

// Monitor all events
window.addEventListener('pc_sw_crash_loop', console.log);
```

## Security Considerations

### Data Protection
- No sensitive data stored in crash events
- Error messages are sanitized
- Session IDs are non-identifying

### Access Control
- Recovery actions require proper context
- Service worker communication is validated
- Telemetry events are local-only

## Future Enhancements

### Planned Features
- [ ] Remote crash reporting
- [ ] Machine learning crash prediction
- [ ] Custom recovery strategies
- [ ] Advanced analytics dashboard

### API Extensions
- [ ] Plugin system for custom recovery
- [ ] Webhook integration for notifications
- [ ] A/B testing for recovery strategies

## Version History

### v1.0.0 (NP-253)
- Initial implementation
- Basic crash detection and recovery
- Service worker integration
- Comprehensive test suite
- Complete documentation

## Support

For issues or questions regarding the PWA Crash Loop Auto-Recover system:

1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Consult the service worker integration guide
4. Check telemetry events for debugging information

---

**Note**: This system is part of the Punch Club PWA stability framework and integrates with other monitoring and recovery components.
