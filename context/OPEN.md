---
title: Open Questions Registry
type: registry
updated: 2026-10-10
---

# OPEN — Unresolved Questions Registry

Risponde alla domanda: **«quali questioni sono realmente ancora aperte?»**

Questo file è un *registry/router*: ogni voce punta alla fonte che contiene il
reasoning completo — non lo duplica. Non ogni TODO o nota è una questione
aperta: entra qui solo ciò che richiede una decisione o una validazione non
ancora avvenuta.

Formato voce:

- ID — `OPEN-*`
- Question
- Status — `open` | `open-in-lab` | `conflict`
- Context — perché è aperta
- Source — dove vive il reasoning completo
- Blocking — cosa blocca / cosa non blocca
- Related plan / decision

---

## OPEN-001 — Rimappatura PLAN-018 sul modello vittoria rev.2

- **Question:** il calcolo implementato in PLAN-018 usa la soglia ≥50% dei check;
  la desiderata v24 rev.2 lega la reward a una prova-obiettivo + leader vivo.
  Come si rimappa il resolver/planner sul nuovo modello?
- **Status:** `conflict` (divergenza design↔implementazione dichiarata, non
  risolta — audit C7)
- **Context:** rev.2 dice esplicitamente che PLAN-018 *non* viene modificato
  automaticamente: la rimappatura è prevista dopo S1.
- **Source:** `plans/PLAN-018-mission-planner.md`; `.mw/desiderata.md` v24
  rev.2; `KNOWLEDGE_AUDIT.md` C7; `plans/PLAN-019-quest-macro-plan.md` D-8.
- **Blocking:** S2 (il runtime si adegua lì); non blocca il lab S1.
- **Related:** PLAN-018, PLAN-019; `QUEST_RULES.md` §Vittoria.

## OPEN-002 — Motore quest canonico (D-2)

- **Question:** quale motore quest diventa canonico?
- **Status:** `open`
- **Context:** deciso che l'evidenza arriva da uno **spike** come primo step di
  S2. Criteri: grafo di nodi con scelte e informazione, percorso variabile
  (denominatore dinamico della vittoria), conseguenze persistenti, costo di
  migrazione dei consumer esistenti.
- **Source:** `plans/PLAN-019-quest-macro-plan.md` tabella decisioni D-2.
- **Blocking:** tutto il resto di S2.
- **Related:** PLAN-019 (S2), PLAN-018.

## OPEN-003 — Mappatura competenze → stat del balancer (D-3)

- **Question:** come si derivano le competenze di quest non di combattimento
  (Intelligenza, Carisma, …) dalle stat del balancer senza toccarlo? Alcune
  non hanno candidato ovvio.
- **Status:** `open`
- **Context:** decisa la *direzione* (opzione C: derive, non modificare il
  balancer); aperta la mappatura completa. Regola: se una competenza non è
  derivabile, l'AI la porta al Director come scelta esplicita, non come rinvio.
- **Source:** `context/DECISION_LOG.md` 2026-10-01;
  `.mw/desiderata.md` v24 rev.1 punti 12–13; PLAN-019 D-3.
- **Blocking:** ingresso di S2; S1 può usare mock.
- **Related:** PLAN-019 (S2).

## OPEN-004 — Collocazione di Gate B / playtest esterno (D-5)

- **Question:** in quale stadio rientra il playtest con persone esterne?
- **Status:** `open`
- **Context:** S1 termina a Gate A (giudizio del Director); il playtest esterno
  non è eliminato ma non appartiene a S1 (*«posso mandare al max un video»*).
- **Source:** `.mw/desiderata.md` v24 rev.1 punto 4; PLAN-019 D-5.
- **Blocking:** niente fino al battesimo di PLAN-019-S4.
- **Related:** PLAN-019 (S4).

## OPEN-005 — Collocazione di Trial by Fire (D-6)

- **Question:** Trial by Fire va in S2 (conseguenza persistente), S4 o S5?
- **Status:** `open`
- **Source:** `plans/PLAN-019-quest-macro-plan.md` D-6.
- **Blocking:** battesimo di PLAN-019-S2.
- **Related:** PLAN-019 (S2/S4/S5).

## OPEN-006 — Calibrazione death save

