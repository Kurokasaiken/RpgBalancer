# Punch Club PWA Retry & Offline Cache Handler Documentation

## Overview

The NP-088 Punch Club Install Retry & Offline Cache Handler provides comprehensive PWA installation retry logic, offline detection, and cache management to ensure reliable user experiences and meet PC-M2 KPI targets.

## Architecture

### Core Components

1. **PWA Retry Configuration** (`pwaRetryConfig.ts`)
   - Retry strategy with exponential backoff
   - Offline detection settings
   - User messaging configuration
   - Cache management parameters
   - Performance thresholds

2. **Enhanced Install Tracker Hook** (`usePWAInstallTracker.ts`)
   - Retry logic with exponential backoff
   - Offline detection and monitoring
   - User messaging system
   - Performance monitoring
   - KPI tracking

3. **Extended Service Worker** (`service-worker.ts`)
   - Cache busting and version management
   - Offline fallback handling
   - Version mismatch detection
   - Performance monitoring

## Retry Strategy

### Exponential Backoff Algorithm

```typescript
// Delay calculation with jitter
const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
const jitter = delay * jitterFactor * Math.random();
const finalDelay = delay + jitter;
```

### Retry Configuration

```typescript
interface PWARetryStrategy {
  maxRetries: 3;           // Maximum retry attempts
  initialDelay: 1000;     // 1 second initial delay
  maxDelay: 30000;         // 30 seconds maximum delay
  backoffMultiplier: 2;    // Exponential backoff factor
  jitterFactor: 0.1;      // 10% jitter to prevent thundering herd
}
```

### Retry Flow

1. **Install Failure Detection**
   - Monitor install prompt outcomes
   - Detect network errors and timeouts
   - Identify non-retryable errors (permission denied, not supported)

2. **Retry Decision**
   - Check if retry attempts remaining
   - Validate error type for retry eligibility
   - Calculate next retry delay with exponential backoff

3. **Retry Execution**
   - Show user feedback with countdown
   - Wait for calculated delay
   - Attempt install again
   - Update retry state and metrics

4. **Retry Completion**
   - Success: Reset retry state, show success message
   - Failure: Update error state, determine if more retries possible
   - Max retries reached: Show failure message, disable retry

## Offline Detection

### Connectivity Testing

```typescript
// Test multiple URLs for reliability
const testUrls = [
  '/',                    // App root
  '/manifest.json',       // PWA manifest
  'https://httpbin.org/get', // External connectivity test
];
```

### Offline Detection Logic

1. **Periodic Checks**
   - Test connectivity every 30 seconds (configurable)
   - Use HEAD requests for minimal bandwidth
   - Timeout after 5 seconds (configurable)

2. **Connection Analysis**
   - Test multiple URLs simultaneously
   - Consider offline if all tests fail
   - Track connection type and quality

3. **State Management**
   - Track failed request count
   - Monitor connection type changes
   - Provide offline/online transitions

### Offline Fallback Strategy

1. **Cache-First Strategy**
   - Serve cached content when offline
   - Fall back to any available cache version
   - Provide offline fallback page for navigation

2. **Offline Page**
   - Styled offline landing page
   - Retry functionality
   - Connection status indicators

3. **Graceful Degradation**
   - Disable install prompts when offline
   - Show offline status in UI
   - Queue actions for when online

## Cache Management

### Cache Busting Strategy

```typescript
interface CacheVersionInfo {
  version: string;
  timestamp: number;
  cacheName: string;
}

// Version-based cache busting
function shouldBustCache(currentVersion: string, cacheName: string): boolean {
  const storedVersion = localStorage.getItem(`cache-version-${cacheName}`);
  const cacheInfo = JSON.parse(localStorage.getItem(`${cacheName}-info`) || '{}');
  
  return !storedVersion || 
         storedVersion !== currentVersion || 
         Date.now() - cacheInfo.timestamp > maxAge;
}
```

### Cache Management Features

1. **Version-Based Invalidation**
   - Automatic cache busting on version changes
   - Timestamp-based expiration (24 hours default)
   - Graceful fallback to older caches

