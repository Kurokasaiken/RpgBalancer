---
title: Open Questions Registry
type: registry
updated: 2026-10-05
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
