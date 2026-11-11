---
title: Ingestion — stato sul POI, quest/job/attività, LocationHub (proposta ChatGPT + mockup)
type: ingestion-report
status: evidence (non canonico)
date: 2026-11-11
source: conversazione Director ↔ ChatGPT incollata in sessione Claude Code 2026-11-11 + mockup «POI – Quest, Job & Activity / Village Hub / Repair the Mill» (immagine generata, non nel repo)
related: src/docs/docs/idle_village/poi_family_spec.md (§ Sigillo), context/QUEST_OPPORTUNITY_LAYER.md §7, CTR-game-008, R-025, R-177, OPEN-025, OPEN-026
---

# Knowledge Ingestion Report

## 1. Source Overview

Il Director ha chiesto a ChatGPT tre cose:

1. come mostrare **sul POI stesso** lo stato: quanto manca alla scadenza, se
   sta scadendo, se è in corso e quanto manca al completamento;
2. come mostrare i **tipi** — quest, job, attività (esplora, studia,
   costruisci) — e se ha senso separare le attività dai job;
3. come gestire le zone con **molte opportunità concentrate** (il villaggio
   di partenza): un **Hub** che si apre cliccando sul luogo e mostra
   all'interno job, quest ecc., in forma **generica** perché riusabile per
   altri luoghi speciali.

ChatGPT ha risposto con una tassonomia a tre categorie, quattro stati del
marker, una grammatica dei timer, un componente generico `LocationHub` e
una lista di componenti UI; il mockup illustra mappa con POI etichettati,
legenda, pannello Hub (lista) e pannello dettaglio.

Nessuna decisione del Director nella fonte: tutto ciò che è nella risposta
è **PROPOSAL** di un'AI esterna. Le uniche parole del Director sono le
domande (punti 1–3), che valgono come **requisiti espressi**.

## 2. Extraction Ledger

