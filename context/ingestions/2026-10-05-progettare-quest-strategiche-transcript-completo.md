---
title: Ingestion Report — «Progettare quest strategiche» (transcript completo)
type: ingestion-report
date: 2026-10-05
source: ChatGPT conversation 2026-10-04 (share link 6ac21e35), transcript integrale
supersedes-coverage: context/ingestions/2026-10-05-progettare-quest-strategiche.md
---

# Knowledge Ingestion Report — transcript completo

Artifacto di evidence/candidatura — **non** conoscenza canonica. La conoscenza
canonica vive nei documenti indicati dalla reconciliazione.

## 1. Source Overview

Seconda ingestion della conversazione ChatGPT «Progettare quest strategiche».
La prima (`2026-10-05-progettare-quest-strategiche.md`, E-01..E-18) copriva solo
i contenuti archiviati in `.mw/runs/20261004-rovine-preview-chatgpt/` — cioè la
**coda** della conversazione (mockup Rovine, economy-notes, preview-prompt).

Il 2026-10-05 il **transcript integrale è stato recuperato** dallo share link:
200 messaggi, ~608k caratteri, persistito in
`.mw/runs/20261005-transcript-quest-strategiche/transcript.md` (evidence L4).
Questa ingestion copre l'**intera** conversazione; il ledger E-01..E-18 resta
valido e non viene duplicato — qui si estraggono solo le voci nuove (E-19+).

Arco della conversazione (ricostruzione):

1. Intent iniziale del Director: rendere le quest divertenti da sole, core =
   Lords of Waterdeep.
2. Esplorazione del modello «quest = spedizione strategica» (situazione →
   preparazione → reazione → conseguenze) → sfocia in PLAN-018 e poi v24/PLAN-019.
3. Slot, loadout, consumabili, timed phases → poi regole rev.1/rev.2.
4. Teoria del design: assi di tensione, gradazione del rischio, tassonomia
   delle decisioni, archetipi di rischio, loop cognitivo.
5. Architettura narrativa: Situation → Context → Approach → Narrative →
   Presentation; asset per situazione.
6. Economia degli umani: human-days, leader-capacity, opportunità; eroi vs
   villager; difesa del villaggio (They Are Billions); categorie di potere.
7. Scenario esplorativo «La Torre nel Bosco».
8. Coda (già ingerita): mockup «Le Rovine sotto il Fiume», simulazione MC
   200k, spec Quest Simulation Preview → R-082/R-083.

