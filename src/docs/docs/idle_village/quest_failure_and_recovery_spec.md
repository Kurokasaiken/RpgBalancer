# Quest Failure, Timeout and Recovery Spec

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Goal

This document describes what happens when a quest does **not** succeed, and how a player recovers. It covers the five quest outcomes, their consequences, the missing failure UI, and the missing timeout behavior.

## Quest Outcomes

`QuestPowerEngine` produces five ordered outcomes from best to worst:

1. `perfect`
2. `success`
3. `partial`
4. `fail`
5. `deadly`

See `idle_village_gameplay_math_spec.md` §Quest Power Engine for the exact formulas.

## Consequences by Outcome

| Outcome | Rewards | XP | Injury | Death |
|---|---|---|---|---|
| `perfect` | `1.5 × base` | full | 0% | 0% |
| `success` | `1.0 × base` | full | 5% | 0% |
| `partial` | `0.5 × base` | full | 20% | 2% |
| `fail` | `0.1 × base` (or none) | full | 40% | 5% |
| `deadly` | `0` | full | 70% | 15% |

- `QuestResolver` currently always awards full `xpAwarded` regardless of outcome. This is a **known simplification**.
- Resource rewards are computed in `QuestResolver` from `activity.rewards` and are not yet multiplied by `rewardMultipliers[outcome]`. This is **not wired** to `QuestPowerEngine`.
- `QuestResolver` returns `injuryRolls` as a field, but the caller does **not apply them**.

## Failure Flow

### Current flow (what the code does)

```text
Quest reaches endTime
   │
   ▼
QuestResolver.resolveQuest()
   │
   ├─ emits quest_completed event
   ├─ applies unmultiplied rewards
   ├─ returns injuryRolls (unused)
   ▼
QuestChronicle opens
   │
   ├─ shows phases
   ├─ shows "Raccogli ricompense"
   ▼
Residents return to roster with status 'available' (or 'exhausted')
```

### What is missing

- **Outcome awareness in the UI:** `QuestChronicle` does not show `perfect/success/partial/fail/deadly`. It always presents the quest as completed.
- **Failure modal:** there is no dedicated failure/recovery screen. `QuestSuccessModal` exists; `QuestFailureModal` does not.
- **Injury/death application:** the engine can roll injuries and death, but the UI does not show or apply them.
- **Resource penalty:** failing a quest should not give rewards, or should give reduced/penalty rewards. Today it gives the base reward amount.
- **Retry / abandon:** there is no retry or abandon quest action.

## Timeout

### Current behavior

- The `TimeEngine` does not have a special `quest_timeout` event.
- When `currentTime >= endTime`, the activity is marked `completed` and `activity_completed` is emitted.
- The quest is treated the same as a normal completion.

### Missing behavior

- No `quest_timeout` event type in `VillageEvent`.
- No partial-completion reward for a quest that runs out of time.
- No "return with nothing" or "abort" path.
- No visible countdown that warns the player when a quest is about to expire.

## Recovery (Proposed)

When a quest fails, the following steps should be available:

1. **Show the outcome card** — result, injuries/deaths, lost resources.
2. **Return residents** — living residents go back to the roster with `status: 'available'` or `'exhausted'`.
3. **Apply injuries/death** — update `ResidentState`, trigger `injury_applied` / `death` events.
4. **Apply resources** — add reduced/penalty rewards, or none.
5. **Chronicle entry** — add a `quest_failed` / `quest_deadly` entry to the event log.
6. **Player options**:
   - `Reattempt` (if quest is still offered and residents are able)
   - `Dismiss` (close the card, return to map)
   - `Heal / Rest` (if injuries need recovery)

## Invariants

- A quest outcome must be deterministic for the same RNG seed and inputs.
- A failed quest must still return residents to the roster; they must not remain stuck in the slot.
- `ResidentState.status` must reflect `dead` if a death roll succeeds; UI must handle `dead` residents.
- `QuestResolver` must not silently ignore `rewardMultipliers` or `injuryRolls`.

## What is Mocked or Missing

| Feature | Status | Notes |
|---|---|---|
| Outcome-based reward multiplier | **MISSING** | `QuestResolver` ignores `QuestPowerEngine` multipliers |
| Injury/death application | **MISSING** | `injuryRolls` returned but unused |
| Failure UI | **MISSING** | No `QuestFailureModal`; `QuestChronicle` always positive |
| Timeout event / partial completion | **MISSING** | `TimeEngine` treats timeout as completion |
| Death state UI | **MISSING** | `dead` not rendered in roster or PgCard |
| Recovery actions (retry/heal) | **MISSING** | Not designed or implemented |
| XP outcome adjustment | **MOCKED** | Full XP always awarded |

## Test Commands

```bash
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts
npm run build:check
```

## References

- `src/engine/game/idleVillage/QuestPowerEngine.ts`
- `src/engine/game/idleVillage/QuestResolver.ts`
- `src/engine/game/idleVillage/TimeEngine.ts`
- `src/engine/game/idleVillage/InjuryEngine.ts`
- `src/docs/docs/idle_village/idle_village_gameplay_math_spec.md`
- `src/docs/docs/idle_village/village_event_system_spec.md`
