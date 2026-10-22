---
id: quest-belt-plaque
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants: []
---

# quest-belt-plaque

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx`.

<!-- plan054:notes -->

- **R-244 (2026-10-21):** rich-rows contract — la placca mostra righe
  icona+nome+effetto (`item.descKey`)+qualifier di stato; supera il
  «Icon-only contract» di R-196 per volontà Director. Il micro-belt inline di
  `QuestRunWindow` resta icon-only su `BeltItemChips` (affordance compatta
  preservata). Marker/`aria-pressed`/arm-disarm invariati; opt-out skin via
  `[data-belt-rows]` in `skinScope.css`.

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