## 2. Extraction Ledger (nuove voci — continua da E-18)

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | REASON | SOURCE | RELATIONSHIPS |
|---|---|---|---|---|---|---|---|
| E-19 | DECISION | Intent Director: *«Vorrei che il gioco fosse divertente e interessante anche solo con la scelta e risoluzione delle quest. Visto che il 'core' del progetto è Lords of Waterdeep»* | CURRENT | CONFIRM | Già motore di R-076 → desiderata v24 FROZEN → PLAN-019; la conversazione è la genesi del macro plan | transcript msg. iniziali | supports → PLAN-019, desiderata v24 |
| E-20 | PROPOSAL | Identità «Lords of Waterdeep + XCOM»: una comunità che manda persone in pericolo — workers scarsi, assegnazione, opportunity cost, permadeath | PLANNED | INTEGRATE | Framing di direzione mai ratificato in GAMEPLAY_DESIGN/DESIGN_PILLARS; la parte «spesa risorsa PG» è già vigente (DECISION_LOG 2026-10-01), il framing complessivo no | transcript sezione identità | → OPEN-013; candidato GAMEPLAY_DESIGN |
| E-21 | DECISION | Loop: *«vedo una situazione → valuto opportunità e rischio → costruisco una spedizione → accetto compromessi → durante la spedizione reagisco → ottengo conseguenze»* | CURRENT | CONFIRM | Coincide con la catena vigente `PARTY → QUEST → PHASE → SITUATION → APPROACH → CHECK/CHOICE → CONSEQUENCE` (PLAN-019, QUEST_RULES §1) | transcript sezione modello | confirms → QUEST_RULES §1 |
| E-22 | PROPOSAL | Vocabolario di tensione a 6 assi: attrition, exposure, uncertainty, commitment, potential, recovery | CURRENT | INTEGRATE | Lessico di authoring non presente in KB; utile per «definizione di buona quest» (artefatto finale PLAN-019) | transcript sezione tensione | refines → QUEST_GAMEPLAY_SCIENCE |
| E-23 | PROPOSAL | Gradazione del rischio: safe → minor cost → HP → injury → major resource loss → death → mission failure | CURRENT | CONFIRM | Coerente con banda di rischio vigente ed epicfail-in-banda (DECISION_LOG 2026-10-03); come vocabolario raffina, non cambia | transcript sezione rischio | confirms → QUEST_RULES §3; refines → QUEST_GAMEPLAY_SCIENCE |
| E-24 | RESEARCH | Euristica di tensione: valore desiderato × conseguenza potenziale × incertezza × irreversibilità | CURRENT | INTEGRATE | Euristica di authoring AI-proposta, non validata | transcript sezione tensione | refines → QUEST_GAMEPLAY_SCIENCE |
| E-25 | RESEARCH | Tassonomia decisioni: risk / resource / route / commitment / information / push-your-luck / sacrifice / recovery / strategic-preparation | CURRENT | INTEGRATE | Tassonomia utile per audit «la quest offre varietà di decisioni?»; non ratificata | transcript sezione decisioni | refines → QUEST_GAMEPLAY_SCIENCE |
| E-26 | PROPOSAL | 7 archetipi di motore di rischio: attrition, injury, death, resource depletion, time/status clock, loot exposure, commitment | PLANNED | INTEGRATE | Candidato vocabolario S5 (generazione); nessuna implementazione prevista prima di S4 | transcript sezione rischio | → candidato S5 (PLAN-019) |
| E-27 | RESEARCH | Loop cognitivo target: *«Aspetta… Potrei fare X… però se faccio X rischio Y… ma se funziona ottengo Z… ok lo faccio… Oh cazzo… adesso devo decidere»* | CURRENT | CONFIRM | Operazionalizza il criterio «interessante» di v24/Gate A; coerente con P1/P3/P9 | transcript sezione teoria | confirms → PLAN-019-S1 Gate A |
| E-28 | PROPOSAL | Architettura narrativa: `Situation → Context → Approach → Narrative → Presentation`; asset per *situazione*, non per combinazione di stat | PLANNED | INTEGRATE | Proposta di pipeline contenuti/asset; pertinente a S5 e ad art direction, non ratificata | transcript sezione narrativa | → OPEN-014 (proposta narrativa) / NARRATIVE.md |
| E-29 | PROPOSAL | Vocabolario situazioni (`TRAVEL_ENCOUNTER`, `OBSERVE`, `FIND_TRACKS`, `CLIMB`, `CROSS_OBSTACLE`, `SEARCH_LOCATION`, `INFILTRATE`, `APPROACH_ENTRANCE`, `TRAP`, `COMBAT`, `NPC_ENCOUNTER`, `DISCOVERY`, `MYSTERY`, `REWARD`, `OBJECTIVE`) e contesti (forest, road, ruins, fortress, village, cave, river, mountain, swamp, abandoned settlement) | PLANNED | INTEGRATE | Vocabolario concreto della proposta E-28; stessa routing | transcript sezione narrativa | → OPEN-014 / NARRATIVE.md |
| E-30 | PROPOSAL | Tre layer narrativi (Quest Gameplay / Quest Narrative / World Narrative) + modello di fase Promise → Comprehension → Complication → Decision → Consequence → hook | PLANNED | INTEGRATE | Stessa famiglia E-28 | transcript sezione narrativa | → OPEN-014 / NARRATIVE.md |
| E-31 | CONSTRAINT | I semi narrativi devono appoggiarsi a `LoreDropService`/`loreDropStore` esistente — non creare un sistema lore parallelo | CURRENT | INTEGRATE | `LoreDropService` è già collegato al runtime (fatto repo, PLAN-019 §Fatti); vincolo di non-duplicazione | transcript sezione narrativa | supports → NARRATIVE.md |
| E-32 | DECISION | Scouting = informazione che cambia le scelte, non bonus flat; più capace = più dettaglio | CURRENT | CONFIRM | Vigente: stat primaria sempre rivelata, esploratore rivela secondarie/pericoli (DECISION_LOG 2026-10-01, QUEST_RULES §2). La granularità a livelli (nessuna/medio/forte) è refinement non ratificato | transcript sezione esploratore | confirms → QUEST_RULES §2; refines → QUEST_GAMEPLAY_SCIENCE |
| E-33 | CONFIRM | Check multi-stat (`PERCEPTION+INTELLIGENCE`, `STR+CON+PER`, …) | CURRENT | CONFIRM | `checkStatTags` separati dal gate sono vigenti (v23 rev.4 D4); le combo multi-stat sono il modello rev.2 | transcript esempi check | confirms → QUEST_RULES §3 |
| E-34 | PROPOSAL | Trial by Fire: un villager che sopravvive a spedizioni pericolose può diventare eroe | PLANNED | CONFIRM | Già tracciato come decisione aperta D-6/OPEN-005 (collocazione S2/S4/S5) | transcript sezione eroi | → OPEN-005 |
| E-35 | PROPOSAL | Difesa del villaggio a ondate (ispirazione They Are Billions): checkpoint di difesa che competono con le spedizioni per umani sani, equip, consumabili, tempo | PLANNED | INTEGRATE | Nuova famiglia di proposte villaggio, mai ratificata | transcript sezione difesa | → OPEN-012 |
| E-36 | PROPOSAL | Categorie di potere: Hero Power, Expedition Power, Defence Power, Unlock Power, Information | PLANNED | INTEGRATE | Tassonomia risorse-poteri non ratificata | transcript sezione difesa | → OPEN-012 |
| E-37 | PROPOSAL | Eroi = moltiplicatori persistenti (affidabilità, protezione dei villager, unlock di strategie) che restano vulnerabili — non sostituti dei villager né eliminano il costo umano | PLANNED | INTEGRATE | Coerente con «morte = spesa risorsa PG» (vigente); il ruolo eroe/villager completo resta proposta | transcript sezione eroi | → OPEN-012 |
| E-38 | UNRESOLVED | Scarsità single-player: come riprodurre in single-player la pressione competitiva di Lords of Waterdeep (che nasce dagli avversari)? Cosa rende una quest degna del capitale umano? | UNRESOLVED | INTEGRATE | Domanda esplicita della conversazione, mai risposta; è il cuore del modello opportunità | transcript sezione economia | → OPEN-013 |
| E-39 | CONFLICT | Party misti Eroe+Villager in spedizione vs «divisorio netto forza lavoro ↔ forza avventuriera» (GAMEPLAY_DESIGN §2.3): la conversazione e il lab S1 usano già party misti | CURRENT | INTEGRATE | Divergenza vision-doc ↔ pratica corrente; non risolta in questa ingestion | transcript + GAMEPLAY_DESIGN §2.3 | → OPEN-013 contesto |
| E-40 | DECISION | Requisiti lab S1: route dev isolata, preset party distinti, RNG seedabile/esiti forzati, log esportabile, tassonomia eventi (`INFO_DISCOVERED`, `APPROACH_SELECTED`, `CHECK_RESOLVED`, `WOUND`, `DEATH`, `OBJECTIVE_PROGRESS`, `LOOT`, `RETREAT`, `QUEST_END`) | CURRENT | CONFIRM | Implementato in PLAN-019-S1 (`/quest-s1-lab`); le scelte di dettaglio vivono nella matrice `QUEST_S1_DESIGN.md` | transcript sezione S1 | confirms → PLAN-019-S1 |
| E-41 | INFERENCE | Regola di eliminazione dello scope: se rimuovendo un sistema la domanda primaria di S1 resta rispondibile, quel sistema non può bloccare il gate | CURRENT | REFINE | Coerente con «nn ci interessa che funzioni, deve essere divertente» (DECISION_LOG 2026-10-02); formulazione esplicita utile contro scope-creep | transcript sezione S1 | refines → PLAN-019-S1 criterio |
| E-42 | PROPOSAL | Estensioni preview: report stato leader (sopravvivenza/ferita/downtime), human-days mostrati direttamente senza conversione monetaria inventata, «WHY prima delle percentuali», propagazione morte/ferita fase-per-fase | CURRENT | CONFIRM-parziale | La simulazione fase-per-fase e la morte che riduce il party sono già in spec/implementazione R-082; report leader e human-days sono dettagli aggiuntivi non ratificati | transcript sezione preview | supports → OPEN-008, R-082 spec |
| E-43 | RESEARCH | Scenario esplorativo «La Torre nel Bosco»: vendor, check di percezione, approcci, infiltrazione | PLANNED | ARCHIVE | Terzo scenario discusso ma mai authored/implementato; materiale candidato per quest future | transcript sezione torre | evidence → futuri scenari |
| E-44 | DECISION | Il fallimento continua con un costo anziché fermare la progressione; il check fallito altera info/difficoltà/rischio/percorso/risorse | CURRENT | CONFIRM | Vigente come direzione (v24 rev.1 «conseguenze dei fallimenti sulla prosecuzione»; fail taxonomy P14 in QUEST_V6_REDESIGN) | transcript sezione fallimenti | confirms → PLAN-019 rev.1 |
| E-45 | RESEARCH | Darkest Dungeon come riferimento strutturale: ritirata = soft-fail (loot tenuto, mission reward persa, conseguenze), wipe = catastrofe (loot perso). Nota esplicita nella fonte: *«non voglio trasformare RpgBalancer in Darkest Dungeon»* | CURRENT | CONFIRM | Provenance della struttura fuga/wipe vigente (QUEST_RULES §5); il vincolo «non diventare DD» è un boundary di design candidato | transcript sezione rischio (ricerca DD/FTL/Sunless Sea/ItB) | confirms → QUEST_RULES §5; candidato GAMEPLAY_DESIGN |
| E-46 | RESEARCH | Incan Gold: il push-your-luck funziona con **trigger casuale a probabilità nascosta/grezza**, non con escalation deterministica — se «sala 3 è quasi suicida» in modo deterministico, «continui?» diventa aritmetica, non scommessa | CURRENT | INTEGRATE | Correzione di design esplicita nella fonte; dettaglio non catturato da QUEST_V6_REDESIGN (che usa escalation visibile) | transcript sezione push-your-luck | refines → QUEST_GAMEPLAY_SCIENCE (P18/P19); pertinente a v6 F7 |
| E-47 | RESEARCH | Wildermyth: le storie emergenti vendono (11k recensioni, 95% positive; Cultist Simulator 5,3k, 79%) MA se gli eventi procedurali diventano riconoscibili («scena X con testo Y cambiato») l'illusione si rompe — warning per la generazione | PLANNED | INTEGRATE | Evidence di mercato + warning per S5; supporta la proposta E-28 (separazione semantica dalla presentazione) | transcript sezione narrativa/mercato | supports → OPEN-014; refines → NARRATIVE.md |
| E-48 | RESEARCH | Mappa dei riferimenti usati nella conversazione: Lords of Waterdeep (gestionale: roster, assegnazione, scarsità), Cultist Simulator (scoperta progressiva/knowledge-driven), They Are Billions (pressione/crescita/perdita run), Frosthaven (valore persistente anche dopo abbandono), Darkest Dungeon (struttura ritirata), Sunless Sea/FTL/Into the Breach (ricerca push-your-luck), Incan Gold (push-your-luck canonico), Wildermyth (storie emergenti) | CURRENT | INTEGRATE | Indice dei riferimenti di design della conversazione; nessuno è «copia questo gioco» | transcript varie sezioni | evidence → DESIGN_PILLARS / QUEST_GAMEPLAY_SCIENCE |
| E-49 | CONSTRAINT | *«RpgBalancer non dovrebbe diventare un dungeon crawler classico»*: la spedizione è componente di un sistema di gestione più grande — il valore deriva da *chi* mandi, cosa lasci a casa, cosa rischi | PLANNED | INTEGRATE | Boundary di direzione esplicito nella fonte; coerente con E-20 ma non ratificato | transcript sezione riferimenti | → OPEN-013 contesto; candidato GAMEPLAY_DESIGN |

