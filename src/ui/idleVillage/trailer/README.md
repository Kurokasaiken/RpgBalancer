# Idle Village Steam Trailer

This directory contains the Steam teaser trailer production pipeline. All components here are **@trailer-only** — they are exempt from gameplay architecture requirements but must preserve presentation architecture requirements.

## @trailer-only Convention

Trailer components are marketing-only implementations built on top of existing game systems. They are NOT gameplay features.

### EXEMPT from gameplay architecture (do NOT apply):
- **Persistence Invariant:** NO PersistenceService, NO localStorage/sessionStorage, NO persistence of any kind
- **Localization Invariant:** NO i18n for copy text (hardcoded allowed for iteration speed), NO translation keys
- **Telemetry:** NO telemetry of any kind (marketing asset, not product)
- **Gameplay State:** NO gameplay state mutation, NO economy systems, NO player progression

### MUST preserve presentation architecture (DO apply):
- **Config-first:** All timing values, camera settings, sequence events in `trailerConfig.ts`
- **Skin/Theme:** Use CSS variables from trailer.css, NO standalone .css files, use Gilded Observatory tokens
- **Component Reuse:** Verify primitives before creating new components, reuse existing components
- **State Management:** Use React Context for local presentation state, NO Zustand (marketing-only)
- **Documentation:** JSDoc on all functions/interfaces, update plan changelog
- **Node/tooling:** Use pinned Node version from .nvmrc
- **Safeguards:** Run lint, build:check, kanban:lint before task complete

## File Header Convention

Every trailer component must include this header:

```typescript
/**
 * @trailer-only
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It is exempt from gameplay architecture requirements but must preserve
 * presentation architecture requirements.
 *
 * NO gameplay logic (scripted sequences, mock data only)
 * NO persistence (marketing asset, not product)
 * NO full i18n (hardcoded copy for iteration speed)
 * NO telemetry (marketing asset, not product)
 * NO Zod validation (tunable config only)
 *
 * MUST preserve:
 * - Visual consistency with existing components
 * - Existing component contracts (reuse, don't fork)
 * - Deterministic behavior for recording
 * - Project styling conventions
 *
 * This code exists solely to produce recordable video content.
 * Do NOT reuse for gameplay features.
 */
```

## Naming Convention

- Prefix `Trailer` for all components
- NO reuse in production gameplay
- Trailer code is isolated and disposable
- Cleanup decision happens after release

## Deterministic Seed Rule

Trailer code cannot use `Math.random()`. All randomness must come from deterministic seed.

Config: `capture.seed: 12345` in `trailerConfig.ts`

## No Placeholder Rule

Every captured frame must represent final visual language. No temporary shapes, debug boxes, fake assets, or developer UI after first integration day.

## Architecture Rule

Every trailer component must have this mindset:

❌ WRONG: "How do I implement the system?"

✅ CORRECT: "How do I create the best frame to capture?"

## Directory Structure

```
src/ui/idleVillage/trailer/
├── README.md                          # This file
├── trailer.css                        # CSS variables for trailer styling
├── AstrolabeTrailerController.tsx     # Scene 4: Risk (hero shot)
├── TrailerViewer.tsx                  # Shell with scene selector
├── TrailerThreat.tsx                  # Scene 1: Threat
├── TrailerChoice.tsx                  # Scene 2: Choice
├── TrailerPreparation.tsx             # Scene 3: Preparation
├── TrailerConsequence.tsx             # Scene 5: Consequence
├── TrailerLegacy.tsx                  # Scene 6: Legacy
└── TrailerOutro.tsx                   # Scene 7: Outro
```

## Reference Plan

[trailer_vertical_slice_plan.md](../../../docs/plans/trailer_vertical_slice_plan.md)