- **Question:** il death save (5% su esito morte → sopravvive ferito) è un mock:
  il valore va calibrato al Gate.
- **Status:** `open-in-lab`
- **Source:** `context/QUEST_S1_DESIGN.md`;
  `context/DECISION_LOG.md` 2026-10-02 (matrice chiusa, death save 5%).
- **Blocking:** valutazione al Gate A di S1.
- **Related:** PLAN-019-S1.

## OPEN-007 — Quantità e cumulo dei modificatori critici

- **Question:** quantità dei modificatori `bigwin`/`epicfail` alle chance
  ferita/morte e ordine di cumulo con il −5pp di `win`.
- **Status:** `open-in-lab` — mock iniziali in `context/QUEST_S1_DESIGN.md`
  (`bigwin` = −5pp cumulati + downgrade morte→ferita; `epicfail` = upgrade
  ferita→morte), da bilanciare nel playtest.
- **Source:** `.mw/desiderata.md` v24 rev.2 «still unresolved»;
  `context/QUEST_S1_DESIGN.md`.
- **Blocking:** calibrazione nel lab S1; formalizzazione check-contract in S2.
- **Related:** PLAN-019-S1; DECISION_LOG 2026-10-03 (epicfail in banda).

## OPEN-008 — Precisione della preview compound (MC vs DP esatta)

- **Question:** per la preview della % di riuscita «dalla partenza» si usa
  Monte Carlo, programmazione dinamica esatta, o ibrido? La politica d'uso dei
  consumabili e le diramazioni future sono ignote → nessun numero esatto
  inventato dove manca il modello.
- **Status:** `open`
- **Context:** rev.2 chiede preview compound; R-082 ha implementato preview
  per-check analitica + MC seeded per la quest; la tensione MC vs DP esatta
  resta aperta.
- **Source:** `.mw/desiderata.md` v24 rev.2;
  `src/docs/docs/idle_village/quest_simulation_preview_spec.md`; R-082;
  `context/DECISION_LOG.md` 2026-09-29 (DP esatta come contratto primario).
- **Blocking:** contratto preview di S2/S3.
- **Related:** PLAN-019 (S3), PLAN-018.

## OPEN-009 — Danni extra durante la fuga

- **Question:** la fuga può infliggere danni extra? *«da decidere/bilanciare
  in un secondo momento»*.
- **Status:** `open`
- **Source:** `.mw/desiderata.md` v24 rev.1 punto 11.
- **Blocking:** bilanciamento; non blocca S1.
- **Related:** PLAN-019.

## OPEN-010 — Ratifica delle proposte economia-villaggio

- **Question:** le proposte emerse dalla conversazione «Progettare quest
  strategiche» — regola leader-capacity (capacità di spedizione limitata da
  stato del leader e pool di umani, non da cooldown), economia human-days,
  quest come opportunità 8–10/mese vs 4–5 fattibili — sono solo PROPOSAL:
  vanno ratificate in desiderata/GAMEPLAY_DESIGN?
- **Status:** `open` — in lavorazione: il Director le ha raccolte in
  `VILLAGE_ECONOMY.md` (DRAFT, «bozza di piano da migliorare», 2026-10-05);
  la ratifica resta pendente.
- **Source:** `RICHIESTE.md` R-083;
  `context/QUEST_ECONOMY_NOTES.md` (copia tracciata delle note;
  originali + provenance in `.mw/runs/20261004-rovine-preview-chatgpt/`);
  `context/ingestions/2026-10-05-progettare-quest-strategiche.md`.
- **Blocking:** candidati a livello villaggio (S4 / GAMEPLAY_DESIGN) — dietro
  avallo Director.
- **Related:** PLAN-019 (S4), GAMEPLAY_DESIGN.

## OPEN-011 — Domande legacy del log decisioni (Aug 2026)

- **Question:** Q1 roster: scroll infinito o paginazione? Q2 token droppato
  fuori: animazione o snap? Q3 quanti scenari test sono «esaustivi»?
- **Status:** `open` (mai esplicitamente chiuse nel log; possibilmente stale —
  verificare prima di agire)
- **Source:** `context/DECISION_LOG.md` sezione «Open Questions» Q1–Q3.
- **Blocking:** nessuna nota; pre-S1.
- **Related:** Decision 007/008 era.

