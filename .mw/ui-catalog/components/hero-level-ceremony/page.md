# hero-level-ceremony — Hero level-up ceremony layer

> PLAN-086. `overlay`: the level-up plate layer (PLAN-067 T-C1, R-234,
> LVL = B — mock presentation). Listens to the same `hero_levelup_mock`
> events as the roster's decorative layer and stamps **one plate per
> hero** — a reward that interrupts for one click, not a notification.

## What it is / does

- `data-testid="hero-levelup-layer"` — `position:fixed inset-0` flex layer
  at `zLayers.reward`, `pointer-events:none` on the layer, `auto` per
  plate; multiple plates wrap side by side.
- Each `data-testid="hero-levelup-plate"` is a `HudPlaque shape="panel"`
  `role="dialog"`: a wax **`Seal`** with the new level in **Roman
  numerals**, title `ceremonyTitle` (name + level), hairline brass rule,
  `data-gain-row` stat gains (`from → to`, tabular-nums), and a
  `SkinButton variant="cta"` **Continue**.
- Esc or Continue closes the top plate; `heroPlateIn` 220 ms entrance
  (skipped under `prefers-reduced-motion`, `data-reduced-motion` marker).
- Staged via Director action `levelup` (`runHeroLevelUpStaging` — opens
  the roster itself if needed, PLAN-032 SP-5).

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/directorHeroLevelUp.ts` (Director panel `d` → `[data-action-id="levelup"]`) | `[data-testid="hero-levelup-layer"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `cd6b4a3ec2e4257e`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `default-ctx-a/b.png` — plate over the game (roster opened by the
  staging); `default-iso-0.png` (`hero-levelup-layer`, full-viewport) and
  `default-iso-1.png` (`hero-levelup-plate`, the plaque itself).
- `deterministicSameBytes: false` — staging settles between the two ctx
  frames; recorded as data, not pass/fail.

## Links

- Contract: `.mw/contracts/components/hero-level-ceremony.md`
- Scope: `src/ui/idleVillage/rosterV2/HeroLevelCeremony.tsx`,
  `HeroLevelDecor.tsx`, `runHeroLevelUpStaging.ts`
- Driver: `scripts/catalog/drivers/directorHeroLevelUp.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → ART-DIRECTION L1+L2 + z-index/portaling: Lacquer Atlas plaque
+ wax-seal materia, Roman-numeral engraving, gain rows in display/serif
duo; celebration by seal and consequence, not confetti (anti-pattern).
