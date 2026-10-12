---
title: "Ingestion — approcci alternativi alla core gimmick (check su stat/skill diverse)"
type: ingestion
date: 2026-10-10
source: "share ChatGPT https://chatgpt.com/share/6acab344-4478-83ed-b19d-ccdd71126518 — voice-mode del Director, 5 messaggi utente + risposte brevi; ultima risposta AI troncata a metà generazione"
related: R-127, QUEST_GENERATION_ARCHITECTURE.md, QUEST_GENERATION_CONTRACTS.md,
         QUEST_GENERATION_SPEC.md, QUEST_RULES.md, OPEN-017,
         quest_sterminio_goblin_spec.md
status: archived — proposta registrata in QUEST_RULES §7 (`proposta`), dettaglio in
        QUEST_GENERATION_ARCHITECTURE.md §16, binding model in OPEN-017
---

# Knowledge Ingestion Report — «Approcci alternativi alla core gimmick»

## 1. Source Overview

Conversazione voice-mode breve (5 turni Director). Il Director sta ragionando ad
alta voce su **come una quest con core gimmick di infiltrazione possa essere
affrontata con canali diversi dalla stat nativa**: non cambia la quest, cambia
*quali check* usano quale stat. Cita la quest authored «Sterminio dei goblin»
come riferimento concreto. L'ultima risposta di ChatGPT è **troncata a metà
frase** (share catturato durante la generazione) — la contro-proposta AI non è
recuperabile e non va indovinata.

