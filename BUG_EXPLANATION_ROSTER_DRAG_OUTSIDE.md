# Bug Explanation: Roster Drag Outside Auto-Assignment

## Problem Summary
When dragging a PgCard (resident card) outside any valid slot and dropping it, the card gets automatically assigned to the first available slot instead of remaining unassigned. This violates the expected behavior where only drops on compatible slots should result in assignment.

## Expected Behavior
- Drag PgCard to valid slot → Assignment occurs ✅
- Drag PgCard to invalid slot → No assignment ✅  
- Drag PgCard outside any slot → No assignment ❌ (BUG: Assignment occurs)

## Test Case That Fails
```typescript
test('should not assign PgCard when dropping outside any slot', async ({ page }) => {
  const pgCard = page.getByTestId('pg-card').first();
  await expect(pgCard).toBeVisible();

  // Clear all slots
  const clearSlotsButton = page.getByRole('button', { name: /Clear Slots/i });
  await clearSlotsButton.click();
  const assignedWorkers = page.locator('[data-testid="assigned-worker"]');
  await expect(assignedWorkers).toHaveCount(0);

  // Verify initial status is Available
  await expect(pgCard.first()).toHaveAttribute('aria-label', /Available/);

  // Manual mouse drag to coordinates outside any slot (50, 50)
  const cardBox = await pgCard.boundingBox();
  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = 50;
  const endY = 50;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();

  // Wait for any async operations
  await page.waitForTimeout(300);
  
  // BUG: This should pass but fails - card becomes "Away"
  await expect(assignedWorkers).toHaveCount(0);
  await expect(pgCard.first()).toHaveAttribute('aria-label', /Available/);
});
```

## Architecture Overview

### Key Components
1. **TestRosterPage.tsx** - Main test harness with drag/drop logic
2. **DragTestContainer.tsx** - Renders PgCards and manages drag state
3. **PgCard.tsx** - Individual resident card component
4. **useResidentSlotController.ts** - Handles slot assignment logic

### Data Flow
```
PgCard (drag) → dnd-kit → handleDragEnd → handleRosterSelect → assignResidentToSlot
```

## Critical Code Sections

### 1. handleDragEnd (TestRosterPage.tsx)
```typescript
const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  const residentId = active.id as string;
  
  // Clear activeId immediately
  setActiveId(null);
  
  // IMPORTANT: If dropped outside any droppable (over is null), do NOT trigger any assignment
  if (!over) {
    console.log('🔍 [TestRosterPage] Dropped outside droppable, ignoring');
    // Add resident to returning set to prevent click-based assignment
    setReturningResidentIds(prev => new Set([...prev, residentId]));
    // Remove from returning set after a delay
    setTimeout(() => {
      setReturningResidentIds(prev => {
        const next = new Set(prev);
        next.delete(residentId);
        return next;
      });
    }, 500);
    return;
  }
  // ... rest of assignment logic
}, [setActiveId, setReturningResidentIds]);
```

### 2. handleRosterSelect (TestRosterPage.tsx)
```typescript
const handleRosterSelect = useCallback(
  (residentId: string) => {
    console.log('🔍 [TestRosterPage] handleRosterSelect called for resident:', residentId, 'activeId:', activeId, 'returningResidentIds:', returningResidentIds);
    
    // Block if currently dragging
    if (activeId === residentId) {
      console.log('🔍 [TestRosterPage] Blocking auto-assignment due to active drag');
      return;
    }

    // Block if resident is in returning set (recently dragged)
    if (returningResidentIds.has(residentId)) {
      console.log('🔍 [TestRosterPage] Blocking auto-assignment due to returning state');
      return;
    }

    // Block if resident is already away
    const resident = residents.find(r => r.id === residentId);
    if (resident?.status === 'away') {
      console.log('🔍 [TestRosterPage] Blocking auto-assignment due to away status');
      return;
    }

    // AUTO-ASSIGNMENT LOGIC (THIS IS WHAT WE WANT TO PREVENT)
    const openScenario = scenarioApisRef.current.open;
    if (openScenario) {
      const openAssignments = assignmentsByScenario.open;
      const firstEmptySlot = Object.keys(openAssignments).find((slotId) => !openAssignments[slotId]);

      if (firstEmptySlot) {
        console.log('🔍 [TestRosterPage] Auto-assigning to open slot:', firstEmptySlot);
        const result = openScenario.assignResident(residentId, firstEmptySlot);
        if (result) {
          handleScenarioAssignmentResult('open', result, residentId);
          return;
        }
      }
    }
    // ... similar logic for restricted scenario
  },
  [assignmentsByScenario, handleScenarioAssignmentResult, activeId, residents, returningResidentIds],
);
```

