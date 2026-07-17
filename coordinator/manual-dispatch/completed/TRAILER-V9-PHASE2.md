# Manual Task: TRAILER-V9-PHASE2

## Title
Idle Village Task - Trailer V9 Skin Alignment Phase 2: Component Architecture

## Description
Idle Village Task - Trailer V9 Skin Alignment Phase 2: Component Architecture

## Prompt
AGENT
Idle Village Task - Trailer V9 Skin Alignment Phase 2: Component Architecture

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `idle-village-task` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Wrap trailer scenes in WanderlustSurface and V9GlassLayers for consistent V9 Explorer Journal aesthetic. This is Phase 2 of the approved trailer_v9_skin_alignment_plan.md. DEPENDS ON PHASE 1 COMPLETION.

CONTEXT
This is part of the Steam teaser trailer production pipeline. The trailer is exempt from gameplay architecture requirements but must preserve presentation architecture requirements. This code exists solely to produce recordable video content.

WHAT YOU MUST DO
1. Wrap trailer scenes in WanderlustSurface (shape="panel", material="bronze")
2. Add V9GlassLayers for glass effects
3. Use InsetPanelDelicate for nested content
4. Apply V9 material presets (bronze, obsidian)
5. Update 6 scene components: TrailerThreat, TrailerChoice, TrailerPreparation, TrailerConsequence, TrailerLegacy, TrailerOutro

@trailer-only CONVENTION
EXEMPT from gameplay architecture:
- NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- NO telemetry of any kind (marketing asset, not product)
- NO gameplay state mutation, NO economy systems, NO player progression

MUST PRESERVE:
- Config-first: Material presets from MATERIAL_PRESETS, NO hardcoded values
- Skin/Theme: Use WanderlustSurface/V9GlassLayers from @/ui/wanderlust-surface
- Component Reuse: Reuse existing WanderlustSurface, V9GlassLayers, InsetPanelDelicate
- State Management: Use React Context for local presentation state, NO Zustand
- Documentation: JSDoc on all functions/interfaces, update plan changelog
- Node/tooling: Use pinned Node version from .nvmrc
- Safeguards: Run lint, build:check, kanban:lint before task complete

Component Updates:
- TrailerThreat.tsx: Use WanderlustSurface for map container
- TrailerChoice.tsx: Use WanderlustSurface for choice cards
- TrailerPreparation.tsx: Use InsetPanelDelicate for hero sheet
- TrailerConsequence.tsx: Use V9GlassLayers for overlay
- TrailerLegacy.tsx: Use WanderlustSurface for legacy cards
- TrailerOutro.tsx: Use WanderlustSurface for CTA

Example Pattern:
<WanderlustSurface 
  shape="panel" 
  material="bronze"
  interactive={false}
  style={{ width: '100%', height: '100%' }}
>
  <V9GlassLayers variant="base">
    {/* Scene content */}
  </V9GlassLayers>
</WanderlustSurface>

SUCCESS CRITERIA
- All 6 scene components use WanderlustSurface/V9GlassLayers
- Material presets from MATERIAL_PRESETS (bronze, obsidian)
- interactive={false} for static scenes
- Visual design matches V9 Explorer Journal reference
- No performance degradation

INTEGRATION POINTS
- Existing Components: TrailerThreat, TrailerChoice, TrailerPreparation, TrailerConsequence, TrailerLegacy, TrailerOutro
- V9 Components: WanderlustSurface, V9GlassLayers, InsetPanelDelicate from @/ui/wanderlust-surface
- Material Presets: MATERIAL_PRESETS from @/ui/wanderlust-surface/materialPresets
- Plan Reference: src/docs/docs/plans/trailer_v9_skin_alignment_plan.md (Phase 2)

FILES TO MODIFY
1. src/ui/idleVillage/trailer/TrailerThreat.tsx (add WanderlustSurface)
2. src/ui/idleVillage/trailer/TrailerChoice.tsx (add WanderlustSurface)
3. src/ui/idleVillage/trailer/TrailerPreparation.tsx (add InsetPanelDelicate)
4. src/ui/idleVillage/trailer/TrailerConsequence.tsx (add V9GlassLayers)
5. src/ui/idleVillage/trailer/TrailerLegacy.tsx (add WanderlustSurface)
6. src/ui/idleVillage/trailer/TrailerOutro.tsx (add WanderlustSurface)

TESTING REQUIREMENTS
- Manual browser test: Verify all scenes render with V9 components
- Performance test: Verify no performance degradation

DOCUMENTATION UPDATES
1. trailer_v9_skin_alignment_plan.md: Update Phase 2 progress in changelog

SAFEGUARDS
- Lint Scope: src/ui/idleVillage/trailer/ (120s timeout)
- Test Scope: None
- Build Check: npm run build:check (180s timeout)
- Kanban Lint: npm run kanban:lint (30s timeout)

PLAN REFERENCE
trailer_v9_skin_alignment_plan.md - Phase 2 (Component Architecture)

KANBAN UPDATE
After completing this task:
1. Update this Kanban row to "Completato" with today's date
2. Add "Evidence: test-results/trailer-v9-phase2-<YYYY-MM-DD>.log" in Note
3. Run npm run kanban:lint and verify it passes
4. Attach lint, build:check, and kanban:lint output in final report

## Files to Modify
src/ui/idleVillage/trailer/TrailerThreat.tsx (add WanderlustSurface)
src/ui/idleVillage/trailer/TrailerChoice.tsx (add WanderlustSurface)
src/ui/idleVillage/trailer/TrailerPreparation.tsx (add InsetPanelDelicate)
src/ui/idleVillage/trailer/TrailerConsequence.tsx (add V9GlassLayers)
src/ui/idleVillage/trailer/TrailerLegacy.tsx (add WanderlustSurface)
src/ui/idleVillage/trailer/TrailerOutro.tsx (add WanderlustSurface)

## Expected Output
Task completes with passing safeguards and evidence log.

## Dependencies
-

## Timestamp
2026-07-17T16:19:44.393060+00:00

## Executor
manual
