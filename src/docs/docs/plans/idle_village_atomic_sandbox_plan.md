# Phase 12.E – Idle Village “Atomic Sandbox” Implementation Plan

**Status:** Draft v1 (2025-12-23)  
**Owner:** Sandbox / IdleVillage squad  
**Scope:** Re‑foundation of the Idle Village UI + engine wiring through a config-first sandbox harness

---

## 1. Objectives

1. **Configurable Physics Knobs** – Hero threshold, risk multiplier (`k`), and HP/Fatigue recovery rates must be editable from the Global Rules tab (`IdleVillageGlobalRulesTab.tsx`) and persisted through `IdleVillageConfigStore`.
2. **Atomic Sandbox Architecture** – `VillageSandbox.tsx` becomes a presentation-only harness while all ticking, heroism math, and recovery logic live in pure engine helpers (`tickIdleVillage`, `resolveActivityOutcome`, upcoming SandboxEngine service).
3. **Density-Aware Map Slots** – Map slots display inline VerbCards when ≤2 verbs are active; crowded slots collapse into “Medaglioni di Luogo” with bloom feedback only when the dragged resident satisfies stat/fatigue compatibility.
4. **Reliable Drag & Drop** – Standardize on `text/resident-id` MIME (exposed via `RESIDENT_DRAG_MIME`), remove z-index/pointer-events blockers, and ensure bloom halos follow compatibility checks.
5. **Theater View Flow** – The floating theater overlay is a cinematic expansion of the selected `slotId`, filtering verbs via config and surfacing `VerbDetailCard` data without duplicating formulas.
6. **Live Tick & Resolve Loop** – The sandbox must call `tickIdleVillage` via `useEffect`, and the “Resolve/Collect” flow should trigger the real death/heroism logic with traceable outcomes.

---

## 2. Architecture Summary

| Layer | Responsibilities | Key Files |
| --- | --- | --- |
| **Config** | Store hero/risk/recovery knobs, density thresholds, drag MIME strings | `src/balancing/config/idleVillage/types.ts`, `defaultConfig.ts`, `IdleVillageConfigStore.ts` |
| **Engine** | Apply `Stat_new = Stat_old * (1 + risk × k)`, clamp risk, award hero flags, HP/fatigue recovery, expose deterministic tick loop | `src/engine/game/idleVillage/TimeEngine.ts`, `SandboxEngine` (new) |
| **UI Harness** | Render workers, slots, VerbDetail overlay; read-only percentages + copy delivered by engine selectors | `VillageSandbox.tsx`, `WorkerCard.tsx`, `ActivitySlot.tsx`, `VerbDetailCard.tsx` |
| **Interaction** | Density clustering, bloom compatibility feedback, MIME wiring | `ActivitySlot`, `LocationCard`, future `SlotCluster` |
| **Docs & Tests** | Plan/tasks, Master Plan references, Vitest suites covering hero thresholds + Theater flows | `docs/plans/*`, `tests/idleVillage/*` |

---

## 3. Workstreams

### 3.1 Config & Persistence

1. Extend `TrialOfFireRules` (types + Zod schema) with `heroismModifier`, `riskMultiplier`, `hpRecoveryPercent`, `fatigueRecoveryPerDay`.
2. Seed defaults inside `defaultConfig.ts`.
3. Update `IdleVillageGlobalRulesTab` inputs with contextual helper copy; ensure number parsing uses clamp helpers.
4. Add regression tests for `IdleVillageConfigStore` import/export + reset.

### 3.2 Engine Wiring

1. Route `TrialOfFireRules` into `resolveActivityOutcome` and `applyTrialOfFireStatBonus` (`TimeEngine.ts`).
2. Introduce `SandboxEngine` helper under `src/ui/idleVillage/engine/` that:
   - bootstraps `createVillageStateFromConfig`,
   - runs `tickIdleVillage` on an interval/requestAnimationFrame,
   - emits derived percentages/strings for the UI.
3. Wire the “Collect/Resolve” CTA to `resolveActivityOutcome`, surfacing heroized IDs, fallen IDs, and stat bonuses.
4. Add Vitest coverage for hero threshold edge cases (below/above threshold, HP recovery clamping).

### 3.3 UI Sandbox

1. Keep `VillageSandbox.tsx` as a thin harness:
   - Worker cards sourced from latest `villageState`.
   - Slots/VerbDetail derived from engine selectors, no inline risk formulas.
2. Replace local worker mock data with actual residents (fallback sample for empty state allowed).
3. Ensure `WorkerCard` displays grayscale state based on fatigue thresholds from config rather than hardcoded >90.
4. Feed VerbDetail preview with engine-provided injury/death percentages and note strings.

### 3.4 Density & Bloom System

1. Create `useSlotDensity()` hook to determine whether a slot should render inline verbs or a medallion cluster.
2. New `MedallionBadge` component hosts the “golden aura” bloom animation triggered only on compatible drops (stat tags + fatigue thresholds).
3. Compatibility logic reuses `evaluateStatRequirement` + `fatigueMaxBeforeExhausted` from config – no ad-hoc numbers.

### 3.5 Theater View

1. Theater overlay uses `fixed inset-0 z-50` with backdrop closing; pointer events only on content.
2. Filter Verb list by `slotId` and `slotTags`, pulling risk bands (yellow/red stripes) from the engine snapshot.
3. Provide `VerbDetailAssignment` callbacks that call the shared drop handler, keeping state single sourced.

### 3.6 Interaction Hardening

1. Consolidate MIME constants in `src/ui/idleVillage/constants.ts` (`RESIDENT_DRAG_MIME = 'text/resident-id'` plus legacy alias).
2. Remove stray `pointer-events-none` and audit z-index layering (map remains interactive while theater hidden).
3. Ensure Keyboard/ARIA flows exist for worker selection + slot assignment.

