# Combat Animation Budget Monitor

**NP-173** – Lumen-PC Animation Ops  
**Status**: ✅ Complete  
**Priority**: 173

## Overview

Config-first frame budget monitoring system for Punch Club combat animations. Ensures animations stay within the 60fps budget (<16ms per frame) with real-time profiling, telemetry, and persistence.

## Objectives

- Monitor animation frame times in real-time
- Detect budget violations (<16ms target)
- Track performance across animation types
- Persist profiling sessions for analysis
- Emit telemetry for performance monitoring
- Provide actionable insights for optimization

## Architecture

### Core Components

1. **CombatAnimationBudget.ts** - Core profiler with Performance API integration
2. **useCombatAnimationProfiler.ts** - React hook for real-time monitoring
3. **CombatAnimationBudget.test.ts** - Comprehensive unit tests

### Data Flow

```
Animation Trigger
    ↓
Performance Mark (start)
    ↓
Animation Execution
    ↓
Performance Mark (end)
    ↓
Frame Time Measurement
    ↓
Budget Status Calculation
    ↓
Session Update + Telemetry
    ↓
Persistence (async)
```

## Configuration

### Frame Budget Thresholds

```typescript
{
  optimal: 10ms,    // Green zone - excellent performance
  warning: 13ms,    // Yellow zone - approaching limit
  critical: 15ms,   // Orange zone - near budget
  max: 16ms         // Red zone - budget exceeded
}
```

### Sampling Configuration

```typescript
{
  enabled: true,
  rate: 1.0,           // 100% sampling (adjust for production)
  maxSamples: 1000     // Prevent memory overflow
}
```

### Monitoring Settings

```typescript
{
  realTime: true,          // Live updates
  logExceeded: true,       // Console warnings
  alertThreshold: 5        // Alert after N exceeds
}
```

### Persistence

```typescript
{
  enabled: true,
  storageKey: 'punch_club_animation_budget',
  maxSessions: 10          // Keep last 10 sessions
}
```

### Telemetry Events

```typescript
{
  budgetExceeded: 'pc_animation_budget_exceeded',
  sessionComplete: 'pc_animation_session_complete',
  criticalFrame: 'pc_animation_critical_frame'
}
```

## Animation Types

| Type | Description | Target Budget |
|------|-------------|---------------|
| `punch` | Basic punch animation | <10ms |
| `kick` | Kick animation | <10ms |
| `block` | Block/parry animation | <8ms |
| `dodge` | Dodge/evade animation | <8ms |
| `special` | Special move animation | <12ms |
| `combo` | Combo sequence | <15ms |
| `hit_reaction` | Hit reaction animation | <8ms |
| `ko` | Knockout animation | <12ms |
| `victory` | Victory pose | <10ms |
| `idle` | Idle animation | <5ms |

## Usage

### Basic Hook Usage

```typescript
import { useCombatAnimationProfiler } from '@/ui/punchClub/hooks/useCombatAnimationProfiler';

function CombatComponent() {
  const { state, startSession, endSession, measureAnimation } = useCombatAnimationProfiler();
  
  useEffect(() => {
    const sessionId = startSession();
    
    return () => {
      endSession();
    };
  }, []);
  
  const handlePunch = async () => {
    await measureAnimation('punch', async () => {
      // Execute punch animation
      await playPunchAnimation();
    });
  };
  
  return (
    <div>
      <p>Budget Compliance: {state.budgetCompliance.toFixed(1)}%</p>
      <p>Exceeded Frames: {state.exceedCount}</p>
      <button onClick={handlePunch}>Punch</button>
    </div>
  );
}
```

### Manual Frame Measurement

```typescript
const { measureFrame } = useCombatAnimationProfiler();

function animatePunch() {
  const startMark = 'punch-start';
  const endMark = 'punch-end';
  
  performance.mark(startMark);
  
  // Execute animation
  executePunchAnimation();
  
  performance.mark(endMark);
  measureFrame('punch', startMark, endMark);
}
```

### Simple Animation Wrapper

```typescript
import { useAnimationMeasurement } from '@/ui/punchClub/hooks/useCombatAnimationProfiler';

function PunchButton() {
  const measurePunch = useAnimationMeasurement('punch');
  
  const handleClick = async () => {
    await measurePunch(async () => {
      await playPunchAnimation();
    });
  };
  
  return <button onClick={handleClick}>Punch</button>;
}
```

## KPIs & Metrics

### Primary KPIs

| KPI | Target | Critical Threshold |
|-----|--------|-------------------|
| **Budget Compliance** | >95% | <90% |
| **Average Frame Time** | <10ms | >13ms |
| **Max Frame Time** | <16ms | >20ms |
| **Exceed Rate** | <5% | >10% |

### Session Metrics

```typescript
interface SessionSummary {
  totalFrames: number;           // Total frames measured
  averageFrameTime: number;      // Mean frame time (ms)
  maxFrameTime: number;          // Worst frame time (ms)
  minFrameTime: number;          // Best frame time (ms)
  exceedCount: number;           // Frames over budget
  exceedPercentage: number;      // % frames over budget
  budgetStatusCounts: {          // Distribution by status
    optimal: number;
    warning: number;
    critical: number;
    exceeded: number;
  };
  animationTypeCounts: {         // Distribution by type
    punch: number;
    kick: number;
    // ... etc
  };
}
```