**Guard — non estratti:** le simulazioni numeriche dettagliate oltre il report
MC 200k sono evidence di esplorazione già coperta da E-13; i mock UI testuali
non quotati sono assorbiti da `quest_rovine_scenario_spec.md` (E-06). Nessun
contenuto «Cinghiale Nero» in questa fonte (correzione audit precedente
confermata sul transcript integrale).

## 3. New Knowledge

| ID | Classificazione | Statement | Importance | Proposed location |
|---|---|---|---|---|
| E-20 | PROPOSAL | Identità «LoW + XCOM» | alta (direzione) | GAMEPLAY_DESIGN dopo avallo; discussione in OPEN-013 |
| E-22 | PROPOSAL | 6 assi di tensione | media | QUEST_GAMEPLAY_SCIENCE (sezione authoring) |
| E-24 | RESEARCH | Euristica valore×conseguenza×incertezza×irreversibilità | media | QUEST_GAMEPLAY_SCIENCE |
| E-25 | RESEARCH | Tassonomia 9 famiglie di decisioni | media | QUEST_GAMEPLAY_SCIENCE |
| E-26 | PROPOSAL | 7 archetipi di rischio | media | candidato S5 / QUEST_GAMEPLAY_SCIENCE |
| E-28/E-29/E-30 | PROPOSAL | Architettura narrativa Situation→Context→Approach→Narrative→Presentation + vocabolari | media-alta | NARRATIVE.md §proposte; routing OPEN-014 |
| E-31 | CONSTRAINT | Riuso LoreDropService, no sistema lore parallelo | media | NARRATIVE.md nota operativa |
| E-35/E-36/E-37 | PROPOSAL | Difesa a ondate, categorie di potere, ruolo eroi | alta (livello villaggio) | OPEN-012 → VILLAGE_ECONOMY/GAMEPLAY_DESIGN dopo avallo |
| E-38 | UNRESOLVED | Scarsità single-player | alta | OPEN-013 |
| E-42 | PROPOSAL | Estensioni preview (leader report, human-days diretti) | media | quest_simulation_preview_spec / OPEN-008 |
| E-43 | RESEARCH | Scenario «La Torre nel Bosco» | bassa | archivio evidence, candidato quest futura |
| E-46 | RESEARCH | Trigger push-your-luck a probabilità nascosta | media | QUEST_GAMEPLAY_SCIENCE; pertinente a v6 F7 |
| E-47 | RESEARCH | Wildermyth: ripetibilità procedurale rompe l'illusione; evidence di mercato | media | NARRATIVE.md / OPEN-014 |
| E-48 | RESEARCH | Mappa riferimenti di design (LoW, CS, TAB, Frosthaven, DD, Incan Gold, Wildermyth…) | media | DESIGN_PILLARS candidato |
| E-49 | CONSTRAINT | «Non un dungeon crawler classico» | alta (direzione) | OPEN-013; candidato GAMEPLAY_DESIGN |

