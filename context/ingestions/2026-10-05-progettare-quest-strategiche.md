---
title: Ingestion Report — «Progettare quest strategiche»
type: ingestion-report
date: 2026-10-05
source: ChatGPT conversation 2026-10-04 (share link 6ac21e35)
---

# Knowledge Ingestion Report

Artifacto di evidence/candidatura — **non** conoscenza canonica. La conoscenza
canonica vive nei documenti indicati dalla reconciliazione.

## 1. Source Overview

Conversazione ChatGPT web «Progettare quest strategiche» condivisa dal
Director (2026-10-04). Il transcript grezzo non è nel repository né
recuperabile dallo share link (pagina JS-rendered); la fonte disponibile è il
contenuto archiviato della conversazione in
`.mw/runs/20261004-rovine-preview-chatgpt/`:

- `README.md` — provenance + intenti Director verbatim + mappatura
- `economy-notes.md` — simulazione MC 200k, human-days, regola leader,
  quest-opportunità, 5 fonti di juice → copia tracciata: `context/QUEST_ECONOMY_NOTES.md`
- `rovine-mockup.md` — mockup completo «Le Rovine sotto il Fiume» → copia
  tracciata: `src/docs/docs/idle_village/quest_rovine_scenario_spec.md`
- `preview-prompt.md` — spec 28 sezioni Quest Simulation Preview → copia
  tracciata: `src/docs/docs/idle_village/quest_simulation_preview_spec.md`

Limite dichiarato: l'analisi copre il contenuto persistito della
conversazione, non il transcript integrale (non disponibile).

