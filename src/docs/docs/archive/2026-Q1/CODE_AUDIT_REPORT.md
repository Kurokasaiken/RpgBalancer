# Code Audit Report - RPG Balancer Project
**Date:** 2025-11-27  
**Audit Scope:** Full project review against master plan and philosophy

---

## Executive Summary

| Category | Status | Critical Issues |
|----------|--------|-----------------|
| ✅ Phase 1 (Notifications) | **COMPLETE** | 0 |
| ⚠️  Phase 2 (Component Restructuring) | **NOT STARTED** | 3 |
| ⚠️  Code Quality | **NEEDS ATTENTION** | 5 |
| ❌ Regressions | **DETECTED** | 2 |

**Overall Assessment:** 🟡 **Action Required**  
The project has successfully completed Phase 1 but has accumulated technical debt. Phase 2 refactoring is critical for maintainability.

---

## 1. Master Plan Implementation Status

### ✅ Phase 1: Quick Wins (COMPLETE)
- [x] Sonner installed and integrated
- [x] Toaster component created
- [x] All `alert()` calls replaced with toasts in SpellCreation.tsx
- [x] Documentation created (PROJECT_PHILOSOPHY.md, ARCHITECTURE.md)

### ❌ Phase 2: Component Restructuring (NOT STARTED)
- [ ] Extract `useWeightedBalance` hook
- [ ] Extract `useStatSteps` hook  
- [ ] Extract `useDefaultStorage` hook
- [ ] Break down EnhancedStatSlider into sub-components
- [ ] Extract CSS to CSS Modules

### ❌ Phase 3: Pattern Generalization (NOT STARTED)
- [ ] Create abstract `WeightBasedCreator` component
- [ ] Item Creator
- [ ] Character Creator

---

## 2. Detected Regressions

### 🔴 REGRESSION 1: Balance Calculation Changed
**File:** `SpellCreation.tsx` (Line 200-218)  
**Issue:** Balance formula was simplified from complex spell budget calculation to basic weight sum.

**Original (from spellBalancingConfig):**
```tsx
calculateSpellBudget(spell, weights, baseline)
// Uses delta × weight formula
```

**Current:**
```tsx
balance = Σ(selected_weights) - Target_Cost
// Simplified weight-only formula
```

**Impact:** 🚨 **CRITICAL**  
- User-defined baseline system partially bypassed
- `calculateSpellBudget` still called but result unused for balance
- Formula changed significantly (may affect existing saved spells)

**Recommendation:**
- Clarify intended behavior with user
- If simplified formula is correct, remove unused `calculateSpellBudget` call
- If complex formula needed, revert balance calculation

### 🟡 REGRESSION 2: EnhancedStatSlider Complexity Increased
**File:** `EnhancedStatSlider.tsx`  
**Lines:** 235 (up from planned 60)

**Issue:** Multiple refactors added drag logic without extracting to hooks.

**Current State:**
- Mouse event handling inline (lines 43-76)
- Layout logic mixed with business logic
- No separation of concerns

**Recommendation:** Extract to `useStatSlider.ts` hook as planned

---

## 3. Code Quality Issues

### 🔴 ISSUE 1: SpellCreation.tsx is Too Large
**File:** `SpellCreation.tsx`  
**Lines:** 435 (target was ~200)  
**Complexity:** Very High

**Problems:**
```tsx
// Duplicated localStorage reading (4x times!)
const [statSteps, setStatSteps] = useState(() => {
    try {
        const savedDefault = localStorage.getItem('userDefaultSpell');
        ...
    } catch { }
});

const [selectedTicks, setSelectedTicks] = useState(() => {
    try {
        const savedDefault = localStorage.getItem('userDefaultSpell'); // DUPLICATE
        ...
    } catch { }
});

const [statOrder, setStatOrder] = useState(() => {
    try {
        const savedDefault = localStorage.getItem('userDefaultSpell'); // DUPLICATE
        ...
    } catch { }
});
```

**Solution:** Extract to `useDefaultStorage` hook:
```tsx
const { spell, statSteps, selectedTicks, statOrder, collapsedStats } = useDefaultStorage();
```

