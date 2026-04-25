# Punch Club Mobile Asset Prefetch Planner

**NP-265** – Velocity-Perf Asset Planner  
**Status**: ✅ Complete

## Overview

Intelligent asset prefetch planning system that analyzes telemetry data to calculate optimal prefetch priorities for mobile PWA assets, generating configuration for Service Worker caching strategies.

## Features

- **Telemetry-Based Analysis**: Uses real usage data to prioritize assets
- **4 Priority Tiers**: Critical, High, Medium, Low
- **Weighted Scoring**: Load count, load time, size, recency
- **Automatic Config Generation**: JSON output for Service Worker
- **Dashboard Reports**: Markdown visualization of priorities
- **Tier Limits**: Prevents over-prefetching

## Usage

```bash
# Run planner with defaults
tsx scripts/pwa/assetPrefetchPlanner.ts

# Output: public/prefetch-config.json
```

## Configuration

```typescript
{
  telemetryPath: 'data/telemetry/asset-usage.json',
  outputPath: 'public/prefetch-config.json',
  weights: {
    loadCount: 0.4,    // Usage frequency
    loadTime: 0.2,     // Load performance
    size: 0.2,         // Asset size
    recency: 0.2,      // Recent usage
  },
  thresholds: {
    critical: 0.8,     // Score >= 0.8
    high: 0.6,         // Score >= 0.6
    medium: 0.4,       // Score >= 0.4
  },
  maxAssetsPerTier: {
    critical: 10,
    high: 20,
    medium: 30,
    low: 50,
  },
}
```

## Priority Calculation

**Score Formula:**
```
score = (loadCount/max) * 0.4 +
        (1 - loadTime/max) * 0.2 +
        (1 - size/max) * 0.2 +
        (1 - age/max) * 0.2
```

**Tier Assignment:**
- **Critical**: score >= 0.8 (top 10 assets)
- **High**: score >= 0.6 (next 20 assets)
- **Medium**: score >= 0.4 (next 30 assets)
- **Low**: score < 0.4 (remaining assets)

## Output Format

**prefetch-config.json:**
```json
{
  "version": "1.0.0",
  "generated": "2026-01-24T12:00:00.000Z",
  "assets": {
    "critical": ["/assets/logo.png", "/assets/hero-bg.jpg"],
    "high": ["/assets/icon-192.png", "/assets/fonts/main.woff2"],
    "medium": ["/assets/sounds/click.mp3"],
    "low": ["/assets/tutorial-1.png"]
  },
  "metadata": {
    "totalAssets": 10,
    "totalSize": 500000,
    "avgLoadTime": 75.5,
    "thresholds": {
      "critical": 0.8,
      "high": 0.6,
      "medium": 0.4
    }
  }
}
```

## Service Worker Integration

```typescript
// service-worker.ts
import prefetchConfig from './prefetch-config.json';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('critical-v1').then((cache) => {
      return cache.addAll(prefetchConfig.assets.critical);
    })
  );
});

// Prefetch high priority on idle
self.addEventListener('activate', (event) => {
  if ('requestIdleCallback' in self) {
    requestIdleCallback(() => {
      caches.open('high-v1').then((cache) => {
        cache.addAll(prefetchConfig.assets.high);
      });
    });
  }
});
```

## Telemetry Input

**asset-usage.json:**
```json
{
  "assets": [
    {
      "path": "/assets/logo.png",
      "type": "image",
      "loadCount": 1000,
      "avgLoadTime": 50,
      "size": 25000,
      "firstLoadTime": 1706097600000,
      "lastLoadTime": 1706184000000
    }
  ]
}
```

## Dashboard Output

Generated markdown report with:
- Priority distribution summary
- Top assets per tier
- Load statistics
- Size breakdown

## Best Practices

1. **Run Regularly**: Update config weekly based on new telemetry
2. **Monitor Sizes**: Keep critical tier under 200KB total
3. **Test Performance**: Measure impact on initial load time
4. **Version Control**: Track config changes over time
5. **A/B Testing**: Compare prefetch strategies

## Performance Targets

| Metric | Target |
|--------|--------|
| Critical Assets | < 10 files, < 200KB |
| High Assets | < 20 files, < 500KB |
| Total Prefetch | < 1MB |
| Load Time Impact | < 100ms |

---

**Status**: ✅ Complete  
**Evidence**: `test-results/np-265-asset-prefetch.log`
