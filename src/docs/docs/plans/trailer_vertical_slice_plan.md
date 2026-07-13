---
title: Idle Village — Trailer Vertical Slice Plan
status: draft
owner: Cascade
last_updated: 2026-07-13
description: "Single source of truth for the 45-second Steam-first trailer vertical slice: phases, code behaviour, viewer experience, and component inventory."
---

# Idle Village — Trailer Vertical Slice Plan

> **Scope:** 45-second cinematic trailer for the Steam page / broadcast / devlog.  
> **Primary owner:** Cascade · Go-To-Market Pod  
> **Related docs:** [go_to_market_steam_first.md](../strategy/go_to_market_steam_first.md), [VERTICAL_SLICE_ROADMAP.md](../../../../VERTICAL_SLICE_ROADMAP.md), [MASTER_PLAN.md](../MASTER_PLAN.md), [vertical_slice_implementation_plan.md](vertical_slice_implementation_plan.md), [trailer_vertical_slice_tasks.md](trailer_vertical_slice_tasks.md)

---

## 1. Objective

Document the trailer as a vertical slice in its own right: a scripted, timed sequence of UI scenes that shows the Gilded Observatory fantasy of the Idle Village loop without exposing the full game simulation. Each phase declares **what the code must do** and **what the viewer must see**, and references existing components or new components that must be built.

This plan feeds the master roadmap and is the basis for the component inventory the user must confirm before implementation begins.

---

## 2. Trailer phases

| Phase | Time | Code must do | Viewer must see | Key notes / existing artefacts |
|-------|------|--------------|-----------------|--------------------------------|
| **A — Title & Loading** | `00:00 - 00:06` | Render a static title card with a progress bar that fills deterministically; behind it, a looping, non-interactive village backdrop with gold/ivory premium lights and a subtle shader. | The game title appears, a progress bar fills, and the village background feels alive (warm lantern lights, starfield, aurora). | Missing: `TrailerIntroPage`, `VillageBackdrop` (loop shader or image/video). Existing: `MapPage` background overlay, `ActionProgressBar`. |
| **B — POI Map** | `00:06 - 00:14` | Render `MapPage` with several POI markers that appear; the trailer highlights one selected POI and one rejected POI, then transitions to the selected high-risk POI. | A living map with POI markers popping in; a risky POI is chosen while others are rejected, then the scene dissolves into the selected location. | Missing: `PoiMap`, `PoiMapMarker`, `PoiMapRiskBar`, `PoiMapTransition`. Existing: `QuestPOI`, `GenericPoiSkin`, `LocationCard`, `MapPage`, `useMapContext`.
| **C — Three Mock UI Screens** | `00:14 - 00:22` | Show three cinematic, non-interactive (or lightly animated) UI screens: Forge, Spell, Hero. The screens should simulate quick click feedback and fast mathematical/stat changes (numbers flashing, sliders moving). | Forgeria arc, Spell creator, and Hero sheet flick through in a seamless montage; numbers and sliders animate in response to fake input. | Missing: `ForgeScreen`, `HeroSheet`, `AnimatedNumber`, `MathFlash`. Existing: `SpellCreatorNewMockup`, `SpellCreatorNew`, `SpellEditor`, `SpellLibrary`, `CharacterCreator`, `CharacterBuilder`, `PgDetailCard`, `StatAllocationCard`, `EnhancedStatSlider`, `ConfigurableCard`/`ConfigurableStat`. |
| **D — Astrolabe Ball** | `00:22 - 00:32` | Drive the pre-calculated ball movement in the astrolabe: the ball dodges crimson spikes and lands on a scripted success, then a loot explosion burst fires. | The player sees the spatial tension of the astrolabe: crimson risk spikes, the ball orbiting, a near-miss, and a golden loot explosion. | Existing: `DestinyAstrolabe` (ball physics + crimson spine + spatial verdict), `SkillCheckLegend`. Missing/needs config: `LootExplosion` particle burst, `AstrolabeTrailerController` (scripted sequence). |
| **E — Celestial Forge Unlock & Wishlist CTA** | `00:32 - 00:45` | Apply a dissolve / particle effect on the village background, then play the Celestial Forge unlock animation and end with a Wishlist / Coming Soon sign. | The village dissolves into golden particles, the Celestial Forge rises/illuminates, then a wishlist sign appears with the Steam CTA. | Missing: `VillageDissolveTransition`, `ParticleField`, `CelestialForgeUnlockAnimation`, `WishlistSign`. Existing: `go_to_market_steam_first.md` defines the Steam KPI. |

