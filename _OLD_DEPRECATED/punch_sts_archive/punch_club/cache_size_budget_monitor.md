# Punch Club PWA Cache Size Budget Monitor

## Overview

Config-first monitor for PWA cache size budget tracking with quota alerts, eviction strategies, and telemetry integration.

## Features

- **Real-time Cache Monitoring**: Track cache usage with configurable check intervals
- **Budget Thresholds**: Warning (75%) and critical (90%) alerts
- **Asset Prioritization**: Critical, high, medium, low priority levels
- **Auto-Eviction**: Optional automatic eviction of low-priority assets
- **Telemetry Integration**: `pc_cache_budget_exceeded` events
- **CLI Tool**: Command-line interface for monitoring and reporting

## Usage

### Programmatic API

```typescript
import { CacheSizeBudgetMonitor } from '@/analytics/punchClub/cacheSizeBudgetMonitor';

// Create monitor with default config
const monitor = new CacheSizeBudgetMonitor();

// Start monitoring
monitor.startMonitoring();

// Check budget manually
const alert = await monitor.checkBudget();
console.log(alert.status); // 'ok' | 'warning' | 'critical' | 'exceeded'

// Get cache usage stats
const stats = await monitor.getCacheUsage();
console.log(`Usage: ${stats.usagePercent.toFixed(1)}%`);

// Stop monitoring
monitor.stopMonitoring();
```

### CLI Tool

```bash
# Check current cache budget
tsx scripts/punchClub/cacheBudgetMonitor.ts check

# Generate report
tsx scripts/punchClub/cacheBudgetMonitor.ts report --format markdown

# Evict low-priority assets
tsx scripts/punchClub/cacheBudgetMonitor.ts evict --target 10485760

# Start continuous monitoring
tsx scripts/punchClub/cacheBudgetMonitor.ts monitor --interval 60000
```

## Configuration

### Default Configuration

```typescript
{
  enabled: true,
  thresholds: {
    warningPercent: 75,
    criticalPercent: 90,
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
  },
  assetPriorities: [
    { pattern: '/service-worker.js', priority: 'critical' },
    { pattern: '/manifest.webmanifest', priority: 'critical' },
    { pattern: '/assets/.*\\.js$', priority: 'high' },
    { pattern: '/assets/.*\\.css$', priority: 'high' },
    { pattern: '/assets/portraits/.*', priority: 'medium' },
    { pattern: '/assets/.*\\.png$', priority: 'low' },
  ],
  checkIntervalMs: 60000,
  enableAutoEviction: false,
  telemetryEnabled: true,
}
```

### Custom Configuration

```typescript
const monitor = new CacheSizeBudgetMonitor({
  thresholds: {
    warningPercent: 60,
    criticalPercent: 80,
    maxSizeBytes: 100 * 1024 * 1024,
  },
  checkIntervalMs: 30000,
  enableAutoEviction: true,
});
```

## Cache Budget Status

| Status | Threshold | Description | Action |
|--------|-----------|-------------|--------|
| **ok** | < 75% | Normal operation | Continue monitoring |
| **warning** | 75-89% | High usage | Monitor closely, consider eviction |
| **critical** | 90-99% | Very high usage | Evict low-priority assets |
| **exceeded** | ≥ 100% | Quota exceeded | Immediate eviction required |

## Asset Priorities

### Priority Levels

1. **Critical**: Never evict (service worker, manifest)
2. **High**: Evict only in emergency (JS, CSS bundles)
3. **Medium**: Evict when warning threshold reached (portraits)
4. **Low**: First to evict (generic images, backgrounds)

### Priority Assignment

Assets are matched against regex patterns in order. First match determines priority.

```typescript
monitor.getAssetPriority('/service-worker.js'); // 'critical'
monitor.getAssetPriority('/assets/main.js'); // 'high'
monitor.getAssetPriority('/assets/portraits/warrior.png'); // 'medium'
monitor.getAssetPriority('/assets/background.png'); // 'low'
```

## Eviction Strategy

### Automatic Eviction

When `enableAutoEviction` is true, the monitor automatically evicts assets when critical threshold is reached.

### Manual Eviction

```typescript
// Get eviction candidates sorted by priority
const candidates = await monitor.getEvictionCandidates();

// Evict assets to free target bytes
const freedBytes = await monitor.evictAssets(10 * 1024 * 1024);
console.log(`Freed ${freedBytes} bytes`);
```

