# Alt Visuals · Pinball Monitor Guidelines

## Overview

The Alt Visuals cinematic canvas (currently v6 Asterism) now exposes a watchdog-driven diagnostics surface to guarantee that the pillars and the guided pinball auto-launch sequence never get stuck. The monitor runs on top of a **config-first hook** (`usePinballMonitor`) plus a **debug UI panel** (`PinballMonitorPanel`), and emits structured telemetry under the `alt_visual_pinball_watchdog` channel.

```text
┌───────────────────────────────────────────┐
│ Alt Visuals · Pinball Monitor             │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ │
│ │ Scene ID  │ │ Pillars   │ │ Ball Run  │ │
│ │ alt-v6    │ │ 5 / 5     │ │ 3.2s      │ │
│ └───────────┘ └───────────┘ └───────────┘ │
│ Flags: bridgeReady ✓ • ballStuck ✗ • ...  │
│ Recent events…                            │
└───────────────────────────────────────────┘
```

## Architecture

```text
AltVisualsV6 (canvas)
  └── exposes window.__ALT_VISUALS_PINBALL__ bridge
        ├─ getSummary(): PinballAnimationSummary
        ├─ relaunchBall()
        ├─ relaunchScene()
        └─ autoLaunchBall()

usePinballMonitor (hook)
  ├─ Polls bridge every pollingIntervalMs
  ├─ Applies PinballMonitorConfig thresholds
  ├─ Emits telemetry + CLI diagnostics
  └─ Provides manual scan / relaunch helpers

PinballMonitorPanel (UI)
  └─ Renders status, KPIs, recent events, controls
```

### Config (`src/ui/altVisuals/config/pinballMonitorConfig.ts`)

All timing and telemetry definitions live in `PinballMonitorConfig`. Never hardcode thresholds in the monitor or UI:

| Field | Description | Default |
| --- | --- | --- |
| `pollingIntervalMs` | Scan cadence | `250` |
| `ballStuckThresholdMs` | Max runtime before ball is considered stuck | `DEFAULT_PINBALL_PHYSICS_CONFIG.maxSteps * 25` |
| `autoLaunchGraceMs` | Wait after pillars land before forcing auto launch | `1500` |
| `pillarStallThresholdMs` | Max idle time without pillar progress | `2000` |
| `telemetryEventName` | Custom event name dispatched on `window` | `alt_visual_pinball_watchdog` |
| `diagnostics` | Verbose console output toggle | `false` |

Override values by passing `config` to `usePinballMonitor` or `PinballMonitorPanel`.

### Hook (`usePinballMonitor`)

- Polls the bridge and computes derived flags:
  - `ballStuck`
  - `awaitingAutoLaunch`
  - `pillarStalled`
  - `bridgeReady`
- Automatically triggers `relaunchBall`, `relaunchScene`, or `autoLaunchBall` depending on the reason.
- Stores last recovery + event history (bounded by `maxEventHistory`).
- Emits structured telemetry via:
  1. `onTelemetryEvent` callback prop (optional).
  2. `CustomEvent` dispatched on `window` using `telemetryEventName`.
- CLI diagnostics hook: set `enableCliDiagnostics: true` to register `window.__ALT_VISUALS_PINBALL_MONITOR__`, then invoke from DevTools:

```js
window.__ALT_VISUALS_PINBALL_MONITOR__.forceScan();
window.__ALT_VISUALS_PINBALL_MONITOR__.getLatestState();
```

### Panel (`PinballMonitorPanel`)

- Thin visual wrapper around the hook.
- Displays KPIs (scene ID, pillars landed, runtime, etc.), watchdog flags, last event, and a short telemetry feed.
- Provides manual buttons:
  - `Manual Scan`
  - `Relaunch Ball`
  - `Relaunch Scene` (fallbacks to ball relaunch if the bridge does not expose `relaunchScene`).
- Usage example:

```tsx
import PinballMonitorPanel from '@/ui/altVisuals/components/PinballMonitorPanel';

<PinballMonitorPanel
  className="max-w-xl"
  enableCliDiagnostics={import.meta.env.DEV}
  config={{ diagnostics: import.meta.env.DEV }}
/>
```

## Animation Bridge Contract

The Alt Visuals runtime must register a bridge on `window.__ALT_VISUALS_PINBALL__` with the following shape:

```ts
interface PinballAnimationBridge {
  getSummary(): PinballAnimationSummary | null; // mandatory
  relaunchBall?(): void;                       // recommended
  relaunchScene?(): void;                      // optional fallback
  autoLaunchBall?(): void;                     // optional (V6 auto-launch)
}
```

`PinballAnimationSummary` is intentionally minimal—only pass derived values (timestamps, counters, flags). Never leak raw refs or internal Pixi/canvas objects.

### Fallback when animation API is unavailable

If the bridge is not registered (e.g., Alt Visuals disabled, legacy dev-only builds), the monitor moves to the `waiting_bridge` state and emits a warning event. This ensures that dashboards or CLI tools do not crash when the visualization is absent.

Recommended fallback steps:

1. Ensure `window.__ALT_VISUALS_PINBALL__` is always defined in environments where the Alt Visuals canvas is mounted.
2. For environments without Alt Visuals, explicitly set `window.__ALT_VISUALS_PINBALL__ = null;` so the hook conveys “bridge missing” cleanly.

## Testing

- Unit tests live in `tests/unit/altVisuals/PinballMonitor.test.tsx`.
- Tests mock the animation bridge and verify:
  - Bridge polling & waiting state.
  - Automatic recovery when ball runtime exceeds thresholds.
  - Manual actions + telemetry callback invocation.

Run targeted suite:

```bash
npm run test -- tests/unit/altVisuals/PinballMonitor.test.tsx
```

## CLI Diagnostics

- Enable via hook/ panel prop `enableCliDiagnostics`.
- Utilities exposed under `window.__ALT_VISUALS_PINBALL_MONITOR__`.
- Sample workflow:

```js
// Force a scan
window.__ALT_VISUALS_PINBALL_MONITOR__.forceScan();

// Inspect last derived state
const state = window.__ALT_VISUALS_PINBALL_MONITOR__.getLatestState();
console.table(state.events.slice(-5));
```

## Integration Checklist

1. **Register bridge** in Alt Visuals runtime with `getSummary` + relaunch helpers.
2. **Mount panel** inside internal dashboards (e.g., Skill Check Preview, Gilded Observatory dev tools).
3. **Configure telemetry** consumers to listen for `alt_visual_pinball_watchdog` events if additional analytics streams are required.
4. **Validate** via unit tests and the manual CLI commands before promoting to QA.

Keeping the monitor config-first and exposing deterministic telemetry ensures the Alt Visuals experience remains stable across future animation revs (v6 → v8+).
