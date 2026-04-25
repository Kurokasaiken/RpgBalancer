# PWA Performance Budget Monitor - NP-108

**Date:** 2026-01-24  
**Agent:** Atlas-PC  
**Status:** ✅ COMPLETED  

## Executive Summary

Comprehensive PWA performance budget monitoring system for Punch Club with config-driven thresholds, cold start tracking (<3s target), runtime KPI measurement, and automated reporting. Includes CLI tooling, telemetry integration, and Lighthouse support.

## Overview

The PWA Performance Budget Monitor provides:
- **Config-driven budgets** with customizable thresholds
- **Cold start monitoring** with <3s target
- **Core Web Vitals** tracking (TTFB, FCP, LCP, TTI, TBT, CLS, FID, INP)
- **PWA-specific metrics** (cold/warm start, offline cache, service worker)
- **Asset size budgets** (bundles, images, fonts)
- **Automated reporting** (JSON + Markdown)
- **CLI tooling** with Lighthouse integration
- **Telemetry integration** for violation tracking

## Performance Budget Thresholds

### Core Web Vitals

| Metric | Target | Warning | Error | Unit | Description |
|--------|--------|---------|-------|------|-------------|
| **TTFB** | 800 | 1200 | 1800 | ms | Time to First Byte - server response time |
| **FCP** | 1800 | 2500 | 4000 | ms | First Contentful Paint - first content render |
| **LCP** | 2500 | 3500 | 4000 | ms | Largest Contentful Paint - main content visible |
| **TTI** | 3000 | 4500 | 6000 | ms | Time to Interactive - app fully interactive |
| **TBT** | 200 | 400 | 600 | ms | Total Blocking Time - main thread blocking |
| **CLS** | 0.1 | 0.15 | 0.25 | score | Cumulative Layout Shift - visual stability |
| **FID** | 100 | 200 | 300 | ms | First Input Delay - input responsiveness |
| **INP** | 200 | 400 | 500 | ms | Interaction to Next Paint - interaction responsiveness |

### PWA-Specific Metrics

| Metric | Target | Warning | Error | Unit | Description |
|--------|--------|---------|-------|------|-------------|
| **COLD_START** | 2000 | 2500 | **3000** | ms | Cold start time - first load without cache |
| **WARM_START** | 500 | 1000 | 1500 | ms | Warm start time - load with service worker cache |
| **OFFLINE_CACHE** | 300 | 600 | 1000 | ms | Offline cache load time - cached resource loading |
| **SW_ACTIVATION** | 500 | 1000 | 2000 | ms | Service worker activation time |

### Asset Size Budgets

| Metric | Target | Warning | Error | Unit | Description |
|--------|--------|---------|-------|------|-------------|
| **BUNDLE_SIZE** | 200KB | 300KB | 500KB | bytes | JavaScript bundle size - main bundle |
| **IMAGE_SIZE** | 100KB | 200KB | 300KB | bytes | Image asset size - per image |
| **FONT_SIZE** | 50KB | 100KB | 150KB | bytes | Font asset size - per font file |

## Usage

### React Hook Integration

```typescript
import { usePWAPerformanceBudget } from '@/ui/punchClub/hooks/usePWAPerformanceBudget';

function MyComponent() {
  const { monitor, report, violations } = usePWAPerformanceBudget();

  useEffect(() => {
    // Measure cold start
    monitor.measureColdStart();
    
    // Measure Web Vitals
    monitor.measureWebVitals();
    
    // Measure custom metrics
    monitor.measure('BUNDLE_SIZE', bundleSize);
  }, []);

  return (
    <div>
      <h2>Performance Budget</h2>
      <p>Pass Rate: {report.summary.passRate.toFixed(1)}%</p>
      {violations.length > 0 && (
        <div className="violations">
          {violations.map(v => (
            <div key={v.metric}>
              ⚠️ {v.metric}: {v.value}{v.unit} (exceeded by {v.violation?.exceededBy}{v.unit})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Direct API Usage

```typescript
import { createPWAPerformanceBudget } from '@/ui/punchClub/perf/PWAPerformanceBudget';