### 🟡 ISSUE 2: Inline Balance Calculation
**File:** `SpellCreation.tsx` (Lines 200-218)

**Current:**
```tsx
const calculateBalance = (): number => {
    const allStats = [...coreStats, ...advancedStats, ...optionalStats];
    const totalWeightCost = allStats.reduce((sum, field) => {
        // ... complex logic
    }, 0);
    return totalWeightCost - targetBudget;
};
```

**Should Be:**
```tsx
const balance = useWeightedBalance(
    spell,
    statSteps,
    selectedTicks,
    targetBudget,
    [...coreStats, ...advancedStats, ...optionalStats]
);
```

### 🟡 ISSUE 3: No CSS Modules (Still Using Inline Tailwind)
**Files:** All UI components  
**Issue:** Complex inline className strings everywhere

**Example:**
```tsx
className={`w-6 h-6 rounded-full border-2 border-white transition-all ${
    selectedTick === idx
        ? isDragging 
            ? 'scale-125 bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,1)]' 
            : 'bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.8)]'
        : 'opacity-0'
}`}
```

**Should Be (CSS Module):**
```tsx
import styles from './EnhancedStatSlider.module.css';
className={cn(styles.sliderThumb, {
    [styles.active]: selectedTick === idx,
    [styles.dragging]: isDragging
})}
```

### 🟡 ISSUE 4: Stat Arrays Defined Inline
**File:** `SpellCreation.tsx` (Lines 160-162)

**Current:**
```tsx
const coreStats = ['effect', 'eco', 'dangerous'];
const advancedStats = ['scale', 'precision'];
const optionalStats = ['aoe', 'cooldown', 'range', 'priority', 'manaCost'];
```

**Should Be:**
```tsx
// src/balancing/spellStatDefinitions.ts
export const SPELL_STAT_DEFINITIONS = {
    core: ['effect', 'eco', 'dangerous'],
    advanced: ['scale', 'precision'],
    optional: ['aoe', 'cooldown', 'range', 'priority', 'manaCost']
};
```

### 🟡 ISSUE 5: No Error Boundaries
**Files:** All UI components  
**Issue:** No error handling for component crashes

**Recommendation:** Add error boundaries for each major section

---

## 4. Code Smells and Anti-Patterns

### Smell 1: God Component
**Component:** `SpellCreation.tsx`  
**Responsibilities:** 10+ (State, Storage, D&D, Balance, UI, Events, Validation...)  
**SRP Violations:** Multiple

### Smell 2: Prop Drilling
**Path:** `SpellCreation` → `StatsGrid` → `EnhancedStatSlider`  
**Props Passed:** 10+ props through intermediate component

### Smell 3: Magic Numbers
**Everywhere:** Hardcoded values without constants
```tsx
{ticks.length > 3 && ...}  // Why 3?
max-w-[70px]  // Why 70px?
```

### Smell 4: No TypeScript Strictness
**Issue:** Using `any` types
```tsx
(spell as any)[field]  // Line 84, 89
(defaultSpell as any)[key]  // Line 261
```

---

## 5. Adherence to Project Philosophy

### ✅ Followed Correctly
1. **Weight-Based Pattern:** Core formula correctly implemented
2. **Glassmorphic Design:** Consistently applied
3. **User-Defined Baseline:** Saving/loading works
4. **Toast Notifications:** Modern UX implemented

### ❌ Not Followed
1. **Component Modularity:** Components too large
2. **CSS Organization:** No CSS Modules (all inline Tailwind)
3. **Custom Hooks:** None extracted yet
4. **Single Source of Truth:** Stat definitions duplicated

---

## 6. Missing Features from Master Plan

### Priority 1 (Critical for Maintainability)
- [ ] `useWeightedBalance` hook
- [ ] `useStatSteps` hook
- [ ] `useDefaultStorage` hook
- [ ] CSS Modules for EnhancedStatSlider

### Priority 2 (Important for Scalability)
- [ ] `WeightBasedCreator` abstract component
- [ ] Stat definitions moved to config file
- [ ] Error boundaries

