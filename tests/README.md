# Playwright Tests for Idle Village

This directory contains Playwright end-to-end tests for the Idle Village sandbox.

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test
npx playwright test tests/activity-cards-parity.spec.ts

# With debug
DEBUG=useSandboxDragController npx playwright test tests/activity-cards-parity.spec.ts
```

## Drag Simulation Examples

### Basic Drag and Drop

Use `dragResidentCard` for simulating real drag events that trigger @dnd-kit:

```typescript
import { dragResidentCard } from './fixtures/villageSandbox';

await dragResidentCard(page, '[data-testid="resident-pc-trainee-1"]', '[data-testid="activity-slot-job_punch_training"]');
```

This performs step-by-step mouse simulation:

1. Mouse down on resident center
2. Move to slot center with intermediate steps (triggers `dragenter`)
3. Mouse up to complete drop

### Visual State Verification

After drag, verify visual states:

```typescript
// Check for bloom effect (valid drop)
await page.waitForFunction(() => {
  const harness = document.querySelector('[data-testid="action-detail-harness"]');
  return harness?.querySelector('.bloom') !== null;
}, { timeout: 5000 });

// Check for opacity (invalid drop)
await page.waitForFunction(() => {
  const harness = document.querySelector('[data-testid="action-detail-harness"]');
  return harness && harness.style.opacity !== '' && parseFloat(harness.style.opacity) < 1;
}, { timeout: 5000 });
```

### Diagnostics

Log `slotDropStates` for debugging:

```typescript
await page.evaluate(() => {
  const slotDropStates = window.__idleVillageTestHooks?.getSlotDropStates?.() ?? {};
  console.log('slotDropStates:', JSON.stringify(slotDropStates));
});
```

### Test Structure

1. Seed sandbox with `seedVillageSandbox`
2. Perform drag simulation
3. Verify states and capture screenshots
4. Clean up

## Fixtures

- `villageSandbox.ts`: Helpers for seeding, dragging, diagnostics
- Use `data-testid` attributes for reliable selectors
- Avoid hardcoded CSS classes; use semantic selectors

## Punch Club QA Tests

### Overview

This section covers Playwright E2E tests specifically for the Punch Club preset in the Idle Village sandbox. The tests focus on cross-device interaction QA, worker picker functionality, and state preservation.

### Running Punch Club Tests

```bash
npm run test:punch-club
```

This runs all `tests/punch-club-*.spec.ts` files with Desktop and Mobile Chrome projects.

### Test Files

- `punch-club-worker-picker.spec.ts`: Tests worker picker opening/closing and resident assignment.
- `punch-club-cross-device.spec.ts`: Comprehensive cross-device QA including tap mode (KPI latency <450ms, screenshots, telemetry), drag mode desktop, and state preservation.

### Fixtures and Helpers

Use `seedVillageSandbox(page, { tabId: 'punchClub', interactionMode: 'tap' | 'drag', preserveState: true })` for seeding.

Helpers in `tests/utils/sandbox.ts`:

- `openWorkerPicker(page, slotId)`: Clicks slot to open picker
- `assignViaPicker(page, residentId)`: Selects resident and closes picker
- `dragResidentToSlot(page, residentId, slotId)`: Direct drag

Collect telemetry with `collectSandboxTelemetry(page)`.
