---
title: "PLAN-043-S4 — Quest goblin senza scena d'apertura, consumabili armati dal planner"
parent: PLAN-043
status: active
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: OPTIONAL
doc_targets:
  - src/docs/docs/idle_village/quest_sterminio_goblin_spec.md (F0 non è più un nodo)
---

# PLAN-043-S4 — Quest goblin senza scena d'apertura, consumabili armati dal planner

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"la quest Sterminio goblin ha una scena in +, nn c deve essere. La prima sostituiva l'onboarding cn la preview, nn c deve + essere"*
>
> Scelta: *"Scena «Assignment» all'apertura"* · *"a) i consumabili si portano dal villaggio nel planner precedente"*

## Esito

- Tolto il nodo `gob-inizio`; la run parte da `gob-esplora` (`goblin.ts`); tolta la sua arte da `questArt.ts`.
- `consumablesArmedByDefault: true` (`gameFrameConfig.ts`): quello che si porta dal villaggio è armato dall'inizio. **Vale per tutte le quest** (anche le rovine).
- Test unitari aggiornati (`questS1Lab/*`: 202/202, `pageCrash.repro` con «Depart» facoltativo). Cattura headless: la finestra si apre su «Exploration — at the edge of the wood».
- **Non verificato:** gli E2E `gameQuestExpedition` e `gameQuestLifecycle` sono stati modificati ma **non eseguiti**; il passaggio bag del planner → consumabile armato non è stato visto (il bag della prova era vuoto).

## Contratto di chiusura

- E2E `gameQuestExpedition`, `gameQuestLifecycle` eseguiti verdi.
- Prova headless con un consumabile nel bag: armato al primo check.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
