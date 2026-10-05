---
title: "PLAN-020 — Canonical Quest Rules Document"
status: completed
owner: strategist
created: 2026-10-05
completed: 2026-10-05
desiderata: v25 (KB audit), risposta Director Q7
parent: PLAN-019
---

# PLAN-020 — Canonical Quest Rules Document

## Goal

Un singolo documento canonico che risponde a «quali sono le regole quest attuali?» senza
ricostruzione da desiderata v23/v24+revisioni, `quest-design.md` (oggi in `.mw/runs/`,
gitignored fino a ieri), DECISION_LOG e PLAN-018/019.

Il Director ha chiesto esplicitamente (Q7, 2026-10-05): il doc **va aggiornato quando si
esprime o chiede cose diverse**, e l'AI deve **fargli domande** quando una sua affermazione
diverge dalle regole registrate.

## In Scope

- T-001: compilare `QUEST_RULES.md` (root) raccogliendo le regole quest correnti da:
  - `.mw/desiderata.md` v23, v24 + tutte le revisioni (vittoria, checkpoint, fuga, stat
    derivate, bodyguard, verdicts, consumabili)
  - `.mw/runs/20261002-s1-quest-design/quest-design.md` e `20261003-s1-quest-design-doc`
  - `context/DECISION_LOG.md` (voci quest)
  - `plans/PLAN-018` e `plans/PLAN-019` (divergenza design↔implementazione da dichiarare,
    non risolvere: vedi KNOWLEDGE_AUDIT §C7)
  - Formato: regola → fonte (desiderata/decision/plan) → stato (vigente / divergenza nota).
    Solo riferimenti alle desiderata — mai riscriverle.
- T-002: regola di mantenimento — ogni volta che il Director esprime una regola quest nuova
  o diversa, il doc va aggiornato nella stessa sessione; divergenza da FROZEN → domanda al
  Director, non assorbimento silenzioso. (Da scrivere in `.windsurf/rules/` o AGENTS.md —
  richiede avallo Director sul testo.)
- T-003: aggiornare `CANON.md` riga «Regole quest correnti» → `QUEST_RULES.md` (creato come
  placeholder «in PLAN-020» nell'audit).

## NOT In Scope

- Risolvere la divergenza PLAN-018 (soglia ≥50%) vs desiderata v24 rev.2 — dichiarata nel
  doc, la risoluzione è decisione Director in sessione gameplay.
- Rimuovere/riformattare le desiderata FROZEN.
- GAMEPLAY_DESIGN.md resta «visione» — QUEST_RULES.md è «regole vigenti», ruoli diversi
  dichiarati in testa al doc.

## Stato esecuzione — 2026-10-05

- **T-001 done:** `QUEST_RULES.md` (root) compilato: regole vigenti da
  desiderata v23/v24+rev, `quest-design.md`, DECISION_LOG, PLAN-018/019.
  Divergenza C7 (soglia PLAN-018 vs prova-obiettivo rev.2) dichiarata come
  `divergenza-nota`, non risolta → `context/OPEN.md` OPEN-001.
- **T-002 done:** regola di mantenimento in
  `.windsurf/rules/80-quest-rules-maintenance.md` — testo fornito dal Director
  nel prompt di chiusura PLAN-020 (same-session update, status
  vigente/proposta/divergenza-nota, nessun assorbimento silenzioso).
- **T-003 done:** `CANON.md` riga «Regole quest correnti» → `QUEST_RULES.md`.

## Acceptance

- Un agente nuovo risponde a «regole attuali per la risoluzione quest» leggendo
  `QUEST_RULES.md` + link, senza scandire `.mw/desiderata.md`.
- Ogni regola nel doc ha fonte esplicita (REQ id / sezione desiderata / DECISION_LOG #).
- `plans/INDEX.md` e `context/INDEX.md` aggiornati.
