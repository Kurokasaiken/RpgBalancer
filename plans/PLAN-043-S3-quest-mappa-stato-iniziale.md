---
title: "PLAN-043-S3 — Quest sulla mappa, «Stato iniziale» = partita nuova, nessuna scadenza"
parent: PLAN-043
status: completed
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: OPTIONAL
doc_targets:
  - src/docs/docs/idle_village/poi_family_spec.md (le offerte non scadono più)
---

# PLAN-043-S3 — Quest sulla mappa, «Stato iniziale» = partita nuova, nessuna scadenza

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"le quest i /game dovrebbero apparire uno ogni 5 secondi, nn appaiono, m serve nel director un pulsante x fare ritonare alla situazione iniziale senza tener nulla in memoria"*
>
> *"il pulsante initial state nn lo fa, y*
> *day 21890*
> *The Eastern Marches"*
>
> *"togli la csoa dei 100000 giorni*
> *stato iniziale = come se fosse una partita nuova"*
>
> *"adesso funziona."* (2026-10-17)

## Esito

- **Causa:** le offerte avevano una finestra di 10 000 giorni (`SLICE_OFFER_WINDOW_DAYS`, R-180); con il clock a 5 tick per giorno e una partita lasciata aperta, al giorno 21 890 erano scadute ed escluse anche da «POI types».
- **Nessuna scadenza:** `availableFromDay` / `availableUntilDay` opzionali in `questPois.ts`; senza finestra l'offerta è sempre aperta; la voce «quest aperta» con conto alla rovescia esce dal registro eventi quando non c'è finestra.
- **«Stato iniziale» = partita nuova** (Director, `questInitialState.ts`): cancella clock e gameplay (`minimal-gameplay-state`), villaggio (`idle_village_state` + cronologia), POI consumati, invasione, prenotazioni, salvataggi delle run, bozze di spedizione (nel browser); poi ricarica. Restano HUD, skin, scala e tuning.
- **Verifica headless:** con rovina consumata e bozza presente, dopo il pulsante la bozza è sparita, la rovina torna, il giorno riparte; nessun errore di pagina. Test `questOffer.test.ts` aggiornato.
- **Limiti:** nell'app desktop le bozze sono file e non vengono cancellate; il giorno 21 890 non è stato riprodotto (iniettare uno snapshot viene scartato dal boot).

## Contratto di chiusura

- Unit: `questOffer.test.ts` verde.
- Director: «adesso funziona» (2026-10-16).
- Bundle non prodotto; chiusura dichiarata dal Director a voce.
