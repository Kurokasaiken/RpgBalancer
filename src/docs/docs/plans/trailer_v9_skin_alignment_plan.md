# Trailer V9 Skin Alignment Plan

## Objective
Align the Steam teaser trailer visual design to the V9 Explorer Journal theme, replacing hardcoded colors with V9 skin variables and using WanderlustSurface/V9GlassLayers for consistent aesthetics.

## Problem Analysis

### Current State
- **trailer.css**: Uses hardcoded colors (#030202, #d8b13e, #f0cf6a, #ede0c4)
- **Components**: Do not use WanderlustSurface or V9GlassLayers
- **Design**: Generic dark/gold theme, not aligned with V9 Explorer Journal
- **Architecture**: Single auto-cycle page, not separate scene pages for recording

### V9 Explorer Journal Reference
**Palette (from v9-skin-sandbox.tsx):**
- Obsidian base: `var(--skin-surface-base)`
- Azure light: `var(--skin-icon-accent)` 
- Gold/bronze: `var(--skin-title-color)`
- Ivory: `var(--skin-text-primary)`
- Text secondary: `var(--skin-text-secondary)`
- Text muted: `var(--skin-text-muted)`
- Surface bg: `var(--skin-surface-bg)`
- Border gold: `var(--skin-surface-border)`
- Glow azure: `var(--skin-glow-accent)`
- Glow gold: `var(--skin-glow-primary)`

**Materials:**
- Lacquered wood, aged brass, polished bronze
- Volumetric lighting (cyan top-left + gold bottom-right)
- Multiple physically stacked layers with subtle imperfections

**Typography:**
- Roman inscription-inspired serif
- Generous tracking (0.18em for titles)
- Uppercase for headers

**Components:**
- WanderlustSurface (shapes: panel, card, badge, medallion, tablet)
- V9GlassLayers (oily prismatic bronze + wilderness green)
- InsetPanelDelicate (for slot rack-like elements)

## Strategic Approach

### Phase 1: CSS Variables Alignment (High Priority)
**Goal:** Replace all hardcoded colors with V9 skin variables

**Actions:**
1. Refactor `trailer.css` to use V9 skin variables
2. Replace hardcoded colors with CSS variable references
3. Add V9-specific typography (serif, tracking)
4. Update gradients to match V9 volumetric lighting pattern

**File:** `src/ui/idleVillage/trailer/trailer.css`

**Changes:**
```css
/* Before */
--trailer-bg: #030202;
--trailer-gold: #d8b13e;
--trailer-gold-bright: #f0cf6a;
--trailer-parchment: #ede0c4;

/* After */
--trailer-bg: var(--skin-surface-base);
--trailer-gold: var(--skin-title-color);
--trailer-gold-bright: var(--skin-glow-primary);
--trailer-parchment: var(--skin-text-primary);
--trailer-azure: var(--skin-icon-accent);
--trailer-text-secondary: var(--skin-text-secondary);
--trailer-surface-bg: var(--skin-surface-bg);
--trailer-border: var(--skin-surface-border);
```

### Phase 2: Component Architecture (High Priority)
**Goal:** Use WanderlustSurface and V9GlassLayers for consistent V9 aesthetic

**Actions:**
1. Wrap trailer scenes in WanderlustSurface (shape="panel")
2. Add V9GlassLayers for glass effects
3. Use InsetPanelDelicate for nested content
4. Apply V9 material presets (bronze, obsidian)

**Components to update:**
- `TrailerThreat.tsx` - Use WanderlustSurface for map container
- `TrailerChoice.tsx` - Use WanderlustSurface for choice cards
- `TrailerPreparation.tsx` - Use InsetPanelDelicate for hero sheet
- `TrailerConsequence.tsx` - Use V9GlassLayers for overlay
- `TrailerLegacy.tsx` - Use WanderlustSurface for legacy cards
- `TrailerOutro.tsx` - Use WanderlustSurface for CTA

**Example pattern:**
```tsx
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
```

### Phase 3: Separate Scene Pages (Medium Priority)
**Goal:** Create individual pages for each scene for recording workflow

**Actions:**
1. Create 7 separate page components:
   - `TrailerThreatPage.tsx` - `/trailer-threat`
   - `TrailerChoicePage.tsx` - `/trailer-choice`
   - `TrailerPreparationPage.tsx` - `/trailer-preparation`
   - `TrailerRiskPage.tsx` - `/trailer-risk`
   - `TrailerConsequencePage.tsx` - `/trailer-consequence`
   - `TrailerLegacyPage.tsx` - `/trailer-legacy`
   - `TrailerOutroPage.tsx` - `/trailer-outro`

2. Each page renders only its scene (no auto-cycle, no debug buttons)
3. Add routes in `App.tsx`
4. Update Test Hub to show 7 separate cards

**File structure:**
```
src/ui/idleVillage/trailer/
├── TrailerThreatPage.tsx (new)
├── TrailerChoicePage.tsx (new)
├── TrailerPreparationPage.tsx (new)
├── TrailerRiskPage.tsx (new)
├── TrailerConsequencePage.tsx (new)
├── TrailerLegacyPage.tsx (new)
├── TrailerOutroPage.tsx (new)
└── TrailerViewer.tsx (keep for reference, but remove from routing)
```

### Phase 4: Test Hub Update (Medium Priority)
**Goal:** Update Test Hub to show separate scene pages

**Actions:**
1. Remove single "Steam Teaser Trailer" card
2. Add 7 separate cards for each scene
3. Update descriptions to reflect V9 Explorer Journal theme
4. Update `test_hub_pages.md` documentation

**Test Hub entries:**
```tsx
{
  id: 'trailer-threat',
  title: 'Trailer: Threat',
  description: 'Scene 1 - Goblin Invasion with V9 Explorer Journal theme',
  path: '/trailer-threat',
  icon: '⚔️',
  status: 'ok',
},
// ... (repeat for all 7 scenes)
```

## Design Guidelines

### V9 Explorer Journal Theme Application

**Background:**
- Use `var(--skin-surface-base)` as base
- Add V9 volumetric lighting: cyan top-left, gold bottom-right
- Reference V9GlassLayers lighting pattern

**Typography:**
- Use serif font family from V9 tokens
- Title tracking: 0.18em uppercase
- Body: `var(--skin-text-primary)`
- Secondary: `var(--skin-text-secondary)`

**Borders & Glows:**
- Border: `var(--skin-surface-border)`
- Gold glow: `var(--skin-glow-primary)`
- Azure glow: `var(--skin-glow-accent)`

**Materials:**
- Primary: `bronze` material preset
- Secondary: `obsidian` for dark elements
- Use WanderlustSurface for all containers

**Decorative Elements:**
- Compass roses (from V9GlassLayers)
- Celestial motifs
- Explorer symbols (subtle, never overpowering)

## Implementation Order

1. **CSS Variables Alignment** (Phase 1) - Foundation for all visual changes
2. **Component Architecture** (Phase 2) - Apply V9 components to existing scenes
3. **Separate Scene Pages** (Phase 3) - Create recording workflow
4. **Test Hub Update** (Phase 4) - Update navigation

## Success Criteria

- [ ] All trailer colors use V9 skin variables
- [ ] All trailer scenes use WanderlustSurface/V9GlassLayers
- [ ] Typography matches V9 Explorer Journal (serif, tracking)
- [ ] 7 separate scene pages accessible via routes
- [ ] Test Hub shows 7 separate scene cards
- [ ] Visual design matches V9 Explorer Journal reference
- [ ] Recording workflow enabled (separate pages per scene)

## Risks & Mitigations

**Risk:** V9 skin variables not available in trailer context
**Mitigation:** Verify skin preferences are loaded in trailer pages, use fallback values

**Risk:** WanderlustSurface performance impact
**Mitigation:** Set `interactive={false}` for static scenes, `isPaused={true}` if needed

**Risk:** Separate pages increase code duplication
**Mitigation:** Extract common scene logic into shared hooks/components

## Timeline Estimate

- Phase 1 (CSS Variables): 1-2 hours
- Phase 2 (Component Architecture): 2-3 hours
- Phase 3 (Separate Pages): 2-3 hours
- Phase 4 (Test Hub): 1 hour

**Total:** 6-9 hours

## Changelog

- **2026-07-17** — Phase 1: CSS Variables Alignment completed. `src/ui/idleVillage/trailer/trailer.css` now uses V9 skin variables and V9 display font/tracking for `.trailer-banner`. Gradients updated to volumetric cyan top-left + gold bottom-right pattern. Build check passes.
- **2026-07-17** — Phase 2: Component Architecture completed. All six trailer scene components (`TrailerThreat`, `TrailerChoice`, `TrailerPreparation`, `TrailerConsequence`, `TrailerLegacy`, `TrailerOutro`) now use V9 primitives: `WanderlustSurface` (panel/card/badge), `V9GlassLayers` (base/sapphire), and `InsetPanelDelicate` (obsidian). Removed hardcoded background gradients in favor of glass layers; `trailer.css` adds layout helpers for full-bleed surface wrappers. Lint and build:check pass.
- **2026-07-17** — Phase 3: Separate Scene Pages completed. Created 7 dedicated page components (`TrailerThreatPage`, `TrailerChoicePage`, `TrailerPreparationPage`, `TrailerRiskPage`, `TrailerConsequencePage`, `TrailerLegacyPage`, `TrailerOutroPage`) under `src/ui/idleVillage/trailer/`. Added matching routes in `src/App.tsx` (`/trailer-threat`, `/trailer-choice`, `/trailer-preparation`, `/trailer-risk`, `/trailer-consequence`, `/trailer-legacy`, `/trailer-outro`). Removed `/trailer` route while retaining `TrailerViewer` for reference. Each page renders a single scene with `autoStart` and without cycling. Lint and build:check pass.
- **2026-07-17** — Phase 4: Test Hub Update completed. Replaced single `/trailer` card in `src/ui/idleVillage/TestHub.tsx` with 7 separate scene cards (`trailer-threat`, `trailer-choice`, `trailer-preparation`, `trailer-risk`, `trailer-consequence`, `trailer-legacy`, `trailer-outro`), each linking to the dedicated scene route and describing the V9 Explorer Journal theme. Updated `src/docs/docs/idle_village/test_hub_pages.md` with the 7 entries. Lint and build:check pass.
- **2026-07-18** — `TrailerThreatIter` (`/trailer-threat-iter`) refinement: `TrailerThreatDetailPanel.tsx` now uses `SkinScope`, `SkinTitle`, and `--skin-*` tokens for plaque, inset, and titlesep styling; the event panel is centered and transitions/morphs to a shorter top-right timer bar via CSS transitions. Preserved `WanderlustSurface` bronze frame. Lint, build:check, and kanban:lint pass; smoke test returns 200 with no console errors.

## Next Steps

1. Execute Phase 2: Component Architecture
2. Execute Phase 3: Separate Scene Pages
3. Execute Phase 4: Test Hub Update
4. Visual verification against V9 Explorer Journal reference
5. Recording workflow test
