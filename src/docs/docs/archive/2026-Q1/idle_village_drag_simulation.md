# Idle Village Drag Simulation Fix

**Date:** 2026-01-03  
**Issue:** Playwright tests using `page.dragAndDrop` do not trigger @dnd-kit drag events, preventing `slotDropStates` updates and visual drop states (bloom, opacity).

## Problem Analysis

- `page.dragAndDrop` performs DOM-level drag but bypasses React event handlers.
- @dnd-kit relies on browser drag events (`dragstart`, `dragenter`, `drop`) to update drop states.
- Without triggered events, `slotDropStates` remains empty, dropState stays 'idle', visual effects don't appear.

## Solution: Mouse Event Simulation

Replace `page.dragAndDrop` with step-by-step mouse simulation using `page.mouse`:

1. Get bounding boxes of source and target elements.
2. `mouse.move` to source center.
3. `mouse.down` to start drag.
4. `mouse.move` to target center with steps to trigger `dragenter`.
5. `mouse.up` to complete drop.

This triggers real browser drag events that @dnd-kit listens to.

## Implementation

### Updated `dragResidentCard`

```typescript
export const dragResidentCard = async (page: Page, residentSelector: string, slotSelector: string) => {
  const residentBox = await page.locator(residentSelector).boundingBox();
  const slotBox = await page.locator(slotSelector).boundingBox();
  if (!residentBox || !slotBox) {
    throw new Error('Could not get bounding boxes for drag');
  }

  const residentCenter = {
    x: residentBox.x + residentBox.width / 2,
    y: residentBox.y + residentBox.height / 2,
  };
  const slotCenter = {
    x: slotBox.x + slotBox.width / 2,
    y: slotBox.y + slotBox.height / 2,
  };

  await page.mouse.move(residentCenter.x, residentCenter.y);
  await page.mouse.down();
  await page.waitForTimeout(100); // Allow dragstart

  await page.mouse.move(slotCenter.x, slotCenter.y, { steps: 10 });
  await page.waitForTimeout(200); // Allow visual updates

  await page.mouse.up();
  await page.waitForTimeout(100); // Allow drop
};
```

### Test Updates

- Use `dragResidentCard` for valid and invalid drag simulations.
- Add diagnostics logging `slotDropStates` after drag.
- Add `waitForFunction` for visual state verification (bloom class, opacity).

## Evidence

**Before Fix:**
- `slotDropStates`: {}
- `dropState`: 'idle'
- Screenshots show no bloom/opacity differences.

**After Fix:**
- `slotDropStates`: { 'job_punch_training': 'valid' } (for compatible resident)
- `dropState`: 'valid' or 'invalid'
- Bloom visible for valid drops, opacity applied for invalid.

**Performance Impact:**
- Test duration +2-3s due to mouse simulation steps.
- Reliable triggering of visual states for regression testing.

## Next Steps

- Monitor test stability with mouse simulation.
- Add more granular visual state checks if needed.
- Extend to other drag/drop test scenarios.
