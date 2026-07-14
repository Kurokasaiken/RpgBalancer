# Agent Execution Mandate

**Status:** Placeholder - Content needs to be exported from Windsurf/Devin Desktop

## Purpose
The Agent Execution role executes specific prompts and implements code changes. This mandate defines the Agent's responsibilities for implementation, testing, and documentation updates.

## Responsibilities (from systems_governance_alignment_plan.md)

According to GOV-004, the Agent Execution mandate should include:

- **Frozen kit usage**: Use frozen kits from `@/ui/idleVillage/frozen/kits`
- **Trusted doc updates**: If task changes a trusted/frozen component, update the trusted doc and `COMPONENT_MASTER_INDEX.md` before marking complete
- **Invariant compliance**: Follow all invariants from `.windsurf/rules/`
- **Safeguard execution**: Run lint, test, build:check, kanban:lint before completion

## Required Content (to be filled from Windsurf export)

1. **Implementation workflow**
   - Code change requirements
   - Config-first design
   - Component reuse verification

2. **Testing requirements**
   - Unit test coverage
   - Integration testing
   - RTL/Playwright testing

3. **Documentation updates**
   - When to update trusted docs
   - COMPONENT_MASTER_INDEX updates
   - Evidence logging

4. **Safeguard checklist**
   - Pre-completion checks
   - Build verification
   - Lint verification

## Action Required

Export the actual content from `.windsurf/skills/agent-execution-mandate/SKILL.md` via Windsurf/Devin Desktop and replace this placeholder.
