# Arcimago Combat Mock Prototype

**Goal:** Build a lightweight, Slay-the-Spire–style combat sandbox to validate the “mana-enhanced martial arts” feel before full production. This mock runs in parallel to Punch Club loop closure but does not gate it.

## Scope

1. **Player-driven combat** – Manual turn-based decisions with a visible hand (no auto-resolve by default).
2. **Spell exhaustion** – Any spell played disappears after one turn (treated as exiled cards).
3. **Hand limit = 4** – Always draw up to four spell-creatures each turn (unless deck <4).
4. **Random mana** – Each turn generates a random mana profile (e.g., 0–3 points across Aspects); costs must respect this RNG.
5. **Placeholder cards** – Use Slay the Spire “Ironclad” cards (Strike, Defend, Bash, etc.) as temporary spells for tuning.
6. **Turns 1–3 focus** – Instrument only the opening turns to test pacing, resource tension, and discard/reshuffle logic.

## Mechanics Summary

| Element | Implementation Notes |
| --- | --- |
| **Deck** | JSON config listing Ironclad cards with cost/damage/block/effects mapped to Archmage stats. Shuffle at start; reshuffle discard when empty. |
| **Hand Draw** | Draw up to 4 cards after upkeep. If deck + discard <4, draw whatever remains (no fatigue for the mock). |
| **Mana RNG** | At start of turn roll `manaPool = {red: rand(0-2), blue: rand(0-2), green: rand(0-1)}`. Display dice-like UI for feedback. |
| **Casting** | Playing a card consumes its cost from the available mana channels. Once resolved, card moves to an “exhaust” pile (no return). |
| **Enemy Intent** | Mock enemy telegraphs next attack/defend number (reuse Slay the Spire data). No AI beyond deterministic values. |
| **Damage/Buff Calc** | Reuse existing Monte Carlo combat helpers where possible; otherwise implement simple deterministic math (attack minus block). |
| **Telemetry** | Log per-turn mana, cards drawn/played, damage dealt/received to evaluate feel. |

## Implementation Plan

1. **Data Layer**
   - `config/combatMock/cards.json` – Ironclad card stats.
   - `config/combatMock/enemy.json` – Simple enemy intents for first 3 turns.
2. **Engine Stub**
   - Pure TS module `ArcimagoCombatMock.ts` handling deck shuffle, draw, mana RNG, card resolution, exhaustion.
   - Hooks into existing RNG utilities (LCG) for deterministic replays.
3. **UI/CLI**
   - Start with CLI or minimal React view replicating Slay-the-Spire layout (hand slots, intent icon, mana orbs).
   - Keyboard shortcuts 1–4 to play cards for fast iteration.
4. **Validation**
   - Snapshot tests for deck/draw/exhaust logic.
   - Telemetry output saved to `test-results/combat-mock-<date>.log` for analysis.

## Next Steps

1. Create config stubs for Ironclad cards + enemy intents.
2. Implement core engine (shuffle/draw/mana/cast/exhaust) with unit tests.
3. Add minimal UI/CLI to visualize first 3 turns.
4. Run playtest session, capture feedback on pacing + randomness.
5. Iterate on mana RNG distribution and hand size before designing custom Archmage spells.

*Owner:* Cascade (prototype spec) • *Status:* Draft • *Last updated:* 2026-01-08
