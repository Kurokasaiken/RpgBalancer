# village-screen-view — Village view (stage, plaque, legend, registry chip)

> PLAN-086. The village surface (`S2_VillageView`), reached via the VILLAGE
> nav plinth: a fixed-aspect painted village stage with interactive
> building pins, a header plaque, a decode legend and the registry chip.
> Everything sits inside `data-testid="village-screen-view"` (absolute
> inset-0 over the world map).

## What it is / does

- **`village-stage`** — the painted village art box (fixed aspect; anchors
  land on roofs). Children positioned on it:
  - **`data-building-pin`** markers (see `village-building-pins` entry) —
    `role="toolbar"` container, roving tabindex, hover-pinnable tooltip
    (`village-tooltip-*`, 140 ms grace, 📌 pin, `village-open-stash` /
    `village-open-merchant` actions).
  - `village-slot-overlay` decorative SVG layer (state marks over
    footprints).
  - **`village-plaque`** — the view's title plaque.
  - **`village-registry-chip`** — opens the registry slide-over drawer.
  - **`village-legend`** — PLAN-038 decode contract: category frames +
    badge legend (level / build / locked) + hotkey row.
- Enter transition: `opacity` fade 240 ms on the stage container
  (`entered` flag).

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S2_VillageView` (S-graph `openVillageView`: `[data-nav-id="village"]` click, input-reale) | `[data-testid="village-screen-view"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `add35cfbff32327c`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures. `howStateReached`: `village:input-reale:nav-plinth`.
- `default-ctx-a/b.png` — in-context view; `default-iso-0.png`
  (`village-screen-view`) and `default-iso-1.png` (`village-stage`) are
  **full-viewport crops by contract** (view-level entry). Readable
  sub-elements in the iso: painted village art, 11 building pins with
  category frames + level badges, slot overlay marks, header plaque,
  legend, registry chip, HUD chrome around it.
- `deterministicSameBytes: false` — ambient stage/game clock between the
  two ctx frames; recorded as data, not pass/fail.
- **Flake note (honest record):** the first V1 run failed
  `driver unreachable` — the `[data-nav-id="village"]` button stayed
  un-actionable ≥30 s after boot-clear once (HUD-wake transient); a plain
  re-run passed and two independent probes could not reproduce (button
  actionable, view mounts). See `fixes.md` for a suggested hardening.

## Links

- Contract: `.mw/contracts/components/village-screen-view.md`
- Scope: `src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx`,
  `villageBuildingIcons.tsx`
- Surface driver: `S2_VillageView` in
  `scripts/sentinel/gameSurfaceHarness.ts` `GAME_SURFACE_GRAPH` (L835).

## Art-direction slice (rubric rev 3)

`view` → full ART-DIRECTION rubric + composition notes: painted village
illustration inside lacquer chrome; state reads live on the pins/overlay
(materia, frames, badges), not on floating panels; Cinzel plaque title.
