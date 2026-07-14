---
name: agent-execution-mandate
description: Use when implementing code changes, running safeguards, updating trusted docs, or completing any development task.
---

# Agent Execution Mandate

Purpose
The Agent Execution role executes specific prompts and implements code changes. This mandate defines the Agent's responsibilities for implementation, testing, and documentation updates.

Core Responsibilities
1. Frozen Kit Usage
MUST use frozen kits from @/ui/idleVillage/frozen/kits when available
Create new kits via npm run freeze:kit <KitName> when needed
Add hub metadata to kit definitions
Keep TestHub generated from registry
Reference KIT_REGISTRY for available kits
Never bypass frozen kit system for idle village components
2. Trusted Doc Updates
If task changes a trusted/frozen component:

Update the corresponding *_trusted.md doc
Update COMPONENT_MASTER_INDEX.md row (status, link, test page, last certified)
Log evidence in test-results
Verify runtime matches updated documentation
Do NOT mark task complete without these updates
3. Invariant Compliance
Follow ALL invariants from rules:

canonical-systems.md: prima di iniziare qualsiasi task UI, consulta coordinator/canonical-systems.md e verifica compatibilità con tutti i sistemi elencati — non solo quelli esplicitamente citati nello spec.
Persistence: Use @/shared/persistence/PersistenceService only
Config-first: No hardcoded values, use Zod schemas for new config
Skin system: New skins as presets in skinConfigRegistry, never standalone .css
i18n: No hardcoded strings, use react-i18next with namespaces common/idleVillage
Component reuse: Check primitives in atoms, atoms, primitives before creating new components
State management: Zustand for shared domain state, Context for local UI state
JSDoc: Every new function/interface gets JSDoc
Node version: Use pinned version from .nvmrc (source ~/.nvm/nvm.sh && nvm use)
4. Safeguard Execution
Before marking task complete, MUST run and pass:



bash
npm run lint -- <scope>
npm run test -- <scope>
npm run build:check
npm run kanban:lint
If any safeguard fails, task is BLOCKED, not complete.

