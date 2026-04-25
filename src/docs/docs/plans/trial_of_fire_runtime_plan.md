# Idle Village – Trial of Fire Runtime Config Plan

**Status:** Draft · **Owner:** Idle Village pod · **Last Updated:** 2025-12-23  
**Scope:** Config-first Trial of Fire brain (`villageConfig`), engine wiring (`resolveActivityOutcome`, auto-loop gates), designer UI sliders, and risk telegraphy updates.

---

## 1. Research Checklist (Punto x Punto)

1. **Engine Types (`TimeEngine.ts`)**  
   - `ScheduledActivity` already carries `snapshotDeathRisk` and `isAuto` but logic hardcodes thresholds (0.3 hero, 0.05 stat bonus, 0.25 HP gate).  
   - `resolveActivityOutcome` exists, yet multipliers/thresholds are literal values and RNG is injected via `deps.rng()`.
2. **Config Types (`idleVillage/types.ts`)**  
   - `GlobalRules.trialOfFire` only defines `highRiskThreshold`, `statBonusMultiplier`, `heroSurvivalThreshold`. Missing hero prefixes, injury knobs, automation gates, soft caps.  
   - No consolidated runtime config module for quick access.
3. **Docs & Plans**  
   - `idle_village_trial_of_fire_plan.md` Phase 0 notes mention config updates but not the detailed heroism/survival/automation rules we now need.  
   - `idle_village_tasks.md` Phase 12.12 lists high-level tasks but lacks acceptance criteria for sliders/UI.
4. **UI Surfaces**  
   - No `/debug/balancer/village` page; designer tooling limited to Balancer config editor.  
   - TheaterView/VerbCard not yet showing real-time risk stripes (yellow/red) tied to `snapshotDeathRisk`.
5. **Auto-loop Rules**  
   - `tickIdleVillage` reschedules auto activities immediately if survivors’ HP ratio > `DEFAULT_TRIAL_OF_FIRE_THRESHOLD` (0.25). No config check for fatigue or resource gating.

---

## 2. Objectives

1. Centralize all Trial of Fire + automation knobs inside `villageConfig.ts`, persisted via Idle Village config store and exposed to UI sliders.  
2. Refactor engine logic to consume only config values—no naked numbers inside `resolveActivityOutcome`, fatigue gates, or stat multipliers.  
3. Provide a designer-only `/debug/balancer/village` page with weight-based sliders + live previews for heroism, stat scaling, survival trauma, automation, and soft cap tuning.  
4. Enhance map HUD/TheaterView to surface calculated risk (striped medallion) and pre-launch updates when gear alters death risk.  
5. Document + test the end-to-end loop (config → UI → engine) ensuring adjustments apply without code edits.

---

## 3. Implementation Phases

### Phase A – Config Foundations

1. **Module Creation**  
   - Add `src/balancing/config/idleVillage/villageConfig.ts` exporting `VILLAGE_RUNTIME_CONFIG`.  
   - Shape: `{ heroism, statBonuses, survival, automation, softCap, ui }` with defaults mirroring the user’s spec.
2. **Types & Schema**  
   - Extend `TrialOfFireRules` (or create `VillageRuntimeRules`) with new nested blocks (hero prefixes array, survival soft cap, automation delay/flags).  
   - Update Zod schemas + `DEFAULT_IDLE_VILLAGE_CONFIG` + config store merge logic.  
   - Ensure `IdleVillageConfig` references this structure via `globalRules.trialOfFire` or a dedicated `villageRules` node.
3. **Single Source of Truth**  
   - Add helper `getVillageRuntimeRules(config: IdleVillageConfig)` returning normalized values (fallback to defaults).  
   - Remove `DEFAULT_TRIAL_OF_FIRE_THRESHOLD` constant after wiring fallback into helper.

### Phase B – Engine Refactor

1. **Stat Bonus Helper**  
   - Replace `applyTrialOfFireStatBonus` multiplier math with config-driven formula:  
     `bonus = 1 + risk * baseMultiplier * scalingFactor`. Apply `softCap` penalty when projected stat exceeds threshold.
2. **Heroism Logic**  
   - Determine hero promotion when `risk >= minDeathRiskForPromotion` _and/or_ `survivalCount >= heroSurvivalThreshold`.  
   - Append `heroPrefixes` by storing last earned title in `ResidentState` metadata (optional future field) or event payload.
3. **Injury Handling**  
   - Use config’s `survival.injuryThreshold` and `hpDamageOnInjury` to toggle `isInjured`, set `currentHp`, and emit `injury_applied` events.  
   - Gate auto-loop by `survival.minHpToWork` and `survival.fatigueLimit` read from config.
