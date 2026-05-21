---
description: Playwright verification for spring-back correctness
---

# Motion Playwright: Spring-Back Test

## Task
Execute focused Playwright test to verify spring-back target correctness with precise measurements and automated validation.

## Instructions
1. Run the existing Playwright test suite for drag behavior
2. Execute specific spring-back verification test
3. Capture precise measurements and validate against contract
4. Generate pass/fail result with detailed evidence
5. Output structured test results

## Test Protocol

### Test Setup
- Navigate to roster page with draggable cards
- Wait for page to fully load
- Identify test target (first draggable roster card)

### Measurement Phase
```typescript
// Capture baseline measurements
const portraitNode = await page.locator('[aria-hidden="true"]').first();
const card = await page.locator('[data-testid="pg-card"]').first();

const portraitRect = await portraitNode.boundingBox();
const cardRect = await card.boundingBox();

const expectedTarget = {
  x: portraitRect.x + portraitRect.width / 2,
  y: portraitRect.y + portraitRect.height / 2
};
```

### Drag-Return Execution
```typescript
// Execute drag and spring-back
await card.hover();
await page.mouse.down();
await page.mouse.move(portraitRect.x + 150, portraitRect.y + 100);
await page.mouse.up();

// Wait for spring-back animation to complete
await page.waitForTimeout(500);
```

### Validation Phase
```typescript
// Capture final position
const finalRect = await card.boundingBox();
const finalCenter = {
  x: finalRect.x + finalRect.width / 2,
  y: finalRect.y + finalRect.height / 2
};

// Calculate distance
const distance = Math.abs(finalCenter.x - expectedTarget.x) + 
                 Math.abs(finalCenter.y - expectedTarget.y);

const withinTolerance = distance <= 10;
const leftEdgeSnap = finalCenter.x < expectedTarget.x - 50;
```

## Output Format
```json
{
  "test_timestamp": "2026-05-05T17:35:00Z",
  "test_environment": "playwright",
  "test_results": {
    "status": "pass|fail|marginal",
    "distance_from_target": number,
    "tolerance_threshold": 10,
    "within_tolerance": boolean,
    "left_edge_snap_detected": boolean
  },
  "measurements": {
    "portrait_rect": {...},
    "expected_target": {...},
    "final_position": {...},
    "distance_calculation": number
  },
  "evidence": {
    "screenshots": ["before.png", "during.png", "after.png"],
    "browser_console_logs": [...],
    "network_activity": [...]
  },
  "validation_summary": {
    "contract_compliance": boolean,
    "visual_continuity": boolean,
    "recommendation": "proceed_to_manual_signoff|investigate_failure"
  }
}
```

## Success Criteria
- **Pass**: Distance ≤ 10px, no left-edge snap
- **Marginal**: Distance 10-30px, requires investigation
- **Fail**: Distance > 30px or left-edge snap detected

## Automated Validation Rules
```typescript
const validateResult = (result) => {
  if (result.left_edge_snap_detected) return 'fail';
  if (result.distance_from_target <= 10) return 'pass';
  if (result.distance_from_target <= 30) return 'marginal';
  return 'fail';
};
```

## Required Evidence
- Screenshots at key test phases
- Console logs for debugging
- Network activity logs
- Precise coordinate measurements
- Distance calculations with tolerance assessment

## Integration
- Uses runtime probe measurements as baseline
- Results feed into manual signoff task
- Failure triggers requirement for user verification

## Notes
- This test is fully automated
- Provides objective measurements for motion behavior
- Cannot be overridden by code reasoning alone
- Results are evidence-based, not opinion-based
