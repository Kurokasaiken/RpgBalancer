# village-slot-overlay — Worker slot overlay on village buildings

> PLAN-086. Decorative SVG layer inside the village stage (`S2_VillageView`):
> state marks painted *over* the buildings' footprints — the painting itself
> is the building, so `built` regions get no mark at all. PLAN-038 /
> web-debate artifact r003.

## What it is / does

- One `SkinScope`-wrapped `<svg>` (`data-testid="village-slot-overlay"`)
  stretched over the whole village canvas (`VILLAGE_CANVAS` viewBox,
  `preserveAspectRatio="none"`).
- Per painted building (`hasFootprint`), one stable `<g data-region
  data-state>` group whose mark depends on `initialState`:
  - `buildable` → "surveyor's ring": dark underlay + brass dashed footprint
    ellipse (`footprintOf`, cy = y + 0.92h) with 4 stake ticks at N/E/S/W.
  - `locked` → feathered radial vignette + dotted ring.
  - `built` → no mark; a pennant flag only from `initialLevel >= 2`.
- Contracts (from the debate): `pointer-events: none`, `aria-hidden` —
  never a tooltip-arbitration target; bboxes are authoring data and never
  drawn; pop-in via the standalone `scale` property (pins own transform);
  all animation is opacity/scale keyframes, no per-frame JS.
- `activeId` (shared `activeBuildingId`, PLAN-042) lights a glow ping on
  the matching region when a registry row or pin is hovered — also via a
  pure-CSS `:has()` rule from pin hover/focus.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S2_VillageView` (nav-plinth click → `village-screen-view`) | `[data-testid="village-slot-overlay"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `0b568a880baa663e`,
  metal backend, 1440×900, reduced-motion `reduce`, captured
  2026-10-24T22:49:03Z.
- `default-ctx-a.png` / `default-ctx-b.png` — in-context village stage;
  `default-iso-0.png` — the overlay layer (full-canvas element, so the
  isolated crop covers the stage).
- `howStateReached`: `village:input-reale:nav-plinth`.
- `deterministicSameBytes: false` — expected: `vslot-breathe` keyframes and
  the staggered pop-in keep opacity/scale moving between the two frames
  (byte-compare recorded as data, not pass/fail).

## Links

- Contract: `.mw/contracts/components/village-slot-overlay.md`
- Scope: `src/ui/idleVillage/components/gameFrame/VillageSlotOverlay.tsx`
  (+ config `src/balancing/config/idleVillage/villageBuildingsConfig.ts`)

## Art-direction slice (rubric rev 3)

`overlay` → ART-DIRECTION L1+L2: painted-state marks in SkinScope tokens
(`--skin-hud-lacquer-base` underlay, `--skin-hud-brass-hi`/`-crest` rings —
re-plated to the Roster range in PLAN-043 WS-5); engraved-material marks,
no bounding-box chrome, reduced-motion honored via `prefers-reduced-motion`.
