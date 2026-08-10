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

## Rules

- Read the files you are about to edit. Never edit blind.
- No stubs, TODOs without implementation, debug `console.log`, or commented-out code.
- Resolve the cause, not the symptom.
- If scope grows during execution, stop and report instead of silently expanding.
- Run the relevant safeguards (`npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`) before declaring done.
- Update the relevant plan, `RICHIESTE.md` item, or evidence log before closing.

Always begin your response with `executor:` followed by a blank line.
