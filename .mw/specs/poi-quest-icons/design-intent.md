# Design Intent — POI Quest Icon Set

## Objective

Create a set of heavy, material POI (Point of Interest) icons, one per active
C2 quest in the Idle Village vertical slice. Each icon must read as a
hand-forged, sun-bronze and basalt relic rather than a clean digital glyph.

## Visual Direction

- Heavy impasto, chiseled bronze-and-stone materiality.
- Gilded Observatory palette: obsidian, slate, ivory, teal, gold.
- No flat design, no grey/brown/mud, no sci-fi, no grimdark gore.
- Centered, isolated, game-ready asset with no text/watermark.

## Quests Covered

Sourced from `src/balancing/config/idleVillage/defaultConfig.ts` (C2
ActivityDefinition quest entries):

1. `quest_gold_repeatable` — Repeatable Gold Quest
2. `quest_dangerous_hunt` — Dangerous Hunt
3. `quest_city_rats` — Cull Rats in Sewers
4. `bandit-camp-demo` — Bandit Camp
5. `ancient-ruins` — Ancient Ruins
6. `herb-gathering` — Herb Gathering

## Output

- `prompt.md` — master style prompt + negative prompt + one child prompt per
  quest.
- PNG assets generated via `scripts/rpg-gen-mockup.py` or any SDXL/Midjourney
  pipeline.
