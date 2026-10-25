# village-building-tooltip — Pinned building tooltip

> PLAN-086. The single hover-pinnable tooltip of the village stage
> (`data-testid="village-building-tooltip"`, `role="group"`): building name,
> category/level, pin + close, and the open actions (`village-open-stash`,
> `village-open-merchant`). §5b.7 + artifact r005.

## What it is / does

- Rendered inside `VillageScreenView` only while `activeBuilding` is set —
  hover a building pin (`data-building-pin`) or click a Settlement Registry
  row (`data-registry-row="<id>"`, the canonical affordance while the drawer
  is open, R-270).
- A positioned wrapper carries ref + pointer handlers around a `HudPlaque
  shape="panel"` (the plaque does not forward refs); `aria-label` = the
  i18n-resolved building name, `aria-controls` on the owning pin.
- Content: engraved building icon + name + category/level header, pin and
  close buttons, and building-specific actions — e.g. warehouse →
  `village-open-stash`, market → `village-open-merchant`.
- Position follows the measured stage node (`pos.x/y`); hidden via
  `visibility` while measuring, never unmounted mid-hover.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/villageBuildingTooltip.ts` (nav → village → registry chip → `[data-registry-row="warehouse"]` click) | `[data-testid="village-building-tooltip"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `489e302840c0b9ee`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T22:51:37Z.
- `default-ctx-a.png` / `default-ctx-b.png` — village stage with the
  registry drawer open and the tooltip pinned on the warehouse;
  `default-iso-0.png` — the tooltip card alone.
- `deterministicSameBytes: false` — recorded as data.
- Driver verified by testid, never a blind sleep
  (`village-building-tooltip` waitFor, 10 s budget).

## Links

- Contract: none linked in the manifest (`links.contract: []`).
- Scope: `src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx`
  (`VILLAGE_TOOLTIP_ID`, tooltip block ~L725-790).
- Driver: `scripts/catalog/drivers/villageBuildingTooltip.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → Lacquer Atlas plaque (`HudPlaque shape="panel"`, skin tokens,
engraved building glyph), Cinzel display title + EB Garamond body; a
functional object pinned to the painting, not floating chrome.
