---
id: beat-sequencer
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/questS1Lab/beatSequencer.ts
scope_files:
  - src/ui/idleVillage/questS1Lab/beatSequencer.ts
fast_checks:
  - tests/unit/idleVillage/cinemaFx.test.tsx
  - tests/unit/idleVillage/combatStrip.test.tsx
  - tests/unit/idleVillage/questBag.test.tsx
  - tests/unit/idleVillage/questCheckOptions.test.tsx
  - tests/unit/idleVillage/questRunWindow.test.tsx
  - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
  - tests/unit/idleVillage/questTheatreSequencer.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: beat-sequencer.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il beat sequencer proietta i commit del run in beat di scena: un check risolto diventa check-beat con il verdict
      authored, i danni mantengono l'ordine harms-prima-scena.
    test_refs:
      - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
  - id: beat-sequencer.INV-2
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B1b: disallineamento posizionale NODE-log/visitedNodes legava la scene beat al check node — i nodi kind
      check non devono emettere scene beat
    test_refs:
      - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
  - id: beat-sequencer.INV-3
    source: director-bug
    source_ref: R-242
    statement: >-
      Cursore beat tenuto dal proprietario della coda (useQuestRun.beatCursorRef) — il remount della finestra riprende
      dal beat held e ripropone solo la pending tail; mai replay di beat consumati (scena stale + cue reveal/expanded
      re-fire + flap geometria cluster)
    test_refs:
      - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
      - tests/unit/idleVillage/questRunWindow.test.tsx
---
# beat-sequencer

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/beatSequencer.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/beatSequencer.ts`.

## Scope

- `src/ui/idleVillage/questS1Lab/beatSequencer.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