### 3.7 Testing & Docs

1. Add Vitest suites for:
   - heroism multiplier math,
   - HP/fatigue recovery,
   - density clustering selection,
   - drag/drop compatibility guard.
2. Playwright scenario: drag worker into slot → bloom highlight if compatible → open Theater → verify risk stripes percentages change after Resolve.
3. Update docs (`idle_village_tasks.md`, `MASTER_PLAN.md`) plus design references.

### 3.8 Phase E Drop Validation & Feedback Loop

**Status:** ✅ COMPLETED (2026-01-11)

1. **Config-First Validation Rules**
   - Created `src/ui/idleVillage/config/residentDropRules.ts` with validation logic for:
     - Stat requirements (allOf/anyOf/noneOf)
     - Fatigue thresholds (configurable maxFatigueBeforeExhausted)
     - Crew capacity limits (supports infinite slots)
     - Resident availability status checks
   - All values configurable through balancing config system

2. **React Hook Integration**
   - Implemented `src/ui/idleVillage/hooks/useResidentDropValidation.ts`:
     - Real-time validation with telemetry events (`idle_drop_*`)
     - Batch validation for multiple residents
     - Human-readable error messages with context
     - Quick eligibility checks for UI responsiveness
     - Custom validator support for extensibility

3. **Wiring & Integration**
   - Integrated validation hook into `VillageSandbox.tsx`
   - Connected to existing drag-drop infrastructure
   - Telemetry integration for validation tracking
   - Config-first initialization from global rules

4. **Unit Test Coverage**
   - Created comprehensive test suite in `tests/unit/idleVillage/useResidentDropValidation.test.tsx`:
     - Stat requirement validation
     - Fatigue threshold enforcement
     - Crew capacity limits
     - Resident availability checks
     - Custom validator support
     - Error message generation
     - Batch validation scenarios

5. **Key Features**
   - **Config-First Design**: No hardcoded validation rules
   - **Telemetry Integration**: `idle_drop_validation_success/failure` events
   - **Extensible**: Custom validators for special cases
   - **Performance**: Quick boolean checks for UI feedback
   - **Type Safety**: Full TypeScript coverage

**Files Created/Modified:**
- `src/ui/idleVillage/config/residentDropRules.ts` (new)
- `src/ui/idleVillage/hooks/useResidentDropValidation.ts` (new)
- `src/ui/idleVillage/VillageSandbox.tsx` (integration)
- `tests/unit/idleVillage/useResidentDropValidation.test.tsx` (new)

### 3.9 Punch Club Telemetry Synchronization & Preset Drift Audit

**Status:** ✅ COMPLETED (2026-01-11)

1. **Preset Synchronization**
   - Enhanced `PunchClubPage.tsx` with automatic preset activation
   - Integrated with `useVillageShellContext` for seamless preset management
   - Added session tag propagation from URL parameters to telemetry pipeline
   - Implemented readiness detection with `window.__idleVillagePunchClubReady` flag

2. **Telemetry Integration**
   - Created `usePunchClubTelemetrySync` hook for real-time monitoring
   - Synchronized with VillageSandbox telemetry events (`idle_drop_*`)
   - Added drift detection for preset behavior validation
   - Implemented mobile playtest logger integration

3. **HUD & State Management**
   - Connected Punch Club UI with VillageSandbox state
   - Added status badges for preset activation feedback
   - Implemented overlay states for loading/transition periods
   - Enhanced test hooks support for development/debugging

4. **RTL Test Coverage**
   - Created comprehensive test suite in `tests/components/idleVillage/PunchClubPage.rtl.test.tsx`:
     - Preset activation/deactivation scenarios
     - Session tag processing and URL cleanup
     - UI state management and status indicators
     - Window property lifecycle management
     - Mobile logger integration
     - Test hooks functionality

5. **Dynamic Import Resolution**
   - Resolved all dynamic imports in PunchClubPage
   - Fixed useEffect synchronous setState issues with flushSync
   - Ensured proper cleanup and memory management
   - Added proper TypeScript typing for all components

**Key Features:**
- **Automatic Preset Activation**: Seamless Punch Club preset loading
- **Real-time Telemetry**: 500ms monitoring interval with drift detection
- **Session Management**: URL-based session tag propagation
- **Test Mode Support**: Enhanced debugging and monitoring capabilities
- **Mobile Integration**: Playtest logger synchronization

**Files Created/Modified:**
- `src/ui/idleVillage/PunchClubPage.tsx` (enhanced with telemetry sync)
- `src/ui/idleVillage/hooks/usePunchClubTelemetrySync.ts` (new)
- `tests/components/idleVillage/PunchClubPage.rtl.test.tsx` (new)

---

## 4. Deliverables Checklist

- [ ] Config schema & defaults updated, UI sliders wired.
- [ ] `SandboxEngine` created with live ticking + resolve hooks.
- [ ] Density/bloom system extracted into reusable components/hooks.
- [ ] Theater overlay filtering verbs by slot, using real risk metrics.
- [ ] Drag/drop MIME + z-index/pointer-events audit complete.
- [ ] Test suites (unit + e2e) covering heroism/density flows.
- [ ] Documentation + Master Plan references updated (this plan + tasks file).

---

## 5. Links

- `src/ui/idleVillage/VillageSandbox.tsx`
- `src/ui/idleVillage/components/WorkerCard.tsx`
- `src/ui/idleVillage/components/ActivitySlot.tsx`
- `src/engine/game/idleVillage/TimeEngine.ts`
- `docs/plans/idle_village_tasks.md`
- `docs/MASTER_PLAN.md`
