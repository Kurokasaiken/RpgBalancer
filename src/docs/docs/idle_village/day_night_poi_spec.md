---
title: DayNightPOI Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# DayNightPOI Spec

## State Machine (ASCII)

```text
[mount] ──► day
 day ──(cycleProgress == 1)──► night
 night ──(cycleProgress == 1)──► day
 day / night ──(pauseGame)──► paused
 paused ──(resumeGame)──► previous phase
```

## Detailed Scenarios

### Scenario 1: Render day phase

**Given:** `useMinimalGameplay` reports `isDayPhase = true` and `cycleProgress = 0.4`
**When:** `DayNightPOI` renders
**Then:** it displays the sun icon, gold/amber ring, and a halo filled to 40%
**Visual contract:** Playwright sees `role=img` with `aria-label` containing "Day" and a circular progress indicator at 40%

### Scenario 2: Render night phase

**Given:** `useMinimalGameplay` reports `isDayPhase = false` and `cycleProgress = 0.7`
**When:** `DayNightPOI` renders
**Then:** it displays the moon icon, purple/indigo ring, and a halo filled to 70%
**Visual contract:** `aria-label` contains "Night" and ring color is purple

### Scenario 3: Pause / resume

**Given:** the game is running in day phase
**When:** the user clicks `TimeEngineStrip` pause toggle
**Then:** `pauseGame()` is called, `DayNightPOI` shows pause bars and reduced bloom
**Visual contract:** `data-paused="true"`, ring opacity ~0.34, no progress animation

### Scenario 4: Phase transition telemetry

**Given:** current tick crosses the day/night boundary
**When:** `isDayPhase` flips in the store
**Then:** `DayNightPOI` emits a `day_night_transition` telemetry event
**Visual contract:** Smooth 220ms icon cross-fade between sun and moon

## Invariants

- All time state is read from `useMinimalGameplay`; no local timers
- Phase and progress are derived deterministically from `currentTick` and config
- Visual tokens come from `dayNightPoiSkinConfig` presets; no hardcoded colors
- DayNightPOI belongs to the POI family and follows its halo grammar

## Runtime Evidence

Playwright suite `poiQuestDetailRosterTimeClock.spec.ts` (2026-08-14):

- `should advance the day/night cycle halo while time runs` — `data-progress` becomes > 0 and `data-paused="false"` after resuming and selecting 4x speed.
- `should pause the day/night cycle and stop progress` — clicking the TimeEngineStrip pause button sets `data-paused="true"`; `data-progress` does not change for 1 s while paused.
- `should transition from day to night and flip the icon/color` — after running at 4x speed the canonical store flips `isDayPhase` to `false` and `DayNightPoiSkin` renders `data-phase="night"`.

## Comportamento atteso — tone ring senza quadrato alfa (2026-08-15)

**Contratto visivo:** il componente *tone* con i ring deve essere renderizzato come puro contorno/filtro, senza un quadrato o rettangolo di colore/alpha attorno. Nessun wrapper del tone deve avere `background-color` opaco o semitrasparente, `box-shadow` pieno o `filter` che disegni un box.

Punti di controllo per mantenere il contratto:
- Il contenitore SVG/ring deve avere `background: transparent` / `background-color: rgba(0,0,0,0)`.
- Eventuali `box-shadow` o `filter: drop-shadow` devono usare alpha in modo da non formare un rettangolo pieno.
- `DayNightPoiSkin.tsx` e i suoi wrapper devono essere privi di `overflow`, `clip-path`, `mask` o `background` residuali che disegnino un box.
- Il tone deve essere coerente con `daynight_trusted.md`: puro contorno/filtro, senza piazzamento di un box colorato dietro.

Test: `should render day/night ring tone without visible alpha square artifact`.

## References

- Trusted contract: [`daynight_trusted.md`](./trusted/daynight_trusted.md)
- Depends on: [`time_engine_spec.md`](./time_engine_spec.md)
- Used by: [`time_engine_day_night_poi_interaction_spec.md`](./time_engine_day_night_poi_interaction_spec.md)
