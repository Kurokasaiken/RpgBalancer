---
title: "PLAN-043-S4 — Quest goblin senza scena d'apertura, consumabili armati dal planner"
parent: PLAN-043
status: completed
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

## Contratto di chiusura — stato 2026-10-19 (devin, PLAN-049 Q4)

- ✅ E2E `gameQuestExpedition` + `gameQuestLifecycle` eseguiti: **27/27 PASS** (15.2m, log `.mw/runs/plan043-s4-e2e/command-logs/e2e-run2.log`).
- ✅ Prova headless consumabile armato: nuovo test `PLAN-043-S4 — bag consumables armed by default at the first check` in `gameQuestCluster.spec.ts` — `demoLaunch` (bag canonica via send reale) → micro-belt al primo waiting frontier: `hasBonusForza`/`hasBonusPerc` `aria-pressed=true`, `hasHealing` `aria-pressed=false` (action kind = scelta del giocatore, contratto R-106). PASS.
- Bundle `.mw/runs/plan043-s4-e2e/bundle.json`: **3/5 obbligazioni PASS** — BLOCKED solo su governance condivisa (T-13): gate-file `contractsCheck.ts` modificato dalla sessione parallela dopo l'ultimo `director_answer` (ri-approvazione Director richiesta) + trusted-lock aggregato in attesa di seal. Nessun blocco di codice/test.
