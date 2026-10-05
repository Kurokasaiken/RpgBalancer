---
title: Rejected Approaches Registry
type: registry
updated: 2026-10-05
---

# REJECTED — Negative Knowledge Registry

Risponde alla domanda: **«cosa abbiamo già valutato e deciso di NON fare?»**

Una voce qui NON è una regola attiva e NON è storico-archivio: è una scelta
valutata e scartata, con la ragione, in modo che non venga riproposta per
ignoranza. Un'idea solo *menzionata* non va qui — va qui solo ciò che è stato
valutato e rifiutato con un motivo (vedi `knowledge-extractor` §10).

Formato voce:

- ID — `REJ-*`
- Rejected approach / idea
- Why rejected
- Status — `rejected` | `parked` | `superseded`
- Reopen-if — condizione che potrebbe riaprire la valutazione
- Source / provenance
- Related decision

---

## REJ-001 — Noise meter come pressione generica di quest

- **Rejected approach / idea:** un meter di «rumore» accumulato che aumenta la
  pressione nel prototipo base/generico di quest.
- **Why rejected:** il Director lo ha parcheggiato — *«il noise nn deve esserci
  nel prototipo base/generico, è una idea interessante x applicazioni future»*.
  È valido solo per tipologie dominio-specifiche (es. stealth).
- **Status:** `parked`
- **Reopen-if:** una quest stealth (o altra tipologia dominio-specifica) viene
  progettata, o il Director decide esplicitamente di reintrodurlo.
- **Source / provenance:** `context/DECISION_LOG.md` 2026-10-03;
  `context/QUEST_GAMEPLAY_SCIENCE.md` (sezione stealth dominio-specifica).
- **Related decision:** risk-band / epicfail (DECISION_LOG 2026-10-03, punto 2).
- **Nota operativa:** il meter `RUMORE ◉○○` è stato rimosso dal codice lab il
  2026-10-03 (commit `f7a55a73`), sostituito dagli stati nominati
  `campoAllertato`/`campoSveglio` — `SESSION_HANDOFF.md` 2026-10-03 sera.

## REJ-002 — Soglia ≥50% come condizione di vittoria della quest

- **Rejected approach / idea:** «la quest è vinta se ≥50% degli skill check
  affrontati è superato» come condizione che assegna la reward di quest.
- **Why rejected:** desiderata v24 rev.2 (approvata *«approvo»* 2026-10-02)
  sostituisce la soglia con una **prova-obiettivo precisa** + leader vivo al
  ritorno. Il conteggio dei check resta solo una statistica descrittiva della
  run.
- **Status:** `superseded`
- **Reopen-if:** il Director ridefinisce la condizione di vittoria; la
  divergenza con il calcolo a soglia di PLAN-018 è tracciata in
  `context/OPEN.md` (OPEN-001).
- **Source / provenance:** `.mw/desiderata.md` v24 rev.2;
  `context/DECISION_LOG.md` 2026-10-01 (D-8) e nota «Superata 2026-10-02»;
  `plans/PLAN-019-quest-macro-plan.md` tabella D-8.
- **Related decision:** modello obiettivo/reward (DECISION_LOG 2026-10-02).

## REJ-003 — Lettura «spedizione goblin» della struttura S1

- **Rejected approach / idea:** l'interpretazione AI che leggeva la quest di
  riferimento S1 come «spedizione goblin».
- **Why rejected:** sostituita dalla struttura dettata dal Director in v24
  rev.1 (viaggio → scelta approccio → evento → scoperta → evento/reward →
  obiettivo → ritorno); la quest di riferimento è «La cassa delle sementi».
- **Status:** `superseded`
- **Reopen-if:** mai, come lettura di S1 — la struttura Director è FROZEN.
- **Source / provenance:** `.mw/desiderata.md` v24 rev.1 punto 1;
  `plans/PLAN-019-S1-quest-interessante.md`.
- **Related decision:** struttura S1–S5 e quest di riferimento (v24).

## REJ-004 — PLAN-MOCKUP-TO-COMPONENT v1

- **Rejected approach / idea:** piano v1 per il workflow mockup→componente.
- **Why rejected:** bocciato dalla delibera multi-AI (6 punti blocking,
  sintesi in `.mw/runs/explore-mockup-to-component/SYNTHESIS.md`).
- **Status:** `superseded` (da v3)
- **Reopen-if:** n/a — la storia è chiusa da v3 battezzato.
- **Source / provenance:** `plans/PLAN-MOCKUP-TO-COMPONENT-v1.md`;
  `.mw/runs/explore-mockup-to-component/SYNTHESIS.md`.
- **Related decision:** `plans/PLAN-MOCKUP-TO-COMPONENT-v3.md`.

## REJ-005 — PLAN-MOCKUP-TO-COMPONENT v2

- **Rejected approach / idea:** piano v2 (CSS/React-first, 2 ingressi,
  whitelist licenze).
- **Why rejected:** cold read avversariale → verdetto NO, 5 blocking,
  7 correzioni richieste (`.mw/runs/coldread-mockup-v2/SYNTHESIS.md`).
- **Status:** `superseded` (da v3)
- **Reopen-if:** n/a.
- **Source / provenance:** `plans/PLAN-MOCKUP-TO-COMPONENT-v2.md`;
  `.mw/runs/coldread-mockup-v2/SYNTHESIS.md`.
- **Related decision:** `plans/PLAN-MOCKUP-TO-COMPONENT-v3.md`.

## REJ-006 — Aggregazione Poisson-binomiale per il rischio di spedizione

- **Rejected approach / idea:** calcolare la probabilità di superamento fasi
  come Poisson-binomiale su probabilità fisse per membro.
- **Why rejected:** i caduti smettono di contribuire alle fasi successive
  (decisione Director «solo morto», 2026-09-29): la probabilità della fase k
  dipende da chi è sopravvissuto alle fasi 1..k−1, quindi serve una
  **programmazione dinamica esatta sull'insieme dei vivi** (2^m × n), non
  probabilità fisse.
- **Status:** `rejected`
- **Reopen-if:** solo se il modello «i caduti non contribuiscono» venisse
  revocato.
- **Source / provenance:** `context/DECISION_LOG.md` 2026-09-29 (punto 2);
  `plans/PLAN-018-mission-planner.md`.
- **Related decision:** modello di rischio per-fase per-residente
  (DECISION_LOG 2026-09-29).
