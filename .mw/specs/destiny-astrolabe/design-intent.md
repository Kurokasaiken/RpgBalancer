# Destiny Astrolabe — Design Intent

**Component:** `DestinyAstrolabe` skill-check astrolabe
**Pillar:** Empire / Wilderness dual-skin (default `gilded-observatory`)
**Status:** exploration
**Date:** 2026-08-15

---

## Why it exists

The astrolabe is the cinematic D100 skill check for the POI Quest family. When a quest phase reaches a milestone, the player sees the astrolabe to learn whether the party overcame the challenge, how close the result was, and whether anyone was wounded or killed.

## What it teaches

- **Skill + difficulty are spatial.** The player sees their stat reach toward the center and the challenge difficulty as a dark boundary. Success is “inside the star”; failure is “in the goo”.
- **Risk is real but readable.** Wound and death are visual zones, not hidden dice rolls.
- **The world is ancient and magical.** The device itself should feel like a heavy brass instrument from a lost observatory, not a clean digital spinner.

## Gameplay emotion

Tension, then release: the palla charges, the rings slam, the throw arcs, and the result lands with a physical snap. It should feel like flipping a tarot card carved in bronze.

## Where it belongs

- Inside the `QuestChronicle` card (desiderata v4) as a floating, draggable skill-check panel.
- Standalone on `/minimal-destiny-astrolabe` as a test harness.
- Eventually embeddable in any POI via `destinyAstrolabeKit` (frozen kit).

## Pillar mapping

- **Empire preset:** heavy Baroque Sun-Bronze frame, basalt obsidian field, prismatic Solar Triumph light, indigo/teal shadows.
- **Wilderness preset:** lighter timber/stone frame, mossy parchment field, warm amber highlights, azure/teal shadows.
