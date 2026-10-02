# Mission Planner — Mathematical Contract

**Status:** candidate
**Version:** 1.1.0 (MP-00 + MP-06 runtime + phase preview)
**Owner:** Devin
**Last Updated:** 2026-10-01
**Authority:** `.mw/desiderata.md` v23 rev.4, `plans/PLAN-018-mission-planner.md` v3.1, `context/DECISION_LOG.md` (D1–D4, checkpoint)

This document is the **single normative source** for the probability model shared by the
Mission Planner preview and the quest resolver. Planner and resolver MUST be two surfaces
over the same pure functions: the Planner shows the distribution, the resolver samples from
it. Any change to this file requires updating both surfaces and the balance evidence.

---

## 1. Definitions and notation

| Symbol | Meaning |
|---|---|
| `M = {1..m}` | Party: `m` members, ordered by **slot index** (then `residentId` as tiebreak). |
| `k = 1..n` | Quest phases, in blueprint order. `n ≥ 1` (schema-enforced `min(1)`). |
| `S_k ⊆ M` | Members **alive** at the start of phase `k`. `S_1 = M`. |
| `c` | Count of passed phases so far. |
| `eff_i(t)` | Effective numeric value of stat `t` for member `i` after loadout (MP-03 output). |
| `D_k` | D100 difficulty target of phase `k`, from `resolvePhaseDifficulty`. |
| `d_i,k(S)` | Death chance (pp) of member `i` in phase `k`, given alive set `S`. |
| `w_i,k(S)` | Injury chance (pp) of member `i` in phase `k`, given alive set `S`. |
| `p_k(S)` | Pass probability of phase `k` given alive set `S`. |

Probabilities in this contract are real numbers in `[0,1]`. **Percentage points (pp)**
are the authoring unit in config: divide by 100 where the contract expects a fraction.

A member has exactly three **final states**: `dead`, `injured` (wounded ≥1 time and alive
at end), `unscathed` (alive, never wounded). These three partition the outcomes: a member
who is wounded and later dies is reported as `dead`.

**Solo morto** (Director decision): only death removes a member from `S`. A wounded member
keeps contributing stats and keeps rolling risk in later phases. Because no other event
removes members, `|S_k| < m` ⟺ at least one death has occurred — the DP needs no separate
`anyDeath` flag.

---

## 2. Phase inputs (data model)

### 2.1 Check stat resolution

Each phase `k` declares `checkStatTags_k` — an ordered list of **numeric stat keys**
(e.g. `strength`, `agility`, `perception`). These are skill-check inputs, **not** role gates.

> **Data-model rule (D4, normative):** `requirements.statRequirement` (`.allOf`/`.anyOf`)
> is a **role/gate requirement** matched via `statMatching.getResidentStatTags`
> (resident tag list), and MUST NOT be fed to the numeric check. The current behaviour —
> `resolvePhaseStatTags` reading `statRequirement.allOf` into `sumPartyStat` — is a bug
> that pins success to `unstaffedStatFloor` and is removed by the fix spec
> (`mission_planner_data_model_fix.md`).

Numeric stat source: the resident's resolved `statSnapshot` (canonical, post-import merge
of `statBlock`), then equipment/loadout deltas from MP-03.

### 2.2 Difficulty

`D_k = resolvePhaseDifficulty({difficultyLabel, blueprintDifficulty, phaseType})` —
existing function in `questSkillCheckConfig.ts`, unchanged. Result is already an integer
in `[difficultyFloor, difficultyCeiling]`.

### 2.3 Party stat aggregation

For each tag `t ∈ checkStatTags_k`, given alive set `S`:

```
rawSum_t(S) = Σ_{i∈S} eff_i(t)
stat_t(S)  = round( clamp( rawSum_t(S) · partyStatMult, unstaffedStatFloor, statCeiling ) )
```

`partyStatMult` is a new `QuestSkillCheckConfig` field (default `1`, see data-model spec);
it bridges the resident stat scale (~2–16) to the D100 difficulty scale (45–80). The
multiplier is applied to the **sum**, before rounding/clamping — same order as the
existing `clampStat` (`round(min(ceiling, max(floor, x)))`).

**Weakest skill (retained, canonical):** the phase check uses the *worst* tag margin:

```
stat_k(S) = stat_{t*}(S)  where  t* = argmin_t ( stat_t(S) − D_k )
```

Ties broken by `checkStatTags` declaration order (first index wins — mirrors the existing
`reduce` that keeps the first minimum).

**Empty `checkStatTags`:** produces one generic skill
`stat = round(clamp(|S| · unstaffedStatFloor, floor, ceiling))`, difficulty `D_k`.
(Party-size proxy; retained for backward compatibility. New blueprints MUST declare
`checkStatTags` — authoring rule in the data-model spec.)

