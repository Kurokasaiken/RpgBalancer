---
id: use-sensory-audio
kind: component
role: shared-kernel
tier: 1
root_file: src/ui/idleVillage/hooks/useSensoryAudio.ts
scope_files:
  - src/ui/idleVillage/hooks/useSensoryAudio.ts
fast_checks:
  - tests/unit/idleVillage/PgCard.interactions.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: use-sensory-audio.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      Il feedback audio sensoriale: pickup cue al drag start, drop_invalid quando il token torna in returning, nessuna
      cue spuria fuori returning.
    test_refs:
      - tests/unit/idleVillage/PgCard.interactions.test.tsx
---

# use-sensory-audio

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/hooks/useSensoryAudio.ts`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/hooks/useSensoryAudio.ts`.

## Scope

- `src/ui/idleVillage/hooks/useSensoryAudio.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
