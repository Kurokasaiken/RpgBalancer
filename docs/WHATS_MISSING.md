# 📋 What's Missing - Quick Summary

**Date:** 2025-11-27

---

## 🔴 Critical (Do Immediately)

1. **Complete EnhancedStatSlider Breakdown**
   - Break 235-line component into sub-components
   - Extract CSS to CSS Modules
   - **Why:** Too large, hard to maintain
   - **Time:** 4-6 hours

2. **Add Error Boundaries**
   - Prevent crashes from propagating
   - Better user experience
   - **Time:** 1 hour

---

## 🟡 Important (Do Soon)

### Skill Check Preview – Alt Visuals Cleanup

- [x] Replace the remaining `ALT_VISUAL_CARDS` grid with `ALT_VISUAL_SKINS`, leveraging the new `buildSkinGeometry` helper for card rendering.
- [x] Rewrite `renderAltVisualSvg` to consume `AltVisualSkin` data instead of the obsolete `AltVisualMeta/renderType` paths; remove the legacy render-type switch once complete.
- [ ] Reintroduce `altBallFrameRef` (or drop the unused animation effect) and fix the `useEffect`/`useMemo` dependency lists (`altRollInfo`, `altRollAnimKey`, `deltaEntries`, `questAverage`, `heroAverage`) so ESLint is satisfied.
- [x] Implement the requested proportional risk stripes: yellow (injury) and red (death) vertical bands clipped to the quest polygon with heights tied to the configured percentages.
- [ ] Remove the unused helpers (`computeAverage`, `computePolygonArea`, etc.) once the new renderer uses them or relocate them to a shared module.
- [x] Add rapid-preview skins (param-rose, ribbon-bezier, overlay-combo) plus poker clover/club/preset variants with labeled cards for user selection.

3. **WeightBasedCreator Abstraction**

   - Generic component for ALL entity creators
   - Foundation for Item/Character creators
   - **Time:** 6-8 hours

4. **Shared Component Library**
   - Glassmorphic Card, Button, Input
   - Consistent UI everywhere
   - **Time:** 8-12 hours

5. **Item Creator**
   - Apply weight-based pattern
   - Test pattern reusability
   - **Time:** 8-10 hours

6. **Character Creator**
   - Apply weight-based pattern
   - Complete entity creation suite
   - **Time:** 10-12 hours

### Il Drago Art Direction Rollout

- [ ] Creare i token materiali condivisi (`goldBevel`, `ivoryPlate`, `obsidianGlass`) dentro `src/styles/color-palette.css` e propagarli all’attuale tema Gilded Observatory.
- [ ] Implementare i componenti riusabili previsti dal piano (`CommandMedallion`, `AstrolabeClock`, `HeroicVerbToken`) sotto `src/ui/components/heroicRealism/`.
- [ ] Integrare i nuovi componenti nelle viste Idle Village (map markers, VerbCards sulla mappa, ciclo giorno/notte) leggendo i valori da config (`themeTokens` o store dedicato).
- [ ] Aggiornare la documentazione visiva (moodboard + README) con screenshot dei nuovi componenti e checklist “Tavolo del Comando”.

---

## 🟢 Nice to Have (Future)

7. **Unit Test Coverage** (currently 67%)
   - Target: 90%+
   - Hook tests, component tests
   - **Time:** 16-24 hours

8. **useStatSteps Hook Extraction**
   - Further reduce SpellCreation.tsx
   - Reusable stat management
   - **Time:** 2-3 hours

9. **Archetype Balancing System**
   - From original MASTER_PLAN
   - Advanced balancing features
   - **Time:** 20-30 hours

10. **Performance Optimization**
    - React.memo usage
    - useMemo/useCallback optimization
    - **Time:** 4-6 hours

---

## 📊 Current vs Target

| Metric | Current | Target |
|--------|---------|--------|
| **SpellCreation.tsx** | 326 lines | ~200 lines |
| **EnhancedStatSlider.tsx** | 235 lines | ~60 lines |
| **Test Coverage** | 67% | 90%+ |
| **TypeScript `any`** | Some | Zero |
| **CSS Modules** | 0% | 100% |
| **Error Boundaries** | 0 | All major sections |

---

## 🎯 Recommended Next Steps

**This Week:**
1. ✅ Finish Phase 2 refactoring (EnhancedStatSlider + CSS Modules)
2. ✅ Add error boundaries
3. ✅ Update documentation

**Week 9-10:**
1. Create WeightBasedCreator abstraction
2. Build shared component library
3. Document patterns thoroughly

**Week 11-12:**
1. Build Item Creator (test pattern)
2. Build Character Creator (validate pattern)
3. Add unit tests

---

## 💡 Big Picture

**What We Have:**
- ✅ Spell Creator (100% complete)
- ✅ Beautiful glassmorphic UI
- ✅ Weight-based pattern established

**What We Need:**
- 🔄 Better code organization (Phase 2)
- 📋 Pattern generalization (WeightBasedCreator)
- 📋 More entity creators (Item, Character)
- 📋 Better testing

**The Gap:**
We have a GREAT foundation but need to:
1. Clean up the code (refactoring)
2. Generalize the pattern (abstraction)
3. Apply it everywhere (Item/Character creators)

**Estimated Total Time:** 50-80 hours to complete everything