### 2.4 Success bound and verdict distribution

Given `stat = stat_k(S)` and `D = D_k`:

```
s = clamp( stat − D + parSuccessChance, successFloor, successCeiling )      // pp
```

The D100 roll `r` is uniform on the integers `{1..100}`. Verdict bands (exact discrete
semantics of `resolveMilestoneWithoutAnimation`, epicfail checked **first**):

| Verdict | Condition | Count of rolls |
|---|---|---|
| `epicfail` | `r ≥ epicFailThreshold` | `100 − epicFailThreshold + 1` |
| `bigwin` | `r ≤ s·criticalWinFraction` and `r < epicFailThreshold` | `max(0, min(⌊s·f⌋, epicFailThreshold−1))` |
| `win` | `r ≤ s` and `r < epicFailThreshold`, not bigwin | `max(0, min(⌊s⌋, epicFailThreshold−1)) − bigwinCount` |
| `almost` | `s < r ≤ s + nearMissBand` and `r < epicFailThreshold` | `max(0, min(⌊s+nearMissBand⌋, epicFailThreshold−1) − min(⌊s⌋, epicFailThreshold−1))` |
| `fail` | otherwise | `100` minus all above |

**Pass definition (rev.3, normative):**
`pass(verdict) = verdict ∈ {bigwin, win}`. `almost` is **not** a pass.

```
p_k(S) = ( bigwinCount + winCount ) / 100
```

Worked example (defaults `par=50, floor=5, ceiling=95, f=0.2, nearMiss=10, epic=96`):
`stat=50, D=60` → `s=40` → bigwin `⌊8⌋=8`, win `32`, almost `10`, epicfail `5`, fail `45`
→ `p = 0.40`. Old rule would have counted almost → `0.50`.

`s` is not rounded before the band computation (matches the code, which uses the raw
clamped value); `⌊·⌋` applies only to roll counts.

---

## 3. Per-member phase risk

### 3.1 Composition (all terms in pp, additive)

For member `i ∈ S`, phase `k` (implemented as `memberPhaseRisk` in
`missionPlannerMath.ts`; exported for the phase-level preview §4.3):

```
d_i,k(S) = clamp( base_d,k
                + slotD_i            // residentRiskModifiers.deathChanceDelta of i's slot
                + equipD_i           // Σ equipment deathChanceDelta
                + consumD            // Σ consumable deathChanceDelta (party pool, D3)
                + emptySlotD         // Σ emptyPenalty.extraDeathChance of empty required slots
                + Σ_{j∈S, j≠i} coverD_j , 0, 100 )

w_i,k(S) = clamp( base_w,k + same terms with injury deltas, 0, 100 )
```

- `base_d,k / base_w,k` = phase `riskProfile.deathChance / injuryChance`.
- **Cover (D1):** `coverD_j` is a pp delta authored on member `j`'s equipment/tags that
  applies to **every other living member**. Cover is alive-conditional: if provider `j`
  dies, the cover stops from the next phase — this is why `d_i,k` depends on `S`.
- Consumables (D3) are a **party pool**: their deltas apply to every living member's roll
  on that phase.
- **Clamp discipline:** compute the raw sum, clamp **once** at the end. If
  `d_i,k + w_i,k > 100`, injury is truncated to `w̃_i,k = 100 − d_i,k` — death has priority
  (mirrors the existing single-roll order).

### 3.2 Roll semantics

One independent roll `u_i,k ∈ {1..100}` per member per phase:

- `u ≤ d` → **dead** (exits `S` for later phases),
- `d < u ≤ d + w̃` → **injured** (stays in `S`),
- else → fine.

### 3.3 Independence assumptions (normative)

- Risk rolls are independent across members and across phases, and independent of the
  phase check roll.
- Phase check rolls are independent across phases **given** the alive sets; the alive sets
  themselves are random, so marginal phase results are *not* independent (death cascade).
- Injuries carry no mechanical penalty in v1 (no stat debuff, no accumulation cap beyond
  the binary `injured` final state).

### 3.4 WHY-contribution ordering

For UI attribution, contributions are listed in this canonical order per metric:
`phase(base) → slot → emptyPenalty → equipment (sorted by itemId) → cover (by provider
slot index) → consumables (sorted by itemId) → clamp` (a synthetic contribution reporting
the clamped-away amount, emitted only when the raw sum hit a bound). Cover contributions
are labelled by the *provider* (`+ Guard (cover) → −4 pp death on you`).

---

## 4. Exact dynamic program

### 4.1 State and transition

Forward distribution `F_k(S, c)` = probability of reaching the start of phase `k` with
alive set `S` and `c` passed phases. `F_1(M, 0) = 1`.

