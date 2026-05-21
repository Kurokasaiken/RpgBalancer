---
description: Manual user signoff for motion behavior verification
---

# Motion Manual: User Signoff

## Task
Provide final user-truth override for visual motion behavior verification when automated tests are insufficient or when user reports conflict with automated results.

## Instructions
1. Review automated test results from runtime probe and Playwright tests
2. Perform manual visual testing of drag-return behavior
3. Confirm or override automated results based on user-truth
4. Provide explicit justification for any overrides
5. Output final verification decision with evidence

## Manual Testing Protocol

### Test Environment Setup
- Open application in browser
- Navigate to roster page with draggable cards
- Ensure consistent test conditions with automated tests

### Visual Verification Steps
1. **Baseline Check**: Verify portrait positions are visible and correct
2. **Drag Test**: Manually drag a roster card to offset position
3. **Spring-Back Observation**: Watch return animation carefully
4. **Final Position Assessment**: Judge if card returns to portrait origin
5. **Multiple Iterations**: Test 3-5 times for consistency

### User Truth Criteria
- **Visual Continuity**: Does the card visually return to the portrait position?
- **Left-Edge Behavior**: Is there any visible left-edge snapping?
- **Animation Smoothness**: Is the spring-back animation natural?
- **Consistency**: Does the behavior repeat across multiple tests?

## Decision Framework

### Automated Pass + User Confirm = FINAL PASS
- Automated tests show distance ≤ 10px
- User confirms visual behavior is correct
- No user-reported issues

### Automated Pass + User Override = INVESTIGATE
- Automated tests show pass
- User reports incorrect visual behavior
- Requires investigation of measurement methodology

### Automated Fail + User Confirm = FINAL FAIL
- Automated tests show distance > 30px or left-edge snap
- User confirms incorrect visual behavior
- Bug requires fixing

### Automated Fail + User Override = MARGINAL PASS
- Automated tests show marginal failure (10-30px)
- User confirms visual behavior is acceptable
- Document justification for override

## Output Format
```json
{
  "signoff_timestamp": "2026-05-05T17:40:00Z",
  "signoff_author": "user_name",
  "automated_results": {
    "runtime_probe_status": "pass|fail|marginal",
    "playwright_status": "pass|fail|marginal",
    "measured_distance": number,
    "tolerance_threshold": 10
  },
  "manual_verification": {
    "visual_test_performed": boolean,
    "test_iterations": number,
    "visual_continuity_observed": boolean,
    "left_edge_snap_detected": boolean,
    "animation_smoothness": "smooth|jerky|other",
    "consistency_rating": "consistent|inconsistent"
  },
  "final_decision": {
    "status": "pass|fail|marginal",
    "user_override_applied": boolean,
    "override_justification": "string",
    "confidence_level": "high|medium|low"
  },
  "evidence": {
    "user_observations": [...],
    "screenshots_taken": boolean,
    "video_recording": boolean,
    "specific_issues_identified": [...]
  },
  "recommendations": {
    "bug_fix_required": boolean,
    "measurement_adjustment_needed": boolean,
    "test_refinement_needed": boolean
  }
}
```

## Override Justification Requirements
When overriding automated results, user must provide:
1. **Specific Visual Description**: What exactly looks wrong/right
2. **Measurement Discrepancy**: Why automated measurement doesn't match visual reality
3. **Context Factors**: Browser, screen size, zoom level, or other variables
4. **Reproducibility**: Can the issue be consistently reproduced

## Final Authority Rules
- **User Truth Override**: User can override any automated result with justification
- **Code/Build Insufficiency**: Code reasoning alone cannot close motion bugs
- **Visual Verification Required**: All motion bug closures require user visual confirmation
- **Evidence Documentation**: All decisions must be documented with evidence

## Integration
- Receives results from runtime probe and Playwright tests
- Provides final authority on motion bug closure
- Outputs to Kanban for task completion tracking

## Notes
- This task represents the final authority in motion verification
- Cannot be bypassed or overridden by automated systems
- Essential for preventing false positive bug closures
- Ensures user experience aligns with technical measurements