| ID | Tipo | Enunciato | Stato temporale | Verdetto | Motivo / relazioni |
|---|---|---|---|---|---|
| E-01 | REQUIREMENT | Il marker POI deve mostrare sul posto: scadenza vicina, «sta scadendo», in corso con avanzamento, completato. | CURRENT (domanda Director) | CONFIRM | Già coperto dalla grammatica dell'halo del Sigillo (`poi_family_spec.md` § «Halo grammar», D4): scadenza = halo avorio che si svuota in senso antiorario, vermiglio all'ultimo 25 %; lavoro = halo che si riempie in senso orario; fatto = pieno + pulsazione lenta 2 s; scaduto = uscita senza pulsazione. Implementato e testato in unità; **non visto dal vivo**: snap urgente, pulsazione, quest principale. |
| E-02 | PROPOSAL | Quattro stati del marker: disponibile / in scadenza / in corso / completato. | — | DUPLICATE | Il Sigillo ha già 7 stati (available normal/main, expiring, working, done, expired, veiled). |
| E-03 | PROPOSAL | Non confondere mai scadenza (quanto resta per accettare) e completamento (quanto resta al lavoro); «ricompensa da ritirare» è un terzo stato. | — | CONFIRM | Ratificato 2026-10-11: due clock distinti, acceptance vs completion (`QUEST_OPPORTUNITY_LAYER.md` §7). «Ricompensa da ritirare» = stato *done* con pulsazione. |
| E-04 | PROPOSAL | Il countdown numerico (es. «02g 14h») non sta sempre sulla mappa: compare solo quando la scadenza è imminente; il dettaglio completo va in hover o nella scheda. | — | CONFIRM (parziale) | Coerente con l'halo che compare solo nell'ultimo 25 % per le quest normali (Director 2026-10-13, Q1). **Il testo numerico vicino al marker no** → vedi E-13. |
| E-05 | PROPOSAL | Tre categorie distinte: Quest = storia; Job = incarico concreto, ripetibile o a scadenza; Activity = operazione che il giocatore sceglie (esplora, studia, costruisci, allenati). Non esclusive sul piano del gameplay, sono modi di presentare. | — | CONFLICT (terminologia) → OPEN-026 | Nel codice `ActivityDefinition` è l'**ombrello** di tutti i POI (`kind` = job/quest/training/maintenance/cooldown, `poi_family_spec.md`). Usare «Activity» come categoria sorella di Job rompe il vocabolario esistente. Inoltre su `/game` esiste oggi solo la famiglia `quest`; job/training/maintenance/cooldown sono `deprecated` (CTR-game-008, PLAN-054 T-003). |
| E-06 | PROPOSAL | Mostrare il tipo con un'icona di famiglia (pergamena/gemma per quest, sigillo/bacheca per job, strumenti/libro/mappa per attività) e colori di famiglia (oro, turchese, viola, verde nel mockup). | — | CONFLICT | Il Sigillo assegna la famiglia alla **sagoma** (tondo con coda = impresa, tassello = lavoro, rombo = minaccia) e il **glifo al luogo, non al verbo** (D1); il colore non porta la famiglia. Resta aperta la richiesta del Director del 15/10 «job diverso dalla quest, anche attività probabilmente» → metallo dell'anello per famiglia (R-177, non ancora deciso). |
| E-07 | PROPOSAL | Un villaggio con molte opportunità non genera N marker: un solo marker del luogo + indicatore di contenuti + eventualmente micro-simboli con conteggi per tipo + animazione discreta all'arrivo di una novità importante. I POI isolati nel mondo restano singoli. | — | INTEGRATE come OPEN-025 | Concetto nuovo: nessun cluster/hub nel repo (nessun `LocationHub`/`VillageHub`; il villaggio su `/game` oggi non è cliccabile). |
| E-08 | REQUIREMENT | L'Hub deve essere **generico**, riusabile per altri luoghi speciali (gilda, accampamento, biblioteca, fortezza, rovine). | CURRENT (domanda Director) | INTEGRATE → OPEN-025 | Parole del Director: «deve essere generico, xè magari si potranno trovare altri posti speciali simili». |
| E-09 | PROPOSAL | Nome del componente: `LocationHub`, non `VillageHub`. | — | INTEGRATE → OPEN-025 | Coerente con E-08. |
| E-10 | PROPOSAL | Layout dell'Hub: intestazione del luogo (immagine, nome, sottotitolo, conteggi), filtri per tipo, lista ordinata per priorità a sinistra, dettaglio a destra (illustrazione, descrizione, requisiti, ricompense, azione). Nessuna finestra separata per ogni incarico. | — | INTEGRATE → OPEN-025 | Il dettaglio a destra è coerente con il ruling 20/10 «info nella preview destra, niente testo sull'immagine». Da riconciliare con il planner reale (`QuestExpeditionDetail`) che oggi si apre dal marker. |
| E-11 | PROPOSAL | Lo stato di un'opportunità deve venire da una sola fonte e coincidere tra marker, Hub e dettaglio. | — | CONFIRM | Già invariante T-07: stato/progress/direzione solo da `mapQuestPoiView`. L'Hub dovrà leggere la stessa view-model. |
| E-12 | PROPOSAL | Famiglie di componenti: MapPOI, POIStatusIndicator, LocationHub, LocationHubTabs, OpportunityCard, OpportunityDetail, OpportunityTimer, OpportunityReward. | — | DROP | Elenco generico non ancorato al codice: marker = `MapQuestPoi`/`PoiMatericV3_5`, stato = `mapQuestPoiView`, dettaglio = `QuestExpeditionDetail`. Si decide in un plan, non qui. |
| E-13 | — (mockup) | Il mockup mette accanto a ogni POI un cartiglio con nome + timer/percentuale. | — | CONFLICT | Ruling Director 2026-10-15 (R-177): «niente etichetta con il nome sopra il POI». Il ruling resta vigente. |
| E-14 | — (mockup) | Il dettaglio usa pulsanti a placca «Assign a Hero» / «Abandon». | — | CONFLICT | Placca CTA vietata ovunque (ruling sul `SkinButton cta`). |
| E-15 | — (mockup) | Ricompense con quantità (120 oro, 40 gemme, 20 legna), nessuna percentuale di drop. | — | CONFIRM | Coerente con il ruling 27/10: ricompense specifiche, mai % di drop. |
| E-16 | — (mockup) | Legenda fissa a schermo (tipi + stati). | — | DROP | Elemento da tavola di presentazione, non proposto come UI di gioco; contrasta con il tutorial diegetico (DESIGN_PILLARS R4.2). |
| E-17 | INFERENCE (mia, non della fonte) | Dal punto di vista del giocatore la differenza che conta è meccanica: **spedizione a rischio** (una volta, planner, check) vs **lavoro continuativo** (slot, ciclo, resa). «Esplora / studia / costruisci» sono verbi che possono stare in entrambe; sulla mappa il verbo non serve (il glifo è il luogo), nell'Hub sì (icona della riga). | — | INTEGRATE in OPEN-026 come opzione | Da far decidere al Director; non è una decisione. |

## 3. New Knowledge

- **OPEN-025 — LocationHub** (E-07…E-10): requisito del Director (Hub
  generico per luoghi con molte opportunità) + proposta di forma. Posto in
  `context/OPEN.md`.