## 4. Confirmed Knowledge

E-19, E-21, E-23 (banda rischio), E-27, E-32, E-33, E-34 (già OPEN-005),
E-40, E-44 — vedi ledger. La parte iniziale della conversazione risulta essere
la **fonte originale** di molte decisioni già canonicalizzate il 2026-09-29 …
2026-10-02: il transcript è quindi anche provenance documentale per PLAN-018,
desiderata v24 e PLAN-019.

## 5. Refinements

- E-22/E-24/E-25: il vocabolario tensione/decisioni raffina
  `QUEST_GAMEPLAY_SCIENCE.md` come lessico di authoring (nessun principio P
  nuovo ratificato da questa fonte).
- E-32: livelli di dettaglio dell'informazione da esploratore — refinement
  operativo della regola vigente «esploratore rivela secondarie».
- E-41: formulazione esplicita della regola di eliminazione scope S1.
- E-42: «WHY prima delle percentuali» e human-days mostrati senza conversione
  monetaria — dettagli di contratto per future revisioni della spec preview.

## 6. Corrections

- **Provenance corretta:** il report precedente dichiarava «transcript grezzo
  non recuperabile». Ora il transcript integrale (200 messaggi) è persistito
  in `.mw/runs/20261005-transcript-quest-strategiche/transcript.md`. La
  copertura E-01..E-18 resta corretta (copriva la coda); questa ingestion la
  estende all'intera fonte.
