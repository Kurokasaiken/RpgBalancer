# world-surface-event-shroud — Fullscreen event shroud veil

> PLAN-086. Two-sided parchment curtain wipe over the map during an event
> theatre (goblin invasion). Documented **partial**: the declared driver is
> unreachable on this build — see `fixes.md`.

## What it is / does

- `data-testid="ws-event-shroud"` — an `aria-hidden`, `pointer-events:none`
  layer (`position:absolute; inset:0`, z above map, below frame/debug UI)
  that is **always mounted** at `S1` (`game-frame-pixi.tsx` L1821).
- Two `ws-event-shroud__half` children (`--left`/`--right`) carry the
  painted cloud/parchment halves (`event_shroud_*_{ottanio,pergamena}.webp`);
  when `covered` they gain `--closed` and slide in to occlude the map.
- `covered` is driven by `shroudCovered` state; the E2E seam
  `__idleVillageTestHooks.startInvasion()` sets it — curtains close, the
  announcement card opens at the peak, confirming reopens them.
- While covered the clock freezes (event theatre ruling) and the HUD is
  woken (`hudWakeSignal`).

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S15_GoblinInvasionEvent` | `[data-testid="ws-event-shroud"]` visible | **documented_partial — driver unreachable**: `reached: false` (120 s poll, no invasion armed). Note: even on a pass, the asserted node is the always-mounted container — see `fixes.md` for a stronger covered-state selector |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `6b8a9797a332ae32`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T23:04:34Z.
- **No shots** — captured only on asserted states.
- DOM truth at S1 (probe, 2026-10-24): `[data-testid="ws-event-shroud"]`
  in DOM, 1440×900 visible, `0` elements with `ws-event-shroud__half--closed`
  — container present, curtains open (uncovered), as designed at idle.

## Fixes

See `fixes.md` — `startInvasion` seam + a covered-state selector
(`.ws-event-shroud__half--closed`) so the assertion names the meaningful
state, not the always-on container.

## Links

- Contract: `.mw/contracts/components/world-surface-event-shroud.md`
- Scope: `src/ui/idleVillage/components/WorldSurfaceEventShroud.tsx`,
  `src/balancing/config/idleVillage/eventShroudGradeTokens.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → painted theatre curtains (deep-teal `ottanio` clouds for
threats / `pergamena` variant), compositor-transform animation; the world
itself is veiled by matter, not dimmed by a flat overlay.
