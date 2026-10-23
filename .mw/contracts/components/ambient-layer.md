---
id: ambient-layer
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx
scope_files:
  - src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx
fast_checks:
  - tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx
  - tests/unit/idleVillage/questCinematics/sceneManifest.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: ambient-layer.INV-1
    source: director-spec
    source_ref: R-271
    statement: >-
      AmbientFxSchema accetta i tipi PLAN-052 showcase (glint, fireflies,
      moths, shaft) con defaults applicati e rifiuta tipi ignoti e campi
      fuori bounds.
    test_refs:
      - tests/unit/idleVillage/questCinematics/sceneManifest.test.ts
  - id: ambient-layer.INV-2
    source: director-spec
    source_ref: R-271
    statement: >-
      drawAmbientFrame emette operazioni canvas per ogni tipo FX dichiarato
      come funzione pura del clock (stesso t → stesso op stream) e ripristina
      globalCompositeOperation 'source-over' a fine frame.
    test_refs:
      - tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx
---

# ambient-layer

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx`.

## Scope

- `src/ui/idleVillage/questS1Lab/render/AmbientLayer.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