- Nessuna correzione di contenuto rispetto a E-01..E-18: il transcript
  conferma che leader-capacity, human-days e opportunità erano proposte del
  tronco economico della conversazione (non isolate alla coda) — la
  classificazione PROPOSAL/OPEN-010 è confermata.

## 7. Decisions

Nessuna decisione nuova prodotta da questa ingestion. Il transcript mostra che
le decisioni canoniche del 2026-09-29 … 2026-10-03 (DECISION_LOG) hanno origine
in questa stessa conversazione — la provenance è documentata, non modificata.

## 8. Research

- Assi di tensione, tassonomia decisioni, archetipi di rischio, euristica di
  tensione (E-22..E-26): materiale di authoring, nessuna validazione.
- Scenario «La Torre nel Bosco» (E-43): esplorazione non authored.
- Riferimenti di design e ricerca nella fonte (E-45..E-48): Darkest Dungeon,
  Incan Gold, Wildermyth, Cultist Simulator, Frosthaven, Sunless Sea, FTL,
  Into the Breach — usati come precedenti, mai come «copia questo».

## 9. Rejected Approaches

Nessun approccio valutato-e-scartato nuovo rispetto a `context/REJECTED.md`.
Nel transcript compaiono idee poi effettivamente scartate o parcheggiate in
sessioni successive (es. noise meter → REJ-001; soglia ≥50% → REJ-002): il
transcript ne è la **provenance**, non una nuova voce.

