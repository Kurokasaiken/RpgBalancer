# settlement-lost-overlay — Settlement-lost takeover overlay

> PLAN-086. `overlay`: the run-ending takeover (R-072 scene 5, direction C),
> active when `gameOverState` is `{ isGameOver: true, reason:
> 'settlement_lost' }`. Blocking by design — Director ratified 2026-09-16:
> no ESC, no backdrop dismiss, focus trapped until the run is acknowledged.

## What it is / does

- `data-testid="settlement-lost-overlay"` — two-phase sequence:
  1. **`iris`** — a dark vignette sweeps the viewport while the world
     surface under it is re-graded to the **oxidised ramp**
     (`OxidizedGradeFilter`, `filter: url(#…)` on the world container) —
     death is ferro freddo, not a red flash.
  2. **`verdict`** — the verdict card fades in: `settlement-lost-title`,
     `settlement-lost-subtitle`, narrative loss beats from
     `settlementLostConfig`, real run stats from `gameOverState.summary`
     when present, and the single CTA (`resetGame()`).
- Focus trap: focusables enumerated, Tab cycled inside; the takeover
  ignores Esc and outside clicks.
- **No canonical in-game trigger yet** (day-30 loss path out of scope):
  staged via Director action `settlementLost`.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/directorSettlementLost.ts` (Director panel `d` → `[data-action-id="settlementLost"]`) | `[data-testid="settlement-lost-overlay"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `9d207c7969fcc56c`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `default-ctx-a/b.png` — takeover over the oxidised world;
  `default-iso-0.png` — the overlay element (verdict phase on this
  capture: the driver waits 15 s for the testid, which mounts with the
  overlay root).
- `deterministicSameBytes: false` — iris/verdict `framer-motion`
  transitions may still be settling between ctx frames; recorded as data,
  not pass/fail.

## Links

- Contract: `.mw/contracts/components/settlement-lost-overlay.md`
- Scope: `src/ui/idleVillage/components/SettlementLostOverlay.tsx`,
  `OxidizedGradeFilter.tsx`, config
  `src/balancing/config/idleVillage/settlementLostConfig.ts`.
- Driver: `scripts/catalog/drivers/directorSettlementLost.ts`.

## Art-direction slice (rubric rev 3)

`overlay` → ART-DIRECTION L1+L2 + z-index/portaling: terminal state in
cold-iron materia (`#93a4ad` oxidised grade per COL-D), vignette iris as
physical scene change, verdict card as consequence ledger — never a toast.
