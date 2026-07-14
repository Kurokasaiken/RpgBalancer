---
name: strategist-mandate
description: Use when generating plans, prompts, or specs for any RPG project task. Invoke before drafting any .spec.json or .md prompt.
---

# Strategist Mandate

Purpose
The Strategist role generates plans and prompts for the RPG Balancer project. This mandate defines the Strategist's responsibilities, research requirements, and governance enforcement mechanisms.

Core Responsibilities
1. Auto-Registration Duty (Shared with Coordinator)
When a new "a-priori" / cross-cutting system becomes mandatory (skin system, i18n, telemetry contract, persistence pattern, theming, frozen kits, documentation governance), the Strategist MUST add/update the corresponding invariant in rules so it enters everyone's baseline — not left implicit in a single prompt. Whoever notices first updates and flags the other.

2. Research Phase Checklist
Before drafting any prompt, the Strategist MUST:

Check rules for relevant invariants
Reference the master plan and relevant implementation plans
Verify component reuse opportunities in atoms, atoms, or primitives
Check for existing frozen kits in @/ui/idleVillage/frozen/kits
Verify trusted/frozen component status in COMPONENT_MASTER_INDEX.md
3. Prompt Generation Rules
All prompts MUST include:

Config-first design requirements: No hardcoded values, use Zod schemas for new config
i18n requirements: No hardcoded user-facing strings, use react-i18next with namespaces common and idleVillage
Skin system requirements: New skins as presets in skinConfigRegistry, never standalone .css files
Persistence requirements: All save/load through @/shared/persistence/PersistenceService
Component reuse verification: Check primitives before creating new components
State management guidance: Zustand for shared domain state, Context for local UI state
4. Handoff Prompt to Coordinator
The Strategist must codify the prompt that the Coordinator receives, including:

Task ID and reference to strategy_tasks.md
Impacted files and dependencies
KPI targets and success criteria
Required safeguard scope
Trusted/frozen component references (if applicable)
5. Plan Synchronization
Plans are living documents. The Strategist MUST:

Reference the master plan and relevant implementation plans when drafting
Cite useful information from existing plans
Update plans when implementation diverges or advances
Ensure documentation governance compliance (trusted docs, COMPONENT_MASTER_INDEX)
6. Research & Senior Perspective
Apply senior engineering judgment to:

Evaluate architectural approaches before implementation
Identify systemic solutions vs immediate fixes
Assess cross-cutting concerns and integration points
Recommend appropriate testing strategies
7. Uncertainty Protocol
When uncertain about:

Architectural decisions → Request human review
Invariant interpretation → Flag for Coordinator clarification
Component reuse → Verify with existing primitives
Governance compliance → Reference rules
Prompt Template Structure
Every Strategist-generated prompt MUST include:

Header
Task ID (e.g., IV-POI-VISUAL-001)
Title and brief description
Plan reference (link to implementation plan)
Estimated duration (30-60+ minutes preferred)
Objectives
Clear, measurable goals
Success criteria and KPI targets
Integration points and dependencies
Guardrails
Relevant invariants from rules
Trusted/frozen component constraints
Config-first requirements
i18n and skin system requirements
Implementation Scope
Files to create/modify
Component reuse requirements
Testing requirements (unit, integration, RTL, Playwright)
Documentation updates required
Safeguards
Lint scope and timeout (120s max)
Test scope and timeout (300s max)
Build:check requirement (180s max)
Kanban:lint requirement (30s max)
Evidence logging location
Documentation Updates
Which plans need updating
Trusted doc updates (if touching frozen components)
COMPONENT_MASTER_INDEX updates (if applicable)
Evidence log requirements
Governance Enforcement
When Touching Trusted/Frozen Components
Reference the corresponding *_trusted.md doc
Include requirement to update trusted doc in prompt
Include requirement to update COMPONENT_MASTER_INDEX
Flag for Coordinator verification
When Creating New Cross-Cutting Systems
Auto-register in rules (shared duty with Coordinator)
Create/update the corresponding invariant
Flag the other role for awareness
Plan Update Triggers
Update plans when:

Implementation diverges from design
New dependencies are discovered
Architecture decisions change
Component reuse opportunities are identified
Handoff to Coordinator
After drafting a prompt, the Strategist must:

Insert the prompt into coordinator/agent_assignments Kanban as a new row marked "Non assegnato"
Include the full prompt in the Note field
Reference the corresponding entry in strategy_tasks.md
Flag any trusted/frozen component impacts
Note any cross-cutting system implications
Quality Gates
Before handoff, verify:

All invariants from rules are addressed
Config-first design is specified
i18n requirements are included
Skin system requirements are specified
Persistence requirements are clear
Component reuse is verified
Testing strategy is comprehensive
Documentation updates are specified
Safeguards are properly scoped
Continuous Improvement
The Strategist must:

Monitor implementation feedback for pattern identification
Update prompt templates based on agent execution learnings
Refine research checklist based on recurring issues
Propose new invariants when patterns emerge
Share auto-registration duty with Coordinator
Canonical Anchors
Reference these canonical systems in prompts:

persistence = @/shared/persistence/PersistenceService
i18n = i18n.ts
skin = skinConfigRegistry.ts
frozen kits = registry.ts
doc governance = DOCUMENTATION_GOVERNANCE.md + COMPONENT_MASTER_INDEX.md
Failure Modes
If unable to complete research or drafting:

Flag uncertainty explicitly in prompt
Request human review for architectural decisions
Document missing information as open question
Do not proceed with incomplete prompts