Transition from `(k, S, c)` over phase `k`:

1. **Deaths** (independent per member): for every `D ⊆ S`,
   `P(S′ = S∖D) = Π_{i∈D} d_i,k(S) · Π_{i∈S∖D} (1 − d_i,k(S))`.
2. **Wipe:** if `S′ = ∅` → absorbing terminal, outcome `deadly` (the quest aborts mid-run;
   unplayed phases are never resolved).
3. **Check:** else `c′ = c+1` w.p. `p_k(S)` (roll vs stats of `S`, pre-death — the check is
   resolved on the party that started the phase), `c′ = c` w.p. `1 − p_k(S)`.
   Accumulate `F_{k+1}(S′, c′)`.

Complexity: `O(n · 3^m · n)` states-transitions worst case; at `m=6, n=5` ≈ 18k — trivially
real-time for a preview.

### 4.2 Terminal classification (full run)

For each terminal `(S ≠ ∅, c)` after phase `n`, with `anyDeath = (|S| < m)`:

| Condition | Tier |
|---|---|
| `c = n`, no death | `perfect` |
| `c = n`, ≥1 death | `success` |
| `c = 0`, ≥1 death | `deadly` |
| `c = 0`, no death | `fail` |
| `c·2 ≥ n` | `success` |
| otherwise | `partial` |

Wipe mass from §4.1 step 2 adds to `deadly`. This mirrors `resolveQuestOutcomeTier`
with two deliberate deviations — `almost` no longer passes, and death is **per-member**
(the old `dead` flag was party-level and narrative-only).