// Create monitor with default config
const monitor = createPWAPerformanceBudget();

// Measure metrics
monitor.measure('TTFB', 650);
monitor.measure('FCP', 1200);
monitor.measure('LCP', 2200);
monitor.measure('COLD_START', 1800);

// Generate report
const report = monitor.generateReport();
console.log(`Pass Rate: ${report.summary.passRate}%`);

// Get violations
const violations = monitor.getViolations();
violations.forEach(v => {
  console.warn(`${v.metric}: ${v.value}${v.unit} exceeds ${v.threshold.error}${v.unit}`);
});
```

### CLI Usage

```bash
# Basic usage with mock data
npm run perf:check

# Run with Lighthouse audit
npm run perf:check -- --lighthouse

# Custom URL
npm run perf:check -- --url http://localhost:3000

# Custom config
npm run perf:check -- --config custom-budget.json

# Output formats
npm run perf:check -- --format json
npm run perf:check -- --format markdown
npm run perf:check -- --format both

# Custom output directory
npm run perf:check -- --output reports

# Verbose logging
npm run perf:check -- --verbose

# Help
npm run perf:check -- --help
```

### CLI Examples

```bash
# Full audit with Lighthouse
npm run perf:check -- --lighthouse --url http://localhost:5173 --format both

# Quick check with mock data
npm run perf:check -- --format markdown --output test-results

# CI/CD integration
npm run perf:check -- --lighthouse --format json --output ci-reports
```

## Custom Budget Configuration

### Creating Custom Config

```typescript
import type { PerformanceBudgetConfig } from '@/ui/punchClub/perf/PWAPerformanceBudget';

const customBudget: PerformanceBudgetConfig = {
  name: 'Strict Performance Budget',
  description: 'Stricter thresholds for production',
  enabled: true,
  enableTelemetry: true,
  enableConsoleWarnings: true,
  enablePerformanceMarks: true,
  thresholds: [
    {
      metric: 'COLD_START',
      target: 1500,
      warning: 2000,
      error: 2500,
      unit: 'ms',
      description: 'Stricter cold start budget',
    },
    {
      metric: 'BUNDLE_SIZE',
      target: 150000,
      warning: 200000,
      error: 300000,
      unit: 'bytes',
      description: 'Stricter bundle size budget',
    },
    // ... more thresholds
  ],
};

const monitor = createPWAPerformanceBudget(customBudget);
```

### Loading Config from JSON

```typescript
import * as fs from 'fs';

const configJson = fs.readFileSync('custom-budget.json', 'utf-8');
const customConfig = JSON.parse(configJson);

const monitor = createPWAPerformanceBudget(customConfig);
```

### Example Custom Config JSON

```json
{
  "name": "Production Budget",
  "description": "Performance budget for production environment",
  "enabled": true,
  "enableTelemetry": true,
  "enableConsoleWarnings": true,
  "enablePerformanceMarks": true,
  "thresholds": [
    {
      "metric": "COLD_START",
      "target": 1500,
      "warning": 2000,
      "error": 2500,
      "unit": "ms",
      "description": "Cold start time for production"
    },
    {
      "metric": "LCP",
      "target": 2000,
      "warning": 3000,
      "error": 3500,
      "unit": "ms",
      "description": "Largest Contentful Paint for production"
    }
  ]
}
```

## Service Worker Integration

### Measuring Service Worker Activation

```typescript
// In service worker
self.addEventListener('activate', (event) => {
  const activationStart = performance.now();
  
  event.waitUntil(
    // ... activation logic
    Promise.resolve().then(() => {
      const activationTime = performance.now() - activationStart;
      
      // Send to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATION_TIME',
            time: activationTime,
          });
        });
      });
    })
  );
});

