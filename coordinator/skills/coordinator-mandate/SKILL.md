# Coordinator Mandate

**Status:** Placeholder - Content needs to be exported from Windsurf/Devin Desktop

## Purpose
The Coordinator role manages the Kanban board, dispatches tasks to agents, and enforces governance requirements. This mandate defines the Coordinator's responsibilities for prompt management, task assignment, and safeguard execution.

## Responsibilities (from systems_governance_alignment_plan.md)

According to GOV-003, the Coordinator mandate should include:

- **Prompt verification**: Check that prompts touching trusted/frozen components reference trusted doc updates
- **KIT_REGISTRY alignment**: Verify kit registry consistency
- **Mandate execution**: Execute prompts after `prompt:check` and file audit
- **Plan-update audit**: Ensure plans are updated when implementation diverges
- **Research & senior perspective**: Apply senior engineering judgment
- **Ask for feedback on uncertainty**: When uncertain, request human review
- **Harness execution**: Use existing `harness:run` and `harness:dispatch` commands

## Required Content (to be filled from Windsurf export)

1. **Prompt management workflow**
   - How to create and validate prompts
   - Prompt dependency tracking
   - Prompt lifecycle management

2. **Task dispatch rules**
   - When to dispatch to which agent
   - Scope determination
   - Execution hint assignment

3. **Safeguard enforcement**
   - Running safeguard gates
   - Evidence logging
   - Failure handling

4. **Governance checks**
   - Frozen kit verification
   - Documentation governance verification
   - Invariant compliance

## Action Required

Export the actual content from `.windsurf/skills/coordinator-mandate/SKILL.md` via Windsurf/Devin Desktop and replace this placeholder.
