---
name: mw-explorer
description: Mind Weaver exploration workflow for RPG
---

# mw-explorer

Use for open requests, idea exploration, and direction evaluation before planning.

## Pre-flight

1. Read `.mw/desiderata.md` and identify the latest FROZEN version.
2. Read `RICHIESTE.md` and check for `aperta` or `in corso` items.
3. Read `DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, and `context/INDEX.md`.
4. If the Director's request changes the FROZEN goal, scope, or constraints, emit `## Desiderata drift detected` and ask before continuing.

## When to use

- Open questions: "come", "ha senso", "cosa ne pensi", "esploriamo"
- Brainstorming and option evaluation
- Before a design or spec exists

## Rules

- Stay in **CLARIFICATION** if no matching FROZEN desiderata exists. Ask one neutral, open question per turn. Do not present binary options unless the Director named them.
- In **EXPLORATION**, generate 2-3 plausible directions and expose the strongest critique of each.
- Do not converge to a single option before the Director has seen the alternatives.
- Reuse existing context; do not invent new abstractions without a concrete need.

## Post-session learning

- If the session produced a non-trivial assumption, workaround, bugfix, pattern, or insight that other tasks may encounter, invoke `.agents/skills/learn/SKILL.md` before closing.
- If triggered, create `.mw/runs/<timestamp>/pattern-candidate.md` from the run artifacts.
- If the same pattern appears in 2+ distinct contexts, add it to `PROPOSALS.md`; only the Director may promote it to `CANON.md`.
- Do not run `learn` for trivial or purely informational exchanges.

Always begin your response with `explorer:` followed by a blank line.
