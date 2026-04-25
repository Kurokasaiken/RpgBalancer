# Idle Village Phase E: Resident Drag Drop Validation

**Date:** 2026-01-03  
**Status:** ✅ Implemented  
**File:** `src/ui/idleVillage/legacy/IdleVillageMapPage.tsx`

## Overview

Implemented config-first drag resident validation on IdleVillageMapPage with dynamic validation for stat tags, fatigue thresholds, and crew limits. Added visual feedback via slotDropStates and integrated with existing assignment logic.

## Implementation Details

### 1. Enhanced canSlotAcceptDrop
- **Function:** `canSlotAcceptDrop(slotId: string, residentId?: string | null)`
- **Config-First:** Reads all validation rules from `IdleVillageConfig`
- **Validation Checks:**
  - Resident availability (`status === 'available'`)
  - Fatigue threshold (`fatigue < maxFatigueBeforeExhausted`)
  - Slot unlock status (`isInitiallyUnlocked`)
  - Stat tag requirements via `evaluateStatRequirement()`
  - Crew limits via `maxSlots` on activities

### 2. Visual Drop Feedback
- **slotDropStates:** `useMemo<Record<string, DropState>>`
- **Logic:** Computes 'valid'/'invalid'/'idle' for each slot during drag
- **Integration:** Passes `slotDropState` to `MapLocationSlot` components
- **Visual States:** Green ring for valid, red ring for invalid drops

### 3. Diagnostics & Error Handling
- **Validation Messages:** Detailed feedback via `updateAssignmentFeedback()`
- **Stat Requirement Details:** Shows missing tags, blocked tags, etc.
- **Crew Limit Warnings:** Prevents drops when slot capacity exceeded
- **Fatigue Alerts:** Real-time fatigue checking during drag

### 4. Config Integration
- **Stat Tags:** Reads from `activity.statRequirement.allOf/anyOf/noneOf`
- **Fatigue Rules:** Uses `config.globalRules.maxFatigueBeforeExhausted`
- **Crew Limits:** Checks `activity.maxSlots` against current assignments
- **Slot Compatibility:** Validates `slotTags` matching

### 5. Performance Optimizations
- **useMemo:** `canSlotAcceptDrop` cached with proper dependencies
- **useMemo:** `slotDropStates` computed only during drag
- **Efficient Checks:** Early returns for basic validations

## API Changes

### MapLocationSlot Props
```typescript
interface MapLocationSlotProps {
  // ... existing
  slotDropState?: DropState;  // NEW: 'idle' | 'valid' | 'invalid'
}
```

### Validation Function
```typescript
canSlotAcceptDrop(slotId: string, residentId?: string | null): boolean
```

## Testing Considerations

- **Playwright Integration:** Validation triggers during `dragResidentCard` utility calls
- **Visual Regression:** Drop states affect slot appearance (rings, colors)
- **Error Scenarios:** Test invalid drops show proper feedback
- **Config Variations:** Test different stat requirements and crew limits

## Files Modified

- `src/ui/idleVillage/legacy/IdleVillageMapPage.tsx` - Main implementation
- `src/ui/idleVillage/components/MapLocationSlot.tsx` - Already supports slotDropState

## Future Integration

- **useMapContext:** Conceptual integration via similar validation logic
- **Sandbox Compatibility:** Aligns with modern drag controller patterns
- **Error Boundaries:** Graceful handling of config load failures

## Validation Examples

### Valid Drop
- Resident: Available, low fatigue, correct stat tags
- Slot: Unlocked, compatible activity, crew capacity available
- Feedback: Green highlight, successful assignment

### Invalid Drop (Fatigue)
- Resident: High fatigue (> maxFatigueBeforeExhausted)
- Result: Red highlight, feedback "troppo stanco"
- Prevention: canSlotAcceptDrop returns false

### Invalid Drop (Stat Tags)
- Resident: Missing required allOf tags
- Result: Red highlight, detailed missing tags message
- Prevention: evaluateStatRequirement blocks incompatible drops

### Invalid Drop (Crew Limit)
- Slot: Max crew reached for available activities
- Result: Red highlight, capacity warning
- Prevention: Crew count check prevents over-assignment
