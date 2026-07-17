# Manual Task: TRAILER-V9-PHASE3

## Title
Idle Village Task - Trailer V9 Skin Alignment Phase 3: Separate Scene Pages

## Description
Idle Village Task - Trailer V9 Skin Alignment Phase 3: Separate Scene Pages

## Prompt
AGENT
Idle Village Task - Trailer V9 Skin Alignment Phase 3: Separate Scene Pages

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Create 7 separate page components for each trailer scene to enable recording workflow. This is Phase 3 of the approved trailer_v9_skin_alignment_plan.md. DEPENDS ON PHASE 2 COMPLETION.

CONTEXT
This is part of the Steam teaser trailer production pipeline. The trailer is exempt from gameplay architecture requirements but must preserve presentation architecture requirements. This code exists solely to produce recordable video content.

WHAT YOU MUST DO
1. Create 7 separate page components (TrailerThreatPage, TrailerChoicePage, TrailerPreparationPage, TrailerRiskPage, TrailerConsequencePage, TrailerLegacyPage, TrailerOutroPage)
2. Each page renders only its scene (no auto-cycle, no debug buttons)
3. Add routes in App.tsx for all 7 pages
4. Keep TrailerViewer.tsx for reference but remove from routing
5. Extract common scene logic into shared hooks if needed

@trailer-only CONVENTION
EXEMPT from gameplay architecture:
- NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- NO telemetry of any kind (marketing asset, not product)
- NO gameplay state mutation, NO economy systems, NO player progression

MUST PRESERVE:
- Config-first: Scene timing from trailerConfig.ts, NO hardcoded values
- Skin/Theme: Use V9 skin variables, NO standalone .css files
- Component Reuse: Reuse existing scene components, extract shared logic
- State Management: Use React Context for local presentation state, NO Zustand
- Documentation: JSDoc on all functions/interfaces, update plan changelog
- Node/tooling: Use pinned Node version from .nvmrc
- Safeguards: Run lint, build:check, kanban:lint before task complete

Page Structure:
- TrailerThreatPage.tsx → /trailer-threat (renders TrailerThreat only)
- TrailerChoicePage.tsx → /trailer-choice (renders TrailerChoice only)
- TrailerPreparationPage.tsx → /trailer-preparation (renders TrailerPreparation only)
- TrailerRiskPage.tsx → /trailer-risk (renders AstrolabeTrailerController only)
- TrailerConsequencePage.tsx → /trailer-consequence (renders TrailerConsequence only)
- TrailerLegacyPage.tsx → /trailer-legacy (renders TrailerLegacy only)
- TrailerOutroPage.tsx → /trailer-outro (renders TrailerOutro only)

SUCCESS CRITERIA
- 7 separate page components created
- All 7 routes accessible in App.tsx
- Each page renders only its scene (no auto-cycle)
- TrailerViewer removed from routing but kept for reference
- Recording workflow enabled (separate pages per scene)

INTEGRATION POINTS
- Existing Components: TrailerThreat, TrailerChoice, TrailerPreparation, AstrolabeTrailerController, TrailerConsequence, TrailerLegacy, TrailerOutro
- Routing: src/App.tsx (add 7 new routes)
- Config: trailerConfig.ts (scene timing)
- Plan Reference: src/docs/docs/plans/trailer_v9_skin_alignment_plan.md (Phase 3)

FILES TO CREATE
1. src/ui/idleVillage/trailer/TrailerThreatPage.tsx (new)
2. src/ui/idleVillage/trailer/TrailerChoicePage.tsx (new)
3. src/ui/idleVillage/trailer/TrailerPreparationPage.tsx (new)
4. src/ui/idleVillage/trailer/TrailerRiskPage.tsx (new)
5. src/ui/idleVillage/trailer/TrailerConsequencePage.tsx (new)
6. src/ui/idleVillage/trailer/TrailerLegacyPage.tsx (new)
7. src/ui/idleVillage/trailer/TrailerOutroPage.tsx (new)

FILES TO MODIFY
1. src/App.tsx (add 7 new routes, remove TrailerViewer from routing)

TESTING REQUIREMENTS
- Manual browser test: Verify all 7 routes render correctly
- Navigation test: Verify each page shows only its scene

DOCUMENTATION UPDATES
1. trailer_v9_skin_alignment_plan.md: Update Phase 3 progress in changelog

SAFEGUARDS
- Lint Scope: src/ui/idleVillage/trailer/ (120s timeout)
- Test Scope: None
- Build Check: npm run build:check (180s timeout)
- Kanban Lint: npm run kanban:lint (30s timeout)

PLAN REFERENCE
trailer_v9_skin_alignment_plan.md - Phase 3 (Separate Scene Pages)

KANBAN UPDATE
After completing this task:
1. Update this Kanban row to "Completato" with today's date
2. Add "Evidence: test-results/trailer-v9-phase3-<YYYY-MM-DD>.log" in Note
3. Run npm run kanban:lint and verify it passes
4. Attach lint, build:check, and kanban:lint output in final report

## Files to Modify
src/App.tsx (add 7 new routes, remove TrailerViewer from routing)

## Expected Output
Task completes with passing safeguards and evidence log.

## Dependencies
TRAILER-V9-PHASE1

## Timestamp
2026-07-17T16:19:44.393789+00:00

## Executor
manual
