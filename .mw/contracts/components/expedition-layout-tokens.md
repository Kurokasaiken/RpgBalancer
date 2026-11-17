---
id: expedition-layout-tokens
kind: component
role: shared-kernel
tier: 2
root_file: src/balancing/config/idleVillage/cassettoLayoutConfig.ts
scope_files:
  - src/balancing/config/idleVillage/cassettoLayoutConfig.ts
  - src/ui/idleVillage/hudReal/layout/cassettoColumn.ts
fast_checks:
  - tests/unit/idleVillage/r339ExpeditionTokens.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: expedition-layout-tokens.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      Lo schema Zod `cassettoLayoutSchema` (.strict) dichiara tutti i token T1 delle superfici
      expedition — drawer clamp {widthMinPx 360, widthVwFraction 0.23, widthMaxPx 460}, bottomSheet
      detents {peekPx, halfFraction, fullFraction}, topChrome {marginPx, gapPx, chronicleReservePx,
      minFitScale} e cta.vars — e rigetta chiavi sconosciute.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionTokens.test.tsx
  - id: expedition-layout-tokens.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      La larghezza renderizzata della colonna cassetto è `aspect × viewportHeight` cappata a
      `drawer.widthMaxPx` (ruling T1: il clamp è un cap, non uno stretch — sopra la soglia
      `cassettoColumnHeightFor` < viewport e l'art baked non si distorce mai).
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionTokens.test.tsx
  - id: expedition-layout-tokens.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      Ogni colore/opacity dipinto sulle superfici expedition risale la catena config →
      `var(--skin-*)` → `BASE_SKIN_CSS_VARS` (AC8): le regole scoped del cassetto CONFIRM non
      contengono letterali colore né opacity letterale, e ogni token nominato in `cta.vars`
      esiste nel layer skin.
    test_refs:
      - tests/unit/idleVillage/r339ExpeditionTokens.test.tsx
---
# expedition-layout-tokens

Modulo token T1 delle superfici expedition di /game (R-339/PLAN-119,
artifact-r004 T1): `cassettoLayoutConfig` dichiara nello schema Zod strict i
clamp e gli inset (drawer, bottom-sheet detents, topChrome + riserva
Chronicle) e i NOMI dei token skin che la CTA legge; i valori
vivono in `BASE_SKIN_CSS_VARS` (+ override per preset). `cassettoColumn` è la
regola pura larghezza/altezza della colonna baked (cap a `widthMaxPx`, mai
distorsione). Consumatori: `HudRealCassetto`,
`GameTopChrome`, `useGameLayoutInsets` (ledger pubblicato).