// In main thread
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'SW_ACTIVATION_TIME') {
    monitor.measureServiceWorkerActivation(event.data.time);
  }
});
```

### Measuring Offline Cache Performance

```typescript
// Track cache hits
const measureCacheLoad = (resourceUrl: string) => {
  const entry = performance.getEntriesByName(resourceUrl)[0];
  if (entry && entry.transferSize === 0) {
    // Served from cache
    const loadTime = entry.responseEnd - entry.fetchStart;
    monitor.measureOfflineCacheLoad(resourceUrl);
  }
};

// Measure after resource loads
window.addEventListener('load', () => {
  const resources = performance.getEntriesByType('resource');
  resources.forEach(resource => {
    if (resource.transferSize === 0) {
      measureCacheLoad(resource.name);
    }
  });
});
```

## Telemetry Integration

### Event Tracking

```typescript
import { trackPWABudgetViolation } from '@/analytics/punchClub';

// Track violations
monitor.measure('COLD_START', 3500);
const violations = monitor.getViolations();

if (violations.length > 0) {
  violations.forEach(v => {
    trackPWABudgetViolation({
      metric: v.metric,
      value: v.value,
      threshold: v.status === 'warning' ? v.threshold.warning : v.threshold.error,
      exceededBy: v.violation?.exceededBy || 0,
      percentage: v.violation?.percentage || 0,
      status: v.status,
    });
  });
}
```

### Telemetry Event Schema

```typescript
interface PWABudgetViolationEvent {
  event: 'pwa_budget_violation';
  timestamp: number;
  data: {
    metric: string;
    value: number;
    threshold: number;
    exceededBy: number;
    percentage: number;
    status: 'warning' | 'error';
    userAgent: string;
    connection?: string;
    deviceMemory?: number;
  };
}
```

## Report Formats

### JSON Report

```json
{
  "timestamp": 1706097600000,
  "budgetName": "Punch Club PWA Budget",
  "measurements": [
    {
      "metric": "COLD_START",
      "value": 1800,
      "unit": "ms",
      "timestamp": 1706097600000,
      "threshold": {
        "metric": "COLD_START",
        "target": 2000,
        "warning": 2500,
        "error": 3000,
        "unit": "ms",
        "description": "Cold start time - first load without cache"
      },
      "status": "good"
    }
  ],
  "summary": {
    "total": 15,
    "good": 14,
    "warning": 1,
    "error": 0,
    "passRate": 93.33
  },
  "violations": [],
  "environment": {
    "userAgent": "Mozilla/5.0...",
    "connection": "4g",
    "deviceMemory": 8,
    "hardwareConcurrency": 8
  }
}
```

### Markdown Report

```markdown
# PWA Performance Budget Report

**Generated:** 2026-01-24T10:00:00.000Z
**Budget:** Punch Club PWA Budget

## Summary

| Metric | Value |
|--------|-------|
| Total Checks | 15 |
| ✅ Passed | 14 |
| ⚠️ Warnings | 1 |
| ❌ Errors | 0 |
| Pass Rate | 93.3% |

## 📊 All Measurements

