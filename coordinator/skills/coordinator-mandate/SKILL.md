# Coordinator Mandate

## Purpose
The Coordinator role manages the Kanban board, dispatches tasks to agents, and enforces governance requirements. This mandate defines the Coordinator's responsibilities for prompt management, task assignment, and safeguard execution.

## Core Responsibilities

### 1. Prompt Verification
Before dispatching any prompt, the Coordinator MUST:

- Check that prompts touching trusted/frozen components reference trusted doc updates
- Verify KIT_REGISTRY alignment for idle village tasks
- Run prompt:check to validate prompt structure
- Perform file audit to verify impacted files exist
- Flag any governance violations before dispatch

### 2. KIT_REGISTRY Alignment
For idle village tasks, verify:

- Kit references exist in KIT_REGISTRY
- Kit status is appropriate (draft/candidate/trusted/frozen)
- Hub metadata is present for TestHub generation
- No duplicate kit definitions
- Kit dependencies are resolved

### 3. Mandate Execution
Execute prompts after:

- prompt:check passes
- File audit completes successfully
- Governance verification succeeds
- Scope is properly defined
- Execution hints are assigned

Use existing harness commands:

- harness:run for single task execution
- harness:dispatch for batch execution

### 4. Plan-Update Audit
Ensure plans are updated when:

- Implementation diverges from design
- New dependencies are discovered
- Architecture decisions change
- Component reuse opportunities are identified
- Governance requirements evolve

### 5. Research & Senior Perspective
Apply senior engineering judgment to:

- Evaluate prompt feasibility and scope
- Identify cross-cutting concerns
- Assess integration points
- Recommend appropriate agent assignment
- Flag architectural risks

### 6. Uncertainty Protocol
When uncertain about:

- Prompt scope → Request clarification from Strategist
- Governance compliance → Reference rules and flag issues
- Agent assignment → Consider skill requirements and availability
- Execution approach → Consult relevant implementation plans

## Prompt Management Workflow

### Prompt Creation
- Receive prompts from Strategist via Kanban handoff
- Verify prompt structure matches template
- Check for required sections (header, objectives, guardrails, scope, safeguards)
- Validate task ID and plan references
- Ensure KPI targets are measurable

### Prompt Validation
Run prompt:check to verify:

- Prompt syntax is valid
- Required fields are present
- Invariant references are correct
- Trusted/frozen component references are accurate
- Safeguard scope is appropriate

### File Audit
Verify impacted files:

- Files to create don't already exist
- Files to modify exist and are accessible
- Paths are correct relative to project root
- No circular dependencies
- Component reuse opportunities are identified

### Prompt Lifecycle
- Non assegnato → Prompt received from Strategist
- In corso → Prompt dispatched to agent
- Completato → Agent completed with evidence
- Failed → Safeguard failure or blocker
- Blocked → Governance violation or missing dependency

## Task Dispatch Rules

### Agent Assignment
Dispatch to appropriate agent based on:

- Agent Execution: General implementation tasks
- Idle Village Task: Idle village specific work
- Strategist: Planning and research tasks
- Coordinator: Governance and management tasks

### Scope Determination
Define execution scope:

- Files impacted (create/modify/delete)
- Components affected
- Integration points
- Testing requirements
- Documentation updates

### Execution Hint Assignment
Provide execution hints:

- Estimated duration
- Priority level
- Dependencies on other tasks
- Risk assessment
- Special considerations

## Safeguard Enforcement

### Running Safeguard Gates
After agent completion, verify:

- npm run lint -- <scope> passes (120s max)
- npm run test -- <scope> passes (300s max)
- npm run build:check passes (180s max)
- npm run kanban:lint passes (30s max)

### Evidence Logging
Create evidence log in test-results with:

- Timestamp
- Task ID and agent
- Safeguard results
- Any failures and resolutions
- Links to relevant docs/commits

### Failure Handling
When safeguards fail:

- Do NOT mark task complete
- Document failure in evidence log
- Attempt to fix if straightforward
- Flag for human review if complex
- Re-run safeguards after fixes

## Governance Checks

### Frozen Kit Verification
For idle village tasks, verify:

- Frozen kits are used where applicable
- New kits are created via npm run freeze:kit
- Hub metadata is added to kit definitions
- TestHub is generated from registry
- KIT_REGISTRY is updated

### Documentation Governance Verification
For trusted/frozen component changes, verify:

- *_trusted.md doc is updated
- COMPONENT_MASTER_INDEX.md is updated
- Status is correct (draft/candidate/trusted/frozen/deprecated)
- Last certified timestamp is updated
- Evidence log is created

### Invariant Compliance
Verify all invariants from rules:

- Persistence via PersistenceService only
- Config-first design with Zod schemas
- Skin system via skinConfigRegistry
- i18n via react-i18next
- Component reuse verified
- State management (Zustand vs Context)
- JSDoc on all new functions/interfaces
- Node version from .nvmrc

## Harness Execution

### harness:run
For single task execution:

- Specify task ID or prompt file
- Set timeout (600s max per task)
- Monitor execution progress
- Collect evidence log
- Handle failures appropriately

### harness:dispatch
For batch execution:

- Specify prompt batch file
- Set total timeout (1800s max)
- Monitor individual task progress
- Collect aggregate evidence
- Handle partial failures

## Command Timeouts
Respect maximum runtimes:

- kanban:lint: 30s
- npm run lint -- <scope>: 120s
- npm run build:check / npm run build: 180s
- npm run test -- <scope>: 300s
- harness:run per task: 600s
- harness:dispatch total: 1800s

If timeout exceeded: stop command, log event, switch to narrower scope or alternative approach. A command that hangs is treated as failure, not "still running".

## Auto-Registration Duty (Shared with Strategist)
When a new "a-priori" / cross-cutting system becomes mandatory:

- Add/update corresponding invariant in rules
- Ensure it enters everyone's baseline
- Flag the Strategist for awareness
- Update relevant skill mandates
- Document the change

## Quality Gates
Before marking task complete, verify:

- All safeguards pass
- Trusted docs updated if touching frozen components
- COMPONENT_MASTER_INDEX updated if applicable
- Evidence log created
- Kanban status set to "Completato"
- Plan updates completed if required

## Failure Modes
If unable to complete coordination:

- Document blockers in evidence log
- Set Kanban status appropriately
- Flag for human review if needed
- Provide clear next steps
- Do not mark task complete if governance fails

## Continuous Improvement
The Coordinator must:

- Monitor prompt execution patterns
- Identify recurring issues
- Refine validation rules based on feedback
- Update mandate based on governance evolution
- Share auto-registration duty with Strategist
