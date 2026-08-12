---
title: World Surface V3 — Sub-plan I — Freeze, Kanban e doc update
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
node: I
classification: task
execution_hint: assisted
created: 2026-08-13
---

# Sub-plan I — Freeze, Kanban e aggiornamento documentazione

## Classificazione e giustificazione

`task`. Niente logica runtime, solo documentazione e Kanban. Può essere confezionato in un singolo Task Package con acceptance chiara.

## Intent

- Approvazione/freeze dei sub-plan draft (post-delibera multi-AI).
- Aggiornare `RICHIESTE.md` R-003 in `fatta` al termine.
- Aggiornare `src/docs/docs/plans/world_surface_v3_strategic_plan.md` Next Steps con i riferimenti ai nuovi sub-plan.
- Creare/aggiornare `coordinator/agent_assignments.md` (o equivalente) con una riga per ogni sub-plan A–H.
- Aggiornare `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` solo se emergono nuovi componenti trusted/frozen.
- Produrre evidence log in `test-results/`.

## Acceptance

- `kanban:lint` passa.
- Ogni sub-plan A–H ha una riga Kanban con: task ID, descrizione, file targets, dipendenze, stato (`Bloccato`/`Assegnato`), executor (`ai-worker`/`harness`/`manual` in base a `execution_hint`).
- `agent_assignments.md` e `strategy_tasks.md` allineati.
- `world_surface_v3_strategic_plan.md` Next Steps punta ai sub-plan.
- `RICHIESTE.md` R-003 marcato `fatta` quando tutti i sub-plan sono completati.

## Invariants (RPG)

- Documentation governance: trusted docs e `COMPONENT_MASTER_INDEX` aggiornati solo se si tocca componenti trusted/frozen.
- Kanban: ogni task ha task ID, acceptance, invariants, constraints, file targets, dependencies.
- No modifica di `CANON.md` o `AGENTS.md` senza avallo esplicito (R-004 propone update di `AGENTS.md`, ma è un passo separato).

## Constraints

- Non avviare esecuzione di un sub-plan prima che le sue dependencies siano `Completato`.
- Lasciare i sub-plan in stato `Non assegnato` fino all'approvazione del Director, poi `Assegnato`/`Bloccato`.

## Approach notes

- Seguire `coordinator-mandate` Plan-to-Kanban Registration Rule: registrazione in massa, dipendenze documentate.
- `strategist-mandate` prompt template: ogni riga di Kanban contiene già intent, acceptance, invariants, constraints, approach notes, execution hint, file targets, safeguards.
- Includere gli evidence log path (`test-results/world-surface-v3-{subplan-id}.md`).

## File targets

- `src/docs/docs/plans/world_surface_v3_tactical_plan.md` (changelog, link a sub-plan)
- `src/docs/docs/plans/world_surface_v3_subplans_index.md` (eventuale index)
- `src/docs/docs/plans/world_surface_v3_strategic_plan.md` (Next Steps)
- `RICHIESTE.md` (R-003, eventuale avanzamento)
- `coordinator/agent_assignments.md` (o file Kanban effettivo)
- `coordinator/strategy_tasks.md` (o equivalente)
- `test-results/world-surface-v3-subplans-freeze.md` (evidence log)

## Dependencies

- Approvazione dei sub-plan A–H (post-delibera multi-AI).
- Conoscenza del path reale del Kanban (verificare `coordinator/` o `.mw/`).

## Safeguards

```bash
npm run kanban:lint
```

## Open questions

- Qual è il path esatto e il formato del Kanban attivo (`agent_assignments.md`, `kanban.md`, `.mw/`)? Verificare prima di scrivere.