| Metric | Value | Target | Status | Description |
|--------|-------|--------|--------|-------------|
| COLD_START | 1800ms | 2000ms | ✅ | Cold start time - first load without cache |
| WARM_START | 450ms | 500ms | ✅ | Warm start time - load with service worker cache |
...
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: PWA Performance Budget

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  performance-budget:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:5173
      
      - name: Run performance budget check
        run: npm run perf:check -- --lighthouse --format both --output ci-reports
        
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: ci-reports/
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('ci-reports/pwa-performance-budget-*.md', 'utf-8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### Package.json Scripts

```json
{
  "scripts": {
    "perf:check": "tsx scripts/punchClub/pwaPerformanceCheck.ts",
    "perf:check:lighthouse": "npm run perf:check -- --lighthouse",
    "perf:check:ci": "npm run perf:check -- --lighthouse --format both --output ci-reports",
    "perf:watch": "nodemon --watch src --exec 'npm run perf:check'"
  }
}
```

## Optimization Recommendations

### Cold Start Optimization (<3s target)

1. **Code Splitting**
   - Split routes and lazy load components
   - Use dynamic imports for heavy dependencies
   - Implement route-based chunking

2. **Critical Path Optimization**
   - Inline critical CSS
   - Defer non-critical JavaScript
   - Preload critical resources

3. **Service Worker Precaching**
   - Precache critical assets
   - Use workbox for efficient caching
   - Implement cache-first strategy

4. **Bundle Size Reduction**
   - Remove unused dependencies
   - Use tree shaking
   - Minify and compress bundles

### Warm Start Optimization (<500ms target)

1. **Efficient Caching**
   - Use cache-first strategy
   - Implement stale-while-revalidate
   - Optimize cache storage

2. **Service Worker Optimization**
   - Minimize service worker size
   - Use skipWaiting() strategically
   - Optimize cache retrieval

### Asset Size Optimization

1. **JavaScript Bundles**
   - Target: <200KB, Error: <500KB
   - Use code splitting
   - Remove unused code
   - Minify and compress

2. **Images**
   - Target: <100KB, Error: <300KB
   - Use modern formats (WebP, AVIF)
   - Implement responsive images
   - Use lazy loading

3. **Fonts**
   - Target: <50KB, Error: <150KB
   - Use variable fonts
   - Subset fonts
   - Use font-display: swap

## Monitoring and Alerts

### Real-time Monitoring

```typescript
// Set up continuous monitoring
const monitor = createPWAPerformanceBudget({
  enableTelemetry: true,
  enableConsoleWarnings: true,
});

// Monitor on every page load
window.addEventListener('load', () => {
  monitor.measureColdStart();
  monitor.measureWebVitals();
  
  const report = monitor.generateReport();
  
  if (report.violations.length > 0) {
    // Send alert
    sendPerformanceAlert(report);
  }
});
```

### Alert Thresholds

- **Warning:** 1-2 violations, pass rate 80-90%
- **Critical:** 3+ violations, pass rate <80%
- **Emergency:** Cold start >3s, pass rate <50%

## Testing

### Unit Tests

```bash
# Run performance budget tests
npm run test -- tests/unit/punchClub/PWAPerformanceBudget.test.ts

# Run with coverage
npm run test -- tests/unit/punchClub/PWAPerformanceBudget.test.ts --coverage
```

### Integration Tests

```bash
# Run full performance audit
npm run perf:check -- --lighthouse --url http://localhost:5173

# Run in CI mode
npm run perf:check:ci
```

## Troubleshooting

### Common Issues

**Issue:** Lighthouse fails to run
- **Solution:** Ensure Chrome/Chromium is installed, use `--no-headless` flag

**Issue:** Cold start always exceeds budget
- **Solution:** Check bundle size, implement code splitting, optimize critical path

**Issue:** Measurements not accurate
- **Solution:** Run multiple times, use real device testing, check network conditions

**Issue:** Service worker metrics not captured
- **Solution:** Ensure service worker is registered, check message passing

## Best Practices

1. **Regular Monitoring**
   - Run performance checks on every PR
   - Monitor production metrics
   - Set up automated alerts

2. **Budget Maintenance**
   - Review budgets quarterly
   - Adjust based on user feedback
   - Keep budgets realistic but challenging

3. **Optimization Workflow**
   - Measure before optimizing
   - Focus on biggest violations first
   - Verify improvements with tests

4. **Documentation**
   - Document optimization efforts
   - Share performance reports
   - Track improvements over time

## Resources

### Internal Documentation
- `src/ui/punchClub/perf/PWAPerformanceBudget.ts` - Core implementation
- `scripts/punchClub/pwaPerformanceCheck.ts` - CLI tool
- `tests/unit/punchClub/PWAPerformanceBudget.test.ts` - Unit tests

### External Resources
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Performance](https://web.dev/pwa/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)

## Conclusion

The PWA Performance Budget Monitor provides comprehensive performance tracking for Punch Club PWA with config-driven budgets, automated reporting, and CI/CD integration. The <3s cold start target ensures excellent user experience while maintaining high performance standards across all metrics.

---

**Last Updated:** 2026-01-24  
**Next Review:** 2026-04-24  
**Maintainer:** Atlas-PC (Cascade AI)
