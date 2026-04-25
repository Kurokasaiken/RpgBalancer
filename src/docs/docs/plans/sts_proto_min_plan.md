# KS-082 – STS Proto Resonance Loop Plan

## 1. Objective

- Deliver a playable numeric prototype that validates the core loop "draw → choose spell → spend mana → resolve → enemy reacts" using only Resonance (stable mana) and fallback agency safeguards.
- Capture telemetry for mana usage, card decisions, fallback frequency, and pacing to inform Phase 2 (Inspiration reintroduction) decisions.

## 2. Scope & Deliverables

1. **Config Updates**
   - Deck preset `proto-resonance-only` (6 cards baseline, handSize 6, draw 3 per turn).
   - Enemy profile `proto-dummy` with 40/30/30 Attack/Defend/Buff weights.
   - Telemetry config extension with `proto_*` counters.
2. **Engine Constraints**
   - Force Resonance-only mana (3 points regenerated per turn, no Inspiration track).
   - Auto-trigger `FallbackRitual` when no cards are played.
   - Enforce `maxTurns = 12` and HP=0 checks as stop conditions.
3. **Telemetry & Reporting**
   - Emit `proto_mana_budget`, `proto_cards_ratio`, `proto_decision_turn`, `proto_fallback_count` on every `sts_turn_tick`.
   - Tag runs with `loopStage: 'proto-resonance'` for filtering in the dashboard.
4. **Documentation & Testing**
   - Spec section 13 (already added) kept in sync with this plan.
   - Add Vitest scenario ensuring: draw=3, mana ≤3, fallback fires when actions=0, enemy intent distribution stays within ±2%.

## 3. Task Breakdown

| Task ID | Description | Owner | Files/Dirs |
|---------|-------------|-------|------------|
| KS-082-T1 | Define deck preset + cards copy | Balancing | `src/balancing/config/archmage/decks/protoResonanceOnly.ts` |
| KS-082-T2 | Create enemy profile `proto-dummy` | Balancing | `src/balancing/config/archmage/enemies/protoDummy.ts` |
| KS-082-T3 | Enforce Resonance-only params in simulator engine | Engineering | `src/balancing/hooks/archmage/useSTSSimulatorEngine.ts` |
| KS-082-T4 | Extend telemetry config + dashboard badges | Analytics/UI | `src/balancing/config/archmage/telemetryConfig.ts`, `src/ui/tools/sts/telemetry/TelemetryDashboard.tsx` |
| KS-082-T5 | Add regression tests for proto loop | QA | `tests/simulators/STSLikeSimulator.spec.ts` |
| KS-082-T6 | Evidence run + log | QA | `test-results/ks-082-sts-proto-<date>.log` |

## 4. Dependencies & Risks

- Depends on `useSTSRunRecorder` (existing) and PersistenceService.
- Risk: manual overrides for Inspiration must stay off; enforce via config flag `inspirationEnabled: false` with guard in engine.
- Risk: telemetry dashboards must recognize new counters; ensure backward compatibility by defaulting to 0 when absent.

## 5. Success Metrics

- ≥95% of turns with `decision_turn = true` when handSize > 1 and mana ≥ 2.
- Fallback usage < 10% of turns (indicates players usually act) but never missing when no action chosen.
- Mana budget variance (spent vs available) documented per run.
- Evidence log contains at least 5 runs with different seeds.

## 6. References

- Core spec: `src/docs/docs/archmage/STS_NumericSimulator_Spec.md#13`
- Coordinator tracker: add row to `src/docs/docs/coordinator/strategy_tasks.md` referencing KS-082.
