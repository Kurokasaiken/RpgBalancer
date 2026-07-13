# Idle Village — Trailer Vertical Slice Tasks

> **Plan:** [trailer_vertical_slice_plan.md](trailer_vertical_slice_plan.md)  
> **Status:** 📋 Draft — pending component inventory confirmation  
> **Scope:** 45-second Steam-first cinematic trailer; not a playable build

---

## 🚨 Blocker

- [ ] **User confirmation of component inventory** — approve existing vs missing components in `trailer_vertical_slice_plan.md` §3 before any implementation begins.

---

## Phase 0: Config & Orchestration

### 0.1 Trailer config

- [ ] Create `src/balancing/config/idleVillage/trailerConfig.ts` with phase timings, copy, fixed seeds, palette, camera keyframes.
- [ ] Define `TrailerPhase` union and `TrailerConfig` interface.
- [ ] Add `phaseDurations`, `transitionDurations`, `telemetry` flags.
- [ ] Define `wishlistCTA` copy and Steam page link.

### 0.2 Telemetry

- [ ] Add `trailer_phase_completed` event (phase id, timestamp, duration).
- [ ] Add `trailer_wishlist_cta_shown` event (opt-in, only when CTA is visible).
- [ ] Wire events to analytics pipeline with feature flag `TRAILER_TELEMETRY_ENABLED`.

### 0.3 Routing

- [ ] Add `/trailer` route for full playback.
- [ ] Add `/trailer-phase-a` through `/trailer-phase-e` routes for isolated review.
- [ ] Add Storybook stories for each phase and the full trailer.

---

## Phase A: Title & Loading (00:00–00:06)

- [ ] Create `src/ui/idleVillage/trailer/TrailerIntroPage.tsx` (orchestrator).
- [ ] Create `src/ui/idleVillage/trailer/VillageBackdrop.tsx` (loop shader or image/video; not real-time game render).
- [ ] Create `src/ui/idleVillage/trailer/TrailerProgressBar.tsx` (deterministic, cinematic fill).
- [ ] Wire `MapPage` background overlay as base for `VillageBackdrop`.
- [ ] Visual regression: `trailer-phase-a`.

---

## Phase B: POI Map (00:06–00:14)

- [ ] Create `PoiMapConfig` schema in `trailerConfig.ts`.
- [ ] Create `src/ui/idleVillage/trailer/PoiMap.tsx` (wrapper on `MapPage` with POI appear/choice).
- [ ] Create `src/ui/idleVillage/trailer/PoiMapMarker.tsx` (POI marker with appear/selected/rejected states).
- [ ] Create `src/ui/idleVillage/trailer/PoiMapRiskBar.tsx` (risk bar for marker).
- [ ] Create `src/ui/idleVillage/trailer/PoiMapTransition.tsx` (cross-fade / camera pan from selected POI).
- [ ] Reuse `QuestPOI`, `GenericPoiSkin`, `LocationCard`, `MapPage`, `useMapContext`.
- [ ] Visual regression: `trailer-phase-b`.

---

## Phase C: Three Mock UI Screens (00:14–00:22)

- [ ] Create `src/ui/idleVillage/trailer/ForgeScreen.tsx` (Celestial Forge mock UI).
- [ ] Create `src/ui/idleVillage/trailer/HeroSheet.tsx` (hero overview card).
- [ ] Create `src/ui/idleVillage/trailer/AnimatedNumber.tsx` (number tick animation).
- [ ] Create `src/ui/idleVillage/trailer/MathFlash.tsx` (sliders/values flashing on fake input).
- [ ] Create `src/ui/idleVillage/trailer/MockScreenCarousel.tsx` (orchestrator for 3-screen montage).
- [ ] Reuse `SpellCreatorNewMockup`, `SpellCreatorNew`, `SpellEditor`, `SpellLibrary`, `SpellBuilder`, `CharacterCreator`, `CharacterBuilder`, `PgDetailCard`, `StatAllocationCard`, `EnhancedStatSlider`, `ConfigurableCard`, `ConfigurableStat`.
- [ ] Visual regression: `trailer-phase-c`.

---

## Phase D: Astrolabe Ball (00:22–00:32)

- [ ] Create `src/ui/idleVillage/trailer/AstrolabeTrailerController.tsx` (scripted mode + camera).
- [ ] Create `src/ui/idleVillage/trailer/LootExplosion.tsx` (particle burst on success).
- [ ] Reuse `DestinyAstrolabe`, `SkillCheckLegend`, `pinballPhysics`, `IdleVillagePinballMonitor`.
- [ ] Configure scripted ball path, crimson spike avoidance, and guaranteed success.
- [ ] Visual regression: `trailer-phase-d`.

---

## Phase E: Celestial Forge Unlock & Wishlist CTA (00:32–00:45)

- [ ] Create `src/ui/idleVillage/trailer/VillageDissolveTransition.tsx` (particle dissolve overlay). **Timebox: 2h. Se lo shader WebGPU diventa troppo complesso, fallback a transizione video/post-produzione anziché codice in-game.**
- [ ] Create `src/ui/idleVillage/trailer/ParticleField.tsx` (gold/ivory particles).
- [ ] Create `src/ui/idleVillage/trailer/CelestialForgeUnlockAnimation.tsx` (building rise + light reveal).
- [ ] Create `src/ui/idleVillage/trailer/WishlistSign.tsx` / `SteamCTA.tsx` (end-card with wishlist copy).
- [ ] Create `src/ui/idleVillage/trailer/PostTrailerPage.tsx` (final orchestrator).
- [ ] Build the end card as a standalone full-screen cinematic view using `VillageDissolveTransition` + `ParticleField`.
- [ ] Visual regression: `trailer-phase-e`.

---

## Phase F: Full Trailer Integration

- [ ] Wire all phases into `/trailer` route.
- [ ] Add deterministic timer/state machine.
- [ ] Add pause/replay/debug controls (opt-in, `?debug=trailer`).
- [ ] Add audio cues (or mute fallback) behind `TRAILER_AUDIO_ENABLED` flag.
- [ ] Full trailer visual regression capture.

---

## Phase G: QA & Handoff

- [ ] Run `npm run test` for new utility tests.
- [ ] Run Storybook visual review for each phase.
- [ ] Run Playwright E2E for `/trailer` route.
- [ ] Update `IMPLEMENTED_PLAN.md` if used.
- [ ] Update Kanban and `test-results/trailer-vertical-slice-<date>.log` evidence.

---

## Notes

- Do **not** start implementation until the user confirms the component inventory.
- `Punch Club` is an internal sandbox-only tool and must not appear in the trailer or any public marketing material.
- Reuse frozen kits: `pgcardKit`, `slotRackKit`, `skillCheckKit`, `questPoiSkinConfig`.
