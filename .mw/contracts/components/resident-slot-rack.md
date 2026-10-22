---
id: resident-slot-rack
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/ResidentSlotRack.tsx
scope_files:
  - src/ui/idleVillage/components/RackScroll.module.css
  - src/ui/idleVillage/components/ResidentSlotRack.tsx
  - src/ui/idleVillage/components/SlotShake.module.css
  - src/ui/idleVillage/hooks/useSlotSounds.ts
  - src/ui/idleVillage/hooks/useSlottedMedalBehavior.ts
  - src/ui/idleVillage/interaction/useExtractionSequence.ts
  - src/ui/idleVillage/utils/slotStateMapping.ts
  - src/ui/v9-skin/V9TooltipContext.ts
  - src/ui/v9-skin/useV9Tooltip.ts
fast_checks:
  - tests/unit/idleVillage/ResidentSlotRack.drag-feedback.test.tsx
  - tests/unit/idleVillage/ResidentSlotRack.medal.test.tsx
  - tests/unit/idleVillage/magneticCollision.test.ts
  - tests/unit/idleVillage/useExtractionSequence.test.ts
  - tests/unit/idleVillage/useSlotSounds.test.ts
  - tests/unit/idleVillage/useSlottedMedalBehavior.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: resident-slot-rack.INV-1
    source: director-bug
    source_ref: R-248
    statement: >-
      Jank all'assegnazione/estrazione pg: useSlotSounds crea un nuovo AudioContext a ogni play (clank/detach),
      costruzione sincrona main-thread per slot per suono.
    test_refs:
      - tests/unit/idleVillage/useSlotSounds.test.ts
  - id: resident-slot-rack.INV-2
    source: director-bug
    source_ref: R-257
    statement: >-
      Medaglione duplicato durante il return flight: il proxy parte (urgent) mentre setAssignments e' in startTransition
      — la medaglia in sede resta montata per tutto il volo (~546ms osservati). La sede deve sopprimere la copia quando
      assignedResidentId === flyingResidentId: mai due medaglioni identici contemporaneamente.
    test_refs:
      - tests/unit/idleVillage/ResidentSlotRack.drag-feedback.test.tsx
---
# resident-slot-rack

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/ResidentSlotRack.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Pannello roster leftWing; riferimento visivo della lingua HUD.

## Scope

- `src/ui/idleVillage/components/RackScroll.module.css`
- `src/ui/idleVillage/components/ResidentSlotRack.tsx`
- `src/ui/idleVillage/components/SlotShake.module.css`
- `src/ui/idleVillage/hooks/useSlotSounds.ts`
- `src/ui/idleVillage/hooks/useSlottedMedalBehavior.ts`
- `src/ui/idleVillage/interaction/useExtractionSequence.ts`
- `src/ui/idleVillage/utils/slotStateMapping.ts`
- `src/ui/v9-skin/V9TooltipContext.ts`
- `src/ui/v9-skin/useV9Tooltip.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `roster-panel` (batch B2-panels, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep V2; V1 = decisione remove/merge (D9) — il fallback non-lacquer è shipped.

<!-- /plan054:generated -->