## 2. Extraction Ledger

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | REASON | SOURCE | RELATIONSHIPS |
|---|---|---|---|---|---|---|---|
| E-01 | PROPOSAL | Regola leader-capacity: la capacità di spedizione è limitata da stato del leader e pool di umani disponibili, non da cooldown «1 quest/X giorni» | PLANNED | INTEGRATE | Direttiva Director verbatim, non ratificata → PROPOSAL verso S4/GAMEPLAY_DESIGN | economy-notes §leader, README verbatim | → OPEN-010; §8 QUEST_RULES |
| E-02 | PROPOSAL | Economia human-days: costo quest = persone × giorni; ferito = indisponibilità X giorni | PLANNED | INTEGRATE | Candidato economia villaggio, non ratificato | economy-notes §human-days | → OPEN-010 |
| E-03 | PROPOSAL | Quest come opportunità: 8–10 appaiono/mese, 4–5 fattibili; alcune scadono | PLANNED | INTEGRATE | Stessa famiglia di E-02 | economy-notes §opportunità | → OPEN-010 |
| E-04 | RESEARCH | 5 fonti di juice: near-miss, deterioramento visibile, loot endowment, push-your-luck, storia emergente (mappa P4/P18/P32/P19/P15/P45) | CURRENT | CONFIRM | Già mappate su QUEST_GAMEPLAY_SCIENCE nel README R-083 | economy-notes §juice | refines → QUEST_GAMEPLAY_SCIENCE |
| E-05 | CONSTRAINT | Avviso bilanciamento: ~1 morto medio/quest rischia «roulette russa» — è un **warning**, non un target di design | CURRENT | INTEGRATE | Correzione audit: l'audit lo leggeva come target; la fonte lo dà come avviso («attenzione a non trasformare ogni quest in una roulette russa») | economy-notes §risultato-sim | → QUEST_RULES §8 criterio diagnosi |
| E-06 | PROPOSAL | Spec mockup «Le Rovine sotto il Fiume»: 7 fasi, party Eroe+3 Villager, checkpoint push-your-luck | CURRENT | CONFIRM | Implementata come seconda quest authored del lab (`questScenarioRovine.ts`); spec archiviata per regressione | rovine-mockup.md; R-083 | supersedes → n/a; supports → PLAN-019 S1 lab |
| E-07 | DECISION | Checkpoint push-your-luck: TAKEN ≠ SECURED — dopo il checkpoint si rischia ciò che si ha già | CURRENT | CONFIRM | Coerente con checkpoint/fuga vigenti (v24 rev.1 p.11, QUEST_RULES §5); la formulazione rafforza, non cambia | rovine-mockup §7 | confirms → QUEST_RULES §5 |
| E-08 | INFERENCE | Attrition non azzerabile: «continuare deve costare qualcosa» | CURRENT | REFINE | Integrazione operativa ai principi di QUEST_GAMEPLAY_SCIENCE | rovine-mockup §8; README mappatura | refines → QUEST_GAMEPLAY_SCIENCE |
| E-09 | PROPOSAL | Spec preview 28 sezioni: due preview (totale + pre-check) stessa logica, MC seeded, ricalcolo reattivo, toggle consumabili, controfattuali, WHY causale | CURRENT | CONFIRM | Implementata in R-082 (preview per-check analitica + MC seeded quest); divergenza MC↔DP tracciata | preview-prompt.md; R-082 | → OPEN-008 |
| E-10 | REQUIREMENT | Le due preview devono usare la stessa logica di simulazione; mai formule ad-hoc separate | CURRENT | CONFIRM | Accettato in R-082 (stessa pipeline) | preview-prompt §1–2 | supports → OPEN-008 |
| E-11 | UNRESOLVED | Preview compound: MC vs DP esatta vs ibrido — politica consumabili/diramazioni ignote | UNRESOLVED | INTEGRATE | Divergenza dichiarata nel prompt stesso; registrata come OPEN-008 | preview-prompt header; README mappatura | → OPEN-008 |
| E-12 | PROPOSAL | Modello check della simulazione: fallimento apre tiro conseguenza; delta skill↔DC riduce probabilità E gravità | CURRENT | CONFIRM | Allineato al modello vigente (verdetto gruppo + rischi per-slot); resta modello di sim, non formula canonica | economy-notes §modello | confirms → QUEST_RULES §3 |
| E-13 | RESEARCH | Risultati sim 200k: ~83% completata, ~0,49 morti, ~1,5 feriti, ~6,7 gg (regole provvisorie) | CURRENT | DUPLICATE | Già persistiti in economy-notes.md (evidence L4); i numeri sono scenario-specifici, non canonici | economy-notes §risultati | evidence → E-05 |
| E-14 | PROPOSAL | Framing strategico: «qual è il prossimo miglior uso dei miei umani?» | PLANNED | CONFIRM | Coerente con pillar strategico; registrato come intento | economy-notes §leader | supports → OPEN-010 |
| E-15 | PROPOSAL | Test proposto «30 giorni → X quest → party → spedizioni → human-days» per validare l'emergenza | PLANNED | INTEGRATE | Candidato scenario di test villaggio | economy-notes §testare | → OPEN-010 |
| E-16 | DECISION | «la voglio implementare come mockup» (Rovine) | CURRENT | CONFIRM | Direttiva eseguita (questScenarioRovine.ts), registrata in R-083 | README verbatim | done → R-083 |
| E-17 | DECISION | «prompt super preciso x il componente Preview… ricalcolarsi… pre skill check… consumable» | CURRENT | CONFIRM | Direttiva eseguita (R-082, preview su primitive canoniche) | README verbatim | done → R-082 |
| E-18 | OBSOLETE | «1 quest per X giorni» come modello di capacità | SUPERSEDED | CHANGE | Sostituito dal modello leader-capacity (E-01) — entrambi non ratificati; E-18 registra solo che l'ipotesi cooldown è esplicitamente negata nella fonte | economy-notes §leader | superseded-by → E-01 |

**Non estratti (guard):** «Cinghiale Nero» — presente in
`GDD_primo_loop.md` come materiale onboarding, NON nella conversazione:
estrarlo sarebbe context-bleed (correzione audit). Nessun riferimento a
Poisson-binomiale in questa fonte: la scelta DP esatta è del 2026-09-29
(REJ-006), non di questa conversazione.

## 3. New Knowledge