2. **Cache Optimization**
   - Cache-first strategy for performance
   - Network-first for critical resources
   - Selective caching for Punch Club routes

3. **Storage Management**
   - Automatic cleanup of old caches
   - Size limits to prevent storage bloat
   - Error recovery for storage failures

## User Messaging System

### Message Types

```typescript
type MessageType = 'info' | 'warning' | 'error' | 'success';
```

### Message Configuration

```typescript
interface PWAMessagingConfig {
  enabled: boolean;
  showOfflineBanner: boolean;
  showRetryPrompts: boolean;
  autoDismissDelay: number;    // 5 seconds for success messages
  messages: {
    offline: string;
    retryAvailable: string;
    installFailed: string;
    retrySuccess: string;
    versionMismatch: string;
  };
}
```

### Message Display Logic

1. **Context-Aware Messages**
   - Different messages for different scenarios
   - Localized message support
   - Configurable message content

2. **Auto-Dismissal**
   - Success messages auto-dismiss after 5 seconds
   - Error/warning messages require manual dismissal
   - Retry countdown messages update dynamically

3. **Message Queue**
   - Single active message at a time
   - Priority-based message handling
   - Smooth transitions between messages

## KPI Monitoring

### Performance Targets

```typescript
interface PWAPerformanceThresholds {
  coldStartThreshold: number;        // 3 seconds
  installSuccessThreshold: number;    // 90% success rate
  swActivationThreshold: number;       // 1 second
  cacheHitRateThreshold: number;        // 80% hit rate
}
```

### KPI Metrics

1. **Installation Metrics**
   - Install success rate
   - Retry attempt frequency
   - Time to successful installation
   - Install failure reasons

2. **Performance Metrics**
   - Cold start time
   - Service worker activation time
   - First contentful paint
   - Cache hit rates

3. **Offline Metrics**
   - Offline detection accuracy
   - Time to detect offline status
   - Offline duration statistics
   - Connection quality metrics

4. **User Experience Metrics**
   - Message display frequency
   - User interaction with messages
   - Retry acceptance rate
   - Version update acceptance

### KPI Calculation

```typescript
interface KPIs {
  totalSessions: number;
  averageSessionDuration: number;
  totalCombats: number;
  overallWinRate: number;
  totalTags: number;
  tagsByType: Record<string, number>;
  eventTypes: Record<string, number>;
  sessionsByDate: Record<string, number>;
  averageTagsPerSession: number;
  topEventTypes: Array<{ type: string; count: number }>;
  
  // PWA-specific KPIs
  installSuccessRate: number;
  averageRetryAttempts: number;
  offlineDetectionAccuracy: number;
  cacheHitRate: number;
  coldStartAverage: number;
}
```

## Fallback Strategies

### Network Fallbacks

1. **Multiple URL Testing**
   - Test internal and external URLs
   - Graceful degradation on partial failures
   - Configurable test URL list

2. **Connection Type Awareness**
   - Adjust behavior based on connection quality
   - Different thresholds for different connection types
   - Adaptive retry delays

3. **Timeout Handling**
   - Configurable timeouts for different operations
   - Progressive timeout increases
   - Early timeout for known slow operations

### Storage Fallbacks

1. **LocalStorage Error Handling**
   - Graceful degradation when storage unavailable
   - In-memory fallback for critical data
   - Error recovery and retry logic

2. **Cache Fallback**
   - Multiple cache version support
   - Fallback to older cache versions
   - Cache reconstruction on corruption

3. **Service Worker Fallback**
   - Fallback to network when SW unavailable
   - Graceful degradation for unsupported features
   - Compatibility checks for older browsers

### Browser Compatibility

1. **Feature Detection**
   - Check for PWA support before enabling features
   - Fallback to basic functionality for unsupported browsers
   - Progressive enhancement approach

2. **API Fallbacks**
   - Fallback for unsupported APIs
   - Polyfill integration where needed
   - Feature-specific error handling

3. **Version Compatibility**
   - Handle different browser versions
   - Fallback for older browser limitations
   - Graceful degradation for missing features

## Integration Examples

### Basic Usage