---

## 3. Component inventory (for user confirmation)

Components are grouped by phase. For each component, the status is **EXISTS** or **MISSING**.

### A — Title & Loading

| Component | Path / Note | Status |
|-----------|-------------|--------|
| `ActionProgressBar` | `src/ui/idleVillage/map/actionCards/ActionProgressBar.tsx` | EXISTS |
| `MapPage` background overlay | `src/ui/idleVillage/map/MapPage.tsx` | EXISTS |
| `VillageBackdrop` (loop shader or image/video; not real-time game render) | New component | MISSING |
| `TrailerIntroPage` | New orchestrator page | MISSING |
| `TrailerProgressBar` | Deterministic, cinematic progress bar | MISSING |

### B — POI Map

| Component | Path / Note | Status |
|-----------|-------------|--------|
| `QuestPOI` / `GenericPoiSkin` | `src/ui/idleVillage/components/minimal/QuestPOI.tsx` | EXISTS |
| `LocationCard` | `src/ui/idleVillage/components/LocationCard.tsx` | EXISTS |
| `MapPage` | `src/ui/idleVillage/map/MapPage.tsx` | EXISTS |
| `useMapContext` | `src/ui/idleVillage/hooks/useMapContext.ts` | EXISTS |
| `PoiMap` | Wrapper on `MapPage` with POI appear/choice | MISSING |
| `PoiMapMarker` | POI marker with appear/selected/rejected states | MISSING |
| `PoiMapRiskBar` | Risk bar for marker | MISSING |
| `PoiMapTransition` | Transition from selected POI | MISSING |
| `PoiMapConfig` | Config-first POI map data | MISSING |

### C — Three Mock UI Screens

| Component | Path / Note | Status |
|-----------|-------------|--------|
| `SpellCreatorNewMockup` | `src/ui/spells/SpellCreatorNewMockup.tsx` | EXISTS |
| `SpellCreatorNew` | `src/ui/spells/SpellCreatorNew.tsx` | EXISTS |
| `SpellEditor` / `SpellLibrary` | `src/ui/spell/SpellEditor.tsx` / `SpellLibrary.tsx` | EXISTS |
| `SpellBuilder` | `src/balancing/spell/SpellBuilder.ts` | EXISTS |
| `CharacterCreator` | `src/ui/character/CharacterCreator.tsx` | EXISTS |
| `CharacterBuilder` | `src/ui/idle/CharacterBuilder.tsx` | EXISTS |
| `PgDetailCard` | `src/ui/idleVillage/components/PgDetailCard.tsx` | EXISTS |
| `StatAllocationCard` | `src/ui/character/components/StatAllocationCard.tsx` | EXISTS |
| `EnhancedStatSlider` | `src/ui/balancing/EnhancedStatSlider.tsx` | EXISTS |
| `ConfigurableCard` / `ConfigurableStat` | `src/ui/balancing/ConfigurableCard.tsx` | EXISTS |
| `ForgeScreen` (Celestial Forge mock UI) | New component | MISSING |
| `HeroSheet` (hero overview card) | New component | MISSING |
| `AnimatedNumber` | New component | MISSING |
| `MathFlash` | New component | MISSING |
| `MockScreenCarousel` | New orchestrator | MISSING |

### D — Astrolabe Ball