| ID | Classificazione | Statement | Importance | Proposed location |
|---|---|---|---|---|
| E-01 | PROPOSAL | leader-capacity | alta (livello villaggio) | OPEN-010 → GAMEPLAY_DESIGN dopo avallo |
| E-02 | PROPOSAL | human-days | alta | OPEN-010 → gameplay_math_spec dopo avallo |
| E-03 | PROPOSAL | quest-opportunità | media | OPEN-010 |
| E-05 | CONSTRAINT | warning ~1 morto/quest | media | QUEST_RULES §8 / QUEST_GAMEPLAY_SCIENCE |
| E-11 | UNRESOLVED | MC vs DP compound | media | OPEN-008 |
| E-15 | PROPOSAL | test 30-giorni | media | OPEN-010 |

## 4. Confirmed Knowledge

E-04, E-06, E-07, E-09, E-10, E-12, E-14, E-16, E-17 — vedi ledger.

## 5. Refinements

- E-08: «continuare deve costare qualcosa» raffina i principi operativi di
  `context/QUEST_GAMEPLAY_SCIENCE.md` (attrition → tensione).
- E-07: la formulazione TAKEN≠SECURED rende esplicito il perché meccanico del
  checkpoint push-your-luck.

## 6. Corrections

- La soglia «~1 morto/quest» della sim NON è un target canonico — è un
  warning condiviso dalla fonte stessa (E-05). Nessun documento canonico la
  registra come obiettivo; se un doc futuro la cita, citarla come avviso.

## 7. Decisions

- E-16: mockup Rovine implementato (R-083) — già registrato.
- E-17: preview component dispatchato e implementato (R-082) — già registrato.

## 8. Research

- Simulazione Monte Carlo 200k run del party Eroe+3 Villager sul mockup a 7
  fasi: risultati in `economy-notes.md` (E-13). Limite: regole provvisorie,
  non il modello canonico DP.

## 9. Rejected Approaches

- E-18: «1 quest per X giorni» (cooldown) negato dalla fonte a favore del
  modello leader-capacity — nessuno dei due è ratificato; entrambi tracciati
  via OPEN-010. Non entra in `context/REJECTED.md` come regola scartata del
  progetto perché il cooldown non è mai stato canonico qui.

## 10. Unresolved Questions

- E-11 → OPEN-008 (preview compound MC vs DP).
- E-01/E-02/E-03/E-15 → OPEN-010 (ratifica proposte villaggio).

## 11. Conflicts

- La spec preview prescrive MC seeded; il contratto planner canonico è DP
  esatta (DECISION_LOG 2026-09-29). Risolta parzialmente in R-082 (analytic
  per-check + MC seeded per totale); la decisione di fondo resta OPEN-008.

## 12. Changes of Direction

Nessun cambio di direzione: le proposte villaggio estendono lo scope S4, non
modificano S1 congelato.

## 13. Documentation Changes

- `context/OPEN.md` — create/aggiornate voci OPEN-008, OPEN-010.
- `QUEST_RULES.md` — §8 «non-regole» registra le proposte come `proposta`.
- `context/INDEX.md` — questo report registrato in L4.
- Nessuna modifica a desiderata/GAMEPLAY_DESIGN (gate Director).

## 14. Implementation Impact

- `idle_village_gameplay_math_spec.md` — candidato per human-days se ratificato.
- Componenti preview R-082 — già implementati; la spec rimane riferimento di
  regressione.
- `questScenarioRovine.ts` — già implementato.

## 15. Argomenti trattati

Mockup Rovine 7 fasi; simulazione MC 200k e warning bilanciamento; economia
human-days; regola leader-capacity; quest come opportunità; 5 fonti di juice;
spec preview totale + pre-check; divergenza MC vs DP; TAKEN≠SECURED;
attrition; test 30-giorni.

## 16. Problemi risolti

- Preview compound ingannevole → etichetta `SIMULATED STRATEGY` (parziale,
  OPEN-008 resta).
- «Come rappresentare il costo reale di una quest» → human-days (proposta).

## 17. Ripresa della conversazione

Stato: contenuto archiviato e integrato (R-082/R-083 fatta); restano
**PROPOSAL non ratificate** lato villaggio (OPEN-010) e la decisione
MC-vs-DP compound (OPEN-008). Prossimo passo atteso: avallo Director sulle
proposte economia-villaggio, poi S2 (spike motore — OPEN-002).