- **OPEN-026 — tassonomia quest/job/attività su `/game`** (E-05, E-06,
  E-17). Posto in `context/OPEN.md`.

## 4. Confirmed Knowledge

E-01, E-03, E-04 (parte), E-11, E-15: la proposta esterna arriva da sola
alla grammatica già decisa per il Sigillo e ai due clock ratificati.

## 5. Refinements

Nessuna: la fonte non aggiunge precisione alla grammatica dell'halo.

## 6. Corrections

Nessuna.

## 7. Decisions

Nessuna. La fonte non contiene decisioni del Director.

## 8. Research

Nessuna ricerca con fonti: solo opinione di design di un'AI.

## 9. Rejected Approaches

Nessuno nuovo. I conflitti E-13 / E-14 confermano ruling già esistenti
(etichetta sul POI, placca CTA).

## 10. Unresolved Questions

- OPEN-025 — LocationHub: quali luoghi diventano Hub, cosa mostra il marker
  dell'Hub, cosa si apre al click, come convive con il planner.
- OPEN-026 — tassonomia: quante famiglie sulla mappa, nome «attività» vs
  `ActivityDefinition`, ritorno dei job su `/game`.
- Già aperta (R-177): metallo dell'anello per famiglia.

## 11. Conflicts

| Fonte | Esistente | Esito |
|---|---|---|
| Etichette nome+timer accanto al POI (mockup) | «niente etichetta con il nome sopra il POI» (R-177, 15/10) | vale l'esistente |
| Colore/icona-verbo per famiglia | sagoma = famiglia, glifo = luogo (Sigillo D1) | vale l'esistente; la richiesta «job diverso dalla quest» resta aperta (R-177) |
| «Activity» come categoria sorella | `ActivityDefinition` = ombrello | aperto in OPEN-026 |
| Pulsanti a placca | placca CTA vietata | vale l'esistente |

## 12. Changes of Direction

Nessuno.

## 13. Documentation Changes

- creato: questo report;
- `context/OPEN.md`: aggiunte OPEN-025, OPEN-026;
- `context/INDEX.md`: registrato questo report;
- non toccati: `poi_family_spec.md`, `QUEST_OPPORTUNITY_LAYER.md`,
  `DECISION_LOG.md`, `CANON.md` (nessuna decisione da registrare).

## 14. Implementation Impact (non implementare)

Se OPEN-025 viene decisa: un marker «luogo» (nuova sagoma o variante del
Sigillo) con riassunto dello stato più urgente; un pannello Hub che legge
`mapQuestPoiView` per ogni opportunità; instradamento del click dalla riga
dell'Hub verso `QuestExpeditionDetail`. Se OPEN-026 riporta i job su
`/game`: riattivare la famiglia `job` (oggi `deprecated` in CTR-game-008) e
dipingere il glifo (oggi croce/placeholder).

## 15. Argomenti trattati

- stato del POI sulla mappa (scadenza, urgenza, avanzamento, completato)
- scadenza vs completamento vs ricompensa da ritirare
- quest vs job vs attività: distinzione e rappresentazione
- marker per famiglia: icona, colore, cartiglio
- luoghi con molte opportunità → Hub generico
- layout dell'Hub (lista + dettaglio)
- elenco componenti UI proposti

## 16. Problemi risolti

- «Come mostro sul POI scadenza e avanzamento?» → già risolto dalla
  grammatica dell'halo del Sigillo (`poi_family_spec.md` § Halo grammar,
  § States); manca solo la prova dal vivo di snap urgente, pulsazione e
  quest principale.

## Aggiornamento 2026-11-11 — decisione del Director

Alla domanda «sulla mappa i tipi devono essere 2 o 3?» il Director ha
risposto **«2 famiglie»**: E-17 passa da INFERENCE a **DECISION**
(spedizione vs lavoro; verbi dentro, icona-verbo solo nell'Hub); E-05 è
risolto per (a)/(b). Registrato in `context/DECISION_LOG.md` 2026-11-11 e in
OPEN-026.

## 17. Ripresa della conversazione

Stato: la parte «stato sul POI» è già progettata e implementata (Sigillo);
la parte nuova è l'Hub (OPEN-025); la tassonomia è decisa a due famiglie (OPEN-026 resta aperta solo su ritorno dei job e metallo). Prossimo
passo atteso: il Director decide se i luoghi densi diventano Hub e quante
famiglie stanno sulla mappa; poi `mw-explorer` (critica UI sul mockup
reale prima di proporre) e `mw-planner` per un mockup del marker-luogo e
del pannello Hub nel linguaggio della skin base.
