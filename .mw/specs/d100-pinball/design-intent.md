# D100 Pinball — Design Intent

**Component:** `DestinyAstrolabe` skill-check resolution (visual refresh)
**Pillar:** Empire default (`gilded-observatory`), Wilderness variant later
**Status:** exploration
**Date:** 2026-08-15

---

## Why it exists

The astrolabe is the D100 skill-check moment for quest milestones. It must make the probabilities of the five outcomes (triumph, success, almost, fail, epic fail) immediately readable while the ball is still in motion. We are moving the metaphor from a passive astrolabe to an active **pinball playfield**: the ball is the dice roll, the lanes/bumpers are the thresholds, and the colored zones are the outcomes.

## What it teaches

- **Where the ball lands = the outcome.** No hidden math.
- **Bigger zones are more likely.** The player can eyeball the relative area of each colored region.
- **Skill pushes the bumpers.** The player’s stat moves the crystal bumpers inward, making the good zones larger.
- **Difficulty narrows the lanes.** The difficulty rating widens the dark tar lanes, shrinking the safe area.
- **Risk is in the gutters.** Wound/death are the outer flippers/drain zones, visible before the throw.

## Gameplay emotion

A charged launch → the marble streaks through glowing lanes → it ricochets off asymmetric bronze bumpers → it settles into a colored well. The result is a physical landing, not a number popup.

## Where it belongs

- Inside `QuestChronicle` / `MilestoneCheckModal` as a floating skill-check panel.
- Standalone on `/minimal-destiny-astrolabe` as a test harness.
- Reusable via `destinyAstrolabeKit`.

## Pillar mapping

- **Empire / gilded-observatory:** heavy bronze frame, obsidian playfield, prismatic Solar Triumph light, gold/amber/purple/crimson zones.
- **Wilderness / rustic-orrery:** lighter brass/timber frame, slate playfield, azure highlights, softer amber/teal/crimson zones.
