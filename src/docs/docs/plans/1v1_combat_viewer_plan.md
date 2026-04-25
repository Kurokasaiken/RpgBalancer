# 1v1 Combat Viewer – Implementation Plan

## 1. Context & Existing Capabilities

- **Combat Engine** – `resolveCombatRound` already models turn-based phases (regen, status effects, initiative, attack loop) and logs every action while tracking per-entity metrics @src/engine/combat/logic.ts#17-150, @src/engine/combat/state.ts#4-64.
- **Simulation Wrappers** – `CombatSimulator` and Monte Carlo utilities expose deterministic turn-by-turn data and sudden death hooks that we can re-use for live playback @src/balancing/simulation/CombatSimulator.ts#18-124, @src/balancing/1v1/montecarlo.ts#1-117.
- **Config-Driven Characters** – Character builder/editor surfaces stat configs, archetypes, and combat summaries already aligned with the Weight-Based Creator philosophy @src/ui/character/CharacterCreator.tsx#207-336, @src/ui/character/components/CharacterSummary.tsx#1-50.
- **Visual Building Blocks** – Grid/arena UI pieces (e.g., `GridEntity`) supply sprite handling, HP bars, and interaction states suitable for an idle-brawler presentation @src/ui/grid/GridEntity.tsx#1-79.

These modules ensure we can focus on orchestration/UI without re-implementing combat math.

## 2. Goals

1. **Interactive 1v1 Combat Page** – Pick any two config-driven characters (later: multi-unit parties) and watch a deterministic fight with animated phases (idle stance, attack, hit reaction, KO).
2. **Phase-Aware Timeline** – Display turn/phase breakdown (prep, initiative, action, resolution) with ability to scrub or auto-play.
3. **Config-First Extensibility** – Support future >1 fighter per team by deriving layout and targeting cues from existing `CombatState` collections without rewriting UI logic.
4. **Telemetry Surfacing** – Mirror combat log + metrics (hits, crits, status uptime) for balancing insights.

## 3. Design Principles

- **Reuse Combat State** – Playback should consume `CombatResult.turnByTurnLog` + extended metrics to avoid duplicating calculations.
- **Declarative Animation State** – Map combat events to presentation states (`idle`, `attack`, `hit`, `defeated`) so animation components only react to state changes.
- **Multi-Entity Ready** – Treat `teamA`/`teamB` as arrays everywhere; even if UI shows two slots now, data plumbing must already support N entities.
- **Single Source of Truth** – All stat presets, sprites, and move catalogs come from config modules (`src/balancing/config/*`, archetype data, sprite registries). No inline constants.

## 4. Implementation Phases

### Phase 1 – Simulation Data & API
1. **Extend CombatSimulator output** to always include `turnByTurnLog`, entity snapshots per turn, and action metadata (actor id, action type, damage, applied effects). Add typings under `src/balancing/simulation/types.ts`.
2. **Add TeamConfig DTOs** describing team rosters (multiple entities) and ability loadouts sourced from BalancerConfig/archetypes.
3. **Create `useCombatPlayback` hook** that runs a simulation (deterministic seed) and produces a normalized timeline structure:
   ```ts
   interface PlaybackFrame {
     turn: number;
     phase: 'prep' | 'initiative' | 'action' | 'resolution';
     actors: CombatActorState[];
     logEntries: CombatLogEntry[];
   }
   ```
4. **Persist last-used fighters** via BalancerConfigStore so designers can quickly re-run matchups.

### Phase 2 – Animation & Presentation Layer
1. **Character Display Component** – Build `IdleFighterSprite` reading sprite/tween data from config; supports states `idle`, `attack`, `hit`, `victory`, `defeat`.
2. **Phase Timeline** – Horizontal timeline showing turns; highlight current phase, allow scrubbing (slider + keyboard). Tie autoplay speed to real-time vs step mode.
3. **Action Overlay** – Floating damage numbers, status icons, and on-hit flashes keyed by `PlaybackFrame`.
4. **Team Layout Abstraction** – Implement flexible layout (2-column now, expandable grid later) driven by roster length.

### Phase 3 – Controls & UX
1. **Roster Selectors** – Two (future multi) selectors fed by archetype builder presets; support swapping attacker/defender.
2. **Playback Controls** – Play/pause, step, speed (0.5x/1x/2x), jump to KO. Include “Re-run with RNG seed” for variance.
3. **Combat Log & Metrics** – Split pane with rich log (filter by actor/event type) and metrics (TTK, DPS, hit/crit %, status uptime).
4. **Export Hooks** – Allow saving combat logs or GIF/JSON snapshots for design reviews.

### Phase 4 – Multi-Unit Readiness
1. **Team Builder Integration** – Accept arrays from archetype presets; display formation preview and derived initiative order.
2. **Targeting Visualization** – Draw beams/lines to show attacker→defender per frame.
3. **AoE & Support Actions** – Extend timeline schema to include multi-target payloads and buff/debuff ticks per entity.

## 5. Testing & Validation

- **Unit Tests** – Ensure `useCombatPlayback` produces consistent frame counts and entity states for given seeds.
- **Snapshot Tests** – Validate timeline rendering for short combats (e.g., 3-turn duel, 12-turn tank fight).
- **Integration** – Run Monte Carlo comparisons before/after viewer refactors to confirm no impact on core combat outputs.

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing per-turn detail in simulator | Playback gaps | Expand `turnByTurnLog` schema before UI work (Phase 1). |
| Animation jitter with dynamic team sizes | Visual noise | Centralize layout math; use CSS grid with deterministic slots. |
| Divergence from config-first rules | Maintenance debt | All new constants live in `src/balancing/config/combatViewer.ts` (new module) and documentation. |

## 7. Deliverables

- Updated simulator types + logging hooks
- `useCombatPlayback` hook + supporting DTOs
- React page `CombatViewerPage` under `src/ui/balancing/1v1/`
- Config entries for sprite/animation mapping
- Documentation updates (this plan + COMBAT_SYSTEM_DESIGN addendum)

## 8. Open Questions

1. Should idle/attack animations use existing sprite sheets or procedural tweening?
2. Do we need AI-controlled ability selection or manual queued moves per turn?
3. How to prioritize future features (multi-unit vs. arena grid) on roadmap?

Collect answers before Phase 2 to avoid rework.
