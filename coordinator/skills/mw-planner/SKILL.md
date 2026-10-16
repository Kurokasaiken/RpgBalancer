---
name: mw-planner
description: >
  Workflow di pianificazione Mind Weaver scopato al progetto RPG. Usa
  quando si pianifica un task dentro RPG: verifica desiderata FROZEN,
  MASTER_PLAN scope e recurring-traps delle superfici toccate, poi
  produce un plan con contratto. Per pianificazione generica fuori da
  RPG usa `planner`.
---

# mw-planner

Use when there is enough clarity to commit to a concrete plan.

## When to use

- The Director says "pianifica", "scrivi una spec", "come implementiamo", or "trasforma in piano"
- After exploration produced a direction

## Pre-flight

1. Read `.mw/desiderata.md` (latest FROZEN) and `RICHIESTE.md`.
2. Read `DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, and `context/INDEX.md` for relevant constraints.
3. If the request materially changes the FROZEN desiderata, stop and ask.
4. Check `src/docs/docs/MASTER_PLAN.md` for scope alignment.
5. Check `context/recurring-traps.md` for traps on the surfaces the plan will touch; a plan must not re-propose a fix already documented as failed or a pattern already promoted to a trap.

## Planning rules

- Every step must require a state the previous step guarantees.
- The last task of the plan must produce a verifiable, measurable result (test passing, build green, evidence log).
- Do not introduce components or features not explicitly requested (YAGNI).
- Mark open architectural decisions as open; do not decide them silently.
- A plan that includes runtime verification, screenshots, playtests, or captures must state that the run is headless/background; a visible window is a manual Director step, never an agent action (`.windsurf/rules/16-no-foreground-windows.md`).
- Ogni piano dichiara il suo **contratto di chiusura**: le obbligazioni verificabili che l'esecuzione trasforma in `.mw/runs/<task>/verification.json` → `verify:bundle` → `bundle.json`, citato dalla voce `fatta` in `RICHIESTE.md` (workflow single-agent R-208: niente kanban, niente dispatch).
- **Contenuto del contesto — regola del giudizio vs lookup.** Un riferimento va nel plan quando è *frutto di un giudizio* (questo file, questo pattern, questa trappola, questa decisione) — sempre, anche se lo stesso agente eseguirà nella stessa conversazione: le conversazioni muoiono (compaction, crash) e il plan è l'unico artifact che sopravvive. Non va nel plan ciò che è *riscopribile con un lookup* (ricerca di file, convenzioni ovvie) — quello l'esecutore lo ritrova da sé. Context pack dettagliati per esecutori esterni si generano a dispatch-time dal manifest/codice, non a mano nel documento.
- Reference and update the relevant plan files in `src/docs/docs/plans/`.
- Quando il plan è battezzato (o entra `in corso`): `npm run plan:stamp -- open PLAN-NNN` — apre il ledger di misura per-plan (R-208: dimostrare ≥30min risparmiati).

## Post-plan learning

- If the plan exposes a hidden constraint, a workaround, an unexpected failure, or a reusable pattern, invoke `.agents/skills/learn/SKILL.md` after the plan is battezzato or rejected.
- When triggered, create `.mw/runs/<timestamp>/pattern-candidate.md` from the run artifacts.
- If the same pattern appears in 2+ distinct contexts, add it to `PROPOSALS.md`; only the Director may promote it to `CANON.md`.
- Do not run `learn` for routine or uneventful plans.

Always begin your response with `planner:` followed by a blank line.
