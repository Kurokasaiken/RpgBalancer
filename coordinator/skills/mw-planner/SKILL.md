---
name: mw-planner
description: Mind Weaver planning workflow for RPG
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

## Planning rules

- Every step must require a state the previous step guarantees.
- The last task of the plan must produce a verifiable, measurable result (test passing, build green, evidence log).
- Do not introduce components or features not explicitly requested (YAGNI).
- Mark open architectural decisions as open; do not decide them silently.
- Reference and update the relevant plan files in `src/docs/docs/plans/`.

## Post-plan learning

- If the plan exposes a hidden constraint, a workaround, an unexpected failure, or a reusable pattern, invoke `.agents/skills/learn/SKILL.md` after the plan is battezzato or rejected.
- When triggered, create `.mw/runs/<timestamp>/pattern-candidate.md` from the run artifacts.
- If the same pattern appears in 2+ distinct contexts, add it to `PROPOSALS.md`; only the Director may promote it to `CANON.md`.
- Do not run `learn` for routine or uneventful plans.

Always begin your response with `planner:` followed by a blank line.
