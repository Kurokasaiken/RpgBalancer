# ART-DIR-CREATURE-001 — Create canonical creature example (Gnarled Nightmare)

## Context
Phase ART-DIR-CREATURE-001 of Art Direction Plan. Creates a canonical creature example (Gnarled Nightmare) following the art direction bible.

## Objectives
- Create canonical creature example (Gnarled Nightmare)
- Follow art direction bible guidelines
- Document creature design
- Verify compliance with art direction

## Scope

### Files to Create
- `art-direction/creatures/creatures/gnarled-nightmare/**` — Creature design assets

### Files to Modify
- (None — standalone phase)

### Out of Scope
- New art direction features (only example creation)

## Guardrails

### Invariants
- **Documentation**: Document is a bible, not code
- **Art Direction Compliance**: Follow art direction kill list and pillars

### Constraints
- Creature design must follow art direction bible
- Must comply with art direction kill list
- Must respect art direction pillars

## Implementation Plan

### Step 1: Create Creature Design
Create `gnarled-nightmare/**` with:
- Creature concept art
- Creature description
- Creature behavior notes
- Creature visual specifications

### Step 2: Verify Compliance
- Verify creature design follows art direction bible
- Verify compliance with kill list
- Verify respect for pillars

### Step 3: Document Design
- Document creature design decisions
- Document compliance with art direction

## Safeguards

### Pre-Execution
- Verify `ART-DIR-UPDATE-001` is marked as `Completato` in Kanban
- Run `npm run lint -- art-direction/` (120s timeout)

### Post-Execution
- Run `npm run lint -- art-direction/` (120s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/art-dir-creature-001-<date>.log` with:
- Lint results
- Kanban lint output
- Creature design summary
- Compliance verification

## Dependencies
- **blocked_by**: ART-DIR-UPDATE-001 (Update art direction bible to v0.11 + rendering system rules)

## Execution Hint
**verified** — This task touches invariants (art direction compliance) and requires careful design following the art direction bible.

## Notes
- Document is a bible, not code
- Must comply with art direction kill list
- Must respect art direction pillars
