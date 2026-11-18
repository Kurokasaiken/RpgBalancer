---
id: slot-v12-renderer
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/SlotV12Renderer.tsx
scope_files:
  - src/ui/idleVillage/components/SlotV12Renderer.tsx
fast_checks:
  - tests/unit/idleVillage/SlotV12Renderer.hud64.test.tsx
  - tests/unit/idleVillage/bloomBrass.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: slot-v12-renderer.INV-1
    source: code-baseline
    statement: >-
      Variante hud64 di SlotV12Renderer: box DOM 64×64, viewBox "-79 -79 158 158"
      con data-bite ≈ 2.5; due piani SVG (under: defs+cavity / over: bezel+teeth)
      con pointer-events:none; glifo di ruolo inciso nella cavità vuota e assente
      quando lo slot è occupato.
    test_refs:
      - tests/unit/idleVillage/SlotV12Renderer.hud64.test.tsx
---

# slot-v12-renderer

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/SlotV12Renderer.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/SlotV12Renderer.tsx`.

## Scope

- `src/ui/idleVillage/components/SlotV12Renderer.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
