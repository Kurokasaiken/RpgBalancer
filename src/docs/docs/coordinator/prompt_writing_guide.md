# Prompt Writing Guide

This guide provides best practices, examples, and templates for writing effective agent prompts in the RPG Balancer project.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Prompt Template](#prompt-template)
3. [Section-by-Section Guide](#section-by-section-guide)
4. [Good vs Bad Examples](#good-vs-bad-examples)
5. [Common Mistakes](#common-mistakes)
6. [Checklist](#checklist)

---

## Core Principles

Based on industry best practices and our project experience:

### 1. Clarity Over Brevity

Write explicit, detailed instructions. Current LLM context windows are large—don't sacrifice clarity for length.

**Bad**: "Implement the stress service"
**Good**: "Implement ResidentStressService with Zod schema validation, PersistenceService integration, and configurable thresholds for warning/critical/emergency levels"

### 2. Config-First Philosophy

All values that could change (thresholds, weights, magic numbers) must live in config files, never inline.

**Bad**: `if (stress > 0.8) { alert() }`
**Good**: `if (stress > config.thresholds.critical) { alert() }`

### 3. Structured Tool Usage

Define exact file paths, commands, and expected outputs. Agents work better with explicit structure.

### 4. Plan Mode vs Act Mode

Encourage agents to first understand the full scope (Plan Mode) before making changes (Act Mode).

### 5. Iterative Verification

Each step should be verifiable before proceeding to the next.

---

## Prompt Template

```text
AGENT
<Agent-Name> – <Specialty>

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
<Clear, measurable objective in 1-2 sentences. Include specific KPI if available.>

PROMPT READINESS
FILE TARGET
- [esistente] path/to/existing/file.ts
- [nuovo] path/to/new/file.ts — creare scaffolding prima di iniziare.

DIPENDENZE
- <PROMPT_ID> (or "-" if none)

OPERAZIONI DA ESEGUIRE
1. <Specific step with deliverable>
2. <Specific step with deliverable>
3. <Specific step with deliverable>
4. Run safeguard suite
5. Create evidence log
6. Update Kanban

OPERAZIONI VIETATE
- <Forbidden action 1 with reason>
- <Forbidden action 2 with reason>
- <Forbidden action 3 with reason>

ASSUNZIONI
- <Assumption about environment>
- <Assumption about available APIs/services>

REGRESSION SAFEGUARDS
- `npm run lint -- <specific paths>`
- `npm run test:unit -- <specific test file>`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia <Alta|Media|Bassa>; <specific conditions for check-in>

KANBAN COMPLETION
1. Stato Kanban → "Completato" con data.
2. Evidence `test-results/<prompt-id>-<data>.log`.
3. <Additional completion criteria>

NOTE
- <Reference to source plan/vision document>
- <Any additional context>

EVIDENCE LOG
- test-results/<prompt-id>-<data>.log
```

---

## Section-by-Section Guide

### AGENT

**Purpose**: Identify the agent and their specialty.

**Format**: `<Name> – <Specialty>`

**Examples**:
- `Helios-Stress – Notification Service`
- `Aurora-STS – Intent Insights`
- `Vector-CLI – Telemetry Replay`

### ISTRUZIONI AGENTE

**Purpose**: Standard instruction pointing to the execution mandate.

**Always use this exact text**:
```
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.
```

### OBIETTIVO

**Purpose**: Define what success looks like. Must be measurable.

**Bad Examples**:
- "Make the stress system work better" (vague)
- "Fix bugs" (no scope)
- "Improve performance" (no metric)

**Good Examples**:
- "Implement ResidentStressService with configurable thresholds (warning: 0.6, critical: 0.8, emergency: 0.95) and PersistenceService integration for data persistence"
- "Create CLI command for combat replay with filters for card, mana, and agency gap, outputting ASCII timeline or JSON"
- "Build heatmap component for combo efficiency with canvas rendering < 16ms per frame"

### FILE TARGET

**Purpose**: Explicitly list all files the agent will touch.

**Markers**:
- `[esistente]` = File must exist. Agent should STOP if missing.
- `[nuovo]` = File to be created. Include scaffolding instructions.

**Example**:
```
FILE TARGET
- [esistente] src/balancing/config/sts/combatantsConfig.ts
- [esistente] tests/unit/sts/ResidentStress.test.ts
- [nuovo] src/balancing/idleVillage/ResidentStressService.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useResidentStress.ts — creare scaffolding prima di iniziare.
```

### DIPENDENZE

**Purpose**: Prevent conflicts and ensure prerequisites are met.

**Format**: List prompt IDs or use `-` if none.

**Examples**:
- `-` (no dependencies)
- `NP-142` (single dependency)
- `NP-142, KS-081-sts-sim` (multiple dependencies)

### OPERAZIONI DA ESEGUIRE

**Purpose**: Step-by-step instructions. Each step should have a clear deliverable.

**Bad Example**:
```
1. Implement the service
2. Add tests
3. Done
```

**Good Example**:
```
1. Define Zod schema for ResidentStressConfig with thresholds, impactFactors, and notifications
2. Implement ResidentStressService class with:
   - processStressEvent() for handling drop rejections
   - calculateStressLevel() returning normalized 0-1 value
   - PersistenceService integration for data storage
3. Create useResidentStress hook with:
   - Real-time stress state management
   - Auto-recovery with configurable interval
   - Notification callbacks
4. Add telemetry event 'resident_stress_updated'
5. Run safeguard suite (lint, test, build, kanban:lint)
6. Create evidence log in test-results/
7. Update Kanban with completion status
```

### OPERAZIONI VIETATE

**Purpose**: Explicit guardrails to prevent common mistakes.

**Always include at least 3 items**:

**Standard items to consider**:
- No hardcoded values (use config)
- No direct localStorage/sessionStorage (use PersistenceService)
- No setInterval < 500ms (use SchedulerService)
- No file modifications outside scope
- No skipping safeguards
- No removing existing tests

**Example**:
```
OPERAZIONI VIETATE
- Non hardcodare soglie stress; usare config.thresholds
- Non usare localStorage direttamente; usare PersistenceService
- Non usare setInterval < 500ms; usare SchedulerService o useSandboxClock
- Non modificare file fuori scope senza approvazione
```

### REGRESSION SAFEGUARDS

**Purpose**: Quality gates that must pass before completion.

**Always include**:
- `npm run build:check` (mandatory)
- `npm run kanban:lint` (mandatory)
- Scoped lint command
- Relevant test command

**Example**:
```
REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing/idleVillage src/ui/idleVillage`
- `npm run test:unit -- tests/unit/idleVillage/ResidentStressService.test.ts`
- `npm run build:check`
- `npm run kanban:lint`
```

### AUTONOMIA & CHECK-IN

**Purpose**: Define when agent should proceed vs ask for help.

**Levels**:
- **Alta**: Agent proceeds unless blocked
- **Media**: Agent checks in at specific milestones
- **Bassa**: Agent checks in frequently

**Examples**:
- `Autonomia Alta; fermarsi solo se PersistenceService non disponibile`
- `Autonomia Media; check dopo step 3 se performance canvas > 16ms`
- `Autonomia Bassa; conferma ogni modifica a file esistenti`

### KANBAN COMPLETION

**Purpose**: Define exactly what "done" means.

**Always include**:
1. Status update instruction
2. Evidence log path
3. Any additional verification

**Example**:
```
KANBAN COMPLETION
1. Stato Kanban → "Completato" con data odierna.
2. Evidence `test-results/np-147-resident-stress-<data>.log`.
3. Verificare che tutti i test passino e build sia verde.
```

### EVIDENCE LOG

**Purpose**: Specify where to save the completion evidence.

**Format**: `test-results/<prompt-id>-<date>.log`

**Example**: `test-results/np-147-resident-stress-2026-01-15.log`

---

## Good vs Bad Examples

### Example 1: Vague vs Specific Objective

**Bad**:
```
OBIETTIVO
Implementare il sistema di stress per i residenti.
```

**Good**:
```
OBIETTIVO
Implementare ResidentStressService con:
- Schema Zod per validazione config
- Thresholds configurabili (warning: 0.6, critical: 0.8, emergency: 0.95)
- Integrazione PersistenceService per persistenza dati
- Hook React useResidentStress per UI integration
```

### Example 2: Missing vs Complete File Target

**Bad**:
```
FILE TARGET
- src/balancing/idleVillage/ResidentStressService.ts
- src/ui/idleVillage/hooks/useResidentStress.ts
```

**Good**:
```
FILE TARGET
- [nuovo] src/balancing/idleVillage/ResidentStressService.ts — creare scaffolding prima di iniziare.
- [nuovo] src/ui/idleVillage/hooks/useResidentStress.ts — creare scaffolding prima di iniziare.
- [esistente] src/ui/idleVillage/config/residentDropRules.ts
- [esistente] tests/unit/idleVillage/ResidentStressService.test.ts
```

### Example 3: Weak vs Strong Forbidden Actions

**Bad**:
```
OPERAZIONI VIETATE
- Non fare cose sbagliate
- Seguire le best practice
```

**Good**:
```
OPERAZIONI VIETATE
- Non hardcodare valori numerici (soglie, pesi, intervalli); usare config files
- Non usare localStorage/sessionStorage direttamente; usare PersistenceService
- Non usare setInterval con intervalli < 500ms; usare SchedulerService
- Non modificare file non elencati in FILE TARGET senza approvazione esplicita
- Non saltare npm run build:check prima di chiudere il task
```

---

## Common Mistakes

### 1. Missing [esistente]/[nuovo] Markers

**Problem**: Agent doesn't know if file should exist or be created.
**Solution**: Always mark every file in FILE TARGET.

### 2. Vague OBIETTIVO

**Problem**: Agent can't verify when task is complete.
**Solution**: Include specific deliverables and measurable criteria.

### 3. No build:check in Safeguards

**Problem**: Build failures go undetected.
**Solution**: Always include `npm run build:check` in REGRESSION SAFEGUARDS.

### 4. Missing Dependencies

**Problem**: Agent starts work that conflicts with in-progress tasks.
**Solution**: Check Kanban for "In corso" prompts touching same files.

### 5. Hardcoded Values in Instructions

**Problem**: Agent copies hardcoded values into code.
**Solution**: Reference config files, not literal values.

### 6. No Evidence Log Path

**Problem**: No audit trail for completed work.
**Solution**: Always specify EVIDENCE LOG path.

---

## Checklist

Before registering a prompt, verify:

### Content
- [ ] AGENT has name and specialty
- [ ] ISTRUZIONI AGENTE uses standard text
- [ ] OBIETTIVO is specific and measurable
- [ ] FILE TARGET has [esistente]/[nuovo] markers for ALL files
- [ ] DIPENDENZE lists dependencies or uses "-"
- [ ] OPERAZIONI DA ESEGUIRE has numbered steps with deliverables
- [ ] OPERAZIONI VIETATE has at least 3 specific items
- [ ] REGRESSION SAFEGUARDS includes `npm run build:check`
- [ ] KANBAN COMPLETION specifies evidence log path
- [ ] EVIDENCE LOG path follows naming convention

### Validation
- [ ] All [esistente] files actually exist in repo
- [ ] All [nuovo] files have scaffolding instructions
- [ ] No conflicts with "In corso" prompts
- [ ] `npm run kanban:lint` passes after registration

---

## References

- `agent-execution-mandate` skill
- `coordinator-mandate` skill
- `strategist-mandate` skill
- `src/docs/docs/prompts/prompt_library.md`
- `src/docs/docs/coordinator/agent_assignments.md`
