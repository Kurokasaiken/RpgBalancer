# 🔬 Balancing Deep Dive: Analysis & Findings

**Date:** 2025-11-28
**Scope:** Comprehensive analysis of the current "Weight-Based" balancing system using empirical Monte Carlo simulations.

---

## 📊 Executive Summary

We performed a "Reality Check" on the project's balancing logic using the new CLI Calibration Tool. The results reveal significant discrepancies between *theoretical* weights and *actual* in-game power.

| Stat | Theoretical Weight | **Actual Weight (Simulated)** | Status |
|------|-------------------|------------------------------|--------|
| **Damage** | 5.0 HP | **0.50 HP** | ✅ Consistent (Linear) |
| **Armor** | 5.0 HP | **0.40 HP** | ⚠️ **Extremely Weak** |
| **TxC** | 2.0 HP | **0.00 HP** | 🚨 **BROKEN / Capped** |
| **Evasion** | 4.0 HP | **0.69 HP** | ⚠️ Undervalued |
| **HP** | 1.0 HP | **1.00 HP** | ✅ Control |

> **Key Insight:** The current "Universal Weights" (e.g. 5.0 for Armor) are vastly overestimating defensive stats in the current low-HP baseline context.

---

## 1. The "Armor Problem" (Weight 0.40 vs 5.0)

**The Finding:**
Simulations show that **1 point of Armor is worth only 0.40 HP**.
The theoretical weight is **5.0 HP**. This is a **12x discrepancy**.

**The Cause:**
The Path of Exile formula (`Armor / (Armor + 10 * Damage)`) is highly dependent on the incoming damage and total HP pool.
*   **Baseline:** 100 HP, 25 Damage.
*   **Test (+500 Armor):** Reduces 25 Damage to ~8.3 (66% reduction).
*   **Survival:** Increases from 4 hits to 12 hits.
*   **Value:** This 3x survival boost is equivalent to adding ~200 HP.
*   **Math:** 200 HP / 500 Armor = **0.40 HP/point**.

**Conclusion:**
Armor is NOT linear. Its value per point drops drastically as you add more, and its relative value depends entirely on your HP pool.
*   **Low HP (100):** Armor is worth little (0.4).
*   **High HP (1000):** Armor would be worth much more (likely ~4.0).

**Recommendation:**
We cannot use a single static weight for Armor if HP varies wildly. We must either:
1.  **Dynamic Weighting:** Calculate weight based on the entity's HP bucket.
2.  **Re-Baseline:** Calibrate weights against a "Endgame" baseline (e.g. 1000 HP) if that's the target gameplay.

---

## 2. The "TxC Anomaly" (Weight 0.00)

**The Finding:**
Adding +20 TxC resulted in **0.00 HP** value. The win rate did not change.

**The Investigation:**
*   **Formula:** `HitChance = TxC + 50 - Evasion` (Clamped 1-100).
*   **Baseline:** TxC 25, Evasion 0.
*   **Base Hit Chance:** `25 + 50 - 0 = 75%`.
*   **Test (+20 TxC):** `45 + 50 - 0 = 95%`.
*   **Expected Result:** Going from 75% to 95% hit chance is a **26% DPS increase**. This *should* have massive value.

**Why 0.00?**
This indicates a potential bug in the `CombatSimulator` or `StatValueAnalyzer`.
*   Possibility A: The `HitChanceModule` is not being called correctly in the simulator.
*   Possibility B: The `BASELINE_STATS` has a hardcoded `hitChance` property that overrides the calculation.
*   Possibility C: The `StatValueAnalyzer` binary search failed to converge (unlikely for such a clear advantage).

**Recommendation:**
Immediate debugging of `CombatSimulator.ts` to ensure `txc` stat changes actually affect the hit roll.

---

## 3. Evasion (Weight 0.69 vs 4.0)

**The Finding:**
Evasion is worth **0.69 HP**. Theoretical is 4.0.

**The Analysis:**
*   **Test (+20 Evasion):** Reduces enemy hit chance from 75% to 55%.
*   **Mitigation:** You take damage 26% less often.
*   **EHP Value:** Increases EHP from 133 to 181 (+48 EHP).
*   **Math:** 48 EHP / 20 Evasion = **2.4 HP/point**.
*   **Simulated Weight (0.69):** Much lower than expected (2.4).

**Why the Discrepancy?**
The simulation balances against **Raw HP**.
*   Adding Raw HP increases survival linearly.
*   Adding Evasion increases survival exponentially (EHP).
*   In the low-HP baseline (100), the raw HP needed to match Evasion's value is lower than EHP theory suggests because of "Overkill" and "Time to Kill" breakpoints.
*   Example: If you die in 4 hits, dodging 1 hit lets you live for 5 hits. Adding 25 HP also lets you live for 5 hits.
*   So 20 Evasion ≈ 25 HP -> Weight 1.25. (Closer to 0.69).

---

## 🚀 Strategic Recommendations

### 1. Abandon "Universal Weights" for Non-Linear Stats
Armor and Evasion cannot have a single weight (e.g. "5.0") that is accurate for both Level 1 (100 HP) and Level 50 (5000 HP).
*   **Action:** Define weights as **Functions** of HP/Level, or stick to a "Standard Tier" baseline for balancing.

### 2. Fix the TxC/Hit Logic
The 0.00 weight for TxC is a critical bug.
*   **Action:** Verify `CombatSimulator` uses `HitChanceModule` correctly and ignores hardcoded `hitChance` if `txc` is present.

### 3. Re-Calibrate `statWeights.ts`
The current file contains "Empirical" weights (Damage=1.0) that contradict our fresh findings (Damage=0.5).
*   **Action:** Update `statWeights.ts` with the *actual* values found today (Damage 0.5, Armor 0.4) to reflect the *current* reality of the engine.

### 3.b Single Source of Truth for Weights (Dec 2025)

Following the Config-Driven Balancer work (Phase 10), weights are now **owned by** the BalancerConfig:

* Canonical values live in `DEFAULT_CONFIG.stats[statId].weight` under `src/balancing/config/defaultConfig.ts`.
* `NORMALIZED_WEIGHTS` and `STAT_WEIGHTS` in `src/balancing/statWeights.ts` now **read from** `DEFAULT_CONFIG` for all stats that exist in the config (hp, damage, txc, evasion, armor, resistance, armorPen, penPercent, lifesteal, regen, critChance, critMult, ward, etc.).
* Legacy consumers (SpellCost, BalanceConfigManager, ArchetypeBuilder presets) still import `NORMALIZED_WEIGHTS`, but the numeric values are no longer independent—they mirror the BalancerConfig defaults.
* The AutoStatBalancer and StatWeightAdvisor already operate directly on `config.stats[statId].weight` and should be considered the primary way to evolve weights.

**Implication:** when we say "update stat weights" we now mean:

1. Change `DEFAULT_CONFIG.stats[statId].weight` (or via the Balancer UI when wired).
2. Let `statWeights.ts`/`NORMALIZED_WEIGHTS` pick up those changes automatically.
3. Avoid introducing new hard-coded weight tables outside of the config.

### 4. Adopt "Standard Baselines"
Define 3 baselines for calibration:
*   **Early Game:** 100 HP, 25 Dmg (Current)
*   **Mid Game:** 1000 HP, 200 Dmg
*   **End Game:** 5000 HP, 1000 Dmg
*   Calibrate weights for each to see the scaling curve.

---

**Next Steps:**
1.  Debug TxC logic.
2.  Update `statWeights.ts` with these findings.
3.  Run calibration on Mid-Game baseline to verify scaling hypothesis.
