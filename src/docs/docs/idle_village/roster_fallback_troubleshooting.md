---
title: Roster Fallback Troubleshooting Guide
status: archived
archived_date: 2026-07-22
reason: Outdated fallback patterns (TEST_ROSTER_HEROES, MINIMAL_GAMEPLAY_RESIDENTS, page-level conversion) superseded by the canonical Character-to-Resident architecture.
replacement: src/docs/docs/idle_village/trusted/character_resident_trusted.md
---

# Roster Fallback Troubleshooting Guide

> **ARCHIVED**: This document is retained for historical reference only.  
> It describes legacy fallback behavior that is no longer authoritative.  
> For the current canonical Character-to-Resident architecture, see:  
> **`src/docs/docs/idle_village/trusted/character_resident_trusted.md`**

## Problem: "Only 1 character visible in roster" (Legacy Issue)

### Symptoms
- "Mock roster attivo" message appears
- Only 1 character visible instead of 3
- Character data doesn't match TEST_ROSTER_HEROES

### Root Cause
The `savedCharacterToResident` conversion in `characterImport.ts` may fail silently for some characters in `TEST_ROSTER_HEROES`, causing them to be filtered out.

### Why This Happens
1. **localStorage is empty** → system uses fallback
2. **Fallback calls `savedCharacterToResident`** for each hero in TEST_ROSTER_HEROES
3. **Conversion may fail** for characters with certain stat configurations
4. **Failed conversions are filtered out** → only successful ones remain

### Permanent Solution

The fallback in `TestRosterPage.tsx` must use a **try/catch** pattern to ensure all characters are converted, even if some fail:

```typescript
const slotLabFallbackResidents = (defaultFatigue: number): ResidentState[] => {
  if (TEST_ROSTER_HEROES.length > 0) {
    const converted = TEST_ROSTER_HEROES.map((hero) => {
      try {
        return savedCharacterToResident(hero, { defaultFatigue });
      } catch (error) {
        console.error(`Failed to convert ${hero.name}:`, error);
        // Manual fallback for failed conversions
        const hpValue = hero.statBlock?.hp ?? 100;
        return {
          id: hero.id,
          displayName: hero.name,
          status: hero.status ?? 'available',
          fatigue: defaultFatigue,
          currentHp: hero.currentHp ?? hpValue,
          maxHp: hero.maxHp ?? hpValue,
          isHero: hero.isHero ?? false,
          isInjured: hero.isInjured ?? false,
          statSnapshot: hero.statSnapshot ?? { hp: hpValue, ...hero.statBlock },
          statTags: hero.statTags ?? [],
          portraitUrl: hero.portraitUrl,
          survivalCount: hero.survivalCount ?? 0,
          survivalScore: hero.survivalScore ?? 0,
          statProfileId: hero.statProfileId ?? hero.aiBehavior,
          visualProfileId: hero.visualProfileId,
        } as ResidentState;
      }
    });
    
    console.log(`Converted ${converted.length}/${TEST_ROSTER_HEROES.length} heroes successfully`);
    return converted;
  }
  // Legacy fallback
  return MINIMAL_GAMEPLAY_RESIDENTS.map(...);
};
```

### Verification Steps

1. **Clear localStorage**: `localStorage.clear()` in browser console
2. **Reload page**: Should see "Mock roster attivo"
3. **Check console**: Should see "Converted 3/3 heroes successfully"
4. **Verify roster**: Should see all 3 characters (Sir Spaccaculi, Salvatrice, Giggiolillo)

### Related Files
- `src/ui/idleVillage/TestRosterPage.tsx` - Contains `slotLabFallbackResidents`
- `src/balancing/config/idleVillage/testRosterResidents.ts` - Defines TEST_ROSTER_HEROES
- `src/engine/game/idleVillage/characterImport.ts` - Contains `savedCharacterToResident`

### Previous Fixes
- 2026-02-26: IV-ROSTER-FIX - Added try/catch pattern
- Multiple previous attempts documented in git history

### Prevention
- Always use try/catch when converting SavedCharacter to ResidentState
- Log conversion failures to identify problematic character data
- Provide manual fallback for failed conversions
- Test with empty localStorage to verify fallback works

### Testing
```bash
# Run roster tests
npm run test:test-roster

# Manual test in browser
1. Open http://localhost:5173/idle-village
2. Open DevTools Console
3. Run: localStorage.clear()
4. Reload page
5. Verify 3 characters appear
```
