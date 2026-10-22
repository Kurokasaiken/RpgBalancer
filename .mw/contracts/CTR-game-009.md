---
id: CTR-game-009
kind: integration
components:
  - quest-run-window
  - quest-run
  - destiny-astrolabe-v62
  - quest-reward-popup
  - quest-settlement
  - active-hud
  - quest-party-roster-panel
external_dependencies: []
fast_checks:
  - tests/unit/idleVillage/astrolabe/ballGuidance.test.ts
  - tests/unit/idleVillage/quests/questSettlement.test.ts
  - tests/unit/idleVillage/questRewardPopup.test.tsx
  - tests/unit/idleVillage/questRunWindow.test.tsx
e2e_checks:
  - tests/e2e/idleVillage/gameQuestLifecycle.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx
  - src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx
  - src/ui/idleVillage/components/gameFrame/QuestRewardPopup.tsx
  - src/ui/idleVillage/components/destinyAstrolabeV62/**
  - src/ui/idleVillage/quests/questSettlement.ts
  - src/ui/idleVillage/questS1Lab/questRun.ts
  - src/ui/idleVillage/components/ActiveHUD.tsx
invariants:
  - id: CTR-game-009.INV-1
    source: plan
    source_ref: PLAN-019
    statement: >-
      «Invia spedizione» congela una run nella QuestRunWindow canonica: il detail si chiude, la window diventa
      visibile, il POI passa `in_progress` e i membri assegnati risultano `in-expedition` (non più eleggibili); la
      run parte sul nodo iniziale del grafo con la party completa dichiarata dagli slot.
    test_refs:
      - tests/e2e/idleVillage/gameQuestLifecycle.spec.ts
  - id: CTR-game-009.INV-2
    source: plan
    source_ref: PLAN-019
    statement: >-
      La pallina dell'astrolabe V62 raggiunge sempre un punto dentro la zona del verdetto prima della fine dello
      spin — parcheggio a velocità ~zero, nessun teleport (spostamento per-frame entro i bound balistici), nessun
      fling dopo l'arrivo, e anche una zona rimpicciolita resta trovabile (regressione valley bug V62).
    test_refs:
      - tests/unit/idleVillage/astrolabe/ballGuidance.test.ts
  - id: CTR-game-009.INV-3
    source: plan
    source_ref: PLAN-019
    statement: >-
      Il piano di settlement deriva le conseguenze come dati (reward + gold/xp della run, effetti per membro secondo
      il fato; wipe = tutto perso, fled = nessun reward ma bottino conservato, survived con leader morto = nessun
      reward) e `applyPlanToState` è idempotente — la seconda applicazione è un no-op, niente doppio settle.
    test_refs:
      - tests/unit/idleVillage/quests/questSettlement.test.ts
  - id: CTR-game-009.INV-4
    source: director-spec
    source_ref: R-199
    statement: >-
      Il report post-run è una placca dialog esterna mai modale (nessun backdrop, nessun `aria-modal`) con reveal a
      stadi — esito prima, sezioni una alla volta, riga di chiusura solo alla fine; un click accelera di uno stadio,
      il focus entra nella placca all'apertura ed Escape chiude e lo restituisce; una run `fled` riporta comunque
      l'esito come rapporto, non come reward.
    test_refs:
      - tests/unit/idleVillage/questRewardPopup.test.tsx
---
# CTR-game-009 — QuestRunWindow ↔ DestinyAstrolabeV62 ↔ QuestRewardPopup ↔ Settlement/HUD: dalla spedizione al rapporto

**id:** `CTR-game-009`

**components:** `QuestRunWindow`, `questRun.ts` (grafo/frontiera), `DestinyAstrolabeV62`, `QuestRewardPopup`, `questSettlement.ts`, `ActiveHUD`, `QuestPartyRosterPanel`

**state:** `/game` con spedizione avviata dal planner — run attiva nella QuestRunWindow, check astrolabe, settle terminale e report.

**invariant:**
1. `INV-1` — «Invia spedizione» congela una run nella QuestRunWindow canonica: il detail si chiude, la window diventa visibile, il POI passa `in_progress` e i membri assegnati risultano `in-expedition` (non più eleggibili); la run parte sul nodo iniziale del grafo con la party completa dichiarata dagli slot.
2. `INV-2` — La pallina dell'astrolabe V62 raggiunge sempre un punto dentro la zona del verdetto prima della fine dello spin — parcheggio a velocità ~zero, nessun teleport (spostamento per-frame entro i bound balistici), nessun fling dopo l'arrivo, e anche una zona rimpicciolita resta trovabile (regressione valley bug V62).
3. `INV-3` — Il piano di settlement deriva le conseguenze come dati (reward + gold/xp della run, effetti per membro secondo il fato; wipe = tutto perso, fled = nessun reward ma bottino conservato, survived con leader morto = nessun reward) e `applyPlanToState` è idempotente — la seconda applicazione è un no-op, niente doppio settle.
4. `INV-4` — Il report post-run è una placca dialog esterna mai modale (nessun backdrop, nessun `aria-modal`) con reveal a stadi — esito prima, sezioni una alla volta, riga di chiusura solo alla fine; un click accelera di uno stadio, il focus entra nella placca all'apertura ed Escape chiude e lo restituisce; una run `fled` riporta comunque l'esito come rapporto, non come reward.

**source:** `PLAN-019` (run window v27, settlement) | `R-199` (report post-run non-modale) | `R-186` (conseguenze residenti come dati)

**check:**

- `npm run test -- tests/unit/idleVillage/astrolabe/ballGuidance.test.ts tests/unit/idleVillage/quests/questSettlement.test.ts tests/unit/idleVillage/questRewardPopup.test.tsx tests/unit/idleVillage/questRunWindow.test.tsx`
- `npx playwright test tests/e2e/idleVillage/gameQuestLifecycle.spec.ts`

**status:** `active`

**evidence:** `.mw/runs/plan054-t003-integration-contracts/`
