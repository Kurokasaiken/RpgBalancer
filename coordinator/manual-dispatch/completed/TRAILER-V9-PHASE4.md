# Manual Task: TRAILER-V9-PHASE4

## Title
Idle Village Task - Trailer V9 Skin Alignment Phase 4: Test Hub Update

## Description
Idle Village Task - Trailer V9 Skin Alignment Phase 4: Test Hub Update

## Prompt
AGENT
Idle Village Task - Trailer V9 Skin Alignment Phase 4: Test Hub Update

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Update Test Hub to show 7 separate scene cards instead of single "Steam Teaser Trailer" card. This is Phase 4 of the approved trailer_v9_skin_alignment_plan.md. DEPENDS ON PHASE 3 COMPLETION.

CONTEXT
This is part of the Steam teaser trailer production pipeline. The trailer is exempt from gameplay architecture requirements but must preserve presentation architecture requirements. This code exists solely to produce recordable video content.

WHAT YOU MUST DO
1. Remove single "Steam Teaser Trailer" card from Test Hub
2. Add 7 separate cards for each scene (threat, choice, preparation, risk, consequence, legacy, outro)
3. Update descriptions to reflect V9 Explorer Journal theme
4. Update test_hub_pages.md documentation
5. Verify all 7 cards link to correct routes

@trailer-only CONVENTION
EXEMPT from gameplay architecture:
- NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- NO telemetry of any kind (marketing asset, not product)
- NO gameplay state mutation, NO economy systems, NO player progression

MUST PRESERVE:
- Config-first: Test Hub config from existing system, NO hardcoded values
- Skin/Theme: Use V9 skin variables in descriptions
- Component Reuse: Reuse existing Test Hub card pattern
- Documentation: Update test_hub_pages.md with new entries
- Node/tooling: Use pinned Node version from .nvmrc
- Safeguards: Run lint, build:check, kanban:lint before task complete

Test Hub Entries:
{
  id: 'trailer-threat',
  title: 'Trailer: Threat',
  description: 'Scene 1 - Goblin Invasion with V9 Explorer Journal theme',
  path: '/trailer-threat',
  icon: '⚔️',
  status: 'ok',
},
// Repeat for choice, preparation, risk, consequence, legacy, outro

SUCCESS CRITERIA
- Single "Steam Teaser Trailer" card removed
- 7 separate scene cards added to Test Hub
- All cards link to correct routes (/trailer-threat, /trailer-choice, etc.)
- Descriptions reflect V9 Explorer Journal theme
- test_hub_pages.md updated with new entries

INTEGRATION POINTS
- Test Hub: src/docs/docs/idle_village/test_hub_pages.md (update documentation)
- Test Hub Config: Existing Test Hub configuration (update entries)
- Routes: /trailer-threat, /trailer-choice, /trailer-preparation, /trailer-risk, /trailer-consequence, /trailer-legacy, /trailer-outro
- Plan Reference: src/docs/docs/plans/trailer_v9_skin_alignment_plan.md (Phase 4)

FILES TO MODIFY
1. src/docs/docs/idle_village/test_hub_pages.md (update Test Hub entries)
2. Test Hub configuration file (remove single card, add 7 scene cards)

TESTING REQUIREMENTS
- Manual browser test: Verify Test Hub shows 7 separate cards
- Navigation test: Verify each card links to correct route

DOCUMENTATION UPDATES
1. test_hub_pages.md: Update Test Hub entries with 7 scene cards
2. trailer_v9_skin_alignment_plan.md: Update Phase 4 progress in changelog

SAFEGUARDS
- Lint Scope: src/docs/docs/idle_village/ (120s timeout)
- Test Scope: None
- Build Check: npm run build:check (180s timeout)
- Kanban Lint: npm run kanban:lint (30s timeout)

PLAN REFERENCE
trailer_v9_skin_alignment_plan.md - Phase 4 (Test Hub Update)

KANBAN UPDATE
After completing this task:
1. Update this Kanban row to "Completato" with today's date
2. Add "Evidence: test-results/trailer-v9-phase4-<YYYY-MM-DD>.log" in Note
3. Run npm run kanban:lint and verify it passes
4. Attach lint, build:check, and kanban:lint output in final report

## Files to Modify
src/docs/docs/idle_village/test_hub_pages.md (update Test Hub entries)
Test Hub configuration file (remove single card, add 7 scene cards)

## Expected Output
Task completes with passing safeguards and evidence log.

## Dependencies
TRAILER-V9-PHASE1

## Timestamp
2026-07-17T16:19:44.394232+00:00

## Executor
manual
