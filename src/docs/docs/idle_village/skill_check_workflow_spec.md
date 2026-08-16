# Skill Check / Spell Resolution Workflow Spec

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Goal

Idle Village has two main skill-check subsystems: a simple D20 component (`SkillCheckComponent`) for quick checks, and a cinematic D100 Astrolabe (`DestinyAstrolabe`) for quest milestones and high-stakes rolls. This document describes both, how they are configured, how they consume resident stats, and where a future "spell creator" or custom skill editor would fit.

## Subsystems

| Name | File | Dice | Use Case | Status |
|---|---|---|---|---|
| `SkillCheckComponent` | `src/ui/idleVillage/components/SkillCheckComponent.tsx` | D20 | Generic skill check, debugging, legacy | implemented |
| `DestinyAstrolabe` (V1) | `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx` | D100 | Cinematic quest milestone resolution | implemented |
| `DestinyAstrolabeV2` | `src/ui/idleVillage/components/destinyAstrolabeV2/` | D100 | V2 iteration | **unused** |
| `DestinyAstrolabeV3` | `src/ui/idleVillage/components/destinyAstrolabeV3/` | D100 | V3 iteration | **unused** |
| `DestinyAstrolabeV4` | `src/ui/idleVillage/components/destinyAstrolabeV4/DestinyAstrolabeV4.tsx` | D100 | Latest component | **candidate** |
| `MilestoneCheckModal` | `src/ui/idleVillage/components/MilestoneCheckModal.tsx` | D100 | Wrapper for quest-phase skill checks | implemented |

## D20 Skill Check (`SkillCheckComponent`)

### Contract

```ts
export interface SkillCheckComponentProps {
  dcTarget: number;      // Difficulty Class to beat
  residentSkill: number; // Skill bonus added to the d20 roll
  activityName?: string; // Display label
  autoStart?: boolean;   // Start rolling on mount
  onComplete?: (result: { success: boolean; roll: number; total: number }) => void;
}
```

### Resolution

1. After an 1.8s rolling animation, a `d20` is rolled: `roll = Math.floor(Math.random() * 20) + 1`.
2. `total = roll + residentSkill`.
3. `success = total >= dcTarget`.
4. `isCrit` if `roll === 20`.
5. `isFumble` if `roll === 1`.

### Limitations
- Not seeded; uses `Math.random()`.
- Hardcoded animation and palette.
- Not wired to the config-first system or the skin registry.
- Currently a debug/legacy component, not used in the main quest flow.

## D100 Destiny Astrolabe

### Contract

```ts
export interface DestinyAstrolabeProps {
  skills: AstrolabeSkill[];
  config?: AstrolabeConfig & { mode?: string };
  onResolve?: (result: AstrolabeResult) => void;
  autoStart?: boolean;
  autoThrow?: boolean;
  skipAnimation?: boolean;
  // ...
}
```

### Skill input

```ts
interface AstrolabeSkill {
  name: string;
  stat: number;       // Resident's relevant stat (e.g. strength, agility)
  difficulty: number; // Difficulty of the check
}
```

### TST calculation

```text
TST (Target Success Threshold) = clamp(50 + (stat - difficulty), 1, 99)
```

This is computed in `DestinyAstrolabe.tsx` and mirrors the engine factory in `engine.ts`.

### Config-first values

- All timing, geometry, risk thresholds, and animation values live in `astrolabeV3Config` (`src/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config.ts`).
- V1 uses `astrolabe-ui.css` and `astrolabe.css` (legacy, not preset-driven).
- V4 is the candidate for full skin/preset integration.

### Resolution phases

1. **Threat slam** — the difficulty obelisks settle.
2. **Agency burst** — the resident's stat bands appear.
3. **Risk pour** — death/wound percentages are shown.
4. **The spin** — the D100 ball rolls and lands.
5. **Snap / verdict** — compare `roll <= TST` for success; `<= critSuccessPct` for crit.

### Milestone integration

- `MilestoneCheckModal` mounts `DestinyAstrolabe` at quest milestones.
- A milestone fires every 25% of quest duration (from `useMilestoneEngine`).
- `buildAstrolabeSkillsForPhase` (quest logic) maps resident stats and quest difficulty to `AstrolabeSkill[]`.

## Spell / Skill Creator (Missing)

There is currently **no canonical "spell creator" or skill editor**. The following capabilities are absent:

- Authoring new skills/spells with a UI.
- Associating a spell with a cost, cooldown, stat, or school.
- Saving custom skills to `IdleVillageConfig` or `PersistenceService`.
- Validating a custom skill with a Zod schema.

### What is configured

The existing "skill" content is data-driven through:
- `IdleVillageConfig.questSkillCheckConfig` — tuning for quest milestone checks.
- `ActivityDefinition.statRequirement` / `requiredStats` — quest entry requirements.
- `QuestPowerEngine` — party power calculation from stats.

### Future spell creator workflow (proposed)

1. **Author** — define name, school, stat, base difficulty, mana/stamina cost, cooldown, effect list.
2. **Validate** — Zod schema ensures no overlap with existing IDs and valid references.
3. **Preview** — render `DestinyAstrolabe` with the custom difficulty/stat in a sandbox.
4. **Publish** — save to a `spells` config tab and persist via `PersistenceService`.
5. **Use** — quest blueprint can reference the spell by ID as a consumable or prerequisite.

## Invariants

- All skill-check tunings (TST clamp, crit/wound thresholds, animation timings) must live in config, not in component code.
- D100 outcomes must be deterministic when a seed is supplied.
- A skill check never mutates `ResidentState` directly; it emits a result to `onResolve`.

## What is Mocked or Missing

| Feature | Status | Notes |
|---|---|---|
| D20 `SkillCheckComponent` | Legacy | `Math.random()`, not config-first or skinned |
| D100 Astrolabe V1 | Implemented | Functional but uses legacy CSS |
| Astrolabe V3 config | Implemented | Not consumed by V1; V3 component is unused |
| Astrolabe V4 | Candidate | Best candidate for skin/preset integration |
| Milestone → Astrolabe | Implemented | `MilestoneCheckModal` wires V1 |
| Spell creator UI | **MISSING** | No design, no route, no config tab |
| Custom spell persistence | **MISSING** | No schema, no storage key |
| Spell effect engine | **MISSING** | Quest rewards are resource-only; no spell effects |

## Test Commands

```bash
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts
npx playwright test tests/e2e/idleVillage/minimal-destiny-astrolabe.spec.ts 2>/dev/null || true
npm run build:check
```

## References

- `src/ui/idleVillage/components/SkillCheckComponent.tsx`
- `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx`
- `src/ui/idleVillage/components/destinyAstrolabe/engine.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV4/DestinyAstrolabeV4.tsx`
- `src/ui/idleVillage/components/MilestoneCheckModal.tsx`
- `src/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config.ts`
- `src/engine/game/idleVillage/QuestPowerEngine.ts`