5. Kanban Status Management
When picking a prompt: Set Kanban row to "In corso" with name/date
Upon delivery: Set Kanban row to "Completato" with evidence links
End response with: KANBAN STATUS: <Prompt ID> – Completato (Evidence: <log principale>)
Completed prompts tracked only in documentation, not on Kanban
Implementation Workflow
Code Change Requirements
Read existing files before editing (never edit blind)
Use minimal, focused edits via edit/multi_edit tools
Follow existing code style and patterns
Add all necessary imports at top of file
Ensure code is immediately runnable
Prefer upstream fixes over downstream workarounds
Config-First Design
Read stats, tokens, timings, copy keys from config modules
New config modules use Zod schemas for validation
No hardcoded gameplay/UI values in components
Reference config in src/balancing/config/**, skin/style configs
Component Reuse Verification
Prima di creare un nuovo componente UI, tutte e 5 le condizioni devono essere verificate:
(1) Hai cercato in src/ui/atoms/ ?
(2) Hai cercato in src/ui/fantasy/atoms/ ?
(3) Hai cercato in src/ui/idleVillage/skins/primitives/ ?
(4) Il nuovo componente NON duplica markup/styling di una primitiva esistente?
(5) Se crei una nuova primitiva, la stai aggiungendo alla directory corretta (non lasciandola come componente isolato)?
Se anche solo una risposta è 'no' → STOP, segnala.
Testing Requirements
Unit Test Coverage
Create comprehensive unit tests for new functions/components
Use Vitest for unit tests
Test both happy path and edge cases
Mock external dependencies appropriately
Ensure tests are deterministic (no timer dependence)
Integration Testing
Test component integration with existing systems
Verify data flow between components
Test error handling and fallback logic
Use test harnesses where available
RTL/Playwright Testing
Use React Testing Library for component tests
Use Playwright for E2E tests with user-visible locators
Web-first assertions (await expect(...).toBeVisible)
Isolated browser contexts per test
Network mocking via page.route
Visual snapshots for HUD/drag-drop regressions
Documentation Updates
When to Update Trusted Docs
Update when task changes:

Behavior of trusted/frozen component
Visual contract
Runtime contract
Source-of-truth usage
Runtime binding
COMPONENT_MASTER_INDEX Updates
Update status (draft/candidate/trusted/frozen/deprecated)
Update link to trusted doc
Update test page reference
Update last certified timestamp
Log evidence in test-results
Evidence Logging
Create evidence log in test-results with timestamp
Include safeguard results (lint, test, build, kanban)
Document any failures and resolutions
Link evidence log in Kanban completion message
Safeguard Checklist
Pre-Completion Checks
All invariants from rules followed
Config-first design implemented
i18n requirements met (no hardcoded strings)
Skin system requirements met (no standalone CSS)
Persistence via PersistenceService only
Component reuse verified
JSDoc added to all new functions/interfaces
Frozen kits used where applicable
Trusted docs updated if touching frozen components
COMPONENT_MASTER_INDEX updated if applicable
Build Verification
Run npm run build:check (timeout: 180s max)
If build fails: task is BLOCKED
Fix TypeScript compilation errors
Fix missing imports/undefined variables
Verify no type errors
Lint Verification
Run npm run lint -- <scope> (timeout: 120s max)
Fix lint errors
Address warnings if blocking
Non-blocking warnings documented in evidence log
Test Verification
Run npm run test -- <scope> (timeout: 300s max)
Ensure all tests pass
Fix failing tests before completion
Document test coverage in evidence log
Kanban Verification
Run npm run kanban:lint (timeout: 30s max)
Ensure Kanban status is "Completato"
Verify evidence links present
Fix any Kanban lint errors
Command Timeouts
Respect maximum runtimes:

kanban:lint: 30s
npm run lint -- <scope>: 120s
npm run build:check / npm run build: 180s
npm run test -- <scope>: 300s
harness:run per task: 600s
harness:dispatch total: 1800s
If timeout exceeded: stop command, log event, switch to narrower scope or alternative approach. A command that hangs is treated as failure, not "still running".

Canonical Anchors
Reference these canonical systems:

persistence = @/shared/persistence/PersistenceService (saveData/loadData/clearData)
i18n = i18n.ts
skin = skinConfigRegistry.ts
frozen kits = registry.ts
doc governance = DOCUMENTATION_GOVERNANCE.md + COMPONENT_MASTER_INDEX.md
Error Handling
When Safeguards Fail
Do NOT mark task complete
Document failure in evidence log
Attempt to fix if straightforward
Flag for human review if complex
Re-run safeguards after fixes
When Uncertain
Flag uncertainty explicitly
Reference relevant invariants
Ask for clarification if needed
Do not proceed with ambiguous requirements
Quality Standards
Code Quality
Minimal, focused changes
Proper error handling
Type safety (TypeScript)
No console.log in production code
No commented-out code
Proper file organization
Testing Quality
Comprehensive coverage
Deterministic tests
Clear test names
Proper setup/teardown
No test interdependence
Documentation Quality
Clear, concise descriptions
Accurate information
Proper formatting
Relevant examples
Up-to-date references
Domain-Specific Skills
Idle Village Task Skill
When using Idle Village Task skill:

Use frozen kits from @/ui/idleVillage/frozen/kits
Create new kits via npm run freeze:kit <KitName>
Add hub metadata to kit definitions
Keep TestHub generated from registry
Follow idle village specific invariants
Reference idle village implementation plans
Completion Protocol
Before marking task complete:

All safeguards pass (lint, test, build:check, kanban:lint)
Trusted docs updated if touching frozen components
COMPONENT_MASTER_INDEX updated if applicable
Evidence log created in test-results
Kanban status set to "Completato"
Response ends with: KANBAN STATUS: <Prompt ID> – Completato (Evidence: <log principale>)
Failure Modes
If unable to complete task:

Document blockers in evidence log
Set Kanban status appropriately
Flag for human review if needed
Provide clear next steps
Do not mark task complete if safeguards fail
