---
title: Ingestion Report — «Progettare quest strategiche», continuazione 2026-10-05
type: ingestion-report
date: 2026-10-06
source: ChatGPT conversation 2026-10-05 (share link 6ac4b926)
related-ingestion: context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md
---

# Knowledge Ingestion Report — continuazione «Progettare quest strategiche»

Artifacto di evidence/candidatura — **non** conoscenza canonica.

## Pertinence Gate

Due link forniti dal Director:

1. `chatgpt.com/share/6ac4b77e` — conversazione su ottimizzazione bollette
   domestiche (luce/gas/fibra/mobile, Carpi). **DROP al gate**: conoscenza
   personale/logistica, nessuna pertinenza con il progetto RPG (MW-P-003).
2. `chatgpt.com/share/6ac4b926` — breve continuazione della conversazione
   «Progettare quest strategiche» (share link 6ac21e35, già ingerita
   2026-10-05 con ledger E-01..E-49). Procede.

## 1. Source Overview

Conversazione breve (~2.7k caratteri): il Director riapre il thread condiviso
per *«scrivere una quest che sia interessante, intelligente, partendo da quella
che avevo proposto»*. ChatGPT propone un metodo di decomposizione prima di
riscrivere il testo, e chiede al Director di incollare la proposta originale
della quest. La conversazione si interrompe lì — thread aperto.

## 2. Extraction Ledger

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | REASON | SOURCE | RELATIONSHIPS |
|---|---|---|---|---|---|---|---|
| E-01 | PROPOSAL | Checklist di authoring quest in 8 punti: obiettivo; ostacolo; informazioni che il giocatore possiede; informazioni scopribili; scelte possibili; costo/rischio di ogni scelta; cosa rende una soluzione migliore di un'altra; conseguenze di successo/fallimento/ferite/morte | CURRENT | INTEGRATE | Rubrica compatta e operativa non presente verbatim in KB; coerente con E-22/E-25 (tensione/decisioni) ma più applicativa | msg. 2 della conversazione | refines → QUEST_GAMEPLAY_SCIENCE; candidata per authoring S5 (PLAN-019) |
| E-02 | REJECTED | Anti-pattern quest piatta: *«manda il party → tiro di abilità → successo/fallimento → ricompensa»* — da evitare perché collassa la quest in un singolo check senza decisioni | CURRENT | INTEGRATE | Anti-pattern esplicito con motivazione; merita il registro negativo per non riproporlo | msg. 2 | → REJECTED.md REJ-007; confirms → QUEST_RULES §1 (struttura multi-fase) |
| E-03 | PROPOSAL | Criterio per la Preview: non deve dire solo «vinci al 78%» ma *perché* quella composizione funziona e cosa si sacrifica per ottenerla | CURRENT | CONFIRM | Già direzione della preview spec (R-082) e del loop cognitivo E-27; rafforza, non aggiunge | msg. 2 | confirms → quest_simulation_preview_spec, PLAN-019 Gate A |
| E-04 | PROPOSAL | La quest è interessante perché composizione party, risorse e decisioni cambiano concretamente l'approccio — non per la descrizione | CURRENT | CONFIRM | Cuore di v24 FROZEN e E-21; nessuna novità | msg. 2 | confirms → desiderata v24, QUEST_RULES §1 |
| E-05 | UNRESOLVED | Il Director vuole riscrivere la quest proposta originariamente; passo successivo: incollare la proposta per smontarla con la checklist E-01 | UNRESOLVED | INTEGRATE | Thread aperto di lavoro, registrato in «Ripresa» | msg. finali | blocks → eventuale nuova quest authored |
| E-06 | PROPOSAL | **Exposure Targeting**: un unico profilo di pesi decide chi assorbe qualsiasi evento pericoloso (danno da check, agguato, sudden death, target narrativi, non-combat). Profilo base S1 0 / S2 0 / S3 20 / S4 80; penetrazione modulabile per evento/quest | CURRENT | INTEGRATE | Sistema unico ed elegante richiesto dal Director («vorrei un sistema unico»); in tensione con intercettazione deterministica bodyguard vigente | share 6ac4f2f9 (stessa conversazione, parte nuova) | conflicts-with → QUEST_RULES §4 bodyguard; candidato S1 lab / mission_planner_math_spec |
| E-07 | PROPOSAL | **Sudden Death Protection**: l'eroe non può essere ucciso istantaneamente finché un altro membro vive; se targato → sopravvive con conseguenza alternativa (danno pesante). Da ultimo vivo può morire | CURRENT | INTEGRATE | Risponde al requisito Director «danni extra sì, morte no» senza un secondo sistema | share 6ac4f2f9 | depends-on → E-06; → QUEST_RULES §4 proposta |
| E-08 | RESEARCH | Sim MC (4 round, esiti 15/40/30/15, cascata 80/20): morti S1 0.004% / S2 4.8% / S3 26.9% / S4 72% — la cascata iper-protegge S1/S2; per ~2 morti/scontro servono ~S1 5–10, S2 20–35, S3 40–55, S4 60–75 | CURRENT | INTEGRATE | Evidenza numerica che il profilo flat 80/20 non basta a produrre la letalità voluta | share 6ac4f2f9 | informs → tuning E-06 |
| E-09 | CONFLICT | Exposure Targeting probabilistico (~80%) vs regola vigente «bodyguard intercetta tutto il danno da check finché vivo» (100%) | UNRESOLVED | CONFLICT | Due modelli di assorbimento incompatibili; serve decisione Director | share 6ac4f2f9 vs QUEST_RULES §4 | blocks → implementazione E-06 |
| E-10 | DECISION | **Targeting posizionale a cascata (Director, verbatim):** il tiro degli esiti pericolosi/danni extra va sugli slot *occupati*; profilo posizionale 1→100 · 2→20/80 · 3→0/20/80 · 4→0/0/20/80; a ogni morte gli slot scalano e il profilo si ricalcola. In combattimento escalation: dopo T1 S4−10 → S2+5/S3+5; dopo T2 S4−10 → S1+5/S2+5. Attesa: bodyguard muore mediamente, S2 ~20–30%, S3 ~50–70% | CURRENT | CHANGE | Correzione Director a E-06: il modello è posizionale, non pesi fissi per slot; la «sudden death protection» dell'eroe diventa conseguenza della posizione, non regola separata → E-09 risolto | msg. Director 2026-10-06 | supersedes → E-06/E-07; resolves → E-09; → QUEST_RULES §4 vigente; → spec Sterminio dei goblin |
| E-11 | DECISION | La quest del Director è «**Sterminio dei goblin**» — quest di combattimento basata su Forza; spec completa F0–F7 scritta dal Director e riportata in `quest_sterminio_goblin_spec.md` | CURRENT | CHANGE | Sostituisce «La Torre nel Bosco» come quest di lavoro | msg. Director 2026-10-06 | → quest_sterminio_goblin_spec.md |