```typescript
const { 
  state, 
  promptInstall, 
  retryInstall, 
  checkOfflineStatus, 
  showMessage, 
  dismissMessage 
} = usePWAInstallTracker({
  retryConfig: {
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
    },
    offline: {
      enabled: true,
      checkInterval: 30000,
    },
    messaging: {
      enabled: true,
      showOfflineBanner: true,
    },
  },
  enableOfflineDetection: true,
  onEvent: (event) => console.log('PWA Event:', event),
  onMessage: (type, message) => console.log('Message:', type, message),
});
```

### Advanced Configuration

```typescript
const customConfig = {
  retryConfig: {
    retry: {
      maxRetries: 5,
      initialDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 1.5,
      jitterFactor: 0.2,
    },
    offline: {
      enabled: true,
      checkInterval: 15000,
      requestTimeout: 3000,
      failureThreshold: 2,
      testUrls: ['/api/health', '/manifest.json'],
    },
    messaging: {
      enabled: true,
      showOfflineBanner: true,
      showRetryPrompts: true,
      autoDismissDelay: 3000,
      messages: {
        offline: 'Connection lost. Some features may be unavailable.',
        retryAvailable: 'Installation failed. Try again?',
        installFailed: 'Installation could not be completed.',
        retrySuccess: 'Installation completed successfully!',
        versionMismatch: 'App updated. Please refresh.',
      },
    },
    cache: {
      enableBusting: true,
      version: '1.2.0',
      invalidationStrategy: 'version',
      maxAge: 43200000, // 12 hours
      maxSize: 100 * 1024 * 1024, // 100MB
    },
    thresholds: {
      coldStartThreshold: 2000, // 2 seconds
      installSuccessThreshold: 0.95, // 95%
      swActivationThreshold: 500, // 500ms
      cacheHitRateThreshold: 0.85, // 85%
    },
    debug: false,
  },
};
```

### React Component Integration

```typescript
function PWAInstallButton() {
  const { state, promptInstall, retryInstall, dismissMessage } = usePWAInstallTracker();

  if (state.isInstalled) {
    return <div>App is installed</div>;
  }

  if (!state.isInstallable) {
    return <div>Install not available</div>;
  }

  return (
    <div>
      {state.messaging.showMessage && (
        <div className={`message ${state.messaging.messageType}`}>
          {state.messaging.currentMessage}
          <button onClick={dismissMessage}>×</button>
        </div>
      )}
      
      {state.retry.isRetrying ? (
        <div className="retrying">
          Retrying in {Math.ceil((state.retry.nextRetryTime - Date.now()) / 1000)}s...
        </div>
      ) : state.retry.canRetry ? (
        <button onClick={retryInstall}>
          Retry Install
        </button>
      ) : (
        <button onClick={promptInstall}>
          Install App
        </button>
      )}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

1. **Retry Logic Tests**
   - Exponential backoff calculation
   - Retry limit enforcement
   - Error type validation
   - Success/failure scenarios

2. **Offline Detection Tests**
   - Connectivity testing
   - Connection type detection
   - Offline/online transitions
   - Error handling

3. **Messaging Tests**
   - Message display logic
   - Auto-dismissal behavior
   - Message prioritization
   - User interaction

4. **Cache Management Tests**
   - Cache busting logic
   - Version validation
   - Fallback behavior
   - Error recovery

### Integration Tests

1. **End-to-End Flows**
   - Complete install retry cycles
   - Offline to online transitions
   - Version mismatch scenarios
   - Cache invalidation

2. **Performance Tests**
   - Cold start timing
   - Cache hit rates
   - Retry performance
   - Memory usage

3. **Compatibility Tests**
   - Browser compatibility
   - Feature detection
   - Fallback behavior
   - Error handling

### Mock Testing

```typescript
// Mock fetch for offline testing
global.fetch = vi.fn()
  .mockResolvedValueOnce({ ok: true, status: 200 })
  .mockRejectedValueOnce(new Error('Network error'));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock timers
vi.useFakeTimers();
```

## Monitoring and Analytics

### Event Tracking

```typescript
// Install retry events
{
  eventType: 'pwa_install_retry_failed',
  data: {
    attempt: 2,
    error: 'Network error',
    timestamp: 1641894400000,
  },
}