**Success probability (the Planner's headline):**
`P_success = P(tier ∈ {perfect, success})`. `partial` is not a success.

### 4.3 Continue/retreat checkpoint (D2)

After each phase `k`, the player may **retreat**: the quest resolves on the `k` phases
already played — same table as §4.2 with `n := k` (denominator = played phases, matching
`resolveQuestOutcomeTier`'s `resolved.length` semantics). A wipe still forces `deadly`.
No checkpoint exists at `k = 0` (retreat before the first phase = abort → `fail`, no risk
taken).

The Planner evaluates the **full run** and emits per-phase
`P_surviveThrough(k) = P(S_{k+1} ≠ ∅)` and the retreat-tier distribution at each `k`
(both are free by-products of the forward pass).

**Dual checkpoint preview (runtime, MP-06):** when the game stops at a checkpoint the
player sees two distinct forecasts:

- **Continue:** `computeMissionPreview` is re-run on the **remaining** phases
  (`phases[k+1..n]`) with the members still alive as the new party (injured keep
  rolling, dead are out). This is a fresh DP over a smaller input — the quest-total
  forecast for what is left, not a copy of the phase just resolved.
- **Retreat:** deterministic `classifyTier(passed, playedCount, anyDeath)` over the
  phases already played — no probability involved.

**Phase-level preview (Planner UI):** each phase row shows metrics computed on the
**all-alive** mask `M` (a point-in-time forecast, not a DP aggregate):

- `memberPhaseRisk(members, i, phase_k, M, consumables, emptySlotPenalty)` — the
  §3 composition for member `i` at phase `k`; the row shows the **min–max range**
  over the drafted members;
- `surviveThrough(k)` and the **dominant retreat tier** (argmax of
  `retreatTiers` conditional on reaching `k`) — both from the §4 forward pass.

### 4.4 Per-member marginals

Final-state marginals, computed exactly inside the same forward pass (no extra DP needed):

- `P_dead_i = 1 − Σ_{S∋i} F_{n+1}(S)` — `1 − P(i` alive at end`)`. Deaths accumulate
  across phases through the transition probabilities.
- `P_unscathed_i` needs i's personal outcome history: maintain, alongside `F`, an
  accumulator `A_i,k(S,c)` = probability mass reaching `(k,S,c)` along paths where `i`
  was **never wounded** (multiply each transition by `1 − d_i,k − w̃_i,k` instead of
  `1 − d_i,k` for member `i`'s survival factor). Then
  `P_unscathed_i = Σ_{S∋i,c} A_i,n+1(S,c)`.
- `P_injured_i = P(alive_i) − P_unscathed_i`.

Because `d`/`w` may depend on `S` (cover), the closed forms
`P_dead_i = 1 − Π_k(1−d_i,k)` / `P_inj_i = Π_k(1−d_i,k) − Π_k(1−d_i,k−w_i,k)`
are **valid only when no cover source exists** (all `d_i,k`/`w_i,k` independent of `S`);
the engine MUST use the DP accumulators, and MAY use the closed form as a fast path /
cross-check when `cover` is empty.

### 4.5 Duration and reward

```
duration = max( durationMin, round( (Σ_k phaseDuration_k + Σ_item durationDelta) · Π_item durationMult ) )
expectedRewardMult = Σ_tier P(tier) · rewardMultiplier[tier] + Σ_item rewardMultiplierDelta
```

Phase durations are summed in the blueprint's own units normalized by the existing
quest-time scale (`questTimeScale.ts`); mount/equipment deltas come from item config
(MP-02). `durationMin` defaults to `1` in the same unit. Reward multipliers come from
`questPowerRules.rewardMultipliers` (fed at the call-site: `useQuestPoiSession` passes
them into the planner input; MP-06 kept this source rather than moving them under the
planner config).

---

## 5. Canonical output and numerical discipline

`computeMissionPreview(party, phases, config)` returns (in this order):

```ts
{
  questSuccess: number;                    // P(tier ∈ {perfect,success}), [0,1]
  tiers: Record<QuestOutcomeTier, number>; // full distribution, sums to 1
  phases: Array<{                          // one entry per blueprint phase
    phaseId: string;
    passChance: number;                    // Σ_S F_k(S,·)·p_k(S) — expected, state-aware
    surviveThrough: number;                // P(S_{k+1} ≠ ∅)
    retreatTiers: Record<QuestOutcomeTier, number>; // if the player stops after k
  }>;
  members: Array<{                         // slot order, then residentId
    residentId: string;
    deathChance: number;                   // P_dead_i
    injuryChance: number;                  // P_injured_i
    unscathedChance: number;               // = 1 − death − injury
  }>;
  aggregate: {
    anyDeath: number;                      // P(≥1 death)
    anyInjury: number;                     // P(≥1 injury event)
    expectedDeaths: number;                // Σ_i P_dead_i
    expectedInjuries: number;              // Σ_i P_injured_i
  };
  duration: number;
  expectedRewardMultiplier: number;
  contributions: Contribution[];           // WHY list, ordered per §3.4
}
```

- **Rounding:** full `Float64` precision internally; every emitted probability is rounded
  to **6 decimal places** (`round(x·1e6)/1e6`). Tier distributions may then sum to
  `1 ± 1e-6`; consumers must not re-normalize.
- **Reversibility:** the preview is a pure function of `(party, loadout, consumables,
  config)`. No RNG, no reads of mutable quest state, no writes to `statSnapshot`.
  A → A+x → A round-trips to **bit-identical** outputs.
- **Seeded-resolver consistency:** the resolver samples the same model (same functions,
  same clamps). Verification tolerance vs Monte Carlo: `±1.5 pp` at ≥10 000 seeded runs.

---

## 6. Edge cases

| Case | Contract |
|---|---|
| `m = 0` (empty party) | Invalid draft — Planner shows `canEmbark=false`; engine output is the zeroed shape with all probabilities `0`. |
| `n = 0` | Blocked by schema (`phases.min(1)`); defensive return = `fail` tier with zeroed fields. |
| `p_k = 0` or `1` | Legal (clamps); DP degenerates correctly. |
| `d_i,k + w_i,k > 100` | Injury truncated (`w̃ = 100 − d`); death never truncated by injury. |
| All members die mid-run (`S′=∅`) | Terminal `deadly` immediately; later phases unplayed. |
| Survivor set shrinks | Later phases recompute stats on `S′` (cascade is the DP's core feature). |
| Cover provider dies | Cover ends from the next phase (risk depends on `S`). |
| `partyStatMult = 0` | Legal; all stats collapse to `unstaffedStatFloor` (authoring footgun — warn in schema doc). |
| Odd phase counts | `c·2 ≥ n` means e.g. 2/3 passes → `success`. |
| Retreat after `k` | Tier table on `k` played phases; `k=0` → `fail`. |

---

## 7. Runtime migration table ("cosa cambia")

| Current | New contract |
|---|---|
| `isPassingVerdict` includes `almost` | `win \| bigwin` only (MP-06 changes one line + call-site audit) |
| Phase `dead/wounded` flags: one party-level roll, narrative only (they never touch residents) | Per-member per-phase risk roll; death removes from `S` |
| `resolvePartyConsequences` (uniform outcome-level chances, rolled at end) | **Deprecated for quest resolution** — consequences emerge from per-phase risk inside the run; call-site inventory in `mission_planner_data_model_fix.md` §4 |
| `resolveQuestOutcomeTier` on all resolved phases | Same function, new verdict semantics + per-member death flag + retreat denominator |
| Stats from `statRequirement` role tags | `checkStatTags` numeric stats + `partyStatMult` |
| No checkpoints | Continue/retreat choice after every phase (D2) |
| `questItemsMock.ts` consumables | Real item schema (MP-02), same `applyConsumableRiskEffects` semantics extended per-member |
