# legacy-reliquary-panel — Legacy reliquary panel (equipment slots)

> PLAN-086. `overlay`: the legacy reliquary on `/game` (PLAN-067 T-C4,
> R-234, LEG = B — mock). Three columns of legacy slots whose count is the
> matching village building's level; picking a slot is a MOCK choice.
> Reachable **only** via Director action `legacy`.

## What it is / does

- `data-testid="legacy-reliquary"` — the panel root.
- Three `data-testid="legacy-column-<category>"` columns:
  **items**, **heroes**, **blueprints** — each renders
  `legacySlotsFor(villageBuildingLevel)[category]` slots.
- Slots are `data-testid="legacy-slot-<category>-<i>"` elements; a column
  with 0 slots renders an empty-state notice instead.
- Slot selection is a staging choice for the legacy run (mock — no
  gameplay mutation on this screen).

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/directorLegacyReliquary.ts` (Director panel `d` → `[data-action-id="legacy"]`) | `[data-testid="legacy-reliquary"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `00a2dff774692170`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `default-ctx-a/b.png` — panel over the world map;
  `default-iso-0.png` — the `legacy-reliquary` element (three-column
  panel on this capture).
- `deterministicSameBytes: false` — game surface keeps rendering behind
  the panel between ctx frames; recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/legacy-reliquary-panel.md`
- Scope: `src/ui/idleVillage/legacy/LegacyReliquaryPanel.tsx`
- Driver: `scripts/catalog/drivers/directorLegacyReliquary.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → ART-DIRECTION L1+L2 + z-index/portaling: reliquary as
incised-slot furniture — three columns read as equipment triptych; slots
carry engraved affordance, empty columns get a declared notice, not blank
space.
