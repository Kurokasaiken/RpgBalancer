# Mind Weaver → RPG Skill Bridge

When working on the RPG project, this rule determines which Mind Weaver skill to load based on the Director's request.

## Trigger patterns

### explorer

Load the `explorer` skill when the Director's message contains:

- Open-ended questions: "come dovremmo", "ha senso", "cosa ne pensi", "esploriamo", "aiutami a capire"
- Brainstorming requests: "quali sono le opzioni per", "valuta questo approccio"
- Direction requests without a plan: "vorrei fare X", "mi aiutassi a costruire X", "vogliamo un sistema per Y" where X/Y have no existing plan
- Decision requests: "quale soluzione è migliore", "confronta A e B"
- "pianifica" is **NOT** present (if present, use planner)

### planner

Load the `planner` skill when the Director's message contains:

- Explicit planning requests: "pianifica questo", "scrivi una spec", "come implementiamo", "trasforma in piano"
- After an exploration session that produced a direction
- "come dovremmo" with sufficient clarity (if ambiguous, explorer takes precedence)

### executor

Load the `executor` skill when the Director's message contains:

- Single, well-defined task: "implementa T-001", "fixa il bug in X", "aggiungi la validazione a Y"
- Task IDs: "T-XXX", "TASK-XXX"
- Conditional verbs are **NOT** present (if "dovrei", "vorrei", "dovrebbe", "potremmo" are present, use explorer)

## Order of evaluation

1. Check for executor triggers (single task, no conditionals). If match → executor.
2. Check for planner triggers (explicit planning). If match → planner.
3. Check for explorer triggers (open-ended, brainstorming). If match → explorer.
4. If no match, default to explorer (safer for personal project).

## Notes

- RPG has no CANON.md, so planner's pre-flight check for FROZEN desiderata is skipped or adapted.
- The RPG project has its own skill system (coordinator-mandate, strategist-mandate, agent-execution-mandate, idle-village-task). This rule is for **Mind Weaver skills only**, not RPG skills.
- When a request clearly belongs to an RPG skill (e.g., "execute prompt", "run harness"), defer to the RPG skill system instead of MW.