### Priority 3 (Nice to Have)
- [ ] Item Creator
- [ ] Character Creator
- [ ] Unit tests

---

## 7. Other Parts of the Project

### Files Scanned (36 total)
- **Spell System:** 8 files (SpellCreation.tsx, SpellEditor.tsx, SpellLibrary.tsx + components)
- **Balancer:** 4 files (Balancer.tsx, CriticalCard.tsx, HitChanceCard.tsx, MitigationCard.tsx)
- **Arena/Grid:** 7 files (grid system components)
- **Character System:** 3 files (CharacterBuilder.tsx, CharacterManager.tsx, IdleArena.tsx)
- **Testing/Verification:** 4 files (labs and testing tools)
- **Shared Components:** 4 files (CardWrapper, GenericParamCard, SmartInput, Tooltip)

### Compliance Status (Quick Scan)

| Section | Following Philosophy? | Needs Refactor? |
|---------|----------------------|-----------------|
| SpellCreation ✅ | Partial | Yes (Priority 1) |
| Balancer ??? | Unknown | To Review |
| CharacterManager ??? | Unknown | To Review |
| SpellLibrary ??? | Unknown | To Review |
| GridArena ??? | Unknown | To Review |

**Note:** Only SpellCreation fully analyzed. Other sections need detailed audit.

---

## 8. Questions for User

### Critical Decision Points

1. **Balance Formula Regression:**
   - Should balance = `Σ(weights) - target` (current simple)?
   - OR should it use `calculateSpellBudget()` with delta×weight (original)?
   - This affects the entire balancing philosophy!

2. **Phase 2 Priority:**
   - Start Phase 2 refactoring now?
   - Or continue with features and refactor later?

3. **Scope of Audit:**
   - Deep dive into other UI sections (Balancer, CharacterManager, etc.)?
   - Or focus only on Spell system for now?

4. **Breaking Changes:**
   - OK to refactor with breaking changes?
   - Or need backward compatibility with saved spells?

5. **CSS Module Migration:**
   - All components at once?
   - Or gradual migration (highest complexity first)?

---

## 9. Recommended Action Plan

### Immediate (Next Session)
1. **Clarify balance formula** with user
2. **Extract 3 core hooks** (useWeightedBalance, useStatSteps, useDefaultStorage)
3. **Fix SpellCreation size** (~435 → ~200 lines)

### Short Term (Next 2-3 Sessions)
1. **Extract EnhancedStatSlider sub-components**
2. **Create CSS Modules** for slider
3. **Move stat definitions** to config file
4. **Add error boundaries**

### Medium Term (After 1 Month)
1. **Create WeightBasedCreator** abstract component
2. **Build Item Creator** using pattern
3. **Audit other UI sections** (Balancer, CharacterManager, etc.)
4. **Add unit tests**

---

## 10. Files to Refactor (Priority Order)

### 🔴 Critical (Do First)
1. `src/ui/spell/SpellCreation.tsx` (435 lines → 200 lines)
2. `src/ui/spell/components/EnhancedStatSlider.tsx` (235 lines → 60 lines)

### 🟡 Important (Do Second)
3. Create `src/shared/hooks/useWeightedBalance.ts`
4. Create `src/shared/hooks/useStatSteps.ts`
5. Create `src/shared/hooks/useDefaultStorage.ts`
6. Create `src/balancing/spellStatDefinitions.ts`

### 🟢 Enhancement (Do Third)
7. Create `src/ui/spell/components/EnhancedStatSlider/styles.module.css`
8. Create `src/shared/components/WeightBasedCreator/index.tsx`

---

## Summary Statistics

**Total Files:** 36 UI files  
**Analyzed in Detail:** 2 files (SpellCreation, EnhancedStatSlider)  
**Critical Issues:** 2 regressions, 5 quality issues  
**Lines to Refactor:** ~670 lines (SpellCreation + EnhancedStatSlider)  
**Estimated Refactoring Time:** 4-6 hours  
**Master Plan Completion:** Phase 1 ✅ | Phase 2 ❌ | Phase 3 ❌

---

**Next Steps:** Await user decisions on critical questions, then proceed with recommended action plan.
