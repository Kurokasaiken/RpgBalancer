# hud-top-tabs — Top HUD tab cluster

> PLAN-086 pilot. Region `HUD-3` (R-234): three DETACHED plaques — time ·
> next event · resources — hanging from the top edge of `/game`. The sky
> between them stays map; the menu lives in the bottom-right cluster.

## What it is / does

- **Time tab** (top-left, `HudPlaque shape="hang"`): day counter
  (`DAY n`) + simulation speed controls (pause, ×1, ×2, ×4 — the active
  speed is highlighted).
- **Next-event tab** (top-center, `data-testid="hud-next-tab"`): one
  glyph + event name + days left; renders **null** when no dated event
  exists (calm events shrink/soften it). Click pans the camera to the
  event; why/what-to-do lives in the tooltip.
- **Resources tab** (top-right, `HudPlaque`): `GOLD / FOOD / WOOD`
  readouts with engraved glyphs, per-resource tone (`data-tone`
  = danger|warning|neutral|good), delta badges and — for food — the
  consumption rate and days-to-empty.

## Declared states

| id | driver | observable assertion |
|---|---|---|
| `default` | surface `S1_WorldMapIdle` | HUD plaques visible |
| `resource-low` | script `drivers/hudResourceLow.ts` | `[data-tone="danger"]` visible |
| `event-imminent` | script `drivers/hudEventImminent.ts` | `hud-next-tab` visible — *documented_partial: no seam reaches it on this build (needs `seedHudEvent`/invasion-countdown hook)* |
| `hud-hidden` | surface+key `h` | HUD hidden, hide-toggle pearl visible |

## Capture (V1)

- `shots/V1/meta.json` — frozen build, sourceSha `d53c5bb2`, metal
  backend, 1440×900, reduced-motion.
- In-context full-surface shots + isolated per-plaque shots
  (`iso-0` resources, `iso-1` time; next-tab absent by design in
  `default`).
- `deterministicSameBytes: false` — byte diff expected (clock/deltas);
  perceptual ε calibration is a T-009 metric, byte-compare recorded as
  data, not as pass/fail.

## Links

- `COMPONENT_MASTER_INDEX.md` row: HudPlaque / Lacquer Atlas kit
- Contract: `.mw/contracts/components/hud-plaque.md` (if present —
  catalog:validate enforces linking when the file exists)
- Drivers: `scripts/catalog/drivers/hudResourceLow.ts`,
  `hudEventImminent.ts`

## Art-direction slice (rubric rev 1)

`hud_cluster` → ART-DIRECTION L1+L2 + token section: Lacquer Atlas
plaques, engraved glyphs, bronze/teal materia, `data-tone` semantic
tones, no flat/glassmorphism.
