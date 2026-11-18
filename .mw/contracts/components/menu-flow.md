---
id: menu-flow
kind: component
role: shared-kernel
tier: 1
root_file: "src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts"
scope_files:
  - "src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts"
fast_checks: []
e2e_checks: []
e2e_trigger_globs: []
invariants:
  - id: menu-flow.INV-1
    source: plan
    source_ref: PLAN-076
    statement: >-
      «Esci al titolo» esce subito quando non c'è nulla da perdere (`decideQuit` → `quit` con
      `unsaved:false`) e chiede conferma solo quando il gioco si è mosso dall'ultimo salvataggio.
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: menu-flow.INV-2
    source: plan
    source_ref: PLAN-076
    statement: >-
      «Continua» riprende lo slot valido più recente (`pickContinueSlot` ordina per `savedAt` tra
      i soli `state:'ok'`); slot danneggiati, vuoti o di versione più nuova non vengono mai scelti.
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
  - id: menu-flow.INV-3
    source: plan
    source_ref: PLAN-076
    statement: >-
      Il titolo si mostra una sola volta dopo un quit (`markShowTitle`/`consumeShowTitle`),
      nell'app desktop e su richiesta esplicita (`?title=1`); una visita browser normale va
      dritta al gioco e un reload richiesto dal gioco salta il titolo.
    test_refs:
      - tests/unit/idleVillage/menuFlow.test.ts
---
# menu-flow

Unità `shared-kernel` (tier 1, kernel) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts`.

## Scope

- `src/ui/idleVillage/components/gameFrame/menu/menuFlow.ts`

## Decision history

Partizione generata meccanicamente da `componentInventory.ts` (PLAN-054 T-002).
