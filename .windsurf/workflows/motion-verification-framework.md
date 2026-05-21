---
description: Motion Verification Framework for Drag/Spring-Back Behavior
---

# Motion Verification Framework

## Measurable Contract for Spring-Back Correctness

### Core Metrics
1. **Portrait Origin Rect**: `{left, top, width, height}` of the actual portrait DOM node
2. **Spring Target Rect**: Expected return position based on portrait origin
3. **Final Returned Rect**: Actual position after spring-back animation completes
4. **Tolerance Threshold**: Maximum allowed deviation (≤10px for precise alignment)

### Success Criteria
- `distance(final_center, portrait_center) ≤ 10px`
- `final_position_within_tolerance = true`
- `visual_continuity_preserved = true`
- `no_left_edge_snap = true`

### Failure Modes
- Distance > 30px: Critical failure
- Distance 10-30px: Marginal failure (requires investigation)
- Left-edge snap: Automatic failure
- Portrait node not found: Implementation error

## Task Chain for Motion Verification

### 1. Runtime Probe Task
**Prompt ID**: `motion-probe-drag-measurements`
**Purpose**: Lightweight runtime measurement of drag-return behavior
**Automation**: Full automated
**Output**: Measured metrics JSON

### 2. Playwright Verification Task  
**Prompt ID**: `motion-playwright-spring-back-test`
**Purpose**: Focused automated test for spring-back target correctness
**Automation**: Full automated
**Output**: Pass/fail with detailed measurements

### 3. Manual Signoff Task
**Prompt ID**: `motion-manual-user-signoff`
**Purpose**: Final user-truth override for visual behavior verification
**Automation**: Manual user verification
**Output**: User-confirmed pass/fail

## Verification Rules

### Automated vs Manual Signoff
- **Automated**: Runtime probe and Playwright tests can pass automatically
- **Manual**: Final user signoff required for any motion bug closure
- **Override**: User can override automated results with explicit justification

### Code/Build Success Limitation
- Code reasoning alone cannot close motion bugs
- Build success is necessary but insufficient
- Runtime verification is mandatory for motion behavior changes

### Evidence Requirements
- Measured portrait rect coordinates
- Spring-back target coordinates  
- Final returned position coordinates
- Distance calculations and tolerance assessment
- Visual confirmation from user testing