// Offline detection events
{
  eventType: 'pwa_offline_detected',
  data: {
    connectionType: '3g',
    failedRequests: 3,
    timestamp: 1641894400000,
  },
}

// Cache busting events
{
  eventType: 'pwa_cache_busted',
  data: {
    oldVersion: '1.1.0',
    newVersion: '1.2.0',
    timestamp: 1641894400000,
  },
}
```

### Performance Monitoring

```typescript
// KPI metrics collection
const kpis = {
  installSuccessRate: 0.92,           // 92% success rate
  averageRetryAttempts: 1.3,        // Average 1.3 retries per install
  offlineDetectionAccuracy: 0.98,     // 98% accurate detection
  cacheHitRate: 0.87,                 // 87% cache hit rate
  coldStartAverage: 1850,             // 1.85s average cold start
};
```

### Error Tracking

```typescript
// Error categorization
const errorCategories = {
  network: ['Network error', 'Timeout', 'Connection refused'],
  permission: ['NotAllowedError', 'Permission denied'],
  compatibility: ['NotSupportedError', 'Feature not supported'],
  storage: ['QuotaExceededError', 'Storage error'],
};
```

## Troubleshooting

### Common Issues

1. **Retry Not Working**
   - Check if retry limit reached
   - Verify error type is retryable
   - Ensure retry configuration is correct

2. **Offline Detection Issues**
   - Verify test URLs are accessible
   - Check network permissions
   - Ensure fetch API is available

3. **Cache Problems**
   - Clear browser cache and storage
   - Check cache version consistency
   - Verify service worker registration

4. **Message Display Issues**
   - Check message configuration
   - Verify message handler setup
   - Ensure proper state management

### Debug Mode

```typescript
const debugConfig = {
  debug: true,
  retryConfig: {
    ...DEFAULT_PWA_RETRY_CONFIG,
    debug: true,
  },
};

// Enable debug logging
const { state } = usePWAInstallTracker(debugConfig);
```

### Performance Optimization

1. **Reduce Check Frequency**
   - Increase offline check interval
   - Use debouncing for rapid changes
   - Optimize test URL list

2. **Optimize Cache Strategy**
   - Use appropriate cache sizes
   - Implement cache warming
   - Monitor cache hit rates

3. **Improve Retry Logic**
   - Use adaptive backoff
   - Implement circuit breaker pattern
   - Optimize retry delays

## Best Practices

### Configuration

1. **Environment-Specific Settings**
   - Different retry limits for production vs development
   - Adjust timeouts based on expected network conditions
   - Configure appropriate cache sizes

2. **User Experience**
   - Provide clear feedback for all operations
   - Use appropriate message timing
   - Ensure graceful degradation

3. **Performance**
   - Monitor KPIs regularly
   - Optimize for common scenarios
   - Use appropriate caching strategies

### Code Organization

1. **Modular Design**
   - Separate retry logic from UI logic
   - Use dependency injection for configuration
   - Implement proper error boundaries

2. **Type Safety**
   - Use TypeScript interfaces for all configurations
   - Implement proper error types
   - Use type guards for runtime checks

3. **Testing**
   - Comprehensive unit test coverage
   - Integration tests for critical flows
   - Performance testing for edge cases

## Future Enhancements

### Planned Features

1. **Advanced Retry Strategies**
   - Circuit breaker pattern
   - Adaptive retry delays
   - Machine learning-based retry optimization

2. **Enhanced Offline Support**
   - Offline-first architecture
   - Background sync capabilities
   - Offline action queuing

3. **Performance Improvements**
   - Predictive caching
   - Intelligent preloading
   - Resource optimization

### Integration Opportunities

1. **Analytics Integration**
   - Enhanced event tracking
   - Real-time KPI monitoring
   - Automated performance alerts

2. **A/B Testing**
   - Retry strategy optimization
   - Message effectiveness testing
   - User experience experiments

3. **Cross-Platform Support**
   - Native app integration
   - Desktop PWA support
   - Mobile optimization

---

This documentation provides comprehensive guidance for implementing, configuring, and troubleshooting the Punch Club PWA Install Retry & Offline Cache Handler system.
