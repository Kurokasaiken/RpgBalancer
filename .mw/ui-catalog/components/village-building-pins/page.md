# village-building-pins — Building pins on the village stage

> PLAN-086. Marker family (`marker`): the interactive pins anchored on
> painted buildings inside `village-stage`. Each pin is a real `<button
> data-building-pin="<id>">` — the village view's primary affordance layer.

## What it is / does

- **11 pins** witnessed on this build (manifest census): lumbermill,
  quarry, farm, warehouse, inn, smithy, market, infirmary, palisade,
  watchtower, barracks — positioned by per-building `anchor` (+`anchorNudge`)
  percentages over the stage art.
- Attributes: `data-pin-frame` (category frame), `data-pin-state`
  (`built` / `buildable` / `locked`), `data-active`, `aria-pressed` when
  its tooltip is pinned. Level shown as **roman numeral** badge, or **"+"**
  for buildable.
- Interaction: `role="toolbar"` container with roving tabindex and
  arrow-key handling; hover/focus opens the building tooltip after a
  140 ms grace (📌 pin to stick); pinned tooltip offers
  `village-open-stash` / `village-open-merchant` (the S4/S5 surface paths).
- `activeBuildingId` (PLAN-042) cross-lights: hovering a registry row or
  pin pings the matching pin + slot-overlay region.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S2_VillageView` (S-graph `openVillageView`: `[data-nav-id="village"]` click, input-reale) | `[data-building-pin]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `add35cfbff32327c`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `default-ctx-a/b.png` — in-context village view with all pins;
  `default-iso-0.png` — the first `[data-building-pin]` element (lumbermill
  pin crop).
- `deterministicSameBytes: false` — ambient stage + game clock; recorded
  as data, not pass/fail.
- Shares the `S2_VillageView` reach — see
  `../village-screen-view/fixes.md` for the once-observed nav-click flake.

## Links

- Scope: `src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx`
  (pin render ~L480), `villageBuildingIcons.tsx`; building data +
  anchors in `src/balancing/config/idleVillage/villageBuildingsConfig.ts`.
- No contract doc linked in the manifest (`links.contract: []`).
- Surface driver: `S2_VillageView` in
  `scripts/sentinel/gameSurfaceHarness.ts` `GAME_SURFACE_GRAPH` (L835).

## Art-direction slice (rubric rev 3)

`marker` → ART-DIRECTION L1+L2 + pillar «stato sul mondo, non pannelli»:
pins are incised materia sitting on the painting (category frame, badge
level), locked/ built/ buildable told by frame+badge — state on the world,
tooltip carries the actions.
