---
title: Knowledge Refactor — Final Health Report (R-085)
type: report
date: 2026-10-05
related: KNOWLEDGE_AUDIT.md (fase 1 audit), RICHIESTE.md R-084/R-085, desiderata v25
---

# Knowledge Refactor — Final Health Report

Seconda tranche del refactor documentale (spec a 40 sezioni, R-085), eseguita
sulla base di R-084 + migrazione audit v25. Refactor, non riscrittura:
le regole di gioco non sono state modificate.

## A. Executive Summary

**Prima:** fonti citate dai doc canonici (QUEST_RULES, OPEN, CURRENT_STATE)
vivevano in `.mw/runs/` gitignored — provenance irraggiungibile su clone;
MASTER_PLAN si autodichiarava SSOT della roadmap pur essendo fermo a dic 2025;
GAMEPLAY_DESIGN presentava come correnti il modello spaziale Dispatch e
l'estetica Gilded Observatory (entrambi superati); la regola consumabili
ratificata non era compilata in QUEST_RULES; il glossario ignorava tutto il
vocabolario quest; nessun contratto documentation-impact per i piani.

**Ora:** ogni fonte citata da un doc canonico ha una copia tracciata; le
autorità concorrenti residue sono marcate; i doc di visione dichiarano il
loro perimetro e le sezioni superate; il glossario stabilizza il vocabolario
vigente e marca le proposte; i piani hanno un contratto di impatto
documentale (rule 85); README espone un router L0.

## B. Canonical Authority Map

| Dominio | Canonico | Supporting | Historical | Autorità irrisolta |
|---|---|---|---|---|
| Mappa autorità | `CANON.md` | `AGENTS.md` | — | — |
| Regole quest | `QUEST_RULES.md` | `context/QUEST_S1_DESIGN.md`, `QUEST_GAMEPLAY_SCIENCE.md` | desiderata v23–v24 (intento) | divergenza PLAN-018↔v24rev.2 (OPEN-001) |
| Design knowledge quest | `context/QUEST_S1_DESIGN.md`, `QUEST_V6_REDESIGN.md` (prop.), `QUEST_ECONOMY_NOTES.md` (prop.) | `QUEST_GAMEPLAY_SCIENCE.md` (research) | `.mw/runs/*` originali | proposte non ratificate (OPEN-010) |
| Gameplay visione/loop | `GAMEPLAY_DESIGN.md` (REFERENCE; §1 parz. superseded) | `DESIGN_PILLARS.md` | — | doc regole generali non-quest assente |
| Economia/matematica villaggio | `idle_village_gameplay_math_spec.md` | `QUEST_ECONOMY_NOTES.md` (prop.) | — | modello human-days non ratificato |
| Skill check / failure | `QUEST_RULES.md` §3–5; `skill_check_workflow_spec.md`, `quest_failure_and_recovery_spec.md` | Astrolabe docs | — | check-contract spec rimandata a S2 |
| UI/UX e componenti | `COMPONENT_MASTER_INDEX.md` | `*_trusted.md` | — | — |
| Architettura | `src/docs/docs/architecture_state.md` (router) | `ARCHITECTURE.md` (reference) | `ARCHITECTURE_BIBLE`, `ARCHITECTURE_REFERENCE` (superseded) | — |
| Stato implementazione | `CURRENT_STATE.md` | `SESSION_HANDOFF.md` (journal), sync rule 70 | `HANDOFF.md`, `CHANGELOG.md`, `VERTICAL_SLICE_PROGRESS.md` (historical) | — |
| Piani | `plans/INDEX.md` | `VERTICAL_SLICE_ROADMAP.md` (slice scope) | `ROADMAP.md`, `MASTER_PLAN.md` (superseded) | — |
| Decisioni/razionale | `context/DECISION_LOG.md` | desiderata FROZEN | — | — |
| Aperte / Rifiutate | `context/OPEN.md`, `context/REJECTED.md` | — | — | — |
| Terminologia | `GLOSSARY.md` v2 | — | — | — |
| Provenance | `context/ingestions/`, `RICHIESTE.md` | `.mw/runs/` (ephemeral) | — | — |
| Progressione/XP, narrativa | — | `GAMEPLAY_DESIGN.md` (sparse) | — | **nessun doc canonico dedicato — non creata autorità fittizia** |

## C. Refactoring Actions (questa tranche)

**Creati (copie tracciate da `.mw/runs/` gitignored, con header provenance):**
- `context/QUEST_S1_DESIGN.md` ← `20261002-s1-quest-design/quest-design.md`
- `context/QUEST_ECONOMY_NOTES.md` ← `20261004-rovine-preview-chatgpt/economy-notes.md`
- `context/QUEST_V6_REDESIGN.md` ← `20261003-quest-v6-science/quest-v6.md`
- `src/docs/docs/idle_village/quest_rovine_scenario_spec.md` ← `rovine-mockup.md`
- `src/docs/docs/idle_village/quest_simulation_preview_spec.md` ← `preview-prompt.md`
- `.windsurf/rules/85-documentation-impact.md` — contratto Documentation Impact (§22–23)
- `KNOWLEDGE_REFACTOR_REPORT.md` (questo file)