## OPEN-012 — Ratifica proposte difesa villaggio e categorie di potere

- **Question:** le proposte emerse dalla conversazione «Progettare quest
  strategiche» — difesa del villaggio a ondate (checkpoint che competono con
  le spedizioni per umani/equip/tempo), categorie di potere (Hero /
  Expedition / Defence / Unlock / Information), eroi come moltiplicatori
  persistenti che non sostituiscono i villager — sono solo PROPOSAL: vanno
  ratificate in desiderata/GAMEPLAY_DESIGN?
- **Status:** `open`
- **Source:** `context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md`
  E-35/E-36/E-37; transcript `.mw/runs/20261005-transcript-quest-strategiche/`.
- **Blocking:** candidati a livello villaggio (S4 / GAMEPLAY_DESIGN) — dietro
  avallo Director.
- **Related:** OPEN-010 (stessa famiglia villaggio), PLAN-019 (S4).

## OPEN-013 — Scarsità single-player e modello del party

- **Question:** come si riproduce in single-player la pressione competitiva
  di Lords of Waterdeep (che nasce dagli avversari)? Cosa rende una quest
  degna di rischiare capitale umano scarso? Inoltre: il «divisorio netto
  forza lavoro ↔ forza avventuriera» di `GAMEPLAY_DESIGN.md` §2.3 resta
  canonico, o è superato dai party misti Eroe+Villager già usati nel lab S1?
- **Status:** `open` — tensione doc↔pratica dichiarata (E-39).
- **Source:** `context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md`
  E-38/E-39; `GAMEPLAY_DESIGN.md` §2.3.
- **Blocking:** design del loop opportunità villaggio (connesso a OPEN-010);
  non blocca S1.
- **Related:** OPEN-010, OPEN-012; PLAN-019 (S4).

## OPEN-014 — Architettura narrativa per situazioni

- **Question:** adottare il modello `Situation → Context → Approach →
  Narrative → Presentation` (asset per situazione, non per combinazione di
  stat; vocabolario situazioni/contesti; semi narrativi su
  `LoreDropService` esistente)?
- **Status:** `open` — pertinente a S5 (generazione) e art pipeline; nessun
  impatto prima di S4.
- **Source:** `context/ingestions/2026-10-05-progettare-quest-strategiche-transcript-completo.md`
  E-28/E-29/E-30/E-31; `context/ingestions/2026-10-06-quest-cross-direct.md`
  E-01/E-03/E-07/E-08 (primitive dei beat, generatore a vincoli in 3 passi —
  segmento a monte di E-28 —, requisito varietà/volume Director, flavor via
  tag); `NARRATIVE.md` §4.
- **Blocking:** nessuno nel breve; candidato per la «definizione di buona
  quest» (artefatto finale PLAN-019).
- **Related:** PLAN-019 (S5), NARRATIVE.md, `context/QUEST_GENERATION_SPEC.md`
  (specchietto riassuntivo — lo schema a strati compone con le primitive dei
  beat: rotta separata ma stessa architettura a 4 livelli).

## OPEN-015 — Mancata risoluzione e conseguenze di ogni quest

- **Question:** che cosa significa «non risolta» e quale evento fa scattare le conseguenze di una quest che il giocatore non completa?
- **Status:** `open` — il principio universale è espresso dal Director, il trigger e le forme delle conseguenze restano da precisare.
- **Context:** R-092 include quest risolte, modalità della risoluzione e quest non risolte; le regole esistenti coprono soprattutto esiti della spedizione e persistenza prevista in S2.
- **Source:** `RICHIESTE.md` R-092 (verbatim); `QUEST_RULES.md` §8; `.mw/desiderata.md` v24 S1–S4.
- **Blocking:** definizione del comportamento delle quest lasciate aperte; non blocca il lab S1.
- **Related:** PLAN-019 (S2/S4/S5), NARRATIVE.md.

## OPEN-016 — Registro mondo, memoria narrativa e sequenza del macro-piano

