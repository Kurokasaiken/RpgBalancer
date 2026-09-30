# Mission Planner — Data-Model Fix Specification

**Status:** candidate
**Version:** 1.0.0 (MP-00)
**Last Updated:** 2026-10-03
**Normative for:** MP-02 (schema + re-authoring), MP-03 (loadout → stats)
**Companion:** `mission_planner_math_spec.md` (the model this data feeds)

---

## 1. The defect being fixed

Three confirmed mismatches between authored data and what the check actually consumes:

1. **Role tags are read as numbers.** `resolvePhaseStatTags`
   (`questMilestones.ts:57-77`) merges `requirements.statRequirement.allOf/anyOf` into
   the skill-check tag list, then `sumPartyStat` sums `statSnapshot[tag]` over the party.
   Blueprints author `allOf: ['lantern']`/`['edge']` as **role gates** ("bring a lantern
   scout"), so the numeric sum is `0` → clamped to `unstaffedStatFloor = 5` → every such
   phase succeeds at the `successFloor` (5%) regardless of who is sent.
2. **Stat scale does not reach the D100 scale.** Resident stats are ~2–8 (villagers,
   `minimalGameplayConfig`) / ~10–70 (heroes, `statBlock`); difficulties are 45–80. A
   raw sum needs ~5 members to reach parity — party size becomes the only lever.
3. **Phases without requirements get a degenerate skill.** The "generic skill" is
   `count(residents with statSnapshot.hp) · unstaffedStatFloor` — an hp-presence hack, not
   a stat.

## 2. Schema changes (MP-02 implements; normative here)

### 2.1 `QuestPhase.requirements.checkStatTags` ✅ landed in MP-02

```ts
// PhaseRequirementsSchema addition (questBlueprints.schema.ts)
checkStatTags: z.array(z.string().min(1)).optional(),
```

- Ordered list of **numeric stat keys** drawn from the canonical stat namespace
  (`strength`, `endurance`, `agility`, `intelligence`, `perception`, plus hero-scale
  `statBlock` keys such as `armor`, `evasion`).
- Empty/absent → the generic-skill fallback of math spec §2.3 (unchanged).
- **Authoring rule (lint target):** every phase SHOULD declare at least one tag; phases
  with no tag AND no `statRequirement` produce a tooling warning.

### 2.2 Role gate separation

`requirements.statRequirement` keeps its gate meaning (matched by `statMatching` on
resident `statTags` — strings like `warden`, `lantern`, `edge`). Migration:

- `resolvePhaseStatTags` no longer reads `statRequirement` (landed in MP-02); its
  inputs are `requirements.checkStatTags` → `requirements.requiredStatTags` (trial
  shape) → explicit `fallbackCheckStatTags` (numeric tags only — the activity-level
  `statRequirement` is a gate and was removed from this chain) → empty.
- Existing `allOf: ['lantern']` / `['edge']` entries are **kept as gates** (slot/quest
  eligibility still uses them); they are re-authored into `checkStatTags` only where a
  real numeric stat exists — see §5 for the blueprint mapping proposal.

### 2.3 `partyStatMult` ✅ landed in MP-02

```ts
// QuestSkillCheckConfigSchema addition (questSkillCheckConfig.ts)
partyStatMult: z.number().min(0).max(10).default(4),
```

Applied to the party sum before clamp (math spec §2.3); NOT applied to the generic
no-tag skill. Default `4` comes from the MP-00 balance report
(`test-results/mission-planner-balance-*.md`): a 3-villager reference party lands a
`dangerous` quest at ~31% success.

### 2.4 Item/equipment schema deltas ✅ schema landed in MP-02 (`questItems.schema.ts` + `questItems.ts` pool; consumed by MP-03)

All pp deltas unless noted. Canonical contribution order: math spec §3.4.

| Field | Target | Semantics |
|---|---|---|
| `statDeltas: Record<string, number>` | wearer | additive to `eff_i(t)` before `partyStatMult` |
| `injuryChanceDelta` / `deathChanceDelta` | wearer (equip) / all members (consumable, D3) | pp additive, pre-clamp |
| `coverRiskDelta: { injuryChance?: number; deathChance?: number }` | **other** living members | pp additive; negative values protect; ends when provider dies (D1) |
| `durationDelta` / `durationMult` | quest | additive units / multiplicative, applied per math spec §4.5 |
| `rewardMultiplierDelta` | quest | additive on expected reward multiplier |
| `slot: 'weapon'\|'armor'\|'mount'\|'trinket'` | wearer | mount occupies an equipment slot (Director decision) — one item per slot per member |

`QuestPhaseRiskProfile` stays the base layer; slot `residentRiskModifiers` and
`emptyPenalty` (already in `slots/types.ts`) are per-member terms in §3.1.

## 3. Proposed `checkStatTags` for existing blueprints ✅ authored in MP-02

Verified against `MINIMAL_GAMEPLAY_RESIDENTS` stat keys. Values marked ★ are the
ones the balance report is computed on — all three landed verbatim in
`questBlueprints.ts`.

| Blueprint / phase | Role gate (unchanged) | `checkStatTags` proposal |
|---|---|---|
| `quest_city_rats` / `scout_tunnels` (check) | `allOf: [lantern]` | `['perception', 'agility']` ★ |
| `quest_city_rats` / `crush_brood` (fight) | `encounterId` | `['strength', 'endurance']` ★ |
| `quest_city_rats` / `purge_vents` (trap) | `materials` cost | `['intelligence', 'perception']` ★ |

## 4. Call-site inventory (MP-06 scope)

`grep -rn resolvePartyConsequences|resolveQuestPower|resolveMilestoneWithoutAnimation
|resolveQuestOutcomeTier|isPassingVerdict src/ tests/`:

| File | Usage | Action under new contract |
|---|---|---|
| `QuestPowerEngine.ts` | defines legacy model | deprecate consequence path; keep power/distribution helpers until preview migration |
| `questMilestones.ts` | `isPassingVerdict`, `resolveMilestoneWithoutAnimation`, `resolveQuestOutcomeTier`, `resolvePhaseStatTags`, `sumPartyStat`, `applyConsumableRiskEffects` | drop `almost` from `isPassingVerdict`; stat tags per §2.2; risk roll becomes per-member via shared pure fns |
| `PoiDetailQuestRosterTimeClockIntegrationPage.tsx` | milestone resolution (×2), `resolveQuestPower`, `resolveQuestOutcomeTier`, `isPassingVerdict` | migrate to resolver over shared model + checkpoint UI (D2) |
| `PoiDetailQuestRosterIntegrationPage.tsx` | `resolveQuestPower` | same migration |
| `MilestoneCheckModal.tsx`, `questPoiKit.tsx` | display `wounded`/`dead` flags | display per-member results |
| `useQuestAssignmentPreview.ts` | distribution + expected-risk preview | superseded by `computeMissionPreview` (MP-01/MP-04) |
| `tests/unit/idleVillage/{questMilestones,QuestPowerEngine,useQuestAssignmentPreview}.test.ts` | coverage of legacy semantics | update assertions; add per-member cases |
