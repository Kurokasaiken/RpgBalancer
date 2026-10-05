# HUD Living Atlas — Design Intent

**Component:** external game frame HUD (`GameFrame` / `/game-frame`)
**Pillar:** Wilderness (rude beauty), with restrained Empire accents in the Sun-Bronze edge objects
**Status:** exploration — Direction A "Living Atlas" selected by the Director after the R-075 audit
**Date:** 2026-09-22

---

## Why it exists

The game needs a persistent frame around the World Surface that carries precision information (time, resources, speed, navigation, roster) without demoting the painted map to dashboard content. The previous mockup audit (R-075, `.mw/runs/20260922-hud-mockup-audit/final.md`) concluded the rejected reference failed "not because of what it shows, but because of how it holds space". Living Atlas is the corrective direction: the map stays full-bleed and protagonist; the HUD is a thin constellation of small physical objects docked on the edges.

## What it teaches

- **The world carries semantics, the HUD carries precision.** POI states, presences and urgencies live inside the map; the chrome only carries exact values the map cannot express.
- **Chrome is sparse and earned.** A few small medallions and one parchment tag; no opaque ribbons, no full-height rails, no second decorative frame.
- **Objects are diegetic.** Each cluster should read as a small physical instrument (medallion, tag, compass) resting on the atlas, not as a decorated rectangle.

## Gameplay emotion

Calm orientation. The player glances at the edge to read a number and immediately returns to the world. Nothing competes with the painted continent; nothing feels like an application window.

## Where it belongs

- `/game-frame` route wrapping `WorldSurfaceStandalone`.
- Decomposable into existing primitives: `HudRibbon`-thin slivers, `ResourceReadout` medallions, `HudHangingTag` objective tag, `SpeedControl`, `WhenWhereCluster`, bottom nav pill.

## Pillar mapping

- **Wilderness:** azure world field, deep cool teal shadows, Solar Triumph white light, warm parchment tag.
- **Empire accent:** only in small Sun-Bronze medallion rims and the gold inner stroke of the objective tag — spent once per object, never repeated as panel frames.

## Explicit non-goals

- No weather widget, no mana/crystal resources, no combat indicators, no notification bell unless a system exists.
- No opaque top ribbon, no solid bottom bar, no full-height side panels, no window-inside-window composition.
