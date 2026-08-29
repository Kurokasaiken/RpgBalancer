# clockKit

**Status:** Draft · **Version:** 1.0.0
- Canonical components: `ClockWidget` (`src/ui/idleVillage/components/minimal/ClockWidget.tsx`), `DayNightTimeEngineStrip` (`src/ui/idleVillage/components/minimal/DayNightTimeEngineStrip.tsx`), `TimeEngineStrip` (`src/ui/idleVillage/components/minimal/TimeEngineStrip.tsx`)
- Reference route: `/minimal-gameplay`
- Minimal route: `/minimal-clock`
- Contract subtree: `[data-testid="minimal-clock-widget"]`

## One-line day/night clock

`DayNightTimeEngineStrip` is the drop-in, canonical day/night clock. It reads the
shared minimal gameplay store, computes the full 24-hour cycle progress from
`globalRules.dayNightCycle`, and wires `TimeEngineStrip` with the correct
`DayNightPoiSkin` phase icon and palette.

```tsx
import { DayNightTimeEngineStripStandalone } from '@/ui/idleVillage/frozen/kits/clockKit';

function MyPage() {
  return <DayNightTimeEngineStripStandalone compact />;
}
```

`DayNightTimeEngineStripStandalone` mounts `SkinSystemProvider` and
`SandboxTimingProvider` automatically if they are not already in the tree, so the
page does not need to know the provider chain.

### The `gameplay` prop is optional, and not an optimisation

`DayNightTimeEngineStrip` accepts an optional `gameplay` prop. Both forms are
valid and behave identically:

```tsx
<DayNightTimeEngineStrip compact />                      // own subscription
<DayNightTimeEngineStrip compact gameplay={gameplay} />  // reuses yours
```

Passing it is a convenience for pages that already hold the instance. It does
**not** save a subscription: the hook is called either way, deliberately.

Until 2026-08-28 the component resolved its source with
`gameplayProp ?? useMinimalGameplayWithIdleVillageConfig()`, which skipped the
hook whenever the prop was supplied — a conditional hook call. Any page that
followed the documented example crashed with React's *"change in the order of
Hooks"* as soon as the prop appeared or disappeared between renders, hot reload
included. The prop's stated purpose, avoiding a double subscription, was the very
thing that broke it. Do not reintroduce that shape, and do not pass a value that
can flip between defined and undefined across renders.

### Active time engine

`DayNightTimeEngineStrip` is not just a display: it owns the canonical real-time
loop. While `isPaused` is `false`, the strip calls `gameplay.tick(intervalMs, 'auto')`
on the shared `useMinimalGameplay` store at `config.loop.tickIntervalMs`. This
makes the day/night cycle, `currentTick`, `currentDay`, `isDayPhase`, and active
activities advance as long as the strip is mounted.

Pages that use the strip no longer need their own `setInterval` for time.

### Global keyboard control

When the strip is mounted anywhere on a page, `Space` is a page-wide shortcut
that toggles play/pause — it works regardless of which element has focus:
- time running → `Space` pauses
- time paused → `Space` resumes

This contract is covered by Playwright on `/poi-quest-detail-roster-time-clock`
and on `/minimal-clock`.

If the page already calls `useMinimalGameplayWithIdleVillageConfig()` and mounts
the providers, pass the same `gameplay` instance to avoid an extra subscription:

```tsx
import { DayNightTimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';

function MyPage() {
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  return <DayNightTimeEngineStrip gameplay={gameplay} compact />;
}
```

When `gameplay` is omitted the hook is called inside the component.

## Manual assembly (legacy)

Use only when you need to override `hudState`, `villageState`, or a non-default
time display.

```tsx
import { TimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
import { ClockWidget, useClockKitData } from '@/ui/idleVillage/frozen/kits/clockKit';

function MinimalClock() {
  const props = useClockKitData();
  return (
    <TimeEngineStrip
      phaseIcon={<DayNightPoiSkin isDayPhase={isDay} cycleProgress={progress} isPaused={paused} />}
      isPlaying={!paused}
      progressFraction={progress}
      totalSeconds={86400}
      onToggle={toggle}
      label="Day/Night Cycle"
      clockProps={{ ... }}
      hudState={{ ... }}
      villageState={{ ... }}
      secondsPerTimeUnit={1}
      temporalDisplay={{ ... }}
      compact
    />
  );
}
```
