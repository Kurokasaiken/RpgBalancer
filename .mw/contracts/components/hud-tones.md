---
id: hud-tones
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/hudTones.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/hudTones.ts"
fast_checks:
  - tests/unit/idleVillage/hudTones.test.ts
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-tones.INV-1
    source: plan
    source_ref: PLAN-112
    statement: >-
      Ogni tono di segnale (danger, warning, neutral, good — set esatto) risolve prima un token
      `--skin-*` con fallback letterale dentro `var()` — mai un colore hardcoded da solo.
    test_refs:
      - tests/unit/idleVillage/hudTones.test.ts
---
# hud-tones

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/hudTones.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/hudTones.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
