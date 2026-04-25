# Live Bug Snapshotter (NP-258)

## Overview

The Live Bug Snapshotter allows playtesters to capture the current canvas/video output plus the latest interaction logs with a single tap. Snapshots are queued locally via `PersistenceService` and uploaded later when network/battery constraints are satisfied. The feature is designed for mobile Punch Club playtests but is reusable in any config-first client.

Key goals:

1. Capture visual evidence using the existing canvas or video feed without blocking UI threads.
2. Attach the last N playtest events, session metadata, and performance stats to every snapshot.
3. Defer uploads when the device is offline, on cellular, or below the configured battery threshold.

## Architecture

```text
src/ui/playtest/LiveBugSnapshotter.tsx
├─ Reads config from DEFAULT_LIVE_SNAPSHOT_CONFIG
├─ Resolves capture target (ref or selector)
├─ Uses PlaytestLogger to fetch recent events/session/stats
├─ Builds SnapshotQueueEntry and persists via PersistenceService
└─ Enforces throttling + device gating (Wi-Fi, battery)

src/ui/playtest/playtestSnapshotConfig.ts
├─ Zod schema for screenshot, upload, throttling, logging knobs
└─ DEFAULT_LIVE_SNAPSHOT_CONFIG exported for reuse

PlaytestLogger
└─ getRecentEvents() helper powers the log payload in snapshots
```

## Configuration

`DEFAULT_LIVE_SNAPSHOT_CONFIG` exposes the following sections:

- `enabled`: master toggle.
- `maxBufferedEvents`: number of recent events included per snapshot.
- `screenshot`: quality/format/scale/background/watermark settings passed to the canvas capture utility.
- `upload`: `persistenceKey`, `maxQueuedSnapshots`, `wifiOnly`, `minBatteryPercent`, and retry backoff (max attempts, base delay, jitter).
- `throttling`: minimum interval between captures plus cooldown window after failures.
- `logging`: whether to include performance metrics and how many console-style summary lines to emit.

All values must be overridden via config files or props; React components must not introduce new magic numbers.

## Component Usage

```tsx
import { LiveBugSnapshotter } from '@/ui/playtest/LiveBugSnapshotter';

const canvasRef = useRef<HTMLCanvasElement>(null);

<LiveBugSnapshotter
  targetRef={canvasRef}
  logger={getPlaytestLogger()}
  onSnapshotQueued={(entry) => console.log('Queued', entry.id)}
  config={{
    screenshot: { watermark: { text: 'IdleVillage QA', position: 'top-left', opacity: 0.8 } },
    upload: { wifiOnly: true },
  }}
/>
```
Props:

1. `targetRef` or `targetSelector`: identifies the canvas/video element to capture.
2. `logger`: optional override; defaults to global `getPlaytestLogger()`.
3. `config`: partial override merged with defaults.
4. `onSnapshotQueued`: callback fired after persistence.
5. `disabled`, `buttonLabel`, `className`: UI helpers.

## Snapshot Payload

Each queue entry stores:

- `screenshot`: Base64 `image/png|jpeg|webp` string with optional watermark.
- `events`: Recent `PlaytestEvent[]` from `getRecentEvents`.
- `eventSummary`: formatted log lines (timestamp + type + value).
- `session`: current `PlaytestSession` (if available).
- `stats`: output of `PlaytestLogger.getSessionStats()`.
- `metadata`: network/battery/platform info for gating analysis.

## Gating & Throttling

- Wi-Fi enforcement uses `navigator.connection` (type/effectiveType). Configurable via `upload.wifiOnly`.
- Battery threshold leverages `navigator.getBattery()` when available; otherwise ignored.
- Throttling prevents rapid taps (`throttling.minIntervalMs`) and adds a cooldown on failure (`cooldownAfterFailureMs`).
- Queue persists under `upload.persistenceKey` with FIFO trimming to honor `maxQueuedSnapshots`.

## Testing

`tests/unit/playtest/LiveBugSnapshotter.test.tsx` covers:

1. Successful capture + persistence with mocked canvas and logger.
2. Wi-Fi gating (cells blocked when `wifiOnly=true`).
3. `disabled` prop preventing captures.

Tests mock `PersistenceService`, `navigator.connection`, `navigator.getBattery`, and `canvas.toDataURL` to keep them deterministic.

## Safeguards

When modifying the snapshotter:

- Update the schema file for any new config knobs and ensure defaults exist.
- Rerun `npm run lint -- src/ui/playtest`, `npm run test -- tests/unit/playtest/LiveBugSnapshotter.test.tsx`, `npm run build:check`, `npm run kanban:lint` and log output to `test-results/np-258-live-bug-snapshotter.log`.
- Never bypass `PersistenceService` for queue storage.

## Troubleshooting

- **Button disabled:** Check `wifiOnly` + network type and ensure `disabled` prop is false.
- **Snapshot target not found:** Pass a valid `targetRef` or `targetSelector` pointing to a `<canvas>` or `<video>`.
- **Queue never drains:** Verify uploader/worker consumes the `upload.persistenceKey` and respects `status`/`attempts` metadata.
