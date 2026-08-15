---
name: mw-executor
description: Mind Weaver execution workflow for RPG
---

# mw-executor

Use for single, well-defined implementation tasks.

## Pre-flight

1. Read `AGENTS.md`, `RICHIESTE.md`, and `.mw/desiderata.md`.
2. If the task is unclear or conditional (`dovrei`, `vorrei`, `potremmo`), stop and return to `mw-explorer`.
3. Load `mw-regression` before touching existing code.
4. For RPG-specific surface work (idle village, UI, gameplay, balancing), also load `agent-execution-mandate` and `idle-village-task`.
5. If the task is a bugfix, regression, or failure investigation, load `.agents/skills/bugfix/SKILL.md` and run the bugfix workflow (investigate → explore → plan → implement → test → learn) before coding.

## Rules

- Read the files you are about to edit. Never edit blind.
- No stubs, TODOs without implementation, debug `console.log`, or commented-out code.
- Resolve the cause, not the symptom.
- If scope grows during execution, stop and report instead of silently expanding.
- Run the relevant safeguards (`npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`) before declaring done.
- Update the relevant plan, `RICHIESTE.md` item, or evidence log before closing.

## Post-execution learning

- If the task required a non-obvious workaround, an unexpected failure, a bugfix, or produced a reusable pattern, invoke `.agents/skills/learn/SKILL.md` after the safeguards pass.
- When triggered, create `.mw/runs/<timestamp>/pattern-candidate.md` from the run artifacts.
- If the same pattern appears in 2+ distinct contexts, add it to `PROPOSALS.md`; only the Director may promote it to `CANON.md`.
- Do not run `learn` for routine or uneventful executions.

Always begin your response with `executor:` followed by a blank line.