**Modificati:**
- `QUEST_RULES.md` — regola consumabili compilata (v23 rev.4 D3); fonti → copie tracciate
- `context/OPEN.md` — fonti → copie tracciate (OPEN-006/007/008/010)
- `GAMEPLAY_DESIGN.md` — header REFERENCE + sezioni superseded marcate (Dispatch→World Surface, Gilded→Prismatic)
- `src/docs/docs/MASTER_PLAN.md` — `status: superseded` + banner
- `CURRENT_STATE.md` — puntatori a SESSION_HANDOFF e spec tracciate
- `GLOSSARY.md` — v2: +18 termini quest vigenti, +3 proposte marcate
- `context/INDEX.md` — +6 voci, link DECISION_LOG riparato, data aggiornata
- `plans/INDEX.md` — regola Documentation Impact
- `README.md` — router L0 + nota sul titolo storico
- `context/DECISION_LOG.md`, ingestion report — puntatori a copie tracciate
- `RICHIESTE.md` — R-085 registrata

**Eliminati:** nessuno. **Rinominati:** nessuno.

## D. Knowledge Preserved

Matrice S1 Director-confermata, redesign v6 con razionale scientifico,
note economia-villaggio, spec Rovine e spec preview: tutti salvati in copie
tracciate con provenance verso gli originali `.mw/runs/`. Le voci REJ e i
doc superseded conservano la storia con rimandi (nessuna cancellazione).

## E. Remaining Open Questions (documentation/authority)

1. Ambiguità «Idle Village»: `CURRENT_STATE.md` dice «lavoro attivo su Idle
   Village» e anche «pagina legacy Idle Village deprecata». Il glossario
   distingue dominio vs pagina, ma la dicitura in CURRENT_STATE confonde —
   serve decisione Director sul naming (dominio vs pagina deprecata).
2. Domini senza doc canonico: progressione/XP, narrativa, economia villaggio
   ratificata. Non creata autorità fittizia — in attesa di maturazione o
   decisione Director.
3. `GAMEPLAY_DESIGN.md` copre la visione di gioco; non esiste un doc canonico
   di «regole gameplay generali» non-quest (economia, produzione). OPEN.
4. `.windsurf/rules/` resta gitignored — governance non versionata
   (segnalato, decisione `.gitignore` al Director).
5. Ratifica proposte OPEN-010 (human-days, leader-capacity, opportunità).

## F. Retrieval Score — test suite §21/§36

