# Alt Visuals V6 – Rigged Throw Plan

## Context
- `updateBall` currently handles all kinematics with basic jitter + slowdown but has no notion of a pre-planned landing spot, so the ball can stop in inconsistent places even when `forcedOutcome` is known @src/ui/testing/AltVisualsV6Asterism.tsx#583-655.
- `assignBallTarget` already samples a valid point inside the star or pentagon (success/failure) and stores it on `ball.targetX/Y`, but those coordinates are never used to guide the ball @src/ui/testing/AltVisualsV6Asterism.tsx#987-1003.
- Launch timing and chaos is triggered implicitly once the star morph completes inside `updateTarAnimation` @src/ui/testing/AltVisualsV6Asterism.tsx#542-580.
- The HUD shows success odds and roll result, but there is no way to re-roll without restarting the entire scene @src/ui/testing/AltVisualsV6Asterism.tsx#145-212.

## Goals
1. Make the throw appear organic (fast chaotic start ➝ easing slowdown) while guaranteeing that the final landing point always matches the precomputed outcome.
2. Allow designers/testers to reroll the dice mid-session without resetting the entire pillar sequence.
3. Keep the experience deterministic per reroll (same roll → same landing) for repro purposes.

## Implementation Plan

### 1. Controller API from `initAltVisualsV6`
- Refactor `initAltVisualsV6` to return `{ cleanup, rerollDice }` instead of only the cleanup callback.
- `rerollDice` responsibilities:
  - Abort any ongoing ball run (set `ball.active=false`, `ball.stopped=false`).
  - Generate a new random roll (`successRoll`), recompute `forcedOutcome`, and reassign `targetX/Y`.
  - Invoke `startBallLaunch()` (see step 2) without resetting pillars/tentacles.
- Update the React effect to keep a ref to the controller so the UI button can invoke `rerollDice`.

### 2. Encapsulated `startBallLaunch` helper
- New helper consumes `InternalState` and performs:
  1. Compute/refresh `successChance` (in case stats changed), run `rollForOutcome`, and persist `successRoll`.
  2. Call `assignBallTarget` to select the destination point.
  3. Initialize `ball` kinematics:
     - Reset position to center, `vx/vy` to randomized burst vector (magnitude scaled by `ball.speed`).
     - Set `guidanceDelay` (e.g., 1000ms chaotic phase) and `targetArrivalTime` (e.g., 4200ms absolute timestamp) so `updateBall` can blend toward the target at the correct moment.
     - Clear `ball.stopped`, `ball.success`, etc.

### 3. Guided kinematics in `updateBall`
- Replace the current ad-hoc acceleration/slowdown with timeline-based easing:
  - **Phase 1 – Chaos (0 → guidanceDelay):** amplify random jitter each frame and optionally add mild screen shake.
  - **Phase 2 – Guidance (guidanceDelay → targetArrivalTime):** use smoothstep interpolation to steer velocity toward the target while gradually reducing jitter.
  - **Phase 3 – Ease-out (final ~500ms):** dampen velocity exponentially so the ball settles exactly on `targetX/Y`; if distance > epsilon near arrival time, snap to target to avoid overshoot.
- Continue reflecting off pentagon walls during Phase 1 to preserve the “pinball” feel.

### 4. Deterministic arrival enforcement
- When entering Phase 3, compute remaining distance and required deceleration so that `state.ball.x/y` converge exactly to the target at `targetArrivalTime`.
- Use a cubic easing (e.g., `t^3`) to interpolate positions if velocity math becomes brittle; freeze `vx/vy` and directly lerp `x/y` once inside the final 150ms window.

### 5. HUD + state wiring
- Ensure `state.successRoll` resets on `resetAnimation` and gets updated on every reroll/launch.
- Keep the HUD labels already added (`SUCCESSO STIMATO`, `ROLL: ... → outcome`).

### 6. Reroll button UX
- Button already rendered; wire it to `rerollRef` (set via effect).
- Disable or show loading if the star morph is still running (no reroll until first throw completes) to avoid confusing states.

### 7. Testing & QA
- Manual pass: verify reroll keeps pillars/tentacles intact and only reruns the ball.
- Determinism: log `successChance`, `successRoll`, `targetX/Y`, and final `ball.success` to ensure they match per reroll.
- Edge cases: reroll during Phase 1 vs Phase 3, reroll immediately after landing, perfect-star test mode.

## Deliverables
1. Code changes in `AltVisualsV6Asterism.tsx` implementing the controller, helper, and new physics.
2. Optional telemetry hook or debug overlay line showing `targetArrivalTime` for tuning.
3. This plan document committed under `docs/plans/alt_visuals_v6_rigged_throw_plan.md`.
