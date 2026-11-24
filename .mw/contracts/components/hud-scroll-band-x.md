---
id: hud-scroll-band-x
kind: component
role: ui-component
tier: 2
root_file: "src/ui/idleVillage/skins/primitives/HudScrollBandX.tsx"
scope_files:
  - "src/ui/idleVillage/skins/primitives/HudScrollBandX.tsx"
fast_checks:
  - tests/unit/idleVillage/hudScrollBandX.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: hud-scroll-band-x-heightpx
    source: director-spec
    source_ref: R-378 (Director 2026-11-24 «la barra x spostare negli slot pg occupa troppo spazio, falla + piccola»)
    statement: >-
      La prop opzionale `heightPx` sovrascrive lo spessore della banda (il cassetto la monta a 8px);
      in assenza resta il default condiviso `HUD_SCROLL_BAND.widthPx` per tutte le altre superfici lista.
    test_refs:
      - tests/unit/idleVillage/hudScrollBandX.test.tsx
---
# hud-scroll-band-x

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/skins/primitives/HudScrollBandX.tsx`.

## Scope

- `src/ui/idleVillage/skins/primitives/HudScrollBandX.tsx`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