## 2. Extraction Ledger

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | SOURCE | RELATIONSHIPS |
|----|------|-----------|----------|---------|--------|---------------|
| E-01 | PROPOSAL | Una core gimmick risolvibile normalmente con una stat (es. infiltrazione/allarme → Destrezza) può ammettere **canali di check alternativi** su stat/skill diverse: invisibilità → Intelligenza, camuffamento → Carisma. | CURRENT | INTEGRATE | msg utente 1, 4, 5 | refines CoreGimmick contract; blocks OPEN-017 |
| E-02 | PROPOSAL | La sostituzione **non è quest-wide**: vale solo per i check della core gimmick (i tiri che muovono la variabile centrale, es. «ogni tiro che dovrebbe far aumentare l'alarm»). I check non-core restano sulle stat native (ponte traballante → Destrezza, scene di forza → Forza). | CURRENT | INTEGRATE | msg utente 1, 2, 5; eco AI msg 4 | refines §16 ARCHITECTURE; vincolo di scope |
| E-03 | PROPOSAL | Esiste quindi una distinzione di tipo: **check core-gimmick** (scrivono/leggono la var centrale) vs **check di scena** (ostacoli locali). Il punto di aggancio dichiarato dal Director è la core gimmick stessa («io soprattutto stavo pensando di andare a toccare la core gimmick»). | CURRENT | INTEGRATE | msg utente 3, 4 | refines SceneArchetype/CoreGimmick contracts |
| E-04 | UNRESOLVED | Il **modello di binding** non è determinato: canale scelto per-check in-run, approccio scelto a monte per tutta la run, o gated da skill/equip/party (invisibilità richiede un caster). Il Director stesso: «ancora non so di preciso come le stiamo facendo queste core gimmick». | UNRESOLVED | INTEGRATE → OPEN-017 | assenza nel transcript + msg 5 | blocks QUEST_GENERATION_CONTRACTS §2 |
| E-05 | FACT (repo) | Il motore lega già le stat **per nodo check** (`QuestNode.stats: LabStat[]`, `questScenario.schema.ts`); gli slot dell'offerta coprono le stat via `statFocus` (check di coerenza offer↔nodes). La quest goblin ha meccaniche di allarme reali (`campoAllertato`/`campoSveglio`, `alarm` bool, approccio stealth in F3) — testbed naturale. | CURRENT | CONFIRM + INTEGRATE (nota di mapping) | msg 5 + verifica repo 2026-10-10 | supports E-01 implementation path |
| E-06 | INFERENCE | «Tirando invisibilità» / «tirando camuffamento» suggerisce che il canale alternativo è una **skill capacità**, non solo una stat nuda — collega ai slot skill equip (desiderata v10/v12). Se il canale è gated da skill posseduta, la preview deve mostrare quali canali il party può usare (regola numeri-esatti R-108). | UNRESOLVED | INTEGRATE come ipotesi marcata | msg 4, 5 | relates desiderata v12 (skill equip, Int→slot) |
| E-07 | PROVENANCE GAP | Risposta finale ChatGPT troncata: «E questa è una buona base, ma invece di aggiungere semplicemente statistiche alternative a ogni» — stava formulando una variante (probabilmente binding a livello diverso dal per-check). | — | DROP — contenuto non recuperabile, non indovinare | msg assistant finale | — |

## 3. New Knowledge

- **E-01/E-02/E-03 → ARCHITECTURE §16 + QUEST_RULES §7 (`proposta`).**
  L'idea nuova rispetto al framework: nel catalogo `DecisionFamily` esiste
  `approcci-incompatibili` (due approcci *dentro una scena*) e il modello
  «tre approcci» §6 (prudente/rapido/interferenza = postura rischio/reward).
  Quello del Director è un asse diverso: **la stessa core gimmick accetta
  canali di stat/skill differenti**, applicato a *tutti* i check che toccano
  la var centrale. Non è una scena con due opzioni — è una proprietà del
  gimmick.

## 4. Confirmed Knowledge

- E-05: stat per-check già nel motore (nessuna divergenza); la quest goblin
  è il testbed naturale (allarme reale, approccio stealth in F3).

## 5. Refinements

- `QUEST_GENERATION_CONTRACTS` §2 `CoreGimmick`: il contratto dovrà prevedere
  i **canali di risoluzione** della gimmick (nativo + alternativi), non solo
  vars/hook/climax. Non aggiunto al contratto v0 — la forma dipende da OPEN-017.
- `SceneArchetype.optionShapes` dichiara già «stat candidate» per opzione:
  il canale alternativo è estendibile come *vocabolario stat alternativo
  sul nodo core*, o come nodi check paralleli gated da flag/approccio —
  due forme implementative diverse, da decidere.

## 6. Corrections

Nessuna.

## 7. Decisions

Nessuna ratificata — voice-mode brainstorm, nessun segnale di decisione.

## 8. Research

Nessuna.

## 9. Rejected Approaches

Nessuna (la contro-proposta AI è troncata, non valutabile — E-07).

## 10. Unresolved Questions

- **OPEN-017**: modello di binding dei canali alternativi (per-check vs
  per-run vs gated da skill/party) + marcatura dei check «core-gimmick»
  vs check di scena + esposizione in preview (numeri esatti R-108).

## 11. Conflicts

Nessuna divergenza da fonti FROZEN. Tensione lieve da registrare (non un
conflitto): se il canale è gated da skill/equip, la preview deve rendere
leggibili i canali disponibili per il party scelto — altrimenti viola
«numeri esatti in preview» (R-108).

## 12. Changes of Direction

Nessuna.

## 13. Documentation Changes

- `context/ingestions/2026-10-10-quest-gimmick-approcci-alternativi.md` — questo report.
- `RICHIESTE.md` — R-127 (verbatim + classificazione).
- `QUEST_RULES.md` §7 — regola `proposta` (approcci alternativi ai check core).
- `context/OPEN.md` — OPEN-017 (modello di binding).
- `context/QUEST_GENERATION_ARCHITECTURE.md` — §16 (dettaglio proposta).
- `context/QUEST_GENERATION_SPEC.md` — §3.1 (voce canali) + §11 (aperta).
- `context/QUEST_GENERATION_CONTRACTS.md` — §11 (aperta, no contratto ancora).
- `context/INDEX.md` — riga di registro.

## 14. Implementation Impact

Nessuna implementazione ora. Quando ratificata toccherà: `QuestNode.stats`
(vocabolario alternativo o nodi paralleli gated), `verdictTable`/`vars`
(check che scrivono la var core via canali diversi), coerenza
offer↔`statFocus` (quali canali il party copre), preview planner (canali
disponibili visibili), skill-equip come gate (desiderata v10/v12).

## 15. Argomenti trattati

- Infiltrazione risolvibile via magia (invisibilità→INT) o camuffamento (→CHA) al posto di Destrezza.
- Scope: solo i check della core gimmick, non la quest intera (chiarimento chiave del transcript).
- Check non-core invariati sulle stat native (es. ponte traballante → DEX).
- Ancoraggio a una quest authored reale («Sterminio dei goblin»).

## 16. Problemi risolti

- **Check-specific vs quest-wide** — risolto nel transcript: l'alternativa
  si applica ai singoli check della gimmick, non ridipinge tutta la quest.
  Registrato in QUEST_RULES §7 come proposta.

## 17. Ripresa della conversazione

Il thread ChatGPT è **troncato**: l'AI stava per proporre una variante al
«stat alternative per-check» (E-07). Per riprendere: riaprire il filo con la
domanda «il canale alternativo è una scelta per-check, un approccio scelto a
monte, o gated da skill del party?» — è esattamente OPEN-017. Lo stato
progettuale aggiornato è in ARCHITECTURE §16 e QUEST_RULES §7; il testbed
concreto è la quest goblin (allarme `campoAllertato`/`campoSveglio` + F3
scelta di approccio).
