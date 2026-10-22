---
id: quest-skill-check-column
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn.tsx
scope_files:
  - src/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn.tsx
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: R-234-verdict-card-once
    source: director-bug
    source_ref: R-234
    statement: >-
      La Verdict Card dice ogni riga d'autore una volta e non scrive HP in prosa: il danno arriva solo come chip
      (PLAN-067 T-A2)
    test_refs:
      - tests/unit/idleVillage/questSkillCheckColumn.verdictCard.test.tsx
  - id: quest-skill-check-column.INV-1
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B3a: click sul board chiamava sempre skipToResult — mai la pallina; il click deve lanciare (throw) prima del
      verdetto, skip solo durante lo spin
    test_refs:
      - tests/unit/idleVillage/questSkillCheckColumn.throwClick.test.tsx
  - id: quest-skill-check-column.INV-2
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B4: wildcard [data-astro-idle=parked] * paused congelava anche .rays — le luci devono restare animate a
      durata rallentata
    test_refs:
      - tests/unit/idleVillage/questSkillCheckColumn.throwClick.test.tsx
  - id: R-253-check-real-data
    source: director-bug
    source_ref: R-253
    statement: >-
      Skill check sempre uguale + niente icone stat: la colonna passava skills=[{stat:check.score}] (UNA skill → 5 assi
      identici → stella regolare) e ResolvedCheck non portava stats. Fix: ResolvedCheck.stats + axisProfile display-only
      (verdict invariato: la pallina sceglie ancora da skills) + icone stat nel title row
    test_refs:
      - tests/unit/idleVillage/questSkillCheckColumn.axisProfile.test.tsx
  - id: R-253-check-stat-icons
    source: director-bug
    source_ref: R-253
    statement: Icona stat mancante sullo skill check board
    test_refs:
      - tests/unit/idleVillage/questSkillCheckColumn.axisProfile.test.tsx
  - id: R-259-auto-dismiss
    source: director-bug
    source_ref: R-259
    statement: >-
      Post-verdict: le beat se settle automatiquement apres dismissArmDelayMs+1000ms sans input
      (verdictAutoDismissMs=1000)
    test_refs:
      - tests/unit/idleVillage/questSkillCheckColumn.autoDismiss.test.tsx
---
# quest-skill-check-column

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn.tsx`.

## Scope

- `src/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn.tsx`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
