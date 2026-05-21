---
description: Runtime probe for drag-return measurements
---

# Motion Probe: Drag-Return Measurements

## Task
Perform lightweight runtime measurement of drag-return behavior to capture precise metrics for spring-back verification.

## Instructions
1. Start the development server
2. Navigate to the roster page with draggable cards
3. Execute automated drag-return measurement probe
4. Capture precise metrics for portrait origin and spring-back behavior
5. Output measured data in structured JSON format

## Measurement Protocol

### Target Selection
- Find first available draggable roster card
- Identify portrait DOM node with `[aria-hidden="true"]` attribute
- Verify card is in idle state (not currently dragging)

### Baseline Measurements
```javascript
const portraitNode = card.querySelector('[aria-hidden="true"]');
const portraitRect = portraitNode.getBoundingClientRect();
const cardRect = card.getBoundingClientRect();

const baseline = {
  portrait_origin: {
    left: portraitRect.left,
    top: portraitRect.top,
    width: portraitRect.width,
    height: portraitRect.height,
    center_x: portraitRect.left + portraitRect.width / 2,
    center_y: portraitRect.top + portraitRect.height / 2
  },
  card_rect: {
    left: cardRect.left,
    top: cardRect.top,
    width: cardRect.width,
    height: cardRect.height
  }
};
```

### Drag-Return Test
1. Simulate pointer down on portrait area
2. Drag to offset position (+150px horizontal, +100px vertical)
3. Release pointer to trigger spring-back
4. Measure final position after animation completes

### Final Measurements
```javascript
const finalRect = card.getBoundingClientRect();
const finalPosition = {
  left: finalRect.left,
  top: finalRect.top,
  center_x: finalRect.left + finalRect.width / 2,
  center_y: finalRect.top + finalRect.height / 2
};
```

## Output Format
```json
{
  "test_timestamp": "2026-05-05T17:30:00Z",
  "baseline_measurements": {
    "portrait_origin": {...},
    "card_rect": {...}
  },
  "spring_back_target": {
    "expected_center_x": number,
    "expected_center_y": number
  },
  "final_position": {...},
  "distance_analysis": {
    "distance_from_portrait_center": number,
    "tolerance_threshold": 10,
    "within_tolerance": boolean,
    "success": boolean
  },
  "visual_analysis": {
    "left_edge_snap_detected": boolean,
    "portrait_center_aligned": boolean,
    "visual_continuity_preserved": boolean
  }
}
```

## Success Criteria
- Distance ≤ 10px: Pass
- Distance 10-30px: Marginal (requires investigation)
- Distance > 30px: Fail
- Left-edge snap detected: Automatic fail

## Required Evidence
- Measured portrait bounding rect
- Spring-back target coordinates
- Final returned position coordinates
- Distance calculations
- Visual behavior assessment

## Notes
- This probe is fully automated and requires no user interaction
- Results are used as input for Playwright verification task
- Failure triggers requirement for manual user signoff
