# Atomic Task Failure Patterns

This document tracks failure patterns for atomic tasks executed on ai-worker. When an atomic task fails for a reason NOT covered by the existing checklist (see `file-reading/dispatch-blocks.log`), add a row here with the failure reason and whether the checklist needs updating.

## Purpose

- Track unexpected failure patterns for atomic tasks
- Identify gaps in the current checklist
- Provide feedback for improving the Strategist Mandate
- Help prevent recurring failures

## Format

Add entries in chronological order:

```
### [Date] - [Task ID]

**Failure Reason**: [Description of why the task failed]

**Checklist Update Needed**: [Yes/No]

**If Yes, What to Add**: [Specific checklist item to add]

**Context**: [Additional context about the failure]
```

## Existing Checklist Reference

The current checklist for atomic tasks is maintained in:
- `file-reading/dispatch-blocks.log` - Detailed dispatch gate blocking logic
- Strategist Mandate - Standard safeguards and requirements

## Failure Patterns

*No failure patterns recorded yet. This file will be updated as atomic tasks fail for reasons not covered by the existing checklist.*

## Review Process

Review this file every time the Strategist Mandate checklist is updated to:
1. Identify patterns that should be added to the standard checklist
2. Remove outdated patterns that have been addressed
3. Ensure the checklist covers all known failure modes

## Notes

- This file focuses on atomic tasks only (execution_hint: "atomic")
- Verified and architectural tasks have their own safeguard requirements including Semgrep
- For dispatch gate blocking reasons, see `file-reading/dispatch-blocks.log`