### Performance Targets

- **60 FPS**: 16.67ms per frame
- **Optimal**: <10ms (40% headroom)
- **Warning**: 10-13ms (20% headroom)
- **Critical**: 13-15ms (10% headroom)
- **Exceeded**: >16ms (budget violation)

## Telemetry

### Budget Exceeded Event

```typescript
{
  event: 'pc_animation_budget_exceeded',
  timestamp: 1706123456789,
  sessionId: 'session_abc123',
  animationType: 'punch',
  frameTime: 18.5,
  budgetStatus: 'exceeded'
}
```

### Session Complete Event

```typescript
{
  event: 'pc_animation_session_complete',
  timestamp: 1706123456789,
  sessionId: 'session_abc123',
  summary: {
    totalFrames: 150,
    averageFrameTime: 11.2,
    maxFrameTime: 18.5,
    exceedCount: 5,
    exceedPercentage: 3.3,
    budgetCompliance: 96.7
  }
}
```

### Critical Frame Event

```typescript
{
  event: 'pc_animation_critical_frame',
  timestamp: 1706123456789,
  sessionId: 'session_abc123',
  animationType: 'combo',
  frameTime: 15.8,
  budgetStatus: 'critical'
}
```

## Persistence

### Storage Format

```typescript
{
  sessions: [
    {
      sessionId: 'session_abc123',
      startTime: 1706123456789,
      endTime: 1706123460000,
      measurements: [...],
      summary: {...}
    },
    // ... up to maxSessions (10)
  ]
}
```

### Storage Key

`punch_club_animation_budget`

### Auto-Save

- Sessions saved automatically on `endSession()`
- Uses async `PersistenceService.saveData()`
- Maintains last N sessions (configurable)
- Graceful error handling

## Testing

### Test Coverage

- ✅ Session management (start/end)
- ✅ Frame measurement (sync/async)
- ✅ Budget status calculation
- ✅ Summary statistics
- ✅ Configuration updates
- ✅ Measurement buffer
- ✅ Performance (100+ measurements)
- ✅ Error handling
- ✅ Utility functions

### Running Tests

```bash
npm run test -- tests/unit/punchClub/CombatAnimationBudget.test.ts
```

## Performance Considerations

### Overhead

- **Measurement overhead**: <0.5ms per frame
- **Memory usage**: ~1KB per 100 measurements
- **Sampling**: Reduce rate in production (0.1 = 10%)

### Optimization Tips

1. **Enable sampling** for production (rate: 0.1-0.5)
2. **Limit max samples** to prevent memory growth
3. **Batch telemetry** to reduce network overhead
4. **Clear measurements** periodically
5. **Disable in low-end devices** if needed

## Troubleshooting

### High Frame Times

1. Check animation complexity
2. Verify GPU acceleration
3. Profile JavaScript execution
4. Review DOM manipulation
5. Check for layout thrashing

### Budget Violations

1. Simplify animation keyframes
2. Reduce particle effects
3. Optimize sprite rendering
4. Use CSS transforms (GPU)
5. Batch DOM updates

### Memory Issues

1. Reduce `maxSamples` limit
2. Enable sampling (lower rate)
3. Clear session history
4. Disable persistence if needed

## Integration

### Combat System

```typescript
// In combat loop
const profiler = useCombatAnimationProfiler();

async function executeCombatMove(move: CombatMove) {
  await profiler.measureAnimation(move.animationType, async () => {
    await animateMove(move);
  });
}
```

### Performance Dashboard

```typescript
function PerformanceDashboard() {
  const { state } = useCombatAnimationProfiler();
  
  return (
    <div>
      <h2>Animation Performance</h2>
      <Metric label="Compliance" value={`${state.budgetCompliance.toFixed(1)}%`} />
      <Metric label="Avg Frame Time" value={formatFrameTime(state.currentSession?.summary.averageFrameTime || 0)} />
      <Metric label="Exceeded" value={state.exceedCount} />
    </div>
  );
}
```

## Future Enhancements

- [ ] Real-time performance graph
- [ ] Animation type recommendations
- [ ] Automatic quality adjustment
- [ ] Device-specific thresholds
- [ ] Historical trend analysis
- [ ] Export to CSV/JSON
- [ ] Integration with DevTools
- [ ] A/B testing support

## References

- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [60fps Animation Guide](https://web.dev/animations-guide/)
- [RAIL Performance Model](https://web.dev/rail/)
- [NP-173 Task](../plans/np-173-animation-budget.md)

## Changelog

### 2026-01-24 - Initial Release

- ✅ Core profiler implementation
- ✅ React hook with persistence
- ✅ Comprehensive unit tests
- ✅ Documentation with KPIs
- ✅ Telemetry integration
- ✅ Config-first design

---

**Status**: ✅ Complete  
**Evidence**: `test-results/np-173-animation-budget-2026-01-24.log`
