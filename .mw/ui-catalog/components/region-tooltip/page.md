# region-tooltip — Map region name plate on hover

> PLAN-086. A cartographer's label laid on a hovered territory of the Pixi
> world map: `HudPlaque shape="plinth"` with `role="tooltip"`, centred on the
> region's screen anchor and following pan/zoom. Never takes the pointer.

## What it is / does

- Mounts only while `regionHover` is set in `game-frame-pixi.tsx`
  (`viewMode === 'map'`): the pointer must dwell ~`regionHoverDelayS`
  (≈1 s, tunable in the Tuning panel) on a painted territory before the
  plate appears.
- Name is i18n-resolved upstream (`t('gameFrame.regions.<id>')`); the plate
  positions itself `translate(-50%,-50%)` on the region centre and fades in
  via `region-label-in` (260 ms).
- `pointer-events: none` — pure readout, never intercepts map input.
- Selector note: `[role="tooltip"]:not([data-hud-tooltip])` distinguishes
  this plate from the radix HUD control tooltip.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/regionTooltip.ts` (pointer sweep over land, dwell-poll per point) | `[role="tooltip"]:not([data-hud-tooltip])` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `1a111a7940e4a824`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T22:53:13Z.
- `default-ctx-a.png` / `default-ctx-b.png` — name plate over the hovered
  territory; `default-iso-0.png` — the plate alone.
- `deterministicSameBytes: false` — recorded as data.
- Driver honesty: sweep grid 160–1300 × 140–760 px, 1.5 s dwell-poll per
  point, returns false (honest unreachable) if no land is hit — it did hit.

## Links

- Contract: `.mw/contracts/components/region-tooltip.md`
- Scope: `src/ui/idleVillage/components/gameFrame/RegionTooltip.tsx`
  (+ mount point `src/pages/game-frame-pixi.tsx` ~L1820).
- Driver: `scripts/catalog/drivers/regionTooltip.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → Lacquer Atlas plinth, `--skin-font-display` (Cinzel) uppercase
letterspaced label, `--skin-label-primary`; ornament at the service of
orientation (level 2 info), pointer-transparent like a painted label.