4. **Automation Delay & Resource Check**  
   - When auto-rescheduling, wait `automation.autoRestartDelay` milliseconds translated into time units (via `secondsPerTimeUnit`).  
   - If `automation.checkResources` is true, ensure activity costs can be paid before rescheduling.
5. **Outcome Payload**  
   - Extend `ResolveActivityOutcomeResult` with `heroPromotions`, `injuries`, `statBonuses` arrays for UI telemetry.

### Phase C – Designer Config UI

1. **Route Setup**  
   - Create `/debug/balancer/village` page gated by designer flag, reusing Observatorio layout.
2. **Tabs & Sliders**  
   - **Heroism Rules:** slider (0.1→0.9) for `minDeathRiskForPromotion`, numeric input for `heroSurvivalThreshold`, editable list for `heroPrefixes`.  
   - **Stat Scaling:** sliders for `baseMultiplier` (0.01→0.2) and `scalingFactor`, plus preview card simulating “10 missions at risk X”.  
   - **Survival & Trauma:** sliders for `injuryThreshold`, `hpDamageOnInjury`, `minHpToWork`, `fatigueLimit`; toggle for soft cap penalty.  
   - **Automation:** slider for `autoRestartDelay`, toggle for `checkResources`.  
   - Persist via `IdleVillageConfigStore.save` + toast feedback.
3. **Live Preview Hook**  
   - Build `useTrialOfFirePreview(risk, runs)` returning projected stats/hero probability.  
   - Reuse for both debug page and TheaterView risk tooltip.

### Phase D – UI Enhancements

1. **TheaterView / VerbCard**  
   - Show real-time risk stripes (yellow = injury %, red = death %) using config-driven thresholds.  
   - Display calculated snapshot risk before scheduling; update when gear/resident changes.  
   - For completed quests, show hero badge + “Apply Trial of Fire” CTA using `resolveActivityOutcome` output.
2. **HUD & Notifications**  
   - Pulse auto-loop stoppage when HP/fatigue gate fails; show tooltip referencing config value.  
   - Log hero promotions with prefix pulled from config.

### Phase E – Testing & Docs

1. **Vitest**  
   - Unit suites for: stat bonus helper w/soft cap, hero promotion thresholds, injury rolls, auto-loop gating.  
   - Deterministic RNG seeds verifying reschedule delay respects config.
2. **Playwright**  
   - Designer page slider adjustments propagate to live simulation (set slider → run quest → risk display changes).  
   - Auto-loop stops when HP slider lowered below threshold.
3. **Documentation**  
   - Update `idle_village_trial_of_fire_plan.md` and `idle_village_tasks.md` with new knobs + UI deliverables.  
   - Append summary to `MASTER_PLAN.md` under Phase 12.

---

## 4. Acceptance Criteria

- All Trial of Fire math reads exclusively from `IdleVillageConfig`. Modifying sliders in the new debug page reflects in active sessions after config save.  
- Auto-loop cannot run residents below config HP/fatigue thresholds; UI communicates the reason.  
- Hero promotions track risk-weighted `survivalScore`; hero prefixes configurable.  
- TheaterView and VerbCards show real-time risk stripes and respond to equipment changes prior to scheduling.  
- Documentation + tasks updated, and tests cover both config loading and engine/application of rules.

---

## 5. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Config drift between defaults and runtime store | Centralize defaults in `villageConfig.ts` and reuse helper for both engine + UI. |
| Designers pushing invalid values (e.g., `minDeathRisk` > 1) | Clamp inputs via Zod schema + slider min/max + helper `clamp01`. |
| Auto-loop starvation when `checkResources` toggled on | Add pre-flight resource availability check + log event for designer debugging. |
| Power creep from aggressive stat bonuses | Implement soft cap penalty and visualize growth preview before save. |

---

## 6. Linked Artifacts

- `src/balancing/config/idleVillage/types.ts` – Requires schema extension.  
- `src/engine/game/idleVillage/TimeEngine.ts` – Houses `resolveActivityOutcome`, auto-loop logic.  
- `docs/plans/idle_village_trial_of_fire_plan.md` – High-level phase plan to update post-implementation.  
- `docs/plans/idle_village_tasks.md` – Checklist tracking Phase 12.12.  
- `docs/MASTER_PLAN.md` – Portfolio overview referencing this sub-plan.  
- Upcoming `/debug/balancer/village` page (new).