- **Question:** quale porzione del mondo persistente serve per rendere leggibili le conseguenze delle quest e quando introdurre evoluzione di personaggi, fazioni/regioni, pattern narrativi e legacy cross-run rispetto a PLAN-019 S1–S5?
- **Status:** `open` — il Director ha chiesto di acquisire e discutere lo share, non ha approvato il macro-piano finale di ChatGPT.
- **Context:** tratti che generano scene e hook che generano quest, NPC ricorrenti, world pressures, provenance/riconoscimento e mondi attraverso più run sono intenti o proposte con livelli diversi di certezza. Il programma AI «Foundation → simulazione → storia → legacy» potrebbe anticipare S5, che la desiderata v24 colloca dopo S4; evitare sostituzione silenziosa.
- **Source:** `context/ingestions/2026-10-07-registro-narrativo-del-mondo.md` E-02..E-18; `NARRATIVE.md` §4; `RICHIESTE.md` R-093.
- **Blocking:** ratifica di un eventuale nuovo macro-piano e design di simulazione mondiale; non blocca S1. Il trigger delle quest non risolte resta OPEN-015.
- **Narrowing Director (2026-10-07):** la fetta di registro mondo in S2 è minima — basta a rendere persistenti e leggibili le conseguenze della *singola* quest di riferimento; personaggi/fazioni che ritornano tra quest diverse non sono requisito di S2.
- **Related:** `.mw/desiderata.md` v24, PLAN-019 (S2/S4/S5), OPEN-014/015, `VILLAGE_ECONOMY.md`.

## OPEN-017 — Binding degli approcci alternativi ai check della core gimmick

- **Question:** la proposta R-127 — una core gimmick (es. infiltrazione/allarme) che ammette canali di check su stat/skill alternative (invisibilità→INT, camuffamento→CHA invece di DEX) — lascia aperto il **modello di binding**: il canale si sceglie per-check in-run, è un approccio scelto a monte per l'intera run, o è gated da skill/equip/composizione del party (invisibilità richiede un caster)? Sub-questioni: come si marca un check come «core-gimmick» vs check di scena; forma dati (vocabolario stat alternativo sul nodo vs nodi check paralleli gated da flag); come i canali disponibili si rendono leggibili in preview (regola numeri-esatti R-108).
- **Status:** `risolta` 2026-10-11 — Director delega («fai cm reputi meglio», R-134) → adottato il binding research-backed.
- **Resolution (vigente, reversibile al playtest):** lock di approccio a run-level, capability-gated dal party, eccezioni a consumo (~1/run); roll per membro nominato; max 3 canali/check, menu solo sui pivot check; canali bloccati greyed «Requires: …»; varianti di canale sullo stesso nodo (no node-splitting); profili di fallimento divergenti obbligatori. Regola: `QUEST_RULES.md` §7 `vigente`. Prototipo: PLAN-028.
- **Residui delegati a PLAN-028:** mappatura capability gate su skill/equip reali (v10/v12), modello di esposizione wound/death per canale, coverage audit «Karma Police» sul quest set.
- **Source:** `context/ingestions/2026-10-10-quest-gimmick-approcci-alternativi.md`; `RICHIESTE.md` R-127/R-128/R-134; `QUEST_RULES.md` §7; `context/QUEST_GENERATION_ARCHITECTURE.md` §16; `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md`.
- **Blocking:** risolta — non blocca più il contratto `CoreGimmick` (S5): il modello è deciso, i dettagli contract sono in §11.9.
- **Related:** OPEN-014 (architettura generazione), OPEN-018 (tensione preview/espressività), `QUEST_GENERATION_CONTRACTS.md` §2/§3.3/§11, desiderata v10/v12 (skill equip come possibile gate).

## OPEN-018 — Tensione preview a numeri esatti vs scelta espressiva dei canali

- **Question:** la ricerca R-128 (finding F8, divergenza D3) segnala che preview a numeri esatti — regola **frozen** R-108 — possono spingere il giocatore verso ottimizzazione EV invece che scelta espressiva d'identità («sono un mago, lancio invisibilità»). La regola è frozen e non si tocca: la domanda aperta è se le mitigazioni adottate bastano, o se in playtest emerge che il problema è reale.
- **Mitigazioni adottate (R-134, per delega):** risk tag semantici + stakes narrative accanto alle odds; menu multi-canale solo sui pivot check; differenziazione dei canali su assi non-EV (costo/rischio/fiction) così nessun canale è «ovviamente migliore».
- **Status:** `open` — da verificare al playtest del prototipo PLAN-028. Metrica indicatrice: i playtester scelgono il canale «per identità/piano» o dichiarano «ho preso la percentuale più alta»?
- **Source:** `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md` §F8/§D3; R-134.
- **Related:** OPEN-017 (risolta), R-108 (frozen), `QUEST_RULES.md` §7.