| Component | Path / Note | Status |
|-----------|-------------|--------|
| `DestinyAstrolabe` (v1) | `src/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe.tsx` | EXISTS (ball, crimson spine, spatial verdict) |
| `SkillCheckLegend` | `src/ui/idleVillage/components/destinyAstrolabe/SkillCheckLegend.tsx` | EXISTS |
| `pinballPhysics` | `src/ui/testing/pinballPhysics.ts` | EXISTS |
| `IdleVillagePinballMonitor` | `src/ui/idleVillage/components/IdleVillagePinballMonitor.tsx` | EXISTS |
| `LootExplosion` (particle burst on success) | New component | MISSING |
| `AstrolabeTrailerController` (scripted mode + camera) | New wrapper | MISSING |

### E — Celestial Forge Unlock & Wishlist CTA

| Component | Path / Note | Status |
|-----------|-------------|--------|
| `VillageDissolveTransition` | Dissolve / particle overlay on village | MISSING |
| `ParticleField` (gold/ivory) | New particle system | MISSING |
| `CelestialForgeUnlockAnimation` | Building rise + light reveal | MISSING |
| `WishlistSign` / `SteamCTA` | End-card with wishlist copy | MISSING |
| `PostTrailerPage` | Final orchestrator | MISSING |

---

## 4. Specialist feedback & guardrails

### 4.1 Specialist feedback: UI readability

- **Font size rule:** every UI text (counters, labels, CTAs, e.g. `Day 42`, `+30% Area`, `Blueprint Unlocked`) must be rendered at least **20% larger** in the trailer than in the final game UI.
- **Reason:** many viewers will watch the trailer inside the Steam client’s reduced window or on a Steam Deck. If math and counters are not readable at a glance, the “strategic brain” effect disappears.
- **Trailer mission:** these 45 seconds are meant to be high-impact eye candy that drives traffic to the Coming Soon page and starts collecting the only currency that matters before launch: wishlists from the target niche.

### 4.2 Implementation guardrails

- This is a **scripted cinematic** trailer, not a playable build. The code can use fixed seeds, pre-baked `mode` values, and timer-driven state machines.
- Follow config-first architecture: all times, text, palette, and camera keyframes must be read from config (`src/balancing/config/idleVillage/trailerConfig.ts` proposed below).
- Re-use existing frozen kits (`pgcardKit`, `slotRackKit`, `skillCheckKit`, `questPoiSkinConfig`) rather than duplicating styling.
- Do **not** start implementation until the user has confirmed the component inventory (what exists vs. what is missing).
- Each phase must be individually runnable in Storybook / a `trailer-phase-<x>` route for review and automated visual regression.
- Telemetry is for trailer playback analytics: `trailer_phase_completed`, `trailer_wishlist_cta_shown` (opt-in).

---

## 5. Proposed files

```
src/
  docs/docs/plans/trailer_vertical_slice_tasks.md   # execution checklist
  balancing/config/idleVillage/trailerConfig.ts       # phase timing, copy, seed
  ui/idleVillage/trailer/
    TrailerIntroPage.tsx
    VillageBackdrop.tsx
    TrailerProgressBar.tsx
    PoiMap.tsx
    PoiMapMarker.tsx
    PoiMapRiskBar.tsx
    PoiMapTransition.tsx
    MockScreenCarousel.tsx
    ForgeScreen.tsx
    HeroSheet.tsx
    AnimatedNumber.tsx
    MathFlash.tsx
    AstrolabeTrailerController.tsx
    LootExplosion.tsx
    VillageDissolveTransition.tsx
    ParticleField.tsx
    CelestialForgeUnlockAnimation.tsx
    WishlistSign.tsx
    PostTrailerPage.tsx
```

---

## 6. Next steps

1. Wait for the user to confirm the component inventory above (existing vs. missing).
2. If needed, update `trailerConfig.ts` with exact copy, timing, and palette.
3. Implement missing components phase by phase, using the `trailer_vertical_slice_tasks.md` checklist.
4. Wire each phase into a single `/trailer` route and a Storybook story.
5. Visual regression capture after each phase.

---

## 7. Change log

- `2026-03-02`: Initial plan created. Phases, code/viewer table, and component inventory added.
- `2026-07-13`: Added Specialist feedback on font size/readability and wishlist goal. Removed `AltVisualsV6Asterism`, `QuestBranchDiagram`, and legacy panel references from the inventory.