## 3. New Knowledge

- **E-01** — checklist di authoring a 8 punti. Importanza: media; diventa la
  rubrica operativa per valutare «questa quest è interessante?». Location:
  `context/QUEST_GAMEPLAY_SCIENCE.md` (Applied frameworks).
- **E-02** — anti-pattern quest piatta. Location: `context/REJECTED.md` (REJ-007).

## 4. Confirmed Knowledge

E-03 (preview deve spiegare il *perché*, non solo la %) e E-04 (interesse =
decisioni/composizione, non descrizione) confermano v24, QUEST_RULES §1 e la
spec preview R-082. Nessuna modifica necessaria.

## 5. Refinements

E-01 raffina la famiglia «vocabolario di authoring» (E-22, E-25, E-27) in una
forma a checklist direttamente applicabile.

E-06/E-07 raffinano il modello di assorbimento del rischio: da «bodyguard
intercetta tutto» a targeting probabilistico unificato + protezione sudden
death dell'eroe. E-08 fornisce la prima evidenza numerica contro il profilo
flat (72% delle morti concentrate su S4, eroe a 0.004%).

## 6. Corrections

Nessuna.

## 7. Decisions

Nessuna nuova decisione — tutte le voci sono PROPOSAL/UNRESOLVED (ChatGPT
propone, il Director non ha ancora ratificato nulla nella conversazione).

## 8. Research

Nessuna fonte esterna citata.

## 9. Rejected Approaches

REJ-007 — quest come singolo skill check («manda party → tiro →
successo/fallimento → ricompensa»). Rejected perché elimina decisioni,
costo/rischio per scelta e conseguenze differenziate.

## 10. Unresolved Questions

- La quest originale del Director va incollata e decomposta con E-01; esito
  aperto (possibile nuova quest authored per il lab S1).

## 11. Conflicts

- **E-09**: Exposure Targeting (assorbimento ~80% probabilistico) vs regola
  vigente «bodyguard intercetta tutto il danno da check finché vivo»
  (deterministico, `QUEST_RULES.md` §4, v24 rev.2). Registrato come proposta
  in QUEST_RULES §4 con status `proposta`; richiede decisione Director.

## 12. Changes of Direction

Nessuno.

## 13. Documentation Changes

- `context/QUEST_GAMEPLAY_SCIENCE.md` — aggiunta checklist di authoring E-01
  (sezione Applied frameworks, marcata PROPOSAL).
- `context/REJECTED.md` — nuova voce REJ-007.
- `context/INDEX.md` — riga per questo report.

## 14. Implementation Impact

Nessuno immediato. La checklist E-01 è candidata per la fase di authoring/
generazione quest (PLAN-019 S5) e per la revisione della quest proposta dal
Director.

## 15. Argomenti trattati

- Continuazione del thread «Progettare quest strategiche».
- Metodo di decomposizione di una quest prima della riscrittura.
- Anti-pattern del singolo skill check.
- Criterio qualitativo per la Quest Simulation Preview.

## 16. Problemi risolti

Nessuno risolto nella fonte — è un messaggio di setup metodologico.

## 17. Ripresa della conversazione

Il Director vuole scrivere una quest «interessante e intelligente» partendo da
una proposta precedente. Stato: metodo concordato (checklist E-01 + evitare
REJ-007). **Prossimo passo atteso**: il Director incolla la proposta originale
della quest; la decomposizione segue la checklist → poi riscrittura con
struttura strategica e preview che spiega il perché (E-03).