## OPEN-019 — Modello del grafo delle opportunità

- **Question:** come si modella il layer sopra le quest — un grafo in cui
  opportunità, requisiti, ricompense e capacità si collegano? Più
  percorsi convergono sulla stessa opportunità e una quest apre porte
  diverse; il grafo rappresenta relazioni di sblocco persistenti, non
  solo successione temporale.
- **Progress 2026-10-11 (ricerca R-154 + decisioni Director):** adottate
  nella proposta — (a) **visibilità parziale** del grafo (nodi
  persistenti e porte note visibili, quest non sbloccate nascoste);
  (d) **transizione mid-run tra famiglie** ammessa sullo stesso
  ScenarioInstance.
- **RATIFICATO 2026-10-12 (Director):** (b) modello dati **ibrido** —
  qualities piatte (`access:`/`intel:`/`contact:`/`clock:`) + offer
  generator transitorio, più pochi nodi authored per milestone/
  obiettivi strategici visibili; (c) tipi di arco = **set aperto
  config-first** (enum estendibile; v0: sblocco/informazione/
  preparazione + clocks come nodi di stato). Regole candidate ancora
  proposal: ≥2 ingressi per nodo critico, path-dependent modifiers.
  Restano aperte: persistenza degli archi tra run, traversal del
  generatore, definizione dei clocks.
- **Status:** `open` — core model ratificato; dettaglio in
  `context/QUEST_OPPORTUNITY_LAYER.md` §1-§2 e
  `.mw/runs/20261011-opportunity-layer-research/report-t1.md`,
  `report-t2.md`. Sub-questioni residue: struttura dati e tipi di
  arco (sblocco/informazione/preparazione); come gli archi persistenti
  vivono nel save; come il generatore delle offerte lo attraversa;
  rapporto «famiglia di quest» ↔ (domain kit, core gimmick); relazione
  con gli archi narrativi delle chain quest.
- **Source:** `context/QUEST_OPPORTUNITY_LAYER.md` §1–§2;
  `context/ingestions/2026-10-11-quest-opportunity-layer.md` E-05..E-07,
  E-11, E-15, E-22; R-153; R-154 (ricerca + decisioni).
- **Blocking:** qualsiasi contratto del generatore di offerte e del
  perimetro di test meta-quest; non blocca i lavori dentro la singola
  quest (PLAN-028, S5).
- **Related:** OPEN-014 (architettura generazione), OPEN-016 (persistenza
  narrativa), OPEN-010/012/013 (economia villaggio), PLAN-026.

## OPEN-020 — Tassonomia requisiti e preparazione insufficiente

