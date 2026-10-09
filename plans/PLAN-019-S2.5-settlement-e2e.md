---
title: 'PLAN-019-S2.5 — Settlement idempotente, secondo POI, E2E completo e chiusura slice'
status: draft
created: 2026-10-09
desiderata: v24 (PLAN-019, stadio S2, gate S2-a/b/c), v24 rev.2 (reward = obiettivo && leader vivo)
request: R-107
parent: PLAN-019-S2 (figlio 5/5 — chiude lo slice)
depends: PLAN-019-S2.4 (run lanciabile da POI)
related: PersistenceService (unico canale), InjuryEngine, QUEST_RULES.md §8 (conseguenze sempre — R-092), OPEN-015 (forma minima), PLAN-018 (mappatura), quest_theatre_spec.md
---

# PLAN-019-S2.5 — Settlement + E2E + chiusura

## Perimetro

Il run non è «finito» quando finisce: il settlement è una transizione
persistente **idempotente** — il bug peggiore possibile in un gioco dove la
morte conta è una conseguenza applicata due volte o zero (critica r1). Poi:
secondo POI end-to-end, E2E completo dello slice, documentazione di chiusura.

## Settlement (T-7 del piano padre)

- **Idempotente chiavato su `runId`**: un solo write logico applica morti
  (→ residenti morti), ferite (→ downtime `InjuryEngine`), gold/loot
  (→ risorse), chiusura POI e riga ledger; l'esito applicato è marcato
  nella stessa scrittura (`settled: true` nel record persistito).
- **Reapply-once al boot**: un run `ended` non marcato riapplica il
  settlement **una sola volta**. Prima dell'implementazione si verifica
  quali garanzie offre `PersistenceService`; se non supporta una
  transazione atomica multi-aggregate, la strategia di recupero durevole
  è definita in spec (marker + replay).
- **Tabella delle transizioni terminali** (in spec, prima del codice):

| Terminazione | Run | Reward quest | Bottino | Party | POI | Ledger |
|---|---|---|---|---|---|---|
| Obiettivo + leader vivo | ended | sì | sì | torna | chiude | riga |
| Obiettivo + leader morto | ended | **no** (v24 rev.2: `objectiveSatisfied && leaderReturnedAlive`) | sì | torna | chiude | riga |
| Obiettivo fallito + fuga | ended | no | **conservato** | torna | chiude | riga |
| Wipe | ended | no | regola config | — | chiude | riga |
| Abbandono offerta | — | — | — | rilascio slot | chiude offerta | riga |
| Scadenza `availableDays` | — | — | — | — | offerta scade | riga |

  La tabella è il riferimento: nessuna semantica nuova introdotta
  implicitamente; «riga ledger» = fatto di cronaca persistito (serve al
  reload e al POI), non entrypoint del registro narrativo (OPEN-016, S4/S5).

- **Lock release**: il settlement o il ritiro rilascia `inExpedition` sui
  superstiti.

## Task

- **T-1 — Spec transizioni terminali** (tabella sopra verificata contro
  QUEST_RULES + v24 rev.2).
- **T-2 — Settlement service idempotente** (marker `settled`, replay-once
  al boot, verifica garanzie `PersistenceService` documentata).
- **T-3 — Test settlement**: reload forzato **prima, durante e dopo** il
  writeback → conseguenze una sola volta; «obiettivo fallito + leader vivo
  + fuga» → no reward, sì bottino; wipe → regola config.
- **T-4 — Secondo POI end-to-end** (rovine): stesso tubo, contenuto diverso.
- **T-5 — E2E completo su `/game`** (entrambi i POI): POI → detail → drag →
  send → halo → click → `QuestRunWindow` → bivio → epilogo → settlement →
  roster mostra morto/ferito → reload a metà run → stessa frontiera.
- **T-6 — Artefatto PLAN-018** (riusa/adatta/superato/manca — contratto S2)
  + QUEST_RULES §modello aggiornato al grafo + CURRENT_STATE, INDEX,
  kanban, PLAN-019 (S2 avanzato).
- **T-7 — Safeguard + acceptance + evidence** finale dello slice.

## Fuori scope

Registro narrativo (OPEN-016 → S4) · memoria personaggi · quest `cassa` ·
calibrazione letalità numerica.

## Acceptance (= chiusura dello slice S2, verso gate PLAN-019)

1. Settlement verificato idempotente sui casi di reload forzato; transizioni
   terminali conformi alla tabella.
2. I due POI funzionano end-to-end su `/game` con party composto dal
   giocatore dal roster reale.
3. Conseguenze visibili (morti/feriti/loot) persistite una sola volta e
   sopravvivono al reload.
4. Tutti i gate del padre valutabili: (a) no mock sui canali reali, (b)
   proprietà preservate, (c) giudizio Director.
5. Safeguard verdi + evidence log completo.