## 10. Unresolved Questions

- E-35/E-36/E-37 → **OPEN-012** (nuovo): ratifica proposte difesa villaggio,
  categorie di potere, ruolo eroi/villager.
- E-38/E-39 → **OPEN-013** (nuovo): scarsità single-player e coerenza del
  modello party con `GAMEPLAY_DESIGN.md` §2.3.
- E-28/E-29/E-30 → **OPEN-014** (nuovo): architettura narrativa per situazioni
  (pertinente a S5 e ad art pipeline).
- E-42 → resta sotto OPEN-008 (nessuna nuova questione: dettagli di spec).

## 11. Conflicts

- **E-39 (nuovo):** «divisorio netto forza lavoro ↔ forza avventuriera»
  (`GAMEPLAY_DESIGN.md` §2.3) vs party misti Eroe+Villager usati nel lab S1 e
  nel modello economico della conversazione. Non risolto qui: `GAMEPLAY_DESIGN`
  è doc di visione e la pratica corrente è già mista — portato al Director via
  OPEN-013.
- **Confermato:** spec preview MC seeded vs contratto planner DP esatta →
  OPEN-008 (invariato rispetto a E-11).

## 12. Changes of Direction

Nessun cambio di direzione: il transcript è la *genes* della direzione
attuale, non una deviazione. La parte nuova (difesa villaggio, poteri,
narrativa per situazioni) estende lo scope a livello villaggio/S5 — nessun
impatto su S1 congelato.

## 13. Documentation Changes

- `context/OPEN.md` — aggiunte voci OPEN-012, OPEN-013, OPEN-014.
- `NARRATIVE.md` — §4: registrata proposta architettura narrativa + vincolo
  LoreDropService.
- `context/INDEX.md` — questo report registrato in L4; nota di provenance
  transcript aggiornata.
- `context/ingestions/2026-10-05-progettare-quest-strategiche.md` — nota di
  provenance aggiornata (transcript ora disponibile; questa ingestion estende).
- Nessuna modifica a desiderata/GAMEPLAY_DESIGN/CANON (gate Director).

## 14. Implementation Impact

- Nessun impatto implementativo nuovo: tutte le nuove voci sono PROPOSAL/
  RESEARCH/UNRESOLVED a livello villaggio, narrativa o S5.
- Se ratificate, le proposte E-35/E-36/E-37 richiederebbero estensioni a
  `idle_village_gameplay_math_spec.md` e `VILLAGE_ECONOMY.md`.
- La proposta E-28 (asset per situazione) avrebbe impatto su art pipeline
  (mockup/painter) solo se ratificata in S5.

## 15. Argomenti trattati

Intent Director LoW; identità LoW+XCOM; boundary «non dungeon crawler /
non Darkest Dungeon»; mappa riferimenti (LoW, Cultist Simulator, They Are
Billions, Frosthaven, Darkest Dungeon, Sunless Sea, FTL, Into the Breach,
Incan Gold, Wildermyth); push-your-luck a trigger nascosto; evidence di
mercato e warning Wildermyth; loop spedizione; assi di tensione;
gradazione rischio; euristica valore×conseguenza×incertezza×irreversibilità;
tassonomia decisioni (9 famiglie); 7 archetipi di rischio; loop cognitivo
target; architettura narrativa Situation→Context→Approach→Narrative→
Presentation; vocabolario situazioni/contesti; scouting-informazione; check
multi-stat; Trial by Fire; difesa villaggio a ondate; categorie di potere;
eroi vs villager; scarsità single-player; lab S1 e regola di eliminazione;
estensioni preview; scenario «La Torre nel Bosco»; fallimento-con-costo.

## 16. Problemi risolti

- «Come rendere le quest divertenti da sole» → risposta emersa nella
  conversazione e poi ratificata come direzione: quest = spedizione con
  scelte, non catena di check (v24, PLAN-019).
- «Perché il transcript mancava» → recuperato integralmente; provenance L4
  ora completa.

## 17. Ripresa della conversazione

Stato: **fonte completamente ingerita**. Le proposte non ratificate vivono in
OPEN-005, OPEN-008, OPEN-010, OPEN-012, OPEN-013, OPEN-014. Prossimi passi
attesi (non di questa ingestion): avallo Director sulle famiglie di proposte
villaggio/difesa/narrativa; eventuale integrazione del vocabolario di
tensione in `QUEST_GAMEPLAY_SCIENCE.md`.