- **Question:** la tassonomia a 4 tipi — accesso assoluto / capacità /
  costo-o-rischio / ottimizzazione — va ratificata? Regole annesse: gate
  assoluti solo per impossibilità effettive (un equip mancante può essere
  costruito/noleggiato/ottenuto se il mondo offre l'alternativa);
  preparazione insufficiente in 3 casi (impossibile / compensabile a
  costo / tentabile a rischio). Quali requisiti sono generici, quali di
  famiglia, quali di singola quest, e come si dichiara il tipo nel
  contratto?
- **RATIFICATO 2026-10-11/12 (Director):** **stato del gate calcolato
  sulla offer card** a 4 stati (`Locked` con via di sblocco nominata /
  `Underprepared` con banda di rischio, mancanza e prezzo / `Ready` /
  `Over-qualified`) con qualità dello scout report dipendente dal
  party/esploratore.
- **NON ratificata 2026-10-12 (scelta Director):** la tassonomia a 4
  tipi resta **proposal** — si valida col prototipo meta-layer prima
  della ratifica. Candidati dalla ricerca: prezzo underprepared
  proporzionale al gap, bande calibrate su esiti simulati, requisiti
  come capability tag `requires/provides` con match a runtime.
- **Status:** `open` — `proposta` registrata in `QUEST_RULES.md` §9;
  dettaglio in `context/QUEST_OPPORTUNITY_LAYER.md` §3;
  `.mw/runs/20261011-opportunity-layer-research/report-t3.md`.
- **Source:** `context/ingestions/2026-10-11-quest-opportunity-layer.md`
  E-08, E-21; R-153; R-154.
- **Blocking:** modello requisiti del generatore di offerte (OPEN-019) e
  del contratto scena; non blocca il runtime attuale.
- **Related:** OPEN-019; R-108 (numeri esatti in preview — il giocatore
  deve sapere a cosa va incontro prima di rischiare).

## OPEN-021 — Orientamento esploratore e risorsa informativa trasversale

- **Question:** due proposte legate all'esploratore: (a) il giocatore può
  **orientare** la generazione delle offerte verso famiglie/tag
  preferiti — influenza la distribuzione senza garantirla; (b) esiste
  una **risorsa trasversale limitata** legata a informazione/preparazione
  operativa (evitare valute per-famiglia). Qual è il meccanismo di
  pesatura e la forma economica? Come si collega alle tre dimensioni di
  crescita del villaggio (visibilità / capacità / capacità operativa)?
- **RATIFICATO 2026-10-11/12 (Director):** (a) scout-quality sulla
  offer card **dipendente da party/esploratore** (banda larga con poco
  intel); (b) **flashback-style prep** come capacità di alto tier entro
  vincoli dichiarati; (c) **steering = bias di peso dichiarato e
  visibile**, mai filtro; (d) **niente valuta "intel"** — qualità info
  solo dalla qualità dell'esploratore/party; (e) capacità parallela =
  **solo leader-capacity** (un party = un leader; gli edifici
  supportano, non concedono spedizioni).
- **Conseguenza:** la mitigazione «numeri esatti come acquisto intel»
  per OPEN-018 non è più disponibile — OPEN-018 resta da verificare al
  playtest PLAN-028.
- **Status:** `open` — estende la regola vigente `QUEST_RULES.md` §2
  (esploratore rivela info) senza modificarla; PROPOSAL.
- **Source:** `context/QUEST_OPPORTUNITY_LAYER.md` §5/§6/§8/§9;
  `context/ingestions/2026-10-11-quest-opportunity-layer.md` E-10,
  E-17, E-19; R-153; R-154
  (`.mw/runs/20261011-opportunity-layer-research/report-t5.md`).
- **Blocking:** filone economia-villaggio (OPEN-010/012/013) e generatore
  di offerte (OPEN-019); non blocca il runtime attuale.
- **Related:** OPEN-010 (leader-capacity, human-days — tensione con
  «più party in parallelo»), OPEN-019, OPEN-020.

## OPEN-022 — Sistema macro di ricompense e requisiti (ciclo di campagna)

- **Question:** come si completa il sistema generale delle ricompense e
  dei requisiti delineato dalla discussione sul ciclo macro della
  campagna (invasione goblin come esempio)? Sub-questioni: (a) sottotipi
  delle quattro famiglie di ricompense (capacità per le quest / economia
  e risorse / potenziamenti combattivi del party / difese del villaggio);
  (b) rappresentazione dei requisiti, comprese le **skill a livelli di
  applicazione** (una capacità nota che si estende a nuove situazioni);
  (c) crescita di requisiti e valore tra i livelli delle quest senza
  rendere obsolete le scelte precedenti; (d) modello di valutazione delle
  ricompense che pesi **tempo, rischio, disponibilità e stato della
  campagna** — non solo valore nominale.
- **Status:** `open` — direzioni chiarite in conversazione 2026-10-16,
  tutte PROPOSAL; nessun numero di bilanciamento definito.
- **Source:** `context/QUEST_CAMPAIGN_MACRO.md` (§1–§6); R-209.
- **Blocking:** qualsiasi ratifica del ciclo macro di campagna e del
  sistema ricompense/requisiti; non blocca il runtime attuale né i lavori
  dentro la singola quest.
- **Related:** OPEN-012 (difesa villaggio a ondate, stessa famiglia);
  OPEN-019/020/021 (grafo opportunità, tassonomia requisiti, esploratore —
  le due tassonomie ricompense vanno composte, MACRO §7); OPEN-010
  (economia villaggio); `QUEST_RULES.md` §7 (canali — la skill a livelli
  si appoggia al meccanismo vigente).
