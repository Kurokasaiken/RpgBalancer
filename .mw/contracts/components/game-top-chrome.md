---
id: game-top-chrome
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/GameTopChrome.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/GameTopChrome.tsx
  - src/balancing/config/idleVillage/cassettoLayoutConfig.ts
fast_checks:
  - tests/unit/idleVillage/r339TopChrome.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: game-top-chrome.INV-1
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il cluster è docked nella fascia superiore della mappa libera (mai overlay né flottante) e pubblica
      la propria occupazione reale in `useGameLayoutInsets.insets.top`: `topChrome.marginPx` più l'altezza
      di riga scalata (× fit × frame.scale), 0 quando nascosto o smontato — la matematica della mappa
      libera lo sottrae sempre.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-2
    source: plan
    source_ref: PLAN-119
    statement: >-
      Due elementi snelli separati (day banner + resource bar, arte `bar-slim.webp` firmata) disposti
      left/center: il bordo sinistro del cluster siede a `insets.left/scale + topChrome.marginPx` —
      segue il fold della colonna sinistra — e il bordo destro non entra mai nella zona top-right
      riservata alla futura Chronicle docked (D10, niente tab pendente) finché il fit resta ≥
      `topChrome.minFitScale`.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-3
    source: plan
    source_ref: PLAN-119
    statement: >-
      L'ornamento sole del day banner è il dial di fase seduto nell'emerald della slim bar: disco
      sole/luna (`sun.webp`/`moon.webp`) + corona di tick letta da `timeOfDay.dialSlim` in config
      (geometria misurata sull'arte schiacciata, colori e URL da config — mai hardcoded nel componente).
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-4
    source: plan
    source_ref: PLAN-119
    statement: >-
      Il cluster non scala mai oltre 1 e si restringe solo per stare nella fascia libera: sotto
      `topChrome.minFitScale` la riserva Chronicle cede e il bound duro resta il bordo finestra
      (`frame.W - topChrome.marginPx`) — il chrome non esce mai dallo schermo.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
  - id: game-top-chrome.INV-5
    source: plan
    source_ref: PLAN-119
    statement: >-
      Le due superfici restano i slot firmati `data-hudslot="time"` e `data-hudslot="resources"` (il
      contratto selettori della suite e2e); la resource bar monta chip compatti per i suoi slot più
      stretti, un chip per item del readout.
    test_refs:
      - tests/unit/idleVillage/r339TopChrome.test.tsx
---
# game-top-chrome

Top chrome docked di /game (R-339/PLAN-119 T6, artifact-r004 D3 + ruling
Director D10): slim day banner + resource bar left/center, zona top-right
riservata alla futura Chronicle, occupancy pubblicata nel ledger
`useGameLayoutInsets`. Solo blueprint mode — phone/landscape mantengono il
chrome firmato full-size. Riutilizza `HudRealTime`/`HudRealResources` con
geometrie e arte slim generate (PLAN-112 F4) — nessuna superficie duplicata.
