# Combat Animator Implementation Plan

## 1. Scope & Goals

- Convert deterministic `CombatAnimationScript` data into visible sprite actions (idle → windup → attack → hit → defeated).
- Keep everything config-driven (sprites referenced through `COMBAT_SPRITE_REGISTRY`, FX via config hooks).
- Maintain sync with `useCombatPlayback` timing for pause/resume/reroll.
- Provide extensible hooks for HUD overlays (damage numbers, shields, debuffs) without embedding balancing logic inside UI components.

## 2. Research Summary (per point)

1. **Sprite frame control via rAF.** FreeCodeCamp’s sprite animation guide highlights using `requestAnimationFrame` over `setInterval` to keep multiple sprites in sync and control `framesPerStep` for pace ("Learn advanced React patterns by developing a game with sprite animation", freecodecamp.org). Takeaway: `useCombatAnimator` should drive frame ticks through rAF tied to playback speed, allowing per-state frame sequences.
2. **Deterministic finite state machine.** CSS-Tricks’ “Robust React User Interfaces with Finite State Machines” shows structuring UI states with explicit transition tables. Takeaway: animation states per actor should live in a machine (`idle`, `windup`, `attack`, `recover`, `hit`, `defeated`), transitioning only through table-driven actions triggered by animation scripts, ensuring reproducibility.

## 3. Implementation Steps

### 3.1 Data plumbing

- Extend `mapFrameToAnimations` results with precomputed `durationMs` per event (if missing) to avoid UI heuristics.
- Add helper `queueAnimations(frames, frameIndex)` that flattens scripts for the active frame window; lives in `src/balancing/simulation/animatorUtils.ts`.
- Update `useCombatPlayback` to expose current animation queue + timeline metadata (no visual logic).

### 3.2 `useCombatAnimator` hook

1. **Input:** `playback` ref + `stageSlots` mapping.
2. **State machine:** define `const actorMachine = { idle: { ATTACK_START: 'windup', HIT: 'hit', DEFEATED: 'defeated' }, windup: { ATTACK_COMMIT: 'attack' }, attack: { ATTACK_RESOLVE: 'recover' }, recover: { RETURN: 'idle' }, hit: { RECOVER: 'idle' }, defeated: {} };` (inspired by CSS-Tricks FSM approach).
3. **Ticker:** use `requestAnimationFrame` to accumulate elapsed time; convert to animation timeline speed = `playback.speedMs` × easing factor. Pause when `playback.isPlaying` is false.
4. **Event consumption:** shift events from queue when elapsed ≥ event.duration; dispatch transitions + set optional FX payload (crit, dodge, shield) from script metadata.
5. **Output:** map of `{ [actorId]: { state, frameIndex, fx, timestamp } }` + derived `activeFx[]`. Provide imperative `reset()` for reroll.

### 3.3 `CombatAvatar` upgrades

- Accept `actorState` (from hook) instead of only spriteId.
- Build per-state frame definitions using registry data: e.g., `sprite.states.attack.frames` referencing sequential PNG files. For now we have single PNG per state; support arrays for future LoL-style loops.
- Implement simple frame cycling: maintain `frameTick` from hook, compute `currentFrame = state.frames[frameTick % frames.length]` (freecodecamp.org pattern). Fall back to static PNG.
- Apply CSS custom properties for palette-based rim/glow; allow additive blending layers (config-driven).

### 3.4 FX + feedback components

- Create `CombatFxLayer` reading `activeFx[]` to render components: `SlashFx`, `ShieldPulse`, `ImpactFlash`, `DamageNumber`.
- Each FX component uses config references (e.g., asset path, color). Provide TTL/duration to auto-remove.
- Hook screen shake + vignette pulses by emitting events from animator (crit, heavy hit) and toggling CSS animations on `CombatStage` container.

### 3.5 Stage/HUD integration

- In `PlaybackArena`, consume `useCombatAnimator` output:
  - Pass `actorStateMap[actorId]` into `CombatAvatar` for stateful sprites.
  - Show damage numbers overlayed near slot positions.
  - Replace static HP bar updates with animation-driven easing (e.g., lerp to new HP when `HIT` event fires).
- Add timeline badges (Phase 6.5 requirement) sourcing from same event queue to highlight current phase/action.

### 3.6 Testing & Tooling

- **Unit tests:**
  - `useCombatAnimator` deterministic playback (given script queue + fixed speed, assert sequence of states).
  - Event queue exhaustion resets when playback rerolls.
- **Visual tests:**
  - Storybook stories for `CombatAvatar` states (idle/attack/hit/defeated) using prototype sprites.
  - Playwright snapshot for `PlaybackArena` verifying slot avatars + FX layering.
- **Dev tooling:** add debug panel toggle to show actor machine state + upcoming events for balancing review.

## 4. Documentation & TODO Alignment

- Phase 6.5 (“Animator & HUD”) in `docs/plans/1v1_tasks.md` → replace generic bullets with references to this plan’s sections 3.2–3.5.
- `docs/plans/combat_viewer_visual_mock_plan.md` Phase 4/5 description should link to this file for implementation details.
- Mention prototype asset usage + animator plan in `COMBAT_SYSTEM_DESIGN.md` Section 8.5.