### 3. assignResidentToSlot (useResidentSlotController.ts)
```typescript
const assignResidentToSlot = useCallback<ResidentSlotControllerResult['assignResidentToSlot']>(
  (residentId, slotId) => {
    // If no specific slotId provided, do NOT auto-assign to any available slot
    if (!slotId) {
      return { success: false, reason: 'VALIDATION_FAILED', details: 'No specific slot provided. Please drop on a specific slot.' };
    }

    const targetSlot = slotViewModels.find((slot) => slot.id === slotId);
    if (!targetSlot) {
      return { success: false, reason: 'VALIDATION_FAILED', details: 'No suitable slot found.' };
    }

    // ... validation logic
    onAssign?.(targetSlot.id, residentId);
    return { success: true, slotId: targetSlot.id };
  },
  [activity, onAssign, residents, scheduler, slotViewModels, maxFatigueBeforeExhausted, customValidator],
);
```

### 4. ScenarioPanelApi.assignResident (TestRosterPage.tsx)
```typescript
assignResident: (residentId, preferredSlotId) => {
  // If preferredSlotId is provided, use it directly
  if (preferredSlotId) {
    const result = assignResidentToSlot(residentId, preferredSlotId);
    if (!result.success) {
      onAssignmentResult(scenario.id, result, residentId);
    }
    return result;
  }
  // For drag operations, DO NOT fallback to any slot - only use preferredSlotId
  console.log('🔍 [Scenario API] No preferredSlotId provided - this should not happen in drag operations');
  return { success: false, reason: 'VALIDATION_FAILED', details: 'Slot specifico richiesto per operazioni drag' } as ResidentSlotAssignResult;
},
```

## Attempts Made to Fix the Bug

### 1. Click Suppression in PgCard
- Added `recentlyDraggedResidentId` prop to block clicks after drag
- **Result**: Failed due to TypeScript type errors

### 2. Click Suppression in DragTestContainer
- Added `recentlyDraggedResidentId` state with 200ms timeout
- Modified `handleResidentSelectSafe` to block selections
- **Result**: Failed - bug persists

### 3. activeId Check in TestRosterPage
- Modified `handleRosterSelect` to block when `activeId === residentId`
- **Result**: Failed - bug persists

### 4. handleDragEnd Early Return
- Modified `handleDragEnd` to clear `activeId` and return early if `!over`
- **Result**: Failed - bug persists

### 5. dnd-kit Disabled State
- Modified `useDraggable` to disable when `dragFeedbackState === 'returning'`
- **Result**: Failed - bug persists

### 6. Returning Resident Set (Final Attempt)
- Added `returningResidentIds` Set with 500ms timeout
- Block auto-assignment when resident is in returning set
- **Result**: Failed - bug persists

## Root Cause Analysis

### What We Know
1. **dnd-kit correctly detects invalid drops** - `handleDragEnd` receives `over: null`
2. **Our early return in handleDragEnd works** - Console shows "Dropped outside droppable, ignoring"
3. **The assignment still happens** - Despite all our blocking mechanisms
4. **handleRosterSelect is being called** - This is where the auto-assignment occurs

### Hypotheses
1. **Synthetic Click Event**: dnd-kit might generate a synthetic click after drag that bypasses our controls
2. **Async State Update**: The state updates might not be synchronized properly
3. **Multiple Event Paths**: There might be another event listener we're not blocking
4. **dnd-kit Internal Behavior**: dnd-kit might have internal logic that triggers assignment

### Debug Evidence
From console logs during test:
```
🔍 [TestRosterPage] handleDragEnd called: {residentId: "resident-1", over: undefined, activeId: "resident-1"}
🔍 [TestRosterPage] Dropped outside droppable, ignoring
🔍 [TestRosterPage] handleRosterSelect called for resident: resident-1, activeId: null, returningResidentIds: Set(1)
🔍 [TestRosterPage] Auto-assigning to open slot: slot-lab-open-slot-0
```

This shows that despite `handleDragEnd` returning early and adding the resident to `returningResidentIds`, `handleRosterSelect` is still being called and performing auto-assignment.

## The Core Issue

The problem appears to be that **there's a disconnect between our drag end handling and the click/selection handling**. Even though we're blocking the drag end from proceeding, something else is triggering `handleRosterSelect` with the resident ID.

### Possible Culprits
1. **dnd-kit's synthetic click event** that fires after drag end
2. **React event bubbling** from the drag operation
3. **Multiple event listeners** on the same element
4. **Timing issue** where our blocking state isn't set when the click occurs

## Current Status
- **Bug persists** despite 6 different fix attempts
- **All safeguards pass** (lint, build, kanban)
- **Test consistently fails** showing the unwanted assignment
- **Root cause not identified** - requires deeper dnd-kit analysis

## Files to Investigate Further
1. **dnd-kit source code** - Understanding how it handles drag end events
2. **React event system** - Checking for event bubbling issues
3. **Browser event timeline** - Verifying the exact sequence of events
4. **Alternative drag libraries** - Considering if this is a known dnd-kit limitation

## Temporary Workaround (If Needed)
```typescript
// Completely disable auto-assignment for drag operations
const handleRosterSelect = useCallback((residentId: string) => {
  // TEMPORARY: Disable all auto-assignments until bug is resolved
  console.log('🔍 [TestRosterPage] Auto-assignment temporarily disabled due to drag bug');
  return;
}, []);
```

This would fix the bug but break legitimate click-to-assign functionality.
