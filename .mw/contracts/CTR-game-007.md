---
id: CTR-game-007
kind: integration
components:
  - village-roster-section-v2
  - resident-roster-panel-v2
  - resident-slot-rack
  - slot-v12-renderer
  - resident-slot-validators
  - quest-expedition-detail
  - use-quest-expedition-session
external_dependencies: []
fast_checks:
  - tests/unit/idleVillage/DragRosterSlotRack.test.ts
  - tests/unit/idleVillage/questExpeditionBag.test.tsx
e2e_checks:
  - tests/e2e/idleVillage/gameQuestExpedition.spec.ts
  - tests/e2e/idleVillage/gameQuestFullFlow.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/rosterV2/**
  - src/ui/idleVillage/components/ResidentSlotRack.tsx
  - src/ui/idleVillage/components/SlotV12Renderer.tsx
  - src/ui/idleVillage/slots/residentSlotValidators.ts
  - src/ui/idleVillage/quests/**
invariants:
  - id: CTR-game-007.INV-1
    source: plan
    source_ref: PLAN-019
    statement: >-
      Il drop di un residente dal roster su uno slot expedition produce il verdetto del guard-layer canonico: un
      residente eleggibile assegna lo slot e sblocca il forecast `ready`; un residente non eleggibile viene rifiutato
      (hook e verdetto concordi), la sua card resta marcata `data-compatibility="invalid"` e «Invia spedizione» resta
      gated finché tutti gli slot required non sono assegnati.
    test_refs:
      - tests/e2e/idleVillage/gameQuestExpedition.spec.ts
  - id: CTR-game-007.INV-2
    source: plan
    source_ref: PLAN-019
    statement: >-
      I guard-layer G1..Gn della pipeline roster→slot sono deterministici e composizionali: stesso input (residente,
      stato slot, stato rack) → stesso verdetto; i livelli si valutano in ordine e nessun livello a valle può
      ribaltare un rifiuto a monte.
    test_refs:
      - tests/unit/idleVillage/DragRosterSlotRack.test.ts
  - id: CTR-game-007.INV-3
    source: plan
    source_ref: PLAN-019
    statement: >-
      Il roster segue il lifecycle del POI detail: si apre insieme al detail se era chiuso e si richiude con esso; se
      era già aperto resta aperto alla chiusura del detail — lo stato pre-esistente non viene mai distrutto.
    test_refs:
      - tests/e2e/idleVillage/gameQuestFullFlow.spec.ts
---
# CTR-game-007 — RosterV2 ↔ ResidentSlotRack `hud64` ↔ QuestExpeditionDetail: verdetto guard-layer, gating, lifecycle condiviso

**id:** `CTR-game-007`

**components:** `VillageRosterSectionV2`, `ResidentRosterPanelV2`, `ResidentSlotRack`, `SlotV12Renderer` (`hud64`), `residentSlotValidators`, `QuestExpeditionDetail`, `useQuestExpeditionSession`

**state:** `/game` con roster V2 e detail expedition aperti — drag reale dnd-kit o hook `__idleVillageTestHooks` canonici.

**invariant:**
1. `INV-1` — Il drop di un residente dal roster su uno slot expedition produce il verdetto del guard-layer canonico: un residente eleggibile assegna lo slot e sblocca il forecast `ready`; un residente non eleggibile viene rifiutato (hook e verdetto concordi), la sua card resta marcata `data-compatibility="invalid"` e «Invia spedizione» resta gated finché tutti gli slot required non sono assegnati.
2. `INV-2` — I guard-layer G1..Gn della pipeline roster→slot sono deterministici e composizionali: stesso input (residente, stato slot, stato rack) → stesso verdetto; i livelli si valutano in ordine e nessun livello a valle può ribaltare un rifiuto a monte.
3. `INV-3` — Il roster segue il lifecycle del POI detail: si apre insieme al detail se era chiuso e si richiude con esso; se era già aperto resta aperto alla chiusura del detail — lo stato pre-esistente non viene mai distrutto.

**source:** `PLAN-019-S2` (planner expedition, guard-layer, roster V2) | `roster_trusted_components.md`

**check:**

- `npm run test -- tests/unit/idleVillage/DragRosterSlotRack.test.ts tests/unit/idleVillage/questExpeditionBag.test.tsx`
- `npx playwright test tests/e2e/idleVillage/gameQuestExpedition.spec.ts tests/e2e/idleVillage/gameQuestFullFlow.spec.ts`

**status:** `active`

**evidence:** `.mw/runs/plan054-t003-integration-contracts/`