### Eviction Order

1. Low priority assets (largest first)
2. Medium priority assets (largest first)
3. High priority assets (only in emergency)
4. Critical assets (never evicted)

## Telemetry Events

### `pc_cache_budget_exceeded`

Emitted when cache usage exceeds warning threshold.

```typescript
{
  eventType: 'pc_cache_budget_exceeded',
  timestamp: 1706091375000,
  data: {
    status: 'warning',
    usagePercent: 76.5,
    usedBytes: 38225920,
    quotaBytes: 50000000,
    cacheCount: 47,
    message: 'Cache usage warning: 76.5%',
    recommendedAction: 'Monitor cache growth',
  }
}
```

## CLI Commands

### check

Check current cache budget status.

```bash
tsx scripts/punchClub/cacheBudgetMonitor.ts check [options]

Options:
  --json      Output as JSON
  --verbose   Verbose output
```

### report

Generate cache budget report.

```bash
tsx scripts/punchClub/cacheBudgetMonitor.ts report [options]

Options:
  -o, --output <file>     Output file path
  --format <format>       Report format (json|markdown|csv)
```

### evict

Evict low-priority cache entries.

```bash
tsx scripts/punchClub/cacheBudgetMonitor.ts evict [options]

Options:
  --dry-run              Show what would be evicted
  --target <bytes>       Target bytes to free (default: 10485760)
```

### monitor

Start continuous monitoring.

```bash
tsx scripts/punchClub/cacheBudgetMonitor.ts monitor [options]

Options:
  --interval <ms>              Check interval (default: 60000)
  --alert-threshold <percent>  Alert threshold (default: 75)
```

## Integration

### With Service Worker

```typescript
// In service worker
self.addEventListener('install', async (event) => {
  const monitor = new CacheSizeBudgetMonitor();
  const stats = await monitor.getCacheUsage();
  
  if (stats.usagePercent > 90) {
    await monitor.evictAssets(10 * 1024 * 1024);
  }
});
```

### With React Component

```typescript
import { useEffect, useState } from 'react';
import { CacheSizeBudgetMonitor } from '@/analytics/punchClub/cacheSizeBudgetMonitor';

function CacheBudgetIndicator() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const monitor = new CacheSizeBudgetMonitor();
    monitor.startMonitoring();

    const checkBudget = async () => {
      const newAlert = await monitor.checkBudget();
      setAlert(newAlert);
    };

    checkBudget();
    return () => monitor.stopMonitoring();
  }, []);

  if (!alert || alert.status === 'ok') return null;

  return (
    <div className={`alert alert-${alert.status}`}>
      {alert.message}
    </div>
  );
}
```

## Storage Quota API

The monitor uses the Storage Quota API to track usage:

```typescript
const estimate = await navigator.storage.estimate();
console.log(`Quota: ${estimate.quota} bytes`);
console.log(`Usage: ${estimate.usage} bytes`);
```

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Partial support (iOS 15.2+)

## Performance

- **Check overhead**: < 100ms for typical cache sizes
- **Memory usage**: < 5MB during monitoring
- **CPU impact**: Minimal (runs at configurable intervals)

## Best Practices

1. **Set appropriate thresholds** based on your app's cache needs
2. **Prioritize critical assets** to prevent eviction
3. **Monitor regularly** but not too frequently (60s recommended)
4. **Test eviction strategy** before enabling auto-eviction
5. **Log telemetry events** for analysis and optimization

## Troubleshooting

### Cache not being evicted

- Check `enableAutoEviction` is true
- Verify assets have correct priority levels
- Ensure critical assets are not blocking eviction

### Quota exceeded errors

- Lower warning threshold to 60-70%
- Reduce cache size limits
- Implement more aggressive eviction

### High memory usage

- Increase check interval
- Reduce number of cached assets
- Implement cache expiration

## Files

- `src/analytics/punchClub/cacheSizeBudgetMonitor.ts` - Monitor service
- `scripts/punchClub/cacheBudgetMonitor.ts` - CLI tool
- `tests/unit/punchClub/CacheSizeBudgetMonitor.test.ts` - Test suite
- `docs/punch_club/cache_size_budget_monitor.md` - Documentation

## Related

- [NP-168 Cache Stress Test](./cache_stress_test.md)
- [Service Worker Cache Strategy](./service_worker_cache.md)
- [PWA Performance Guide](./pwa_performance.md)