| # | Domanda | Fonte attesa | Fonte trovata | Esito | Note |
|---|---|---|---|---|---|
| 1 | Cos'è RpgBalancer | README/CURRENT_STATE | CURRENT_STATE §sintesi | PASS | README puntava a framing obsoleto → nota aggiunta |
| 2 | Design pillars | DESIGN_PILLARS | DESIGN_PILLARS via CANON | PASS | |
| 3 | Cosa è implementato | CURRENT_STATE | §Implementato | PASS | |
| 4 | In sviluppo | CURRENT_STATE/RICHIESTE | §In corso + RICHIESTE | PASS | |
| 5 | Regole quest correnti | QUEST_RULES | QUEST_RULES §1–8 | PASS | |
| 6 | Come si vince una quest | QUEST_RULES | §6 prova-obiettivo + leader vivo | PASS | |
| 7 | Come si fallisce | QUEST_RULES | §5–6 fuga/wipe/obiettivo | PASS | |
| 8 | Leader esausto | — | nessuna regola vigente; proposta leader-capacity (OPEN-010, QUEST_ECONOMY_NOTES) | PASS | risposta corretta = «non ratificato» |
| 9 | PG ferito | QUEST_RULES | §3 ferito resta, +rischio | PASS | |
| 10 | Morte | QUEST_RULES | §3–5 + morte=risorsa | PASS | |
| 11 | Death save | QUEST_RULES | §4 (5% mock, OPEN-006) | PASS | |
| 12 | Fuga | QUEST_RULES | §5 | PASS | danni extra → OPEN-009 |
| 13 | Skill check | QUEST_RULES | §3 modello gruppo+per-slot | PASS | |
| 14 | Consumabili | QUEST_RULES | §3 pool party (aggiunta) | PASS | prima assente — gap chiuso |
| 15 | Preview totale | spec preview | `quest_simulation_preview_spec.md` + OPEN-008 | PASS | |
| 16 | Preview pre-check | spec preview | stessa spec + CURRENT_STATE | PASS | |
| 17 | Meccaniche irrisolte | OPEN | OPEN-001…009 + QUEST_RULES §8 | PASS | |
| 18 | Slot economy | — | nessun concetto stabilito | FAIL | termine del template, non del progetto; più vicino: slot obbligatori/secondari |
| 19 | Value/day | — | assente | FAIL | non inventato |
| 20 | human-days | GLOSSARY/ECONOMY | GLOSSARY `proposta` + QUEST_ECONOMY_NOTES | PASS | correttamente marcato proposta |
| 21 | Optionality | — | idea presente in ECONOMY_NOTES (party libero per opportunità future), termine non canonizzato | PARTIAL | concetto sì, lemma no |
| 22 | Opportunity network | — | assente | FAIL | non inventato |
| 23 | Speculative investment | — | assente | FAIL | non inventato |
| 24 | Sunk cost | QUEST_GAMEPLAY_SCIENCE | P-entry Arkes & Blumer | PASS | come RESEARCH |
| 25 | Risk budget | — | assente (esiste «banda di rischio», altro concetto) | FAIL | |
| 26 | Decision density | — | assente | FAIL | |
| 27 | Counterfactual clarity | — | frammenti: «negative counterfactual» (SCIENCE), «counterfactual consumabile» (preview) | PARTIAL | nessuna definizione canonica |
| 28 | Cosa è canonico | CANON | CANON.md gerarchia + stati | PASS | |
| 29 | Cosa è rifiutato | REJECTED | REJECTED.md REJ-001…006 | PASS | |
| 30 | Cosa è irrisolto | OPEN | OPEN.md 11 voci | PASS | |
| 31 | Perché una decisione | DECISION_LOG | log datato con razionale | PASS | |
| 32 | Dove modificare una regola quest | QUEST_RULES+rule80 | entrambi | PASS | |
| 33 | Architettura corrente | router | architecture_state.md | PASS | |
| 34 | Doc architettura autorevole | CANON | architecture_state (riga CANON) | PASS | |
| 35 | Doc architettura storici | banner | BIBLE/REFERENCE superseded, ARCHITECTURE reference | PASS | |
| 36 | Piano attivo | plans/INDEX | tabella + vocabolario stati | PASS | |
| 37 | Roadmap autorevole | plans/INDEX | INDEX (ROADMAP superseded) | PASS | |
| 38 | Dove registrare un piano | plans/INDEX | regole §1–4 | PASS | |
| 39 | Termini quest | GLOSSARY | GLOSSARY v2 | PASS | |
| 40 | Termini ambigui | GLOSSARY/OPEN | «Idle Village» dominio↔pagina ambiguo (E.1) | PARTIAL | |

**Score: PASS 33 · PARTIAL 3 · FAIL 5** — i 5 FAIL sono termini del template
non presenti nel progetto: registrati come assenti, non inventati (§0.1).
I PARTIAL sono concetti presenti ma senza lemma canonico o naming ambiguo.

## G. Dangerous Remaining Documents

- `src/docs/docs/MASTER_PLAN.md` — marcato superseded, ma il corpo contiene
  ancora 740+ task che un agente potrebbe leggere come attivi: il banner in
  testa è l'unica difesa.
- `context/RPG_PROJECT_CONTEXT.md` — referenzia ancora ROADMAP/MASTER_PLAN
  (non riallineato in questa tranche).
- `DECISION_LOG.md` — il blocco «Open Questions» Q1–Q3 (Aug) è ora duplicato
  in OPEN-011; il log resta storia, ma un agente potrebbe leggerlo come
  attuale senza il rimando.
- `VERTICAL_SLICE_ROADMAP.md` — resta autorità CANON per la slice, ma datato
  giugno: rischio di essere letto come roadmap corrente (banner storico
  presente dalla tranche precedente).
- `.mw/runs/` — contiene ancora evidence non copiata (deepresearch 2026-10-03,
  playtest seed 1983): accettabile come provenance L4, ma i doc che la citano
  restano dipendenti da file gitignored per il dettaglio.

## H. Recommended Next Steps

1. Ratificare o rifiutare OPEN-010 (proposte economia-villaggio) — unica
   decisione Director che sblocca il canonizzare dei concetti human-days.
2. Risolvere OPEN-001 (rimappatura PLAN-018) in una sessione gameplay.
3. Decidere naming «Idle Village» dominio vs pagina deprecata (E.1).
4. Se `.windsurf/rules/` deve essere versionato: una riga di `.gitignore`.
5. Applicare Documentation Impact ai piani attivi al loro prossimo update.

*Manutenzione: questo report è un artefatto puntale del refactor R-085; non
va aggiornato come doc vivo — lo stato corrente vive in `context/INDEX.md`,
`plans/INDEX.md`, `context/OPEN.md`.*
