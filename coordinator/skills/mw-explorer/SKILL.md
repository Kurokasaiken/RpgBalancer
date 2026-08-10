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

Always begin your response with `explorer:` followed by a blank line.
