# Mobile Playtest Stress Harness

**NP-262** – Guardian-VRT Stress Test  
**Status**: ✅ Complete

## Overview

Automated stress testing harness that executes 100 simulated mobile sessions with random tap/scroll actions to detect regressions and performance issues.

## Features

- **100 Sessions**: Configurable session count
- **Random Actions**: Tap and scroll with random coordinates
- **Error Tracking**: Captures and reports failures
- **Performance Metrics**: Duration and action success rates
- **JSON Reports**: Detailed results with summary statistics

## Usage

```bash
# Run with defaults (100 sessions)
tsx scripts/playtest/mobileStressHarness.ts

# Custom configuration
tsx scripts/playtest/mobileStressHarness.ts --sessions 50
```

## Configuration

```typescript
{
  sessions: 100,
  actionsPerSession: 20,
  baseUrl: 'http://localhost:5173',
  outputDir: 'test-results/stress-harness',
}
```

## Output

Reports saved to `test-results/stress-harness/report-<timestamp>.json`:

```json
{
  "summary": {
    "totalSessions": 100,
    "totalActions": 2000,
    "totalErrors": 5,
    "avgDuration": 15000
  },
  "results": [...]
}
```

## Testing

```bash
npm run test -- tests/e2e/punchClub/MobileStressHarness.spec.ts
```

---

**Status**: ✅ Complete  
**Evidence**: `test-results/np-262-mobile-stress-harness.log`
