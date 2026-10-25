# hud-tooltip — HUD control tooltip plate (radix)

> PLAN-086. The HUD's own tooltip (PLAN-067 T-A14, R-234): control name,
> engraved shortcut key cap, optional one-line hint — replacing the native
> `title` that never shows in a capture and says nothing about the shortcut.

## What it is / does

- `HudTooltip` wraps HUD chrome controls (nav items, corner controls,
  plaques, hide-toggle pearl). Radix `Tooltip.Root` + `Portal`, `data-hud-tooltip`
  on the content plate; `delayDuration 350 ms`, `skipDelayDuration 250 ms`.
- Anatomy: uppercase Cinzel label + optional `<kbd>` key cap (engraved) +
  optional EB Garamond hint line; lacquer gradient plate on
  `--skin-hud-lacquer-*` tokens, `pointer-events: none`.
- `wrap` puts the trigger on a span so disabled controls still open it;
  `when={false}` renders the child alone; keyboard focus opens it too.
- The control keeps its own `aria-label` — the tooltip is for sighted
  hover/focus, not the accessible name.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/hudTooltipHover.ts` (hover `hud-hide-toggle`, wait ≤4 s) | `[data-hud-tooltip]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `1c84df69c3676f04`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T22:57:51Z.
- `default-ctx-a.png` / `default-ctx-b.png` — plate open under the
  hide-toggle in the bottom-right cluster; `default-iso-0.png` — the plate
  alone.
- `deterministicSameBytes: false` — recorded as data.

## Links

- Contract: `.mw/contracts/components/hud-tooltip.md`
- Scope: `src/ui/idleVillage/components/gameFrame/HudTooltip.tsx`.
- Driver: `scripts/catalog/drivers/hudTooltipHover.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → Lacquer Atlas plate on skin tokens, brass-bordered engraved key
cap, Cinzel + EB Garamond; hint line is level-2 info kept subordinate to
the control's name.
